import type { PlatformAccessory } from 'homebridge';
import type { CubyHeliosPlatform } from './platform.js';
export declare class CubyHeliosAccessory {
    private readonly platform;
    private readonly accessory;
    private readonly service;
    private readonly pollingIntervalMs;
    private timer?;
    private refreshPromise?;
    private currentLevel;
    private readonly alertState;
    private readonly alertService?;
    private readonly battery;
    constructor(platform: CubyHeliosPlatform, accessory: PlatformAccessory);
    stop(): void;
    private start;
    private refresh;
    private updateAlertCharacteristics;
    private doRefresh;
}
