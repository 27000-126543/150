import { useState, useEffect } from 'react';
import {
  Download,
  Calendar,
  Play,
  Pause,
  FastForward,
  Gauge,
  Maximize2,
  Minimize2,
  Factory,
  FileSpreadsheet,
  Settings,
} from 'lucide-react';
import { usePlantStore } from '@/store/usePlantStore';
import { useInventoryStore } from '@/store/useInventoryStore';
import { exportDailyReport } from '@/utils/excelExporter';
import { formatDateTime } from '@/utils/formatters';
import GlassCard from './GlassCard';

interface TopToolbarProps {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}

const TopToolbar = ({ isFullscreen, toggleFullscreen }: TopToolbarProps) => {
  const {
    processUnits,
    equipment,
    currentTime,
    isSimulationRunning,
    simulationSpeed,
    toggleSimulation,
    setSimulationSpeed,
  } = usePlantStore();
  const { inventory } = useInventoryStore();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showExportConfirm, setShowExportConfirm] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      // 触发状态更新以重新渲染时间
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleExport = () => {
    const date = new Date(selectedDate);
    exportDailyReport(date, processUnits, equipment, inventory);
    setShowExportConfirm(false);
  };

  return (
    <>
      <div className="absolute top-0 left-0 right-0 z-40 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <GlassCard className="px-6 py-3 flex items-center gap-3">
              <Factory className="w-6 h-6 text-cyan-400" />
              <div>
                <h1
                  className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  智慧污水处理厂
                </h1>
                <p className="text-xs text-slate-400">运营调度与环保应急可视化平台</p>
              </div>
            </GlassCard>

            <GlassCard className="px-4 py-2 flex items-center gap-3">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="text-white text-sm font-mono">{formatDateTime(currentTime)}</span>
            </GlassCard>
          </div>

          <div className="flex items-center gap-3">
            <GlassCard className="px-3 py-2 flex items-center gap-2">
              <button
                onClick={toggleSimulation}
                className={`p-2 rounded-lg transition-all ${
                  isSimulationRunning
                    ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                }`}
                title={isSimulationRunning ? '暂停模拟' : '启动模拟'}
              >
                {isSimulationRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <div className="flex items-center gap-1">
                <span
                  className={`cursor-pointer transition-colors ${
                    simulationSpeed === 1 ? 'text-slate-500' : 'text-cyan-400'
                  }`}
                  onClick={() => setSimulationSpeed(simulationSpeed === 1 ? 2 : 1)}
                  title={simulationSpeed === 1 ? '2倍速' : '1倍速'}
                >
                  <FastForward className="w-4 h-4" />
                </span>
                <span className="text-xs text-slate-400 w-8">{simulationSpeed}x</span>
              </div>
            </GlassCard>

            <GlassCard className="px-3 py-2 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-slate-400">运行状态:</span>
              <span
                className={`w-2 h-2 rounded-full animate-pulse ${
                  isSimulationRunning ? 'bg-green-400' : 'bg-red-400'
                }`}
              />
              <span className="text-sm text-white">
                {isSimulationRunning ? '正常' : '暂停'}
              </span>
            </GlassCard>

            <GlassCard className="px-3 py-2">
              <button
                onClick={() => setShowExportConfirm(true)}
                className="flex items-center gap-2 px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="text-sm font-bold">导出日报</span>
              </button>
            </GlassCard>

            <GlassCard className="px-2 py-2">
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </GlassCard>
          </div>
        </div>
      </div>

      {showExportConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <GlassCard className="w-[400px] p-6">
            <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              导出运营日报
            </h3>

            <div className="mb-4">
              <label className="block text-slate-400 text-sm mb-2">选择日期</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="bg-slate-800/50 rounded-lg p-3 mb-4">
              <p className="text-sm text-slate-400 mb-2">日报内容包括:</p>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>• 各工艺段处理量统计表</li>
                <li>• 出水水质达标率</li>
                <li>• 设备能耗统计</li>
                <li>• 总体运行指标</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowExportConfirm(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleExport}
                className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-bold"
              >
                <Download className="w-4 h-4" />
                确认导出
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </>
  );
};

export default TopToolbar;
