import { useState } from 'react';
import {
  ClipboardCheck,
  User,
  UserCheck,
  Crown,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useApprovalStore } from '@/store/useApprovalStore';
import { formatDateTime, formatNumber } from '@/utils/formatters';
import GlassCard from './GlassCard';
import type { ApprovalRequest } from '@/types';

const approvalSteps = [
  { key: 'pending_operator', label: '操作员审批', icon: User, color: '#00d4ff', order: 1 },
  { key: 'pending_director', label: '车间主任审批', icon: UserCheck, color: '#ff9500', order: 2 },
  { key: 'pending_manager', label: '厂长审批', icon: Crown, color: '#ff3b30', order: 3 },
  { key: 'approved', label: '已通过', icon: CheckCircle2, color: '#34c759', order: 4 },
  { key: 'rejected', label: '已驳回', icon: XCircle, color: '#ff3b30', order: 4 },
];

const StepIcon = ({ stepKey, isActive, isCompleted }: any) => {
  const step = approvalSteps.find((s) => s.key === stepKey);
  if (!step) return null;

  const Icon = step.icon;
  const color = isCompleted ? '#34c759' : isActive ? step.color : '#64748b';
  const bgColor = isCompleted ? '#34c75920' : isActive ? `${step.color}20` : '#1e293b';

  return (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
        isActive ? 'scale-110 shadow-lg' : ''
      }`}
      style={{ backgroundColor: bgColor, boxShadow: isActive ? `0 0 15px ${color}40` : 'none' }}
    >
      <Icon className="w-5 h-5" style={{ color }} />
    </div>
  );
};

const ApprovalTimeline = ({ request }: { request: ApprovalRequest }) => {
  const currentStep = approvalSteps.find((s) => s.key === request.status);
  const currentOrder = currentStep?.order || 0;

  return (
    <div className="flex items-center gap-1 my-3">
      {approvalSteps.slice(0, 3).map((step, index) => {
        const isActive = request.status === step.key;
        const isCompleted =
          (step.order === 1 && request.operatorApproval?.approved) ||
          (step.order === 2 && request.directorApproval?.approved) ||
          (step.order === 3 && request.managerApproval?.approved) ||
          request.status === 'approved';

        return (
          <div key={step.key} className="flex items-center flex-1">
            <StepIcon stepKey={step.key} isActive={isActive} isCompleted={isCompleted} />
            {index < 2 && (
              <div
                className={`flex-1 h-0.5 mx-1 ${
                  isCompleted ? 'bg-green-500' : 'bg-slate-700'
                }`}
              />
            )}
          </div>
        );
      })}
      {request.status === 'approved' && (
        <div className="flex items-center">
          <div className="h-0.5 w-4 bg-green-500" />
          <StepIcon stepKey="approved" isActive={false} isCompleted={true} />
        </div>
      )}
      {request.status === 'rejected' && (
        <div className="flex items-center">
          <div className="h-0.5 w-4 bg-red-500" />
          <StepIcon stepKey="rejected" isActive={false} isCompleted={false} />
        </div>
      )}
    </div>
  );
};

const ApprovalCard = ({ request }: { request: ApprovalRequest }) => {
  const [expanded, setExpanded] = useState(false);

  const getStatusBadge = () => {
    switch (request.status) {
      case 'pending_operator':
      case 'pending_director':
      case 'pending_manager':
        return (
          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" />
            审批中
          </span>
        );
      case 'approved':
        return (
          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            已通过
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-bold rounded-full flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            已驳回
          </span>
        );
    }
  };

  return (
    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-cyan-400 font-bold text-sm">{request.parameter}</span>
            {getStatusBadge()}
          </div>
          <p className="text-slate-300 text-xs">
            申请人: {request.applicant} | {formatDateTime(request.createdAt)}
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-400"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex items-center gap-4 mt-2 text-xs">
        <div>
          <span className="text-slate-500">当前值: </span>
          <span className="text-white font-mono">
            {formatNumber(request.currentValue, 2)} {request.unit}
          </span>
        </div>
        <div className="text-cyan-400">→</div>
        <div>
          <span className="text-slate-500">申请值: </span>
          <span className="text-yellow-400 font-mono font-bold">
            {formatNumber(request.requestedValue, 2)} {request.unit}
          </span>
        </div>
      </div>

      <ApprovalTimeline request={request} />

      {expanded && (
        <div className="mt-2 pt-3 border-t border-slate-700/50 space-y-2">
          <p className="text-xs text-slate-400">
            <span className="text-slate-500">申请原因: </span>
            {request.reason}
          </p>
          {request.operatorApproval && (
            <p className="text-xs">
              <span className="text-slate-500">操作员: </span>
              <span className={request.operatorApproval.approved ? 'text-green-400' : 'text-red-400'}>
                {request.operatorApproval.approved ? '同意' : '驳回'}
              </span>
              <span className="text-slate-500 ml-2">- {request.operatorApproval.comment}</span>
              <span className="text-slate-600 ml-2">{formatDateTime(request.operatorApproval.time)}</span>
            </p>
          )}
          {request.directorApproval && (
            <p className="text-xs">
              <span className="text-slate-500">车间主任: </span>
              <span className={request.directorApproval.approved ? 'text-green-400' : 'text-red-400'}>
                {request.directorApproval.approved ? '同意' : '驳回'}
              </span>
              <span className="text-slate-500 ml-2">- {request.directorApproval.comment}</span>
              <span className="text-slate-600 ml-2">{formatDateTime(request.directorApproval.time)}</span>
            </p>
          )}
          {request.managerApproval && (
            <p className="text-xs">
              <span className="text-slate-500">厂长: </span>
              <span className={request.managerApproval.approved ? 'text-green-400' : 'text-red-400'}>
                {request.managerApproval.approved ? '同意' : '驳回'}
              </span>
              <span className="text-slate-500 ml-2">- {request.managerApproval.comment}</span>
              <span className="text-slate-600 ml-2">{formatDateTime(request.managerApproval.time)}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const NewApprovalModal = ({ onClose }: { onClose: () => void }) => {
  const { createRequest } = useApprovalStore();
  const [formData, setFormData] = useState({
    parameter: '曝气量',
    currentValue: 45,
    requestedValue: 50,
    unit: 'Hz',
    reason: '',
    applicant: '张三',
  });

  const parameterOptions = [
    { label: '曝气量', unit: 'Hz', default: 45 },
    { label: '回流比', unit: '%', default: 100 },
    { label: '污泥排放量', unit: 'm³/h', default: 30 },
    { label: '加药量', unit: 'mg/L', default: 10 },
  ];

  const handleSubmit = () => {
    if (!formData.reason.trim()) return;
    createRequest(
      formData.parameter,
      formData.currentValue,
      formData.requestedValue,
      formData.unit,
      formData.reason,
      formData.applicant
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <GlassCard className="w-[450px] p-6">
        <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          提交参数调整申请
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-slate-400 text-sm mb-1">参数类型</label>
            <select
              value={formData.parameter}
              onChange={(e) => {
                const option = parameterOptions.find((o) => o.label === e.target.value);
                setFormData({
                  ...formData,
                  parameter: e.target.value,
                  unit: option?.unit || '',
                  currentValue: option?.default || 0,
                });
              }}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              {parameterOptions.map((o) => (
                <option key={o.label} value={o.label}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-sm mb-1">当前值 ({formData.unit})</label>
              <input
                type="number"
                value={formData.currentValue}
                onChange={(e) => setFormData({ ...formData, currentValue: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                readOnly
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-1">申请值 ({formData.unit})</label>
              <input
                type="number"
                value={formData.requestedValue}
                onChange={(e) => setFormData({ ...formData, requestedValue: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-sm mb-1">申请原因</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="请说明调整原因..."
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 h-24 resize-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-sm mb-1">申请人</label>
            <input
              type="text"
              value={formData.applicant}
              onChange={(e) => setFormData({ ...formData, applicant: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.reason.trim()}
            className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-bold"
          >
            提交申请
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

const ApprovalFlow = () => {
  const { requests, getPendingRequests } = useApprovalStore();
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  const filteredRequests =
    filter === 'pending'
      ? getPendingRequests()
      : filter === 'approved'
        ? requests.filter((r) => r.status === 'approved')
        : requests;

  return (
    <>
      <GlassCard
        className="h-full flex flex-col"
        title="三级审批流程"
        icon={<ClipboardCheck className="w-4 h-4" />}
        action={
          <button
            onClick={() => setShowModal(true)}
            className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors flex items-center gap-1 text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5" />
            新建申请
          </button>
        }
      >
        <div className="flex gap-2 mb-3">
          {[
            { key: 'all', label: '全部', count: requests.length },
            { key: 'pending', label: '待审批', count: getPendingRequests().length },
            { key: 'approved', label: '已通过', count: requests.filter((r) => r.status === 'approved').length },
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
          {filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <ClipboardCheck className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">暂无审批申请</p>
            </div>
          ) : (
            filteredRequests.map((req) => <ApprovalCard key={req.id} request={req} />)
          )}
        </div>
      </GlassCard>

      {showModal && <NewApprovalModal onClose={() => setShowModal(false)} />}
    </>
  );
};

export default ApprovalFlow;
