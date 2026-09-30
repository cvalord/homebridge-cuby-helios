import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as hap from '@homebridge/hap-nodejs';
import { CubyHeliosAccessory } from '../dist/platformAccessory.js';
const { Service, Characteristic, Accessory, uuid } = hap;
test('HomeKit mode migration, alert persistence and refill', async () => {
  const accessory = new Accessory('Gas', uuid.generate('test-gas'));
  accessory.context = {};
  let level = 20;
  const platform = {
    Service, Characteristic, pollingInterval: 300, lowGasThreshold: 20,
    config: { deviceID: '123456789012', displayMode: 'humidity', enableLowGasAlert: true },
    client: { getGasLevel: async () => level },
    log: { warn() {}, info() {}, error() {} },
    api: { updatePlatformAccessories() {} },
  };
  const first = new CubyHeliosAccessory(platform, accessory);
  first.stop();
  await first.refresh();
  assert.equal(accessory.getService(Service.HumiditySensor).getCharacteristic(Characteristic.CurrentRelativeHumidity).value, 20);
  assert.equal(accessory.getService(Service.LeakSensor).getCharacteristic(Characteristic.LeakDetected).value, 1);
  platform.config.displayMode = 'battery';
  const second = new CubyHeliosAccessory(platform, accessory);
  second.stop();
  await second.refresh();
  assert.equal(accessory.getService(Service.HumiditySensor), undefined);
  assert.equal(accessory.getService(Service.Battery).getCharacteristic(Characteristic.StatusLowBattery).value, 1);
  level = 60;
  await second.refresh();
  await second.refresh();
  assert.equal(accessory.getService(Service.LeakSensor).getCharacteristic(Characteristic.LeakDetected).value, 0);
  platform.config.enableLowGasAlert = false;
  const third = new CubyHeliosAccessory(platform, accessory);
  third.stop();
  await third.refresh();
  assert.equal(accessory.getService(Service.LeakSensor), undefined);
  assert.equal(accessory.getService(Service.Battery).getCharacteristic(Characteristic.StatusLowBattery).value, 0);
});
