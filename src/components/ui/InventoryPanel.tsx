import { useState } from 'react';
import {
  Package,
  AlertTriangle,
  ShoppingCart,
  Clock,
  TrendingDown,
  CheckCircle,
  XCircle,
  Plus,
  BarChart3,
  Droplets,
  FlaskConical,
  Truck,
} from 'lucide-react';
import { useInventoryStore } from '@/store/useInventoryStore';
import { formatNumber, calculateDaysRemaining, formatDateTime } from '@/utils/formatters';
import GlassCard from './GlassCard';
import type { ChemicalInventory } from '@/types';

const getChemicalIcon = (name: string) => {
  if (name.includes('碳源') || name.includes('乙酸钠')) return Droplets;
  return FlaskConical;
};

const getChemicalColor = (name: string) => {
  if (name.includes('碳源') || name.includes('乙酸钠')) return '#00d4ff';
  if (name.includes('絮凝剂') || name.includes('PAM')) return '#ff9500';
  if (name.includes('消毒剂') || name.includes('次氯酸钠')) return '#34c759';
  if (name.includes('碱') || name.includes('氢氧化钠')) return '#ff3b30';
  return '#5e5ce6';
};

const InventoryCard = ({ item }: { item: ChemicalInventory }) => {
  const { consumeChemical, createPurchaseRequest, receivePurchase, updatePurchaseStatus } =
    useInventoryStore();
  const [showDetails, setShowDetails] = useState(false);

  const Icon = getChemicalIcon(item.name);
  const color = getChemicalColor(item.name);
  const daysRemaining = calculateDaysRemaining(item.currentStock, item.dailyConsumption);
  const isLowStock = item.currentStock < item.safetyThreshold;
  const usagePercent = (item.currentStock / item.maxStock) * 100;

  const handleReceive = () => {
    receivePurchase(item.id);
  };

  const handleStatusChange = (status: 'ordered' | 'received') => {
    if (status === 'received') {
      handleReceive();
    } else {
      updatePurchaseStatus(item.id, status);
    }
  };

  return (
    <div
      className={`p-3 rounded-lg border transition-all ${
        isLowStock
          ? 'bg-red-500/10 border-red-500/50'
          : item.purchaseRequest
            ? 'bg-yellow-500/10 border-yellow-500/30'
            : 'bg-slate-800/50 border-slate-700/50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className="p-2.5 rounded-lg flex-shrink-0"
          style={{
            backgroundColor: `${color}20`,
            boxShadow: isLowStock ? '0 0 15px #ff3b3040' : `0 0 10px ${color}40`,
          }}
        >
          <Icon className="w-5 h-5" style={{ color: isLowStock ? '#ff3b30' : color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-white font-bold text-sm">{item.name}</span>
            {isLowStock && (
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-bold rounded-full flex items-center gap-1 animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                库存不足
              </span>
            )}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500">当前库存: </span>
              <span className={`font-mono font-bold ${isLowStock ? 'text-red-400' : 'text-white'}`}>
                {formatNumber(item.currentStock, 0)} {item.unit}
              </span>
            </div>
            <div>
              <span className="text-slate-500">安全库存: </span>
              <span className="text-slate-300 font-mono">
                {formatNumber(item.safetyThreshold, 0)} {item.unit}
              </span>
            </div>
            <div>
              <span className="text-slate-500">日消耗量: </span>
              <span className="text-cyan-400 font-mono">
                {formatNumber(item.dailyConsumption, 1)} {item.unit}
              </span>
            </div>
            <div>
              <span className="text-slate-500">可维持: </span>
              <span
                className={`font-mono font-bold ${
                  daysRemaining < 3
                    ? 'text-red-400'
                    : daysRemaining < 7
                      ? 'text-orange-400'
                      : 'text-green-400'
                }`}
              >
                {daysRemaining} 天
              </span>
            </div>
          </div>

          <div className="mt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500">库存水位</span>
              <span className={isLowStock ? 'text-red-400' : 'text-cyan-400'}>
                {formatNumber(usagePercent, 0)}%
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${usagePercent}%`,
                  backgroundColor: isLowStock ? '#ff3b30' : color,
                  boxShadow: isLowStock ? '0 0 8px #ff3b30' : `0 0 8px ${color}`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs mt-0.5 text-slate-600">
              <span>0</span>
              <span>安全线 {formatNumber(item.safetyThreshold, 0)}</span>
              <span>满仓 {formatNumber(item.maxStock, 0)}</span>
            </div>
          </div>

          <div className="mt-2 flex gap-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex-1 px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs transition-colors"
            >
              {showDetails ? '收起' : '采购记录'}
            </button>
            {isLowStock && !item.purchaseRequest && (
              <button
                onClick={() => createPurchaseRequest(item.id)}
                className="flex-1 px-2 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded text-xs font-bold transition-colors flex items-center justify-center gap-1"
              >
                <ShoppingCart className="w-3 h-3" />
                生成采购申请
              </button>
            )}
            {item.purchaseRequest && item.purchaseRequest.status === 'pending' && (
              <button
                onClick={() => handleStatusChange('ordered')}
                className="flex-1 px-2 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-xs font-bold transition-colors flex items-center justify-center gap-1"
              >
                <ShoppingCart className="w-3 h-3" />
                已下单
              </button>
            )}
            {item.purchaseRequest && item.purchaseRequest.status === 'ordered' && (
              <button
                onClick={handleReceive}
                className="flex-1 px-2 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-xs font-bold transition-colors flex items-center justify-center gap-1"
              >
                <Truck className="w-3 h-3" />
                确认到货
              </button>
            )}
            {item.purchaseRequest && item.purchaseRequest.status === 'received' && (
              <div className="flex-1 px-2 py-1.5 bg-green-500/20 text-green-400 rounded text-xs font-bold text-center flex items-center justify-center gap-1">
                <CheckCircle className="w-3 h-3" />
                已到货
              </div>
            )}
          </div>

          {item.purchaseRequest && (
            <div className="mt-2 p-2 bg-yellow-500/10 rounded border border-yellow-500/30">
              <div className="flex items-center justify-between">
                <p className="text-xs text-yellow-400 flex items-center gap-1">
                  <ShoppingCart className="w-3 h-3" />
                  采购申请 #{item.purchaseRequest.id}
                </p>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    item.purchaseRequest.status === 'received'
                      ? 'bg-green-500/20 text-green-400'
                      : item.purchaseRequest.status === 'ordered'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {item.purchaseRequest.status === 'received'
                    ? '已到货'
                    : item.purchaseRequest.status === 'ordered'
                      ? '已下单'
                      : '待下单'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                采购数量: {formatNumber(item.purchaseRequest.quantity, 0)} {item.unit}
              </p>
              <p className="text-xs text-slate-500">
                创建时间: {formatDateTime(item.purchaseRequest.createdAt)} | 预计到货:{' '}
                {item.purchaseRequest.estimatedArrivalDate}
              </p>
            </div>
          )}

          {showDetails && (
            <div className="mt-2 pt-2 border-t border-slate-700/50">
              <p className="text-xs text-slate-500 mb-1">最近采购记录:</p>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {item.purchaseHistory.slice(0, 5).map((record, i) => (
                  <div key={i} className="text-xs text-slate-400 flex justify-between items-center">
                    <span>
                      <span
                        className={
                          record.status === 'completed' ? 'text-green-400' : 'text-yellow-400'
                        }
                      >
                        {record.status === 'completed' ? '✓' : '⏳'}
                      </span>{' '}
                      采购 {formatNumber(record.quantity, 0)} {item.unit}
                      {record.unitPrice && (
                        <span className="text-slate-600 ml-1">
                          (¥{formatNumber(record.quantity * record.unitPrice, 0)})
                        </span>
                      )}
                    </span>
                    <span className="text-slate-600">{formatDateTime(record.date)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InventoryPanel = () => {
  const { inventory, purchaseRequests, getLowStockItems, totalValue } = useInventoryStore();
  const [filter, setFilter] = useState<'all' | 'low_stock' | 'normal' | 'purchasing'>('all');

  const filteredInventory = inventory.filter((item) => {
    switch (filter) {
      case 'low_stock':
        return item.currentStock < item.safetyThreshold;
      case 'normal':
        return item.currentStock >= item.safetyThreshold && !item.purchaseRequest;
      case 'purchasing':
        return !!item.purchaseRequest;
      default:
        return true;
    }
  });

  const lowStockCount = getLowStockItems().length;
  const pendingPurchaseCount = purchaseRequests.filter((r) => r.status !== 'received').length;
  const purchasingItemsCount = inventory.filter((i) => !!i.purchaseRequest).length;

  return (
    <GlassCard
      className="h-full flex flex-col"
      title="药剂库存管理"
      icon={<Package className="w-4 h-4" />}
      action={
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400">
            库存总值:{' '}
            <span className="text-yellow-400 font-mono font-bold">¥{formatNumber(totalValue, 0)}</span>
          </span>
          {pendingPurchaseCount > 0 && (
            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center gap-1 font-bold">
              <ShoppingCart className="w-3 h-3" />
              {pendingPurchaseCount} 采购中
            </span>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="p-2 bg-slate-800/50 rounded-lg text-center">
          <p className="text-lg font-bold text-cyan-400 font-mono">{inventory.length}</p>
          <p className="text-xs text-slate-500">药剂种类</p>
        </div>
        <div className="p-2 bg-green-500/10 rounded-lg text-center">
          <p className="text-lg font-bold text-green-400 font-mono">
            {inventory.length - lowStockCount}
          </p>
          <p className="text-xs text-slate-500">库存正常</p>
        </div>
        <div className="p-2 bg-red-500/10 rounded-lg text-center">
          <p className="text-lg font-bold text-red-400 font-mono">{lowStockCount}</p>
          <p className="text-xs text-slate-500">库存不足</p>
        </div>
        <div className="p-2 bg-yellow-500/10 rounded-lg text-center">
          <p className="text-lg font-bold text-yellow-400 font-mono">{purchasingItemsCount}</p>
          <p className="text-xs text-slate-500">采购中</p>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        {[
          { key: 'all', label: '全部', count: inventory.length },
          { key: 'low_stock', label: '库存不足', count: lowStockCount },
          { key: 'purchasing', label: '采购中', count: purchasingItemsCount },
          { key: 'normal', label: '正常', count: inventory.length - lowStockCount - purchasingItemsCount },
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
        {filteredInventory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Package className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">暂无药剂</p>
          </div>
        ) : (
          filteredInventory.map((item) => <InventoryCard key={item.id} item={item} />)
        )}
      </div>
    </GlassCard>
  );
};

export default InventoryPanel;
