import type { PlatformConfig } from 'homebridge';

export interface CubyHeliosConfig extends PlatformConfig {
  name: string;
  email: string;
  password: string;
  deviceID: string;
  pollingInterval?: number;
  tokenExpiration?: number;
  lowGasThreshold?: number;
  displayMode?: 'humidity' | 'battery';
  enableLowGasAlert?: boolean;
}

export interface TokenResponse {
  expiration: number;
  status: string;
  token: string;
}

export interface GasLevelResponse {
  level: number;
}
