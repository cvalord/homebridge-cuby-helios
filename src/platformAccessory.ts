import type { PlatformAccessory, Service } from 'homebridge';
import type { CubyHeliosPlatform } from './platform.js';

export class CubyHeliosAccessory {
  private readonly service: Service;
  private readonly pollingIntervalMs: number;
  private timer?: NodeJS.Timeout;
  private refreshPromise?: Promise<void>;
  private currentLevel = 0;

  constructor(
    private readonly platform: CubyHeliosPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    this.pollingIntervalMs = platform.pollingInterval * 1000;

    accessory.getService(platform.Service.AccessoryInformation)!
      .setCharacteristic(platform.Characteristic.Manufacturer, 'Cuby')
      .setCharacteristic(platform.Characteristic.Model, 'Helios')
      .setCharacteristic(platform.Characteristic.SerialNumber, platform.config.deviceID);

    // HomeKit has no native "tank level" service. Relative Humidity gives us a
    // native 0-100% tile in Apple Home while the accessory/service name makes
    // the real meaning explicit to the user.
    this.service = accessory.getService(platform.Service.HumiditySensor)
      ?? accessory.addService(platform.Service.HumiditySensor, 'Nivel de Gas');

    this.service.setCharacteristic(platform.Characteristic.Name, 'Nivel de Gas');
    this.service.getCharacteristic(platform.Characteristic.CurrentRelativeHumidity)
      .onGet(async () => {
        await this.refresh();
        return this.currentLevel;
      });

    this.start();
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private start(): void {
    void this.refresh();
    this.timer = setInterval(() => void this.refresh(), this.pollingIntervalMs);
  }

  private async refresh(): Promise<void> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.doRefresh().finally(() => {
        this.refreshPromise = undefined;
      });
    }
    await this.refreshPromise;
  }

  private async doRefresh(): Promise<void> {
    try {
      const level = await this.platform.client.getGasLevel(this.platform.config.deviceID);
      this.currentLevel = level;
      this.service.updateCharacteristic(
        this.platform.Characteristic.CurrentRelativeHumidity,
        level,
      );

      if (level <= this.platform.lowGasThreshold) {
        this.platform.log.warn(`Nivel de gas bajo: ${level}% (umbral ${this.platform.lowGasThreshold}%).`);
      } else {
        this.platform.log.debug(`Nivel de gas actualizado: ${level}%.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.platform.log.error(`No se pudo actualizar el nivel de gas: ${message}`);
    }
  }
}
