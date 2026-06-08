import { useState } from 'react';
import { Bell, ClipboardCheck, Cog, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import GlassCard from './GlassCard';
import AlertCenter from './AlertCenter';
import ApprovalFlow from './ApprovalFlow';
import EquipmentPanel from './EquipmentPanel';
import InventoryPanel from './InventoryPanel';

const tabs = [
  { key: 'alerts', label: '警报', icon: Bell, color: '#ff3b30' },
  { key: 'approval', label: '审批', icon: ClipboardCheck, color: '#ff9500' },
  { key: 'equipment', label: '设备', icon: Cog, color: '#00d4ff' },
  { key: 'inventory', label: '库存', icon: Package, color: '#34c759' },
];

interface RightPanelProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const RightPanel = ({ isCollapsed, onToggle }: RightPanelProps) => {
  const [activeTab, setActiveTab] = useState('alerts');
  const [isExpanded, setIsExpanded] = useState(false);

  const activeTabConfig = tabs.find((t) => t.key === activeTab);

  const renderContent = () => {
    switch (activeTab) {
      case 'alerts':
        return <AlertCenter />;
      case 'approval':
        return <ApprovalFlow />;
      case 'equipment':
        return <EquipmentPanel />;
      case 'inventory':
        return <InventoryPanel />;
      default:
        return <AlertCenter />;
    }
  };

  if (isCollapsed) {
    return (
      <div className="absolute right-4 top-24 z-40">
        <GlassCard className="p-2 flex flex-col gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  onToggle();
                }}
                className={`p-3 rounded-lg transition-all hover:scale-105 ${
                  activeTab === tab.key
                    ? 'shadow-lg'
                    : 'hover:bg-slate-700/50'
                }`}
                style={{
                  backgroundColor: activeTab === tab.key ? `${tab.color}20` : 'transparent',
                  boxShadow: activeTab === tab.key ? `0 0 15px ${tab.color}40` : 'none',
                }}
                title={tab.label}
              >
                <Icon className="w-5 h-5" style={{ color: activeTab === tab.key ? tab.color : '#94a3b8' }} />
              </button>
            );
          })}
          <div className="h-px bg-slate-700 my-1" />
          <button
            onClick={onToggle}
            className="p-3 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
            title="展开面板"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </GlassCard>
      </div>
    );
  }

  const panelWidth = isExpanded ? 'w-[480px]' : 'w-[380px]';

  return (
    <div className={`absolute right-4 top-24 bottom-4 ${panelWidth} z-40 transition-all duration-300`}>
      <div className="h-full flex flex-col">
        <GlassCard className="flex-shrink-0 mb-2">
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${
                      isActive
                        ? 'text-white shadow-lg'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                    style={{
                      backgroundColor: isActive ? `${tab.color}20` : 'transparent',
                      boxShadow: isActive ? `0 0 10px ${tab.color}40` : 'none',
                    }}
                  >
                    <Icon className="w-4 h-4" style={{ color: isActive ? tab.color : undefined }} />
                    <span className="text-xs font-bold">{tab.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 hover:bg-slate-700 rounded transition-colors text-slate-400"
                title={isExpanded ? '缩小面板' : '扩大面板'}
              >
                {isExpanded ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
              <button
                onClick={onToggle}
                className="p-1.5 hover:bg-slate-700 rounded transition-colors text-slate-400"
                title="收起面板"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </GlassCard>

        <div className="flex-1 min-h-0">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default RightPanel;
