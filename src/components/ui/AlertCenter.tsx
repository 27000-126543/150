import { useState } from 'react';
import { AlertTriangle, Check, X, Bell, Droplets, Wind, Shield, AlertOctagon } from 'lucide-react';
import { useAlertStore } from '@/store/useAlertStore';
import { formatDateTime, formatNumber } from '@/utils/formatters';
import { alertTypeLabels, alertLevelColors } from '@/data/simulationConfig';
import GlassCard from './GlassCard';
import type { Alert, AlertType } from '@/types';

const AlertIcon = ({ type }: { type: AlertType }) => {
  switch (type) {
    case 'water_quality':
      return <Droplets className="w-4 h-4" />;
    case 'equipment':
      return <Wind className="w-4 h-4" />;
    case 'safety':
      return <Shield className="w-4 h-4" />;
    case 'emergency':
      return <AlertOctagon className="w-4 h-4" />;
    default:
      return <Bell className="w-4 h-4" />;
  }
};

const AlertItem = ({ alert }: { alert: Alert }) => {
  const { acknowledgeAlert, clearAlert } = useAlertStore();
  const [showActions, setShowActions] = useState(false);

  const bgColor = alert.acknowledged
    ? 'bg-slate-800/50'
    : alert.level === 'critical'
      ? 'bg-red-500/10 border-red-500/30'
      : alert.level === 'warning'
        ? 'bg-orange-500/10 border-orange-500/30'
        : 'bg-cyan-500/10 border-cyan-500/30';

  return (
    <div
      className={`p-3 rounded-lg border transition-all ${bgColor} ${
        !alert.acknowledged && alert.level === 'critical' ? 'animate-pulse' : ''
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start gap-3">
        <div
          className="p-2 rounded-lg flex-shrink-0"
          style={{ backgroundColor: `${alertLevelColors[alert.level]}20`, color: alertLevelColors[alert.level] }}
        >
          <AlertIcon type={alert.type} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${alertLevelColors[alert.level]}20`, color: alertLevelColors[alert.level] }}
            >
              {alertTypeLabels[alert.type]}
            </span>
            <span className="text-xs text-slate-500 whitespace-nowrap">
              {formatDateTime(alert.timestamp)}
            </span>
          </div>
          <p className={`text-sm mt-1 ${alert.acknowledged ? 'text-slate-500 line-through' : 'text-white'}`}>
            {alert.message}
          </p>
        </div>
        {showActions && (
          <div className="flex gap-1">
            {!alert.acknowledged && (
              <button
                onClick={() => acknowledgeAlert(alert.id)}
                className="p-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                title="确认"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => clearAlert(alert.id)}
              className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
              title="清除"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const AlertCenter = () => {
  const { alerts, unacknowledgedCount, clearAllAlerts, getAlertsByLevel } = useAlertStore();
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  const filteredAlerts =
    filter === 'all' ? alerts : getAlertsByLevel(filter as any);

  const criticalCount = getAlertsByLevel('critical').length;
  const warningCount = getAlertsByLevel('warning').length;
  const infoCount = getAlertsByLevel('info').length;

  return (
    <GlassCard
      className="h-full flex flex-col"
      title="警报中心"
      icon={<Bell className="w-4 h-4" />}
      action={
        <div className="flex items-center gap-2">
          {unacknowledgedCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
              {unacknowledgedCount}
            </span>
          )}
          <button
            onClick={clearAllAlerts}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            清除全部
          </button>
        </div>
      }
    >
      <div className="flex gap-2 mb-3">
        {[
          { key: 'all', label: '全部', count: alerts.length, color: '#00d4ff' },
          { key: 'critical', label: '严重', count: criticalCount, color: '#ff3b30' },
          { key: 'warning', label: '预警', count: warningCount, color: '#ff9500' },
          { key: 'info', label: '信息', count: infoCount, color: '#34c759' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key as any)}
            className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === item.key
                ? 'text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
            style={{
              backgroundColor: filter === item.key ? `${item.color}30` : 'transparent',
              boxShadow: filter === item.key ? `0 0 10px ${item.color}40` : 'none',
            }}
          >
            <span style={{ color: filter === item.key ? item.color : 'inherit' }}>
              {item.label} ({item.count})
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <AlertTriangle className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">暂无警报</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => <AlertItem key={alert.id} alert={alert} />)
        )}
      </div>
    </GlassCard>
  );
};

export default AlertCenter;
