import { useState } from 'react';
import {
  Cog,
  Wind,
  Droplets,
  ArrowDownUp,
  Gauge,
  Clock,
  AlertTriangle,
  CheckCircle,
  Wrench,
  History,
  BarChart3,
  Package,
  User,
  Calendar,
} from 'lucide-react';
import { usePlantStore } from '@/store/usePlantStore';
import { formatHours, formatNumber, formatDateTime } from '@/utils/formatters';
import { equipmentColors, equipmentIcons } from '@/data/simulationConfig';
import GlassCard from './GlassCard';
import type { Equipment } from '@/types';

const getEquipmentIcon = (type: string) => {
  const iconName = equipmentIcons[type as keyof typeof equipmentIcons] || 'pump';
  switch (iconName) {
    case 'blower':
      return Wind;
    case 'dewatering':
      return Droplets;
    case 'pump':
    default:
      return ArrowDownUp;
  }
};

const EquipmentCard = ({ equipment }: { equipment: Equipment }) => {
  const { createMaintenanceOrder, completeMaintenanceOrder, updateMaintenanceProgress } = usePlantStore();
  const [showDetails, setShowDetails] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  const Icon = getEquipmentIcon(equipment.type);
  const color = equipmentColors[equipment.type as keyof typeof equipmentColors] || '#00d4ff';

  const usagePercent = (equipment.runHours / equipment.maintenanceThreshold) * 100;
  const needsMaintenance = equipment.runHours >= equipment.maintenanceThreshold;
  const isOnline = equipment.status === 'running';

  const order = equipment.maintenanceOrder;

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return '#34c759';
    if (progress >= 60) return '#00d4ff';
    if (progress >= 30) return '#ff9500';
    return '#ff3b30';
  };

  const getProgressStatus = (progress: number) => {
    if (progress >= 100) return '已完成';
    if (progress >= 80) return '收尾阶段';
    if (progress >= 60) return '正在检修';
    if (progress >= 30) return '部件拆卸';
    if (progress > 0) return '准备中';
    return '待处理';
  };

  return (
    <div
      className={`p-3 rounded-lg border transition-all ${
        needsMaintenance
          ? 'bg-orange-500/10 border-orange-500/50'
          : equipment.status === 'standby' || equipment.status === 'maintenance'
            ? 'bg-red-500/10 border-red-500/30'
            : 'bg-slate-800/50 border-slate-700/50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className="p-2.5 rounded-lg flex-shrink-0"
          style={{
            backgroundColor: `${color}20`,
            boxShadow: isOnline ? `0 0 10px ${color}40` : 'none',
          }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-white font-bold text-sm">{equipment.name}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                isOnline
                  ? needsMaintenance
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isOnline ? (needsMaintenance ? 'bg-orange-400' : 'bg-green-400') : 'bg-red-400'
                }`}
              />
              {equipment.status === 'running'
                ? needsMaintenance
                  ? '待保养'
                  : '运行中'
                : equipment.status === 'standby'
                  ? '待机'
                  : '维护中'}
            </span>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500">累计运行: </span>
              <span className={`font-mono ${needsMaintenance ? 'text-orange-400' : 'text-white'}`}>
                {formatHours(equipment.runHours)}
              </span>
            </div>
            <div>
              <span className="text-slate-500">能耗: </span>
              <span className="text-white font-mono">{formatNumber(equipment.powerConsumption, 1)} kW</span>
            </div>
            <div>
              <span className="text-slate-500">效率: </span>
              <span className="text-cyan-400 font-mono">{formatNumber(equipment.efficiency, 1)}%</span>
            </div>
            <div>
              <span className="text-slate-500">振动: </span>
              <span className="text-white font-mono">{formatNumber(equipment.vibration, 2)} mm/s</span>
            </div>
          </div>

          <div className="mt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                保养进度
              </span>
              <span className={needsMaintenance ? 'text-orange-400' : 'text-slate-400'}>
                {formatNumber(usagePercent, 0)}%
              </span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(usagePercent, 100)}%`,
                  backgroundColor: needsMaintenance ? '#ff9500' : color,
                  boxShadow: needsMaintenance ? '0 0 8px #ff9500' : `0 0 8px ${color}`,
                }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              保养阈值: {formatHours(equipment.maintenanceThreshold)} | 下次保养还剩:{' '}
              <span className={needsMaintenance ? 'text-orange-400' : 'text-slate-400'}>
                {formatHours(Math.max(0, equipment.maintenanceThreshold - equipment.runHours))}
              </span>
            </p>
          </div>

          <div className="mt-2 flex gap-2">
            {needsMaintenance && !order && (
              <button
                onClick={() => createMaintenanceOrder(equipment.id)}
                className="flex-1 px-2 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded text-xs font-bold transition-colors flex items-center justify-center gap-1"
              >
                <Wrench className="w-3 h-3" />
                生成检修工单
              </button>
            )}
            {order && order.progress >= 100 && (
              <button
                onClick={() => completeMaintenanceOrder(equipment.id)}
                className="flex-1 px-2 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-xs font-bold transition-colors flex items-center justify-center gap-1"
              >
                <CheckCircle className="w-3 h-3" />
                完成保养
              </button>
            )}
            {order && order.progress < 100 && (
              <button
                onClick={() => setShowOrderDetails(!showOrderDetails)}
                className={`flex-1 px-2 py-1.5 rounded text-xs font-bold transition-colors flex items-center justify-center gap-1 ${
                  showOrderDetails
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400'
                }`}
              >
                <Wrench className="w-3 h-3" />
                {showOrderDetails ? '收起工单' : '查看工单详情'}
              </button>
            )}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs transition-colors"
            >
              <History className="w-3 h-3" />
            </button>
          </div>

          {order && (
            <div className="mt-2 p-2 bg-orange-500/10 rounded border border-orange-500/30">
              <div className="flex items-center justify-between">
                <p className="text-xs text-orange-400 flex items-center gap-1">
                  <Wrench className="w-3 h-3" />
                  工单 #{order.id} - {order.description}
                </p>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${getProgressColor(order.progress)}20`,
                    color: getProgressColor(order.progress),
                  }}
                >
                  {getProgressStatus(order.progress)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                创建时间: {formatDateTime(order.createdAt)}
              </p>

              {order.progress < 100 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500">处理进度</span>
                    <span style={{ color: getProgressColor(order.progress) }}>{order.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${order.progress}%`,
                        backgroundColor: getProgressColor(order.progress),
                        boxShadow: `0 0 6px ${getProgressColor(order.progress)}`,
                      }}
                    />
                  </div>
                </div>
              )}

              {order.lowStockAlert && order.lowStockAlert.length > 0 && (
                <div className="mt-2 p-2 bg-red-500/10 rounded border border-red-500/30">
                  <p className="text-[10px] text-red-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    备件不足提醒: {order.lowStockAlert.join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}

          {order && showOrderDetails && (
            <div className="mt-2 p-3 bg-slate-800/80 rounded-lg border border-slate-600/50">
              <p className="text-sm font-bold text-cyan-400 mb-2 flex items-center gap-1">
                <Wrench className="w-4 h-4" />
                检修工单详情
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-500" />
                  <span className="text-slate-500">负责人:</span>
                  <span className="text-white font-bold">{order.assignee}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span className="text-slate-500">预计停机:</span>
                  <span className="text-yellow-400 font-bold">{order.estimatedDowntime}</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                <Package className="w-3 h-3" />
                所需备件:
              </p>
              <div className="space-y-1 mb-3">
                {order.spareParts.map((part, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded text-xs ${
                      part.inStock
                        ? 'bg-green-500/10 border border-green-500/30'
                        : 'bg-red-500/10 border border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-white">{part.name}</span>
                      <span className="text-slate-500">x{part.quantity}</span>
                    </div>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        part.inStock
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {part.inStock ? '库存充足' : '库存不足'}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-slate-500 mb-1">处理进度:</p>
              <div className="grid grid-cols-5 gap-1 mb-3">
                {[0, 25, 50, 75, 100].map((step) => (
                  <button
                    key={step}
                    onClick={() => updateMaintenanceProgress(equipment.id, step)}
                    disabled={step < order.progress}
                    className={`p-1.5 rounded text-[10px] font-bold transition-all ${
                      step <= order.progress
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'bg-slate-700 text-slate-500 border border-slate-600 hover:bg-slate-600 hover:text-slate-300'
                    }`}
                  >
                    {step}%
                  </button>
                ))}
              </div>

              {order.notes && (
                <div className="p-2 bg-slate-700/50 rounded">
                  <p className="text-[10px] text-slate-500">备注:</p>
                  <p className="text-xs text-slate-300">{order.notes}</p>
                </div>
              )}
            </div>
          )}

          {showDetails && (
            <div className="mt-2 pt-2 border-t border-slate-700/50">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">温度: </span>
                  <span className="text-white font-mono">{formatNumber(equipment.temperature, 1)}°C</span>
                </div>
                <div>
                  <span className="text-slate-500">电流: </span>
                  <span className="text-white font-mono">{formatNumber(equipment.current, 1)}A</span>
                </div>
                <div>
                  <span className="text-slate-500">压力: </span>
                  <span className="text-white font-mono">{formatNumber(equipment.pressure, 1)}kPa</span>
                </div>
                <div>
                  <span className="text-slate-500">转速: </span>
                  <span className="text-white font-mono">{formatNumber(equipment.rpm, 0)}rpm</span>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-xs text-slate-500 mb-1">维护历史:</p>
                <div className="space-y-1">
                  {equipment.maintenanceHistory.slice(0, 3).map((record, i) => (
                    <div key={i} className="text-xs text-slate-400 flex justify-between">
                      <span>{record.description}</span>
                      <span className="text-slate-600">{formatDateTime(record.date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const EquipmentPanel = () => {
  const { equipment, maintenanceOrders, totalPowerConsumption } = usePlantStore();
  const [filter, setFilter] = useState<'all' | 'needs_maintenance' | 'running' | 'standby'>('all');

  const filteredEquipment = equipment.filter((eq) => {
    switch (filter) {
      case 'needs_maintenance':
        return eq.runHours >= eq.maintenanceThreshold;
      case 'running':
        return eq.status === 'running';
      case 'standby':
        return eq.status === 'standby' || eq.status === 'maintenance';
      default:
        return true;
    }
  });

  const needsMaintenanceCount = equipment.filter(
    (eq) => eq.runHours >= eq.maintenanceThreshold
  ).length;
  const onlineCount = equipment.filter((eq) => eq.status === 'running').length;
  const offlineCount = equipment.filter((eq) => eq.status !== 'running').length;
  const activeOrderCount = maintenanceOrders.filter((o) => o.progress < 100).length;

  return (
    <GlassCard
      className="h-full flex flex-col"
      title="设备运维中心"
      icon={<Cog className="w-4 h-4" />}
      action={
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            <Gauge className="w-3 h-3" />
            总能耗: <span className="text-yellow-400 font-mono font-bold">{formatNumber(totalPowerConsumption, 1)} kW</span>
          </span>
          {activeOrderCount > 0 && (
            <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full flex items-center gap-1 font-bold">
              <Wrench className="w-3 h-3" />
              {activeOrderCount} 进行中工单
            </span>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="p-2 bg-slate-800/50 rounded-lg text-center">
          <p className="text-lg font-bold text-cyan-400 font-mono">{equipment.length}</p>
          <p className="text-xs text-slate-500">设备总数</p>
        </div>
        <div className="p-2 bg-green-500/10 rounded-lg text-center">
          <p className="text-lg font-bold text-green-400 font-mono">{onlineCount}</p>
          <p className="text-xs text-slate-500">在线</p>
        </div>
        <div className="p-2 bg-orange-500/10 rounded-lg text-center">
          <p className="text-lg font-bold text-orange-400 font-mono">{needsMaintenanceCount}</p>
          <p className="text-xs text-slate-500">待保养</p>
        </div>
        <div className="p-2 bg-red-500/10 rounded-lg text-center">
          <p className="text-lg font-bold text-red-400 font-mono">{offlineCount}</p>
          <p className="text-xs text-slate-500">离线</p>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        {[
          { key: 'all', label: '全部', count: equipment.length },
          { key: 'needs_maintenance', label: '待保养', count: needsMaintenanceCount },
          { key: 'running', label: '运行中', count: onlineCount },
          { key: 'standby', label: '待机/维护', count: offlineCount },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key as any)}
            className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === item.key
                ? 'bg-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {item.label} ({item.count})
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {filteredEquipment.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Cog className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">暂无设备</p>
          </div>
        ) : (
          filteredEquipment.map((eq) => <EquipmentCard key={eq.id} equipment={eq} />)
        )}
      </div>
    </GlassCard>
  );
};

export default EquipmentPanel;
