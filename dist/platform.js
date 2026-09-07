import { CubyApiClient } from './cubyApi.js';
import { CubyHeliosAccessory } from './platformAccessory.js';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';
export class CubyHeliosPlatform {
    log;
    api;
    Service;
    Characteristic;
    accessories = [];
    handlers = [];
    client;
    pollingInterval;
    lowGasThreshold;
    config;
    configured;
    constructor(log, config, api) {
        this.log = log;
        this.api = api;
        this.config = config;
        this.Service = api.hap.Service;
        this.Characteristic = api.hap.Characteristic;
        this.pollingInterval = Math.max(60, this.config.pollingInterval ?? 300);
        this.lowGasThreshold = Math.max(0, Math.min(100, this.config.lowGasThreshold ?? 20));
        this.configured = Boolean(this.config.email && this.config.password && this.config.deviceID);
        this.client = new CubyApiClient(log, this.config.email ?? '', this.config.password ?? '', this.config.tokenExpiration ?? 3600);
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
    configureAccessory(accessory) {
        this.log.debug(`Accesorio restaurado desde caché: ${accessory.displayName}`);
        this.accessories.push(accessory);
    }
    discoverDevice() {
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
//# sourceMappingURL=platform.js.map