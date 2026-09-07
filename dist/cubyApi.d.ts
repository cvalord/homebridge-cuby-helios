import type { Logging } from 'homebridge';
export declare class CubyApiClient {
    private readonly log;
    private readonly email;
    private readonly password;
    private readonly requestedExpiration;
    private token?;
    private tokenExpiresAt;
    private tokenRequest?;
    constructor(log: Logging, email: string, password: string, requestedExpiration?: number);
    getGasLevel(deviceID: string): Promise<number>;
    private requestGasLevel;
    private ensureToken;
    private refreshToken;
    private invalidateToken;
    private safeText;
}
