import type { API, Characteristic, DynamicPlatformPlugin, Logging, PlatformAccessory, PlatformConfig, Service } from 'homebridge';
import { CubyApiClient } from './cubyApi.js';
import { CubyHeliosAccessory } from './platformAccessory.js';
import type { CubyHeliosConfig } from './types.js';
export declare class CubyHeliosPlatform implements DynamicPlatformPlugin {
    readonly log: Logging;
    readonly api: API;
    readonly Service: typeof Service;
    readonly Characteristic: typeof Characteristic;
    readonly accessories: PlatformAccessory[];
    readonly handlers: CubyHeliosAccessory[];
    readonly client: CubyApiClient;
    readonly pollingInterval: number;
    readonly lowGasThreshold: number;
    readonly config: CubyHeliosConfig;
    private readonly configured;
    constructor(log: Logging, config: PlatformConfig, api: API);
    configureAccessory(accessory: PlatformAccessory): void;
    private discoverDevice;
}
