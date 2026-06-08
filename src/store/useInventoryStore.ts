import { create } from 'zustand';
import type { ChemicalInventory, PurchaseRequest } from '@/types';
import { initialInventory } from '@/data/initialData';
import { simulationConfig } from '@/data/simulationConfig';
import { generateId, clamp } from '@/utils/formatters';

interface InventoryState {
  inventory: ChemicalInventory[];
  purchaseRequests: PurchaseRequest[];
  totalValue: number;
  updateInventory: () => void;
  consumeChemical: (id: string, amount: number) => void;
  addStock: (id: string, amount: number) => void;
  createPurchaseRequest: (id: string, quantity?: number) => void;
  updatePurchaseStatus: (id: string, status: 'pending' | 'ordered' | 'received') => void;
  receivePurchase: (id: string) => void;
  getLowStockItems: () => ChemicalInventory[];
  getDaysRemaining: (id: string) => number;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  inventory: initialInventory,
  purchaseRequests: [],
  totalValue: initialInventory.reduce((sum, item) => sum + item.currentStock * item.unitPrice, 0),

  updateInventory: () => {
    const { inventory, purchaseRequests } = get();
    const variation = simulationConfig.inventory.dailyConsumptionVariation;

    const newPurchaseRequests: PurchaseRequest[] = [];

    const updatedInventory = inventory.map((item) => {
      const consumption = item.dailyConsumption * (1 + (Math.random() - 0.5) * variation) * 0.0005;
      const newStock = Math.max(0, item.currentStock - consumption);

      let updatedItem = { ...item, currentStock: newStock };

      if (newStock < item.safetyThreshold && !item.purchaseRequest) {
        const arrivalDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const newRequest: PurchaseRequest = {
          id: generateId(),
          chemicalId: item.id,
          chemicalName: item.name,
          quantity: item.dailyConsumption * 30,
          createdAt: new Date(),
          status: 'pending',
          estimatedArrivalDate: arrivalDate.toLocaleDateString('zh-CN'),
        };

        updatedItem.purchaseRequest = newRequest;
        newPurchaseRequests.push(newRequest);
      }

      if (item.purchaseRequest?.status === 'received') {
        updatedItem.currentStock += item.purchaseRequest.quantity;
        const newRecord = {
          id: generateId(),
          quantity: item.purchaseRequest.quantity,
          date: new Date(),
          status: 'completed' as const,
          unitPrice: item.unitPrice,
        };
        updatedItem.purchaseHistory = [newRecord, ...item.purchaseHistory];
        updatedItem.purchaseRequest = undefined;
      }

      return updatedItem;
    });

    set({
      inventory: updatedInventory,
      purchaseRequests: [...purchaseRequests, ...newPurchaseRequests],
      totalValue: updatedInventory.reduce((sum, item) => sum + item.currentStock * item.unitPrice, 0),
    });
  },

  consumeChemical: (id, amount) => {
    set((state) => {
      const updatedInventory = state.inventory.map((item) =>
        item.id === id
          ? { ...item, currentStock: Math.max(0, item.currentStock - amount) }
          : item
      );
      return {
        inventory: updatedInventory,
        totalValue: updatedInventory.reduce((sum, item) => sum + item.currentStock * item.unitPrice, 0),
      };
    });
  },

  addStock: (id, amount) => {
    set((state) => {
      const updatedInventory = state.inventory.map((item) =>
        item.id === id ? { ...item, currentStock: item.currentStock + amount } : item
      );
      return {
        inventory: updatedInventory,
        totalValue: updatedInventory.reduce((sum, item) => sum + item.currentStock * item.unitPrice, 0),
      };
    });
  },

  createPurchaseRequest: (id, quantity) => {
    set((state) => {
      const item = state.inventory.find((i) => i.id === id);
      if (!item || item.purchaseRequest) return state;

      const qty = quantity || item.dailyConsumption * 30;
      const arrivalDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const purchaseRequest: PurchaseRequest = {
        id: generateId(),
        chemicalId: id,
        chemicalName: item.name,
        quantity: qty,
        createdAt: new Date(),
        status: 'pending',
        estimatedArrivalDate: arrivalDate.toLocaleDateString('zh-CN'),
      };

      const updatedInventory = state.inventory.map((i) =>
        i.id === id
          ? {
              ...i,
              purchaseRequest: {
                id: purchaseRequest.id,
                chemicalName: purchaseRequest.chemicalName,
                quantity: purchaseRequest.quantity,
                createdAt: purchaseRequest.createdAt,
                status: purchaseRequest.status,
                estimatedArrivalDate: purchaseRequest.estimatedArrivalDate,
              },
            }
          : i
      );

      return {
        inventory: updatedInventory,
        purchaseRequests: [...state.purchaseRequests, purchaseRequest],
      };
    });
  },

  updatePurchaseStatus: (id, status) => {
    set((state) => {
      const updatedInventory = state.inventory.map((item) =>
        item.id === id && item.purchaseRequest
          ? {
              ...item,
              purchaseRequest: {
                ...item.purchaseRequest,
                status,
              },
            }
          : item
      );

      const updatedPurchaseRequests = state.purchaseRequests.map((pr) =>
        pr.chemicalId === id ? { ...pr, status } : pr
      );

      return {
        inventory: updatedInventory,
        purchaseRequests: updatedPurchaseRequests,
      };
    });
  },

  receivePurchase: (id) => {
    set((state) => {
      const item = state.inventory.find((i) => i.id === id);
      if (!item || !item.purchaseRequest) return state;

      const receivedQuantity = item.purchaseRequest.quantity;

      const updatedInventory = state.inventory.map((i) => {
        if (i.id !== id) return i;
        const newRecord = {
          id: generateId(),
          quantity: receivedQuantity,
          date: new Date(),
          status: 'completed' as const,
          unitPrice: i.unitPrice,
        };
        return {
          ...i,
          currentStock: i.currentStock + receivedQuantity,
          purchaseHistory: [newRecord, ...i.purchaseHistory],
          purchaseRequest: undefined,
        };
      });

      const updatedPurchaseRequests = state.purchaseRequests.filter(
        (pr) => pr.chemicalId !== id
      );

      return {
        inventory: updatedInventory,
        purchaseRequests: updatedPurchaseRequests,
        totalValue: updatedInventory.reduce((sum, i) => sum + i.currentStock * i.unitPrice, 0),
      };
    });
  },

  getLowStockItems: () => {
    return get().inventory.filter((item) => item.currentStock < item.safetyThreshold);
  },

  getDaysRemaining: (id) => {
    const item = get().inventory.find((i) => i.id === id);
    if (!item || item.dailyConsumption <= 0) return Infinity;
    return Math.ceil(item.currentStock / item.dailyConsumption);
  },
}));
