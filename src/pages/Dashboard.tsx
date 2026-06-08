import { useState, useCallback } from 'react';
import { Layers, Map, Eye, Grid3X3, Activity, Zap } from 'lucide-react';
import PlantScene from '@/components/scene/PlantScene';
import TopToolbar from '@/components/ui/TopToolbar';
import RightPanel from '@/components/ui/RightPanel';
import TrendChart from '@/components/ui/TrendChart';
import DispatchPanel from '@/components/ui/DispatchPanel';
import GlassCard from '@/components/ui/GlassCard';
import { usePlantStore } from '@/store/usePlantStore';
import { useDispatchStore } from '@/store/useDispatchStore';
import { useSimulation } from '@/hooks/useSimulation';
import { formatNumber } from '@/utils/formatters';

const Dashboard = () => {
  const { selectedUnitId, setSelectedUnitId, treatmentLines, totalInletFlow, totalPowerConsumption, getUnitById } = usePlantStore();
  const { isActive: isDispatchActive } = useDispatchStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [showPipelines, setShowPipelines] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [showDispatchPanel, setShowDispatchPanel] = useState(false);

  useSimulation();

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const activeTreatmentLines = treatmentLines.filter((l) => l.isActive);
  const backupLine = treatmentLines.find((l) => l.isBackup);

  const getLineColor = (load: number) => {
    if (load >= 90) return '#ff3b30';
    if (load >= 70) return '#ff9500';
    if (load >= 50) return '#ffd60a';
    return '#34c759';
  };

  return (
    <div className="w-full h-screen bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900" />
      
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(to right, #00d4ff 1px, transparent 1px),
              linear-gradient(to bottom, #00d4ff 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <PlantScene
        showLabels={showLabels}
        showPipelines={showPipelines}
        showGrid={showGrid}
      />

      <TopToolbar
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
      />

      <RightPanel
        isCollapsed={isRightPanelCollapsed}
        onToggle={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
      />

      <div className="absolute left-4 top-24 z-40 space-y-2">
        <GlassCard className="p-2 flex flex-col gap-1">
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`p-2.5 rounded-lg transition-all ${
              showLabels
                ? 'bg-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
            title="显示/隐藏水质标签"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowPipelines(!showPipelines)}
            className={`p-2.5 rounded-lg transition-all ${
              showPipelines
                ? 'bg-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
            title="显示/隐藏管道"
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2.5 rounded-lg transition-all ${
              showGrid
                ? 'bg-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
            title="显示/隐藏网格"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDispatchPanel(!showDispatchPanel)}
            className={`p-2.5 rounded-lg transition-all ${
              showDispatchPanel || isDispatchActive
                ? 'bg-yellow-500/20 text-yellow-400 shadow-lg shadow-yellow-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
            title="调度推演模式"
          >
            <Activity className="w-4 h-4" />
          </button>
        </GlassCard>
      </div>

      {showDispatchPanel && (
        <div className="absolute left-20 top-24 z-40 w-[400px] max-h-[70vh] overflow-y-auto">
          <DispatchPanel onClose={() => setShowDispatchPanel(false)} />
        </div>
      )}

      <div className="absolute left-4 bottom-4 z-40 right-80">
        <GlassCard className="px-4 py-3">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-slate-400">系统在线</span>
            </div>
            <div className="h-4 w-px bg-slate-700" />
            <div className="text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              总能耗: <span className="text-yellow-400 font-mono font-bold">{formatNumber(totalPowerConsumption, 1)} kW</span>
            </div>
            <div className="h-4 w-px bg-slate-700" />
            <div className="text-slate-400">
              总进水: <span className="text-cyan-400 font-mono font-bold">{formatNumber(totalInletFlow, 1)} m³/h</span>
            </div>
            <div className="h-4 w-px bg-slate-700" />
            <div className="text-slate-400">
              工艺单元: <span className="text-white font-mono">9</span>
            </div>

            {activeTreatmentLines.length > 0 && (
              <>
                <div className="h-4 w-px bg-slate-700" />
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">处理线负荷:</span>
                  {treatmentLines.map((line) => (
                    <div
                      key={line.id}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded ${
                        line.isActive
                          ? 'bg-slate-700/50'
                          : 'bg-slate-800/30 opacity-50'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          line.isBackup ? 'bg-green-400' : 'bg-cyan-400'
                        } ${line.isActive ? 'animate-pulse' : ''}`}
                      />
                      <span className="text-slate-400 text-[10px]">{line.name}</span>
                      <span
                        className="font-mono font-bold text-[10px]"
                        style={{ color: getLineColor(line.loadPercentage) }}
                      >
                        {formatNumber(line.loadPercentage, 0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {backupLine && backupLine.isActive && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 rounded border border-green-500/30 ml-2">
                <span className="text-green-400 text-[10px] font-bold">
                  备用线接管 {formatNumber(backupLine.loadPercentage, 0)}% 负荷
                </span>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      <div className="absolute right-4 bottom-4 z-30">
        <GlassCard className="px-3 py-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Map className="w-3 h-3" />
            <span>智慧污水处理厂 3D 可视化平台 v1.0</span>
          </div>
        </GlassCard>
      </div>

      {selectedUnitId && (
        <TrendChart
          unitId={selectedUnitId}
          onClose={() => setSelectedUnitId(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
