import { useState, useCallback } from 'react';
import { Layers, Map, Eye, Grid3X3 } from 'lucide-react';
import PlantScene from '@/components/scene/PlantScene';
import TopToolbar from '@/components/ui/TopToolbar';
import RightPanel from '@/components/ui/RightPanel';
import TrendChart from '@/components/ui/TrendChart';
import GlassCard from '@/components/ui/GlassCard';
import { usePlantStore } from '@/store/usePlantStore';
import { useSimulation } from '@/hooks/useSimulation';

const Dashboard = () => {
  const { selectedUnitId, setSelectedUnitId } = usePlantStore();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [showPipelines, setShowPipelines] = useState(true);
  const [showGrid, setShowGrid] = useState(false);

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
        </GlassCard>
      </div>

      <div className="absolute left-4 bottom-4 z-40">
        <GlassCard className="px-4 py-2">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-slate-400">系统在线</span>
            </div>
            <div className="h-4 w-px bg-slate-700" />
            <div className="text-slate-400">
              工艺单元: <span className="text-white font-mono">9</span>
            </div>
            <div className="h-4 w-px bg-slate-700" />
            <div className="text-slate-400">
              在线设备: <span className="text-white font-mono">7</span>
            </div>
            <div className="h-4 w-px bg-slate-700" />
            <div className="text-slate-400">
              现场人员: <span className="text-white font-mono">3</span>
            </div>
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
