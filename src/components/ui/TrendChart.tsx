import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import { X, ArrowDownUp } from 'lucide-react';
import { usePlantStore } from '@/store/usePlantStore';
import { formatNumber, formatTime } from '@/utils/formatters';
import { waterQualityStandards } from '@/data/simulationConfig';
import GlassCard from './GlassCard';

type TrendType = 'inlet' | 'outlet' | 'removal';

interface TrendChartProps {
  unitId: string;
  onClose: () => void;
}

const TrendChart = ({ unitId, onClose }: TrendChartProps) => {
  const { getUnitById } = usePlantStore();
  const [selectedParam, setSelectedParam] = useState<'cod' | 'nh3n' | 'tp'>('cod');
  const [trendType, setTrendType] = useState<TrendType>('outlet');
  const unit = getUnitById(unitId);

  if (!unit) return null;

  const paramConfig = {
    cod: {
      key: 'COD',
      color: '#00d4ff',
      unit: 'mg/L',
      standard: waterQualityStandards.cod,
    },
    nh3n: {
      key: '氨氮',
      color: '#ff9500',
      unit: 'mg/L',
      standard: waterQualityStandards.nh3n,
    },
    tp: {
      key: '总磷',
      color: '#ff3b30',
      unit: 'mg/L',
      standard: waterQualityStandards.tp,
    },
  };

  const config = paramConfig[selectedParam];

  const getChartData = () => {
    if (trendType === 'removal') {
      return unit.trendDataRemovalRate.map((data, index) => ({
        time: data.timestamp ? formatTime(data.timestamp) : `${index}h`,
        去除率: data[selectedParam],
      }));
    }

    const dataSource = trendType === 'inlet' ? unit.trendDataInlet : unit.trendData;
    return dataSource.map((data, index) => ({
      time: data.timestamp ? formatTime(data.timestamp) : `${index}h`,
      [config.key]: data[selectedParam],
      ...(data.do !== undefined && { 溶解氧: data.do }),
    }));
  };

  const chartData = getChartData();

  const getCurrentValue = () => {
    if (trendType === 'removal') {
      return unit.trendDataRemovalRate[unit.trendDataRemovalRate.length - 1]?.[selectedParam] || 0;
    }
    const data = trendType === 'inlet' ? unit.inletWater : unit.outletWater;
    return data[selectedParam];
  };

  const getAvgValue = () => {
    if (trendType === 'removal') {
      return (
        unit.trendDataRemovalRate.reduce((sum, d) => sum + d[selectedParam], 0) /
        unit.trendDataRemovalRate.length
      );
    }
    const data = trendType === 'inlet' ? unit.trendDataInlet : unit.trendData;
    return data.reduce((sum, d) => sum + d[selectedParam], 0) / data.length;
  };

  const getComplianceRate = () => {
    if (trendType === 'removal') {
      const validCount = unit.trendDataRemovalRate.filter((d) => d[selectedParam] > 50).length;
      return (validCount / unit.trendDataRemovalRate.length) * 100;
    }
    const data = trendType === 'inlet' ? unit.trendDataInlet : unit.trendData;
    const compliantCount = data.filter((d) => d[selectedParam] <= config.standard).length;
    return (compliantCount / data.length) * 100;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 border border-cyan-500/50 rounded-lg p-3 shadow-xl">
          <p className="text-cyan-400 font-bold text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              <span className="font-bold">{entry.name}:</span> {formatNumber(entry.value, 2)}{' '}
              {trendType === 'removal' ? '%' : config.unit}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const trendTypeLabels = {
    inlet: { label: '进水曲线', color: '#ff9500', icon: '↑' },
    outlet: { label: '出水曲线', color: '#34c759', icon: '↓' },
    removal: { label: '去除率曲线', color: '#00d4ff', icon: '%' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <GlassCard className="w-[650px] max-w-[90vw] max-h-[85vh] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-cyan-400">{unit.name}</h2>
            <p className="text-slate-400 text-sm">近24小时水质趋势曲线</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 mb-3">
          {(Object.keys(paramConfig) as Array<keyof typeof paramConfig>).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedParam(key)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                selectedParam === key
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {paramConfig[key].key}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-4">
          {(Object.keys(trendTypeLabels) as TrendType[]).map((type) => (
            <button
              key={type}
              onClick={() => setTrendType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                trendType === type
                  ? 'bg-slate-700 text-white shadow-lg'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
              }`}
              style={{
                borderColor: trendType === type ? trendTypeLabels[type].color : 'transparent',
                borderWidth: '2px',
              }}
            >
              <span>{trendTypeLabels[type].icon}</span>
              <span>{trendTypeLabels[type].label}</span>
            </button>
          ))}
        </div>

        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={trendTypeLabels[trendType].color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={trendTypeLabels[trendType].color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                interval={2}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                label={{
                  value: trendType === 'removal' ? '%' : config.unit,
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#94a3b8',
                  fontSize: 10,
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{
                  paddingTop: '10px',
                  fontSize: '12px',
                }}
              />

              {trendType !== 'removal' && (
                <ReferenceLine
                  y={config.standard}
                  stroke="#ff3b30"
                  strokeDasharray="5 5"
                  label={{
                    value: `排放标准: ${config.standard}${config.unit}`,
                    fill: '#ff3b30',
                    fontSize: 10,
                  }}
                />
              )}

              {trendType === 'removal' ? (
                <Area
                  type="monotone"
                  dataKey="去除率"
                  stroke={trendTypeLabels.removal.color}
                  strokeWidth={2}
                  fill="url(#colorGradient)"
                  dot={{ fill: trendTypeLabels.removal.color, r: 3 }}
                  activeDot={{ r: 6, fill: trendTypeLabels.removal.color, stroke: '#fff', strokeWidth: 2 }}
                />
              ) : (
                <>
                  <Area
                    type="monotone"
                    dataKey={config.key}
                    stroke={trendTypeLabels[trendType].color}
                    strokeWidth={2}
                    fill="url(#colorGradient)"
                    dot={{ fill: trendTypeLabels[trendType].color, r: 3 }}
                    activeDot={{ r: 6, fill: trendTypeLabels[trendType].color, stroke: '#fff', strokeWidth: 2 }}
                  />
                  {unit.type === 'biological' && trendType === 'outlet' && (
                    <Line
                      type="monotone"
                      dataKey="溶解氧"
                      stroke="#34c759"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  )}
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-700/50">
          <div className="text-center">
            <p className="text-slate-500 text-xs">当前{trendTypeLabels[trendType].label.replace('曲线', '')}</p>
            <p className="text-lg font-bold" style={{ color: trendTypeLabels[trendType].color }}>
              {formatNumber(getCurrentValue(), 2)} {trendType === 'removal' ? '%' : config.unit}
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-500 text-xs">平均值</p>
            <p className="text-lg font-bold text-white">
              {formatNumber(getAvgValue(), 2)} {trendType === 'removal' ? '%' : config.unit}
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-500 text-xs">{trendType === 'removal' ? '有效率' : '达标率'}</p>
            <p className="text-lg font-bold text-green-400">
              {formatNumber(getComplianceRate(), 0)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-500 text-xs">进水→出水</p>
            <p className="text-lg font-bold text-cyan-400">
              {formatNumber(
                ((unit.inletWater[selectedParam] - unit.outletWater[selectedParam]) /
                  Math.max(unit.inletWater[selectedParam], 0.001)) *
                  100,
                1
              )}
              %
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700/50">
          <p className="text-slate-500 text-xs mb-2 flex items-center gap-1">
            <ArrowDownUp className="w-3 h-3" />
            进出水对比
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-800/50 p-3 rounded-lg text-center">
              <p className="text-[10px] text-slate-500 mb-1">进水 {config.key}</p>
              <p className="text-lg font-bold text-orange-400">
                {formatNumber(unit.inletWater[selectedParam], 1)}
              </p>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg text-center">
              <p className="text-[10px] text-slate-500 mb-1">出水 {config.key}</p>
              <p className="text-lg font-bold text-green-400">
                {formatNumber(unit.outletWater[selectedParam], 1)}
              </p>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg text-center">
              <p className="text-[10px] text-slate-500 mb-1">去除率</p>
              <p className="text-lg font-bold text-cyan-400">
                {formatNumber(
                  ((unit.inletWater[selectedParam] - unit.outletWater[selectedParam]) /
                    Math.max(unit.inletWater[selectedParam], 0.001)) *
                    100,
                  1
                )}
                %
              </p>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default TrendChart;
