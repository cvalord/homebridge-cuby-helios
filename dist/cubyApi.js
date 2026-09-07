import { CUBY_API_BASE_URL } from './settings.js';
export class CubyApiClient {
    log;
    email;
    password;
    requestedExpiration;
    token;
    tokenExpiresAt = 0;
    tokenRequest;
    constructor(log, email, password, requestedExpiration = 3600) {
        this.log = log;
        this.email = email;
        this.password = password;
        this.requestedExpiration = requestedExpiration;
    }
    async getGasLevel(deviceID) {
        await this.ensureToken();
        let response = await this.requestGasLevel(deviceID);
        if (response.status === 401) {
            this.log.warn('Cuby rechazó el JWT. Generando un token nuevo y reintentando una vez.');
            this.invalidateToken();
            await this.ensureToken();
            response = await this.requestGasLevel(deviceID);
        }
        if (!response.ok) {
            const body = await this.safeText(response);
            if (response.status === 502) {
                throw new Error(`Cuby no pudo obtener el nivel de gas (502). ${body}`);
            }
            throw new Error(`Cuby API respondió HTTP ${response.status}. ${body}`);
        }
        const data = await response.json();
        if (typeof data.level !== 'number' || !Number.isFinite(data.level)) {
            throw new Error('La respuesta de Cuby no contiene un campo level numérico válido.');
        }
        return Math.max(0, Math.min(100, data.level));
    }
    async requestGasLevel(deviceID) {
        const url = new URL(`${CUBY_API_BASE_URL}/history/gas/level/${encodeURIComponent(deviceID)}`);
        url.searchParams.set('token', this.token ?? '');
        return fetch(url, {
            method: 'GET',
            headers: { accept: 'application/json' },
            signal: AbortSignal.timeout(15000),
        });
    }
    async ensureToken() {
        // Renew 60 seconds before expiry to avoid racing the server clock.
        if (this.token && Date.now() < this.tokenExpiresAt - 60_000) {
            return;
        }
        if (!this.tokenRequest) {
            this.tokenRequest = this.refreshToken().finally(() => {
                this.tokenRequest = undefined;
            });
        }
        await this.tokenRequest;
    }
    async refreshToken() {
        const url = `${CUBY_API_BASE_URL}/token/${encodeURIComponent(this.email)}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                password: this.password,
                expiration: this.requestedExpiration,
            }),
            signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) {
            const body = await this.safeText(response);
            throw new Error(`No se pudo autenticar con Cuby (HTTP ${response.status}). ${body}`);
        }
        const data = await response.json();
        if (data.status !== 'ok' || typeof data.token !== 'string' || !data.token) {
            throw new Error('Cuby respondió sin un JWT válido.');
        }
        const expirationSeconds = Number.isFinite(data.expiration) && data.expiration > 0
            ? data.expiration
            : this.requestedExpiration;
        this.token = data.token;
        this.tokenExpiresAt = Date.now() + expirationSeconds * 1000;
        this.log.debug(`JWT de Cuby renovado; expiración reportada: ${expirationSeconds}s.`);
    }
    invalidateToken() {
        this.token = undefined;
        this.tokenExpiresAt = 0;
    }
    async safeText(response) {
        try {
            const text = await response.text();
            return text.slice(0, 500);
        }
        catch {
            return '';
        }
    }
}
//# sourceMappingURL=cubyApi.js.map