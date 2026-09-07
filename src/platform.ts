import type {
  API,
  Characteristic,
  DynamicPlatformPlugin,
  Logging,
  PlatformAccessory,
  PlatformConfig,
  Service,
} from 'homebridge';

import { CubyApiClient } from './cubyApi.js';
import { CubyHeliosAccessory } from './platformAccessory.js';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';
import type { CubyHeliosConfig } from './types.js';

export class CubyHeliosPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;
  public readonly accessories: PlatformAccessory[] = [];
  public readonly handlers: CubyHeliosAccessory[] = [];
  public readonly client: CubyApiClient;
  public readonly pollingInterval: number;
  public readonly lowGasThreshold: number;
  public readonly config: CubyHeliosConfig;

  private readonly configured: boolean;

  constructor(
    public readonly log: Logging,
    config: PlatformConfig,
    public readonly api: API,
  ) {
    this.config = config as CubyHeliosConfig;
    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;
    this.pollingInterval = Math.max(60, this.config.pollingInterval ?? 300);
    this.lowGasThreshold = Math.max(0, Math.min(100, this.config.lowGasThreshold ?? 20));

    this.configured = Boolean(this.config.email && this.config.password && this.config.deviceID);
    this.client = new CubyApiClient(
      log,
      this.config.email ?? '',
      this.config.password ?? '',
      this.config.tokenExpiration ?? 3600,
    );

    if (!this.configured) {
      this.log.warn('Cuby Helios no está configurado. Agrega email, password y deviceID en Homebridge UI.');
      return;
    }

    if (!/^[A-Za-z0-9]{12}$/.test(this.config.deviceID)) {
      this.log.error('deviceID debe tener exactamente 12 caracteres alfanuméricos.');
      this.configured = false;
      return;
    }

    this.api.on('didFinishLaunching', () => this.discoverDevice());
    this.api.on('shutdown', () => this.handlers.forEach(handler => handler.stop()));
  }

  configureAccessory(accessory: PlatformAccessory): void {
    this.log.debug(`Accesorio restaurado desde caché: ${accessory.displayName}`);
    this.accessories.push(accessory);
  }

  private discoverDevice(): void {
    if (!this.configured) {
      return;
    }

    const uuid = this.api.hap.uuid.generate(`cuby-helios:${this.config.deviceID}`);
    const existing = this.accessories.find(accessory => accessory.UUID === uuid);

    if (existing) {
      existing.context.deviceID = this.config.deviceID;
      this.handlers.push(new CubyHeliosAccessory(this, existing));
      this.log.info(`Cuby Helios restaurado: ${this.config.deviceID}.`);
      return;
    }

    const accessory = new this.api.platformAccessory(this.config.name || 'Cuby Helios', uuid);
    accessory.context.deviceID = this.config.deviceID;
    this.handlers.push(new CubyHeliosAccessory(this, accessory));
    this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    this.log.info(`Cuby Helios agregado: ${this.config.deviceID}.`);
  }
}
