export const simulationConfig = {
  updateInterval: 2000,
  waterQuality: {
    cod: {
      min: 280,
      max: 420,
      effluentStandard: 50,
    },
    nh3n: {
      min: 18,
      max: 32,
      effluentStandard: 5,
    },
    tp: {
      min: 2.5,
      max: 5.5,
      effluentStandard: 0.5,
    },
    flow: {
      min: 180,
      max: 320,
    },
    level: {
      min: 2.0,
      max: 4.0,
    },
    do: {
      min: 0.5,
      max: 5.0,
      targetLow: 2.0,
      targetHigh: 4.0,
      alarmThreshold: 1.0,
    },
  },
  equipment: {
    blowerFrequency: {
      min: 25,
      max: 60,
    },
    runHoursIncrement: 0.001,
  },
  alerts: {
    randomAlertProbability: 0.02,
  },
  inventory: {
    dailyConsumptionVariation: 0.1,
  },
  personnel: {
    moveSpeed: 0.02,
    dangerZoneCheckInterval: 1000,
  },
  dispatch: {
    overloadThreshold: 90,
    overloadDuration: 5,
  },
  approval: {
    autoApproveDelay: 30000,
  },
};

export const colorConfig = {
  normal: '#00d4ff',
  warning: '#ff9500',
  alarm: '#ff3b30',
  success: '#34c759',
  background: '#0a1628',
  surface: 'rgba(10, 22, 40, 0.8)',
  border: 'rgba(0, 212, 255, 0.3)',
  text: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
};

export const waterQualityStandards = {
  cod: 50,
  nh3n: 5,
  tp: 0.5,
};

export const equipmentIcons = {
  blower: 'Wind',
  dewaterer: 'RefreshCw',
  pump: 'Droplets',
};

export const equipmentColors = {
  blower: '#00d4ff',
  dewaterer: '#ff9500',
  pump: '#34c759',
};

export const alertTypeLabels = {
  water_quality: '水质异常',
  equipment: '设备故障',
  safety: '安全告警',
  emergency: '应急事件',
};

export const alertLevelColors = {
  info: '#00d4ff',
  warning: '#ff9500',
  critical: '#ff3b30',
};
