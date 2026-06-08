import { useState } from 'react';
import {
  Play,
  Pause,
  Zap,
  Wind,
  Droplets,
  Gauge,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  X,
  ArrowRight,
  RefreshCw,
  Lightbulb,
  BarChart3,
  Leaf,
  Target,
} from 'lucide-react';
import { useDispatchStore } from '@/store/useDispatchStore';
import { usePlantStore } from '@/store/usePlantStore';
import { formatNumber } from '@/utils/formatters';
import GlassCard from './GlassCard';
import type { DispatchStrategy, DispatchScenario } from '@/types';

const StrategyCard = ({
  strategy,
  isSelected,
  onSelect,
}: {
  strategy: DispatchStrategy;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const activeLines = strategy.lineActivation.filter((l) => l.active).length;
  const avgFreq = strategy.aerationFrequency.reduce((sum, f) => sum + f.frequency, 0) / strategy.aerationFrequency.length;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400';
    if (score >= 75) return 'text-cyan-400';
    return 'text-yellow-400';
  };

  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? 'bg-cyan-500/20 border-cyan-500 shadow-lg shadow-cyan-500/20'
          : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 hover:border-cyan-500/50'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              strategy.name.includes('节能') ? 'bg-green-500/20' : strategy.name.includes('强化') ? 'bg-red-500/20' : 'bg-cyan-500/20'
            }`}
          >
            {strategy.name.includes('节能') ? (
              <Leaf className="w-4 h-4 text-green-400" />
            ) : strategy.name.includes('强化') ? (
              <Zap className="w-4 h-4 text-red-400" />
            ) : (
              <Target className="w-4 h-4 text-cyan-400" />
            )}
          </div>
          <span className="text-white font-bold text-sm">{strategy.name}</span>
        </div>
        <div className={`text-lg font-bold ${getScoreColor(strategy.score)}`}>
          {strategy.score}分
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs mb-2">
        <div className="bg-slate-900/50 p-2 rounded text-center">
          <p className="text-slate-500">处理线</p>
          <p className="text-cyan-400 font-bold">{activeLines}条</p>
        </div>
        <div className="bg-slate-900/50 p-2 rounded text-center">
          <p className="text-slate-500">曝气频率</p>
          <p className="text-yellow-400 font-bold">{formatNumber(avgFreq, 0)}Hz</p>
        </div>
        <div className="bg-slate-900/50 p-2 rounded text-center">
          <p className="text-slate-500">回流比</p>
          <p className="text-green-400 font-bold">{strategy.returnSludgeRatio}%</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="bg-slate-900/50 p-2 rounded text-center">
          <p className="text-slate-500">预计达标率</p>
          <p
            className={`font-bold ${
              strategy.expectedComplianceRate >= 95
                ? 'text-green-400'
                : strategy.expectedComplianceRate >= 80
                  ? 'text-yellow-400'
                  : 'text-red-400'
            }`}
          >
            {formatNumber(strategy.expectedComplianceRate, 1)}%
          </p>
        </div>
        <div className="bg-slate-900/50 p-2 rounded text-center">
          <p className="text-slate-500">预计能耗</p>
          <p className="text-orange-400 font-bold">{formatNumber(strategy.expectedEnergyConsumption, 0)}kW</p>
        </div>
        <div className="bg-slate-900/50 p-2 rounded text-center">
          <p className="text-slate-500">风险点</p>
          <p
            className={`font-bold ${
              strategy.riskPoints.some((r) => r.level === 'high')
                ? 'text-red-400'
                : strategy.riskPoints.some((r) => r.level === 'medium')
                  ? 'text-yellow-400'
                  : 'text-green-400'
            }`}
          >
            {strategy.riskPoints.length}个
          </p>
        </div>
      </div>

      {strategy.chemicalDosing.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-700/50">
          <p className="text-xs text-slate-500 mb-1">应急投加:</p>
          <div className="flex gap-2 flex-wrap">
            {strategy.chemicalDosing.map((dosing, i) => (
              <span key={i} className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                {dosing.chemicalId === 'carbon' ? '碳源' : 'PAC'} {dosing.dosage}kg/h
              </span>
            ))}
          </div>
        </div>
      )}

      {strategy.riskPoints.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-700/50">
          <p className="text-xs text-slate-500 mb-1">风险提示:</p>
          <div className="space-y-1">
            {strategy.riskPoints.slice(0, 2).map((risk, i) => (
              <div key={i} className="flex items-start gap-1">
                <AlertTriangle
                  className={`w-3 h-3 flex-shrink-0 mt-0.5 ${
                    risk.level === 'high' ? 'text-red-400' : risk.level === 'medium' ? 'text-yellow-400' : 'text-green-400'
                  }`}
                />
                <span className="text-xs text-slate-400">{risk.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface DispatchPanelProps {
  onClose?: () => void;
}

const DispatchPanel = ({ onClose }: DispatchPanelProps) => {
  const {
    isActive,
    scenario,
    strategies,
    selectedStrategy,
    scenarios,
    togglePreviewMode,
    setScenario,
    generateStrategies,
    selectStrategy,
    applyStrategy,
    cancelPreview,
  } = useDispatchStore();

  const { treatmentLines } = usePlantStore();
  const [customScenario, setCustomScenario] = useState({
    inflow: 250,
    codLoad: 350,
    nh3nLoad: 25,
  });

  const handleScenarioSelect = (s: DispatchScenario) => {
    setScenario(s);
    setCustomScenario({
      inflow: s.inflow,
      codLoad: s.codLoad,
      nh3nLoad: s.nh3nLoad,
    });
  };

  const handleGenerateStrategies = () => {
    const currentScenario: DispatchScenario = {
      id: scenario?.id || 'custom',
      name: scenario?.name || '自定义场景',
      ...customScenario,
      description: scenario?.description || '用户自定义调度场景',
    };
    setScenario(currentScenario);
    generateStrategies();
  };

  if (!isActive) {
    return (
      <GlassCard className="p-3">
        <button
          onClick={togglePreviewMode}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-bold text-sm hover:from-cyan-400 hover:to-blue-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30"
        >
          <Lightbulb className="w-4 h-4" />
          启动调度推演模式
        </button>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="h-full flex flex-col" title="调度推演中心" icon={<Lightbulb className="w-4 h-4" />}>
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        <div className="bg-slate-800/30 p-3 rounded-lg border border-cyan-500/30">
          <p className="text-cyan-400 text-xs font-bold mb-2 flex items-center gap-1">
            <Target className="w-3 h-3" />
            选择推演场景（未来2小时）
          </p>

          <div className="grid grid-cols-2 gap-2 mb-3">
            {scenarios.map((s) => (
              <button
                key={s.id}
                onClick={() => handleScenarioSelect(s)}
                className={`p-2 rounded-lg text-left text-xs transition-all ${
                  scenario?.id === s.id
                    ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                    : 'bg-slate-700/50 border border-transparent text-slate-400 hover:bg-slate-700'
                }`}
              >
                <p className="font-bold">{s.name}</p>
                <p className="text-[10px] opacity-70 mt-1">{s.description}</p>
              </button>
            ))}
          </div>

          <p className="text-slate-500 text-xs mb-2">或自定义参数:</p>

          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">来水量</span>
                <span className="text-cyan-400 font-mono">{customScenario.inflow} m³/h</span>
              </div>
              <input
                type="range"
                min="100"
                max="500"
                value={customScenario.inflow}
                onChange={(e) => setCustomScenario({ ...customScenario, inflow: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">COD负荷</span>
                <span className="text-orange-400 font-mono">{customScenario.codLoad} mg/L</span>
              </div>
              <input
                type="range"
                min="100"
                max="800"
                value={customScenario.codLoad}
                onChange={(e) => setCustomScenario({ ...customScenario, codLoad: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">氨氮负荷</span>
                <span className="text-yellow-400 font-mono">{customScenario.nh3nLoad} mg/L</span>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                value={customScenario.nh3nLoad}
                onChange={(e) => setCustomScenario({ ...customScenario, nh3nLoad: Number(e.target.value) })}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
              />
            </div>
          </div>

          <button
            onClick={handleGenerateStrategies}
            className="w-full mt-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3 h-3" />
            生成调度策略
          </button>
        </div>

        {strategies.length > 0 && (
          <div>
            <p className="text-cyan-400 text-xs font-bold mb-2 flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              可选调度策略 ({strategies.length}套)
            </p>
            <div className="space-y-2">
              {strategies.map((strategy) => (
                <StrategyCard
                  key={strategy.id}
                  strategy={strategy}
                  isSelected={selectedStrategy?.id === strategy.id}
                  onSelect={() => selectStrategy(strategy)}
                />
              ))}
            </div>
          </div>
        )}

        {selectedStrategy && (
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-3 rounded-lg border border-cyan-500/50">
            <p className="text-cyan-400 text-xs font-bold mb-2 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              策略详情 - {selectedStrategy.name}
            </p>

            <div className="space-y-2 text-xs">
              <div>
                <p className="text-slate-500 mb-1">处理线负荷分配:</p>
                {selectedStrategy.lineActivation.map((line) => (
                  <div key={line.lineId} className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${line.active ? 'bg-green-400' : 'bg-slate-600'}`} />
                    <span className="text-slate-400 w-20">
                      {treatmentLines.find((l) => l.id === line.lineId)?.name || line.lineId}
                    </span>
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 transition-all"
                        style={{ width: `${line.loadRatio}%` }}
                      />
                    </div>
                    <span className="text-cyan-400 font-mono w-12 text-right">
                      {line.active ? `${formatNumber(line.loadRatio, 0)}%` : '停用'}
                    </span>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-slate-500 mb-1">曝气系统设置:</p>
                {selectedStrategy.aerationFrequency.map((blower) => (
                  <div key={blower.blowerId} className="flex items-center gap-2 mb-1">
                    <Wind className="w-3 h-3 text-yellow-400" />
                    <span className="text-slate-400 w-20">
                      {blower.blowerId.replace('blower-', '')}#鼓风机
                    </span>
                    <span className="text-yellow-400 font-mono">{blower.frequency} Hz</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Droplets className="w-3 h-3 text-green-400" />
                <span className="text-slate-400">污泥回流比:</span>
                <span className="text-green-400 font-mono font-bold">{selectedStrategy.returnSludgeRatio}%</span>
              </div>

              {selectedStrategy.chemicalDosing.length > 0 && (
                <div>
                  <p className="text-slate-500 mb-1">药剂投加方案:</p>
                  {selectedStrategy.chemicalDosing.map((dosing, i) => (
                    <div key={i} className="flex items-center gap-2 mb-1">
                      <Zap className="w-3 h-3 text-orange-400" />
                      <span className="text-slate-400 w-20">
                        {dosing.chemicalId === 'carbon' ? '碳源(乙酸钠)' : 'PAC'}
                      </span>
                      <span className="text-orange-400 font-mono">{dosing.dosage} kg/h</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {selectedStrategy && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={applyStrategy}
              className="py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-bold text-xs hover:from-green-400 hover:to-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/30"
            >
              <CheckCircle className="w-3 h-3" />
              一键套用
            </button>
            <button
              onClick={cancelPreview}
              className="py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <X className="w-3 h-3" />
              取消推演
            </button>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export default DispatchPanel;
