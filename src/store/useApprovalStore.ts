import { create } from 'zustand';
import type { ApprovalRequest, ApprovalStatus } from '@/types';
import { initialApprovals } from '@/data/initialData';
import { generateId } from '@/utils/formatters';

interface ApprovalState {
  requests: ApprovalRequest[];
  createRequest: (
    parameter: string,
    currentValue: number,
    requestedValue: number,
    unit: string,
    reason: string,
    applicant: string
  ) => string;
  approveAtLevel: (id: string, level: 'operator' | 'director' | 'manager', approved: boolean, comment: string) => void;
  getRequestById: (id: string) => ApprovalRequest | undefined;
  getPendingRequests: () => ApprovalRequest[];
  getApprovedRequests: () => ApprovalRequest[];
  getRequestsByStatus: (status: ApprovalStatus) => ApprovalRequest[];
}

const getNextStatus = (currentStatus: ApprovalStatus, approved: boolean): ApprovalStatus => {
  if (!approved) return 'rejected';

  switch (currentStatus) {
    case 'pending_operator':
      return 'pending_director';
    case 'pending_director':
      return 'pending_manager';
    case 'pending_manager':
      return 'approved';
    default:
      return currentStatus;
  }
};

export const useApprovalStore = create<ApprovalState>((set, get) => ({
  requests: initialApprovals,

  createRequest: (parameter, currentValue, requestedValue, unit, reason, applicant) => {
    const newRequest: ApprovalRequest = {
      id: generateId(),
      parameter,
      currentValue,
      requestedValue,
      unit,
      reason,
      applicant,
      status: 'pending_operator',
      createdAt: new Date(),
    };

    set((state) => ({
      requests: [newRequest, ...state.requests],
    }));

    return newRequest.id;
  },

  approveAtLevel: (id, level, approved, comment) => {
    set((state) => ({
      requests: state.requests.map((req) => {
        if (req.id !== id) return req;

        const approvalStep = { approved, comment, time: new Date() };
        const nextStatus = getNextStatus(req.status, approved);

        const updated = { ...req, status: nextStatus };

        if (level === 'operator') {
          updated.operatorApproval = approvalStep;
        } else if (level === 'director') {
          updated.directorApproval = approvalStep;
        } else if (level === 'manager') {
          updated.managerApproval = approvalStep;
        }

        return updated;
      }),
    }));
  },

  getRequestById: (id) => {
    return get().requests.find((r) => r.id === id);
  },

  getPendingRequests: () => {
    return get().requests.filter((r) => r.status.startsWith('pending_'));
  },

  getApprovedRequests: () => {
    return get().requests.filter((r) => r.status === 'approved');
  },

  getRequestsByStatus: (status) => {
    return get().requests.filter((r) => r.status === status);
  },
}));
