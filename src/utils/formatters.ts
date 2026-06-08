export const formatNumber = (num: number, decimals = 1): string => {
  return num.toFixed(decimals);
};

export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatHours = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}小时${m}分钟`;
};

export const getStatusColor = (status: 'normal' | 'warning' | 'alarm'): string => {
  switch (status) {
    case 'normal':
      return '#34c759';
    case 'warning':
      return '#ff9500';
    case 'alarm':
      return '#ff3b30';
    default:
      return '#00d4ff';
  }
};

export const getStatusText = (status: 'normal' | 'warning' | 'alarm'): string => {
  switch (status) {
    case 'normal':
      return '正常';
    case 'warning':
      return '预警';
    case 'alarm':
      return '告警';
    default:
      return '未知';
  }
};

export const getEquipmentStatusText = (status: 'running' | 'standby' | 'maintenance'): string => {
  switch (status) {
    case 'running':
      return '运行中';
    case 'standby':
      return '备用';
    case 'maintenance':
      return '维护中';
    default:
      return '未知';
  }
};

export const getEquipmentStatusColor = (status: 'running' | 'standby' | 'maintenance'): string => {
  switch (status) {
    case 'running':
      return '#34c759';
    case 'standby':
      return '#ff9500';
    case 'maintenance':
      return '#ff3b30';
    default:
      return '#888888';
  }
};

export const calculateDaysRemaining = (currentStock: number, dailyConsumption: number): number => {
  if (dailyConsumption <= 0) return Infinity;
  return Math.ceil(currentStock / dailyConsumption);
};

export const getComplianceStatus = (value: number, standard: number): 'compliant' | 'warning' | 'non-compliant' => {
  if (value <= standard * 0.8) return 'compliant';
  if (value <= standard) return 'warning';
  return 'non-compliant';
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};

export const randomRange = (min: number, max: number): number => {
  return min + Math.random() * (max - min);
};

export const smoothStep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};
