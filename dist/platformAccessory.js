import { updateAlert } from './alertState.js';
export class CubyHeliosAccessory {
    platform;
    accessory;
    service;
    pollingIntervalMs;
    timer;
    refreshPromise;
    currentLevel = 0;
    alertState;
    alertService;
    battery;
    constructor(platform, accessory) {
        this.platform = platform;
        this.accessory = accessory;
        this.pollingIntervalMs = platform.pollingInterval * 1000;
        accessory.getService(platform.Service.AccessoryInformation)
            .setCharacteristic(platform.Characteristic.Manufacturer, 'Cuby')
            .setCharacteristic(platform.Characteristic.Model, 'Helios')
            .setCharacteristic(platform.Characteristic.SerialNumber, platform.config.deviceID);
        this.battery = platform.config.displayMode === 'battery';
        this.alertState = accessory.context.lowGasAlert ?? { triggered: false, refillReadings: 0 };
        accessory.context.lowGasAlert = this.alertState;
        const selected = this.battery ? platform.Service.Battery : platform.Service.HumiditySensor;
        const old = accessory.getService(this.battery ? platform.Service.HumiditySensor : platform.Service.Battery);
        if (old)
            accessory.removeService(old);
        this.service = accessory.getService(selected) ?? accessory.addService(selected, 'Nivel de Gas');
        this.service.setCharacteristic(platform.Characteristic.Name, 'Nivel de Gas');
        if (this.battery) {
            this.service.setCharacteristic(platform.Characteristic.ChargingState, platform.Characteristic.ChargingState.NOT_CHARGEABLE);
        }
        this.service.getCharacteristic(this.battery ? platform.Characteristic.BatteryLevel : platform.Characteristic.CurrentRelativeHumidity)
            .onGet(async () => {
            await this.refresh();
            return this.currentLevel;
        });
        const existingAlert = accessory.getService(platform.Service.LeakSensor);
        if (platform.config.enableLowGasAlert) {
            this.alertService = existingAlert ?? accessory.addService(platform.Service.LeakSensor, 'Alerta de gas bajo');
            this.alertService.setCharacteristic(platform.Characteristic.Name, 'Alerta de gas bajo');
        }
        else if (existingAlert) {
            accessory.removeService(existingAlert);
        }
        this.updateAlertCharacteristics();
        this.start();
    }
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = undefined;
        }
    }
    start() {
        void this.refresh();
        this.timer = setInterval(() => void this.refresh(), this.pollingIntervalMs);
    }
    async refresh() {
        if (!this.refreshPromise) {
            this.refreshPromise = this.doRefresh().finally(() => {
                this.refreshPromise = undefined;
            });
        }
        await this.refreshPromise;
    }
    updateAlertCharacteristics() {
        const active = this.platform.config.enableLowGasAlert === true && this.alertState.triggered;
        this.alertService?.updateCharacteristic(this.platform.Characteristic.LeakDetected, active ? 1 : 0);
        if (this.battery) {
            this.service.updateCharacteristic(this.platform.Characteristic.StatusLowBattery, active ? 1 : 0);
        }
    }
    async doRefresh() {
        try {
            const level = await this.platform.client.getGasLevel(this.platform.config.deviceID);
            this.currentLevel = level;
            this.service.updateCharacteristic(this.battery ? this.platform.Characteristic.BatteryLevel : this.platform.Characteristic.CurrentRelativeHumidity, level);
            const event = updateAlert(this.alertState, level, this.platform.lowGasThreshold, this.platform.config.enableLowGasAlert === true);
            this.updateAlertCharacteristics();
            this.platform.api.updatePlatformAccessories([this.accessory]);
            if (event === 'alert') {
                this.platform.log.warn(`Nivel de gas bajo: ${level}% (umbral ${this.platform.lowGasThreshold}%). Aviso único hasta la próxima recarga.`);
            }
            else if (event === 'refill') {
                this.platform.log.info('Recarga estimada detectada. La alerta de gas bajo está lista para el siguiente ciclo.');
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.platform.log.error(`No se pudo actualizar el nivel de gas: ${message}`);
        }
    }
}
//# sourceMappingURL=platformAccessory.js.map