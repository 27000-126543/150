import { useState } from 'react';
import { Html } from '@react-three/drei';
import { usePlantStore } from '@/store/usePlantStore';
import { formatNumber } from '@/utils/formatters';
import { getWaterQualityColor } from '@/utils/colorUtils';
import { waterQualityStandards } from '@/data/simulationConfig';
import { TrendingUp, TrendingDown, Droplets, Gauge, Activity, ArrowRight } from 'lucide-react';

const UnitWaterQuality = ({ unitId }: { unitId: string }) => {
  const { getUnitById, selectedUnitId, setSelectedUnitId } = usePlantStore();
  const unit = getUnitById(unitId);

  const [showInlet, setShowInlet] = useState(true);

  if (!unit || unit.type === 'control') return null;

  const isSelected = selectedUnitId === unit.id;
  const isBioTank = unit.type === 'biological';

  const tagPosition: [number, number, number] = [
    unit.position[0],
    unit.position[1] + unit.size[1] / 2 + 2.5,
    unit.position[2],
  ];

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous * 1.05) return <TrendingUp className="w-3 h-3 text-red-400" />;
    if (current < previous * 0.95) return <TrendingDown className="w-3 h-3 text-green-400" />;
    return <Activity className="w-3 h-3 text-cyan-400" />;
  };

  const currentData = showInlet ? unit.inletWater : unit.outletWater;
  const prevData = showInlet
    ? unit.trendDataInlet.length > 1
      ? unit.trendDataInlet[unit.trendDataInlet.length - 2]
      : null
    : unit.trendData.length > 1
      ? unit.trendData[unit.trendData.length - 2]
      : null;

  const removalRate = {
    cod: unit.inletWater.cod > 0 ? ((unit.inletWater.cod - unit.outletWater.cod) / unit.inletWater.cod) * 100 : 0,
    nh3n: unit.inletWater.nh3n > 0 ? ((unit.inletWater.nh3n - unit.outletWater.nh3n) / unit.inletWater.nh3n) * 100 : 0,
    tp: unit.inletWater.tp > 0 ? ((unit.inletWater.tp - unit.outletWater.tp) / unit.inletWater.tp) * 100 : 0,
  };

  return (
    <Html
      position={tagPosition}
      center
      distanceFactor={12}
      style={{ pointerEvents: 'auto' }}
    >
      <div
        className={`relative rounded-lg backdrop-blur-md cursor-pointer transition-all duration-300 ${
          isSelected
            ? 'bg-cyan-900/90 border-2 border-cyan-400 shadow-lg shadow-cyan-500/30 scale-105'
            : 'bg-slate-900/80 border border-slate-600/50 hover:bg-slate-800/90 hover:border-cyan-500/50'
        }`}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedUnitId(isSelected ? null : unit.id);
        }}
        style={{ fontFamily: 'Rajdhani, sans-serif', minWidth: '220px' }}
      >
        <div className="flex items-center justify-between px-3 pt-2 pb-1 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold text-sm">{unit.name}</span>
            <span
              className={`w-2 h-2 rounded-full animate-pulse`}
              style={{
                backgroundColor:
                  unit.status === 'alarm' ? '#ff3b30' : unit.status === 'warning' ? '#ff9500' : '#34c759',
              }}
            />
          </div>
          <div className="flex items-center gap-1 bg-slate-800/50 rounded p-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowInlet(true);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                showInlet ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              进水
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowInlet(false);
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                !showInlet ? 'bg-green-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              出水
            </button>
          </div>
        </div>

        <div className="p-2">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-400 flex items-center gap-1">
              <Droplets className="w-3 h-3" /> 流量
            </span>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[10px]">{formatNumber(unit.inletWater.flow, 0)}</span>
              <ArrowRight className="w-3 h-3 text-slate-600" />
              <span className="text-white font-mono font-bold">{formatNumber(unit.outletWater.flow, 0)} m³/h</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-400 flex items-center gap-1">
              <Gauge className="w-3 h-3" /> 液位
            </span>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[10px]">{formatNumber(unit.inletWater.level, 2)}</span>
              <ArrowRight className="w-3 h-3 text-slate-600" />
              <span className="text-white font-mono font-bold">{formatNumber(unit.outletWater.level, 2)} m</span>
            </div>
          </div>

          <div className="h-px bg-slate-700 my-1.5" />

          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400">COD</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[10px]">{formatNumber(unit.inletWater.cod, 1)}</span>
              <ArrowRight className="w-3 h-3 text-slate-600" />
              <div className="flex items-center gap-1">
                <span
                  className="font-mono font-bold"
                  style={{ color: getWaterQualityColor(unit.outletWater.cod, waterQualityStandards.cod) }}
                >
                  {formatNumber(unit.outletWater.cod, 1)}
                </span>
                <span className="text-slate-500 text-[10px]">mg/L</span>
                {prevData && getTrendIcon(currentData.cod, prevData.cod)}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400">氨氮</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[10px]">{formatNumber(unit.inletWater.nh3n, 2)}</span>
              <ArrowRight className="w-3 h-3 text-slate-600" />
              <div className="flex items-center gap-1">
                <span
                  className="font-mono font-bold"
                  style={{ color: getWaterQualityColor(unit.outletWater.nh3n, waterQualityStandards.nh3n) }}
                >
                  {formatNumber(unit.outletWater.nh3n, 2)}
                </span>
                <span className="text-slate-500 text-[10px]">mg/L</span>
                {prevData && getTrendIcon(currentData.nh3n, prevData.nh3n)}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400">总磷</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[10px]">{formatNumber(unit.inletWater.tp, 2)}</span>
              <ArrowRight className="w-3 h-3 text-slate-600" />
              <div className="flex items-center gap-1">
                <span
                  className="font-mono font-bold"
                  style={{ color: getWaterQualityColor(unit.outletWater.tp, waterQualityStandards.tp) }}
                >
                  {formatNumber(unit.outletWater.tp, 2)}
                </span>
                <span className="text-slate-500 text-[10px]">mg/L</span>
                {prevData && getTrendIcon(currentData.tp, prevData.tp)}
              </div>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-700/50 grid grid-cols-3 gap-1 text-center">
            <div className="bg-slate-800/50 rounded p-1">
              <p className="text-[10px] text-slate-500">COD去除</p>
              <p className="text-[11px] font-bold text-cyan-400">{formatNumber(removalRate.cod, 1)}%</p>
            </div>
            <div className="bg-slate-800/50 rounded p-1">
              <p className="text-[10px] text-slate-500">氨氮去除</p>
              <p className="text-[11px] font-bold text-yellow-400">{formatNumber(removalRate.nh3n, 1)}%</p>
            </div>
            <div className="bg-slate-800/50 rounded p-1">
              <p className="text-[10px] text-slate-500">总磷去除</p>
              <p className="text-[11px] font-bold text-green-400">{formatNumber(removalRate.tp, 1)}%</p>
            </div>
          </div>

          {isBioTank && unit.outletWater.do !== undefined && (
            <>
              <div className="h-px bg-slate-700 my-1.5" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">溶解氧</span>
                <div className="flex items-center gap-1">
                  <span
                    className="font-mono font-bold"
                    style={{
                      color:
                        unit.outletWater.do < 1
                          ? '#ff3b30'
                          : unit.outletWater.do < 2
                            ? '#ff9500'
                            : '#34c759',
                    }}
                  >
                    {formatNumber(unit.outletWater.do, 1)}
                  </span>
                  <span className="text-slate-500 text-[10px]">mg/L</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="px-2 pb-2 pt-1 border-t border-slate-700/50 text-center">
          <p className="text-[10px] text-cyan-400 animate-pulse">点击查看24小时趋势曲线</p>
        </div>

        {isSelected && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping" />
        )}
      </div>
    </Html>
  );
};

const WaterQualityTag = () => {
  const { processUnits } = usePlantStore();

  return (
    <group>
      {processUnits.map((unit) => (
        <UnitWaterQuality key={unit.id} unitId={unit.id} />
      ))}
    </group>
  );
};

export default WaterQualityTag;
