export interface AlertState {
    triggered: boolean;
    minimum?: number;
    refillReadings: number;
}
export declare function updateAlert(state: AlertState, level: number, threshold: number, enabled: boolean): 'alert' | 'refill' | undefined;
