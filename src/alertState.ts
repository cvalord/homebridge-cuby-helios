export interface AlertState {
  triggered: boolean;
  minimum?: number;
  refillReadings: number;
}

// Persisted in accessory context so restarting Homebridge cannot repeat an alert.
export function updateAlert(state: AlertState, level: number, threshold: number, enabled: boolean): 'alert' | 'refill' | undefined {
  if (!enabled) {
    return undefined;
  }
  if (state.triggered) {
    state.minimum = Math.min(state.minimum ?? level, level);
    state.refillReadings = level >= state.minimum + 10 ? state.refillReadings + 1 : 0;
    if (state.refillReadings >= 2 && level > threshold) {
      state.triggered = false;
      state.minimum = undefined;
      state.refillReadings = 0;
      return 'refill';
    }
  } else if (level <= threshold) {
    state.triggered = true;
    state.minimum = level;
    state.refillReadings = 0;
    return 'alert';
  }
  return undefined;
}
