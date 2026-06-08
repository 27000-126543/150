import { create } from 'zustand';
import type { Alert, AlertType, AlertLevel } from '@/types';
import { initialAlerts } from '@/data/initialData';
import { generateId } from '@/utils/formatters';

interface AlertState {
  alerts: Alert[];
  unacknowledgedCount: number;
  addAlert: (type: AlertType, level: AlertLevel, message: string, unitId?: string) => void;
  acknowledgeAlert: (id: string) => void;
  clearAlert: (id: string) => void;
  clearAllAlerts: () => void;
  getAlertsByType: (type: AlertType) => Alert[];
  getAlertsByLevel: (level: AlertLevel) => Alert[];
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: initialAlerts,
  unacknowledgedCount: 0,

  addAlert: (type, level, message, unitId) => {
    const newAlert: Alert = {
      id: generateId(),
      type,
      level,
      message,
      timestamp: new Date(),
      acknowledged: false,
      unitId,
    };

    set((state) => ({
      alerts: [newAlert, ...state.alerts].slice(0, 100),
      unacknowledgedCount: state.unacknowledgedCount + 1,
    }));
  },

  acknowledgeAlert: (id) => {
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, acknowledged: true } : a
      ),
      unacknowledgedCount: Math.max(0, state.unacknowledgedCount - 1),
    }));
  },

  clearAlert: (id) => {
    set((state) => {
      const alert = state.alerts.find((a) => a.id === id);
      return {
        alerts: state.alerts.filter((a) => a.id !== id),
        unacknowledgedCount: alert && !alert.acknowledged
          ? Math.max(0, state.unacknowledgedCount - 1)
          : state.unacknowledgedCount,
      };
    });
  },

  clearAllAlerts: () => {
    set({ alerts: [], unacknowledgedCount: 0 });
  },

  getAlertsByType: (type) => {
    return get().alerts.filter((a) => a.type === type);
  },

  getAlertsByLevel: (level) => {
    return get().alerts.filter((a) => a.level === level);
  },
}));
