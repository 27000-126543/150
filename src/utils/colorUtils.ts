export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0, g: 0, b: 0 };
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  return '#' + [r, g, b].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
};

export const interpolateColor = (color1: string, color2: string, t: number): string => {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = c1.r + (c2.r - c1.r) * t;
  const g = c1.g + (c2.g - c1.g) * t;
  const b = c1.b + (c2.b - c1.b) * t;
  return rgbToHex(r, g, b);
};

export const getWaterQualityColor = (value: number, standard: number): string => {
  const ratio = value / standard;
  if (ratio <= 0.8) return '#34c759';
  if (ratio <= 1.0) return '#ff9500';
  return '#ff3b30';
};

export const getDOColor = (doValue: number): string => {
  if (doValue < 1) return '#ff3b30';
  if (doValue < 2) return '#ff9500';
  if (doValue > 4) return '#00d4ff';
  return '#34c759';
};

export const getLevelColor = (level: number, min: number, max: number): string => {
  const ratio = (level - min) / (max - min);
  if (ratio < 0.3) return '#ff9500';
  if (ratio > 0.8) return '#ff3b30';
  return '#34c759';
};

export const createGradient = (colors: string[], stops: number[]): string => {
  return `linear-gradient(to right, ${colors.map((c, i) => `${c} ${stops[i] * 100}%`).join(', ')})`;
};

export const withAlpha = (hex: string, alpha: number): string => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`;
};

export const getContrastColor = (hex: string): string => {
  const { r, g, b } = hexToRgb(hex);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 0.5 ? '#000000' : '#ffffff';
};
