import { create } from 'zustand';
import type { ProcessUnit, Equipment, Personnel, TreatmentLine, EmergencyDosing, WaterQuality, MaintenanceOrder, PipelineConnection } from '@/types';
import { initialProcessUnits, initialEquipment, initialPersonnel, initialTreatmentLines, initialEmergencyDosing, dangerZones, pipelineConnections, sparePartsData, maintenanceAssignees } from '@/data/initialData';
import { simulationConfig, waterQualityStandards } from '@/data/simulationConfig';
import { clamp, randomRange, generateId, lerp } from '@/utils/formatters';

interface PlantState {
  processUnits: ProcessUnit[];
  equipment: Equipment[];
  personnel: Personnel[];
  treatmentLines: TreatmentLine[];
  emergencyDosing: EmergencyDosing[];
  maintenanceOrders: MaintenanceOrder[];
  pipelineConnections: PipelineConnection[];
  selectedUnitId: string | null;
  currentTime: Date;
  simulationSpeed: number;
  isSimulationRunning: boolean;
  totalPowerConsumption: number;
  totalInletFlow: number;
  setSelectedUnitId: (id: string | null) => void;
  updateWaterQuality: () => void;
  updateEquipment: () => void;
  updatePersonnel: () => void;
  updateTreatmentLines: () => void;
  checkEmergencyConditions: () => void;
  triggerEmergencyDosing: (type: 'carbon_source' | 'flocculant', active: boolean) => void;
  switchToBackupLine: () => void;
  setSimulationSpeed: (speed: number) => void;
  toggleSimulation: () => void;
  getUnitById: (id: string) => ProcessUnit | undefined;
  getEquipmentById: (id: string) => Equipment | undefined;
  createMaintenanceOrder: (equipmentId: string) => void;
  completeMaintenanceOrder: (equipmentId: string) => void;
  updateMaintenanceProgress: (equipmentId: string, progress: number, notes?: string) => void;
  checkAndCreateMaintenanceOrders: () => void;
  updatePipelineConnections: () => void;
  getActivePipelineConnections: () => PipelineConnection[];
}

const isPointInBox = (
  point: [number, number, number],
  boxPos: [number, number, number],
  boxSize: [number, number, number]
): boolean => {
  return (
    point[0] >= boxPos[0] - boxSize[0] / 2 &&
    point[0] <= boxPos[0] + boxSize[0] / 2 &&
    point[1] >= boxPos[1] &&
    point[1] <= boxPos[1] + boxSize[1] &&
    point[2] >= boxPos[2] - boxSize[2] / 2 &&
    point[2] <= boxPos[2] + boxSize[2] / 2
  );
};

export const usePlantStore = create<PlantState>((set, get) => ({
  processUnits: initialProcessUnits,
  equipment: initialEquipment,
  personnel: initialPersonnel,
  treatmentLines: initialTreatmentLines,
  emergencyDosing: initialEmergencyDosing,
  maintenanceOrders: [],
  pipelineConnections: pipelineConnections,
  selectedUnitId: null,
  currentTime: new Date(),
  simulationSpeed: 1,
  isSimulationRunning: true,
  totalPowerConsumption: initialEquipment.reduce((sum, eq) => sum + eq.powerConsumption, 0),
  totalInletFlow: initialProcessUnits.find((u) => u.type === 'inlet')?.outletWater.flow || 0,

  setSelectedUnitId: (id) => set({ selectedUnitId: id }),

  updateWaterQuality: () => {
    const { processUnits } = get();
    const config = simulationConfig.waterQuality;

    const updatedUnits = processUnits.map((unit) => {
      if (unit.type === 'control') return unit;

      const inletVariation = {
        cod: randomRange(-5, 5),
        nh3n: randomRange(-0.5, 0.5),
        tp: randomRange(-0.05, 0.05),
        flow: randomRange(-10, 10),
        level: randomRange(-0.1, 0.1),
      };

      const newInlet: WaterQuality = {
        cod: clamp(unit.inletWater.cod + inletVariation.cod, config.cod.min, config.cod.max),
        nh3n: clamp(unit.inletWater.nh3n + inletVariation.nh3n, config.nh3n.min, config.nh3n.max),
        tp: clamp(unit.inletWater.tp + inletVariation.tp, config.tp.min, config.tp.max),
        flow: clamp(unit.inletWater.flow + inletVariation.flow, config.flow.min, config.flow.max),
        level: clamp(unit.inletWater.level + inletVariation.level, config.level.min, config.level.max),
      };

      const removalEfficiency = {
        inlet: { cod: 0.02, nh3n: 0.02, tp: 0.03 },
        grille: { cod: 0.05, nh3n: 0.04, tp: 0.05 },
        biological: { cod: 0.85, nh3n: 0.85, tp: 0.9 },
        sediment: { cod: 0.12, nh3n: 0.15, tp: 0.15 },
        disinfection: { cod: 0.08, nh3n: 0.1, tp: 0.1 },
        dewatering: { cod: 0.8, nh3n: 0.6, tp: 0.65 },
      };

      const efficiency = removalEfficiency[unit.type] || removalEfficiency.inlet;
      const newOutlet: WaterQuality = {
        cod: newInlet.cod * (1 - efficiency.cod),
        nh3n: newInlet.nh3n * (1 - efficiency.nh3n),
        tp: newInlet.tp * (1 - efficiency.tp),
        flow: newInlet.flow * 0.98,
        level: newInlet.level * 0.95,
      };

      if (unit.type === 'biological') {
        const baseDO = 2.5 + Math.sin(Date.now() / 10000) * 0.5;
        newOutlet.do = clamp(baseDO + randomRange(-0.3, 0.3), config.do.min, config.do.max);
      }

      const outletStatus =
        newOutlet.cod > waterQualityStandards.cod ||
        newOutlet.nh3n > waterQualityStandards.nh3n ||
        newOutlet.tp > waterQualityStandards.tp
          ? 'alarm'
          : newOutlet.cod > waterQualityStandards.cod * 0.8 ||
              newOutlet.nh3n > waterQualityStandards.nh3n * 0.8 ||
              newOutlet.tp > waterQualityStandards.tp * 0.8
            ? 'warning'
            : 'normal';

      const newTrendData = [...unit.trendData.slice(1), { ...newOutlet, timestamp: new Date().toISOString() }];
      const newTrendDataInlet = [...unit.trendDataInlet.slice(1), { ...newInlet, timestamp: new Date().toISOString() }];
      const newRemovalRate = {
        cod: newInlet.cod > 0 ? ((newInlet.cod - newOutlet.cod) / newInlet.cod) * 100 : 0,
        nh3n: newInlet.nh3n > 0 ? ((newInlet.nh3n - newOutlet.nh3n) / newInlet.nh3n) * 100 : 0,
        tp: newInlet.tp > 0 ? ((newInlet.tp - newOutlet.tp) / newInlet.tp) * 100 : 0,
        timestamp: new Date().toISOString(),
      };
      const newTrendDataRemovalRate = [...unit.trendDataRemovalRate.slice(1), newRemovalRate];

      return {
        ...unit,
        inletWater: newInlet,
        outletWater: newOutlet,
        status: outletStatus as 'normal' | 'warning' | 'alarm',
        trendData: newTrendData,
        trendDataInlet: newTrendDataInlet,
        trendDataRemovalRate: newTrendDataRemovalRate,
      };
    });

    set({ processUnits: updatedUnits, currentTime: new Date() });
  },

  updateEquipment: () => {
    const { equipment } = get();
    const increment = simulationConfig.equipment.runHoursIncrement * get().simulationSpeed;

    const updatedEquipment = equipment.map((eq) => {
      let newRunHours = eq.runHours;
      let newFrequency = eq.frequency;

      if (eq.status === 'running') {
        newRunHours += increment;

        if (eq.type === 'blower' && eq.frequency !== undefined) {
          const targetFreq = 45 + Math.sin(Date.now() / 5000) * 10;
          newFrequency = lerp(eq.frequency, targetFreq, 0.1);
          newFrequency = clamp(newFrequency, simulationConfig.equipment.blowerFrequency.min, simulationConfig.equipment.blowerFrequency.max);
        }
      }

      return {
        ...eq,
        runHours: newRunHours,
        frequency: newFrequency,
      };
    });

    set({ equipment: updatedEquipment });
  },

  updatePersonnel: () => {
    const { personnel } = get();
    const speed = simulationConfig.personnel.moveSpeed * get().simulationSpeed;

    const updatedPersonnel = personnel.map((p) => {
      const dx = p.targetPosition[0] - p.position[0];
      const dz = p.targetPosition[2] - p.position[2];
      const dist = Math.sqrt(dx * dx + dz * dz);

      let newPosition: [number, number, number] = p.position;
      let newTarget = p.targetPosition;

      if (dist > 0.1) {
        newPosition = [
          p.position[0] + (dx / dist) * speed,
          p.position[1],
          p.position[2] + (dz / dist) * speed,
        ];
      } else {
        const areas: [number, number, number][] = [
          [0, 0, 8],
          [-6, 0, -8],
          [9, 0, 8],
          [15, 0, 8],
          [-12, 0, 10],
        ];
        const randomTarget = areas[Math.floor(Math.random() * areas.length)];
        newTarget = [randomTarget[0], 0, randomTarget[2]];
      }

      let inDangerZone = false;
      let zoneName: string | undefined;

      for (const zone of dangerZones) {
        if (isPointInBox(newPosition, zone.position, zone.size)) {
          inDangerZone = true;
          zoneName = zone.name;
          break;
        }
      }

      return {
        ...p,
        position: newPosition,
        targetPosition: newTarget,
        inDangerZone,
        zoneName,
      };
    });

    set({ personnel: updatedPersonnel });
  },

  updateTreatmentLines: () => {
    const { treatmentLines, processUnits } = get();
    const inletUnit = processUnits.find((u) => u.type === 'inlet');
    const totalFlow = inletUnit?.outletWater.flow || 0;

    const activeLines = treatmentLines.filter((l) => l.isActive && !l.isBackup);
    const flowPerLine = totalFlow / Math.max(activeLines.length, 1);

    const updatedLines = treatmentLines.map((line) => {
      if (!line.isActive) {
        return { ...line, currentLoad: 0, loadPercentage: 0, isOverloaded: false };
      }

      const loadPercentage = (flowPerLine / line.capacity) * 100;
      const isOverloaded = loadPercentage > simulationConfig.dispatch.overloadThreshold;

      return {
        ...line,
        currentLoad: clamp(loadPercentage, 0, 120),
        loadPercentage: clamp(loadPercentage, 0, 120),
        isOverloaded,
      };
    });

    set({ treatmentLines: updatedLines, totalInletFlow: totalFlow });
  },

  checkEmergencyConditions: () => {
    const { processUnits, emergencyDosing } = get();
    const disinfectionUnit = processUnits.find((u) => u.type === 'disinfection');

    if (!disinfectionUnit) return;

    const isOverStandard =
      disinfectionUnit.outletWater.cod > waterQualityStandards.cod ||
      disinfectionUnit.outletWater.nh3n > waterQualityStandards.nh3n ||
      disinfectionUnit.outletWater.tp > waterQualityStandards.tp;

    const updatedDosing = emergencyDosing.map((d) => {
      if (d.chemicalType === 'carbon_source' && disinfectionUnit.outletWater.cod > waterQualityStandards.cod * 1.2) {
        return { ...d, isActive: true, startTime: d.startTime || new Date() };
      }
      if (d.chemicalType === 'flocculant' && disinfectionUnit.outletWater.tp > waterQualityStandards.tp * 1.2) {
        return { ...d, isActive: true, startTime: d.startTime || new Date() };
      }
      if (d.isActive && d.startTime) {
        const duration = (Date.now() - d.startTime.getTime()) / 1000;
        if (duration > 60 && !isOverStandard) {
          return { ...d, isActive: false, startTime: undefined };
        }
      }
      return d;
    });

    set({ emergencyDosing: updatedDosing });
  },

  triggerEmergencyDosing: (type, active) => {
    const { emergencyDosing } = get();
    const updated = emergencyDosing.map((d) =>
      d.chemicalType === type ? { ...d, isActive: active, startTime: active ? new Date() : undefined } : d
    );
    set({ emergencyDosing: updated });
  },

  switchToBackupLine: () => {
    const { treatmentLines } = get();
    const backupLine = treatmentLines.find((l) => l.isBackup);
    if (!backupLine || backupLine.isActive) return;

    const overloadedLine = treatmentLines.find((l) => l.isOverloaded);
    if (!overloadedLine) return;

    const updatedLines = treatmentLines.map((l) => {
      if (l.id === backupLine.id) {
        const newLoad = overloadedLine.currentLoad * 0.5;
        return { ...l, isActive: true, currentLoad: newLoad, loadPercentage: newLoad };
      }
      if (l.id === overloadedLine.id) {
        const newLoad = overloadedLine.currentLoad * 0.5;
        return { ...l, currentLoad: newLoad, loadPercentage: newLoad, isOverloaded: false };
      }
      return l;
    });

    set({ treatmentLines: updatedLines });
  },

  setSimulationSpeed: (speed) => set({ simulationSpeed: speed }),

  toggleSimulation: () => set((state) => ({ isSimulationRunning: !state.isSimulationRunning })),

  getUnitById: (id) => get().processUnits.find((u) => u.id === id),

  getEquipmentById: (id) => get().equipment.find((e) => e.id === id),

  createMaintenanceOrder: (equipmentId) => {
    const eq = get().equipment.find((e) => e.id === equipmentId);
    if (!eq || eq.maintenanceOrder) return;

    const spareParts = sparePartsData[eq.type] || [];
    const lowStockAlert = spareParts
      .filter((sp) => sp.currentStock < sp.quantity)
      .map((sp) => sp.name);

    const order: MaintenanceOrder = {
      id: generateId(),
      description: `${eq.name} 定期保养`,
      createdAt: new Date(),
      equipmentId,
      status: 'pending',
      spareParts: spareParts,
      estimatedDowntime: eq.type === 'dewaterer' ? 4 : eq.type === 'blower' ? 2 : 1,
      assignee: maintenanceAssignees[Math.floor(Math.random() * maintenanceAssignees.length)],
      progress: 0,
      notes: '',
      lowStockAlert,
    };

    set((state) => ({
      equipment: state.equipment.map((e) =>
        e.id === equipmentId ? { ...e, maintenanceOrder: order } : e
      ),
      maintenanceOrders: [...state.maintenanceOrders, order],
    }));
  },

  checkAndCreateMaintenanceOrders: () => {
    const { equipment, createMaintenanceOrder } = get();
    equipment.forEach((eq) => {
      if (eq.runHours >= eq.maintenanceThreshold && !eq.maintenanceOrder) {
        createMaintenanceOrder(eq.id);
      }
    });
  },

  updateMaintenanceProgress: (equipmentId, progress, notes) => {
    set((state) => {
      const updatedEquipment = state.equipment.map((e) => {
        if (e.id === equipmentId && e.maintenanceOrder) {
          const newStatus: 'pending' | 'in_progress' | 'completed' =
            progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'pending';
          return {
            ...e,
            maintenanceOrder: {
              ...e.maintenanceOrder,
              progress,
              status: newStatus,
              notes: notes || e.maintenanceOrder.notes,
            },
          };
        }
        return e;
      });

      const updatedOrders = state.maintenanceOrders.map((o) => {
        if (o.equipmentId === equipmentId) {
          const newStatus: 'pending' | 'in_progress' | 'completed' =
            progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'pending';
          return { ...o, progress, status: newStatus, notes: notes || o.notes };
        }
        return o;
      });

      return {
        equipment: updatedEquipment,
        maintenanceOrders: updatedOrders,
      };
    });
  },

  updatePipelineConnections: () => {
    const { treatmentLines } = get();
    const activeTankIds = treatmentLines
      .filter(l => l.isActive)
      .map(l => {
        if (l.id === 'line-1') return 'bio-tank-1';
        if (l.id === 'line-2') return 'bio-tank-2';
        if (l.id === 'line-backup') return 'bio-tank-backup';
        return null;
      })
      .filter(Boolean) as string[];
    const backupActive = treatmentLines.some(l => l.isBackup && l.isActive);

    set((state) => {
      const updatedConnections = state.pipelineConnections.map((conn) => {
        const isBackup = conn.type === 'backup';
        const isEmergency = conn.type === 'emergency';
        const fromTankActive = activeTankIds.includes(conn.fromUnit);
        const toTankActive = activeTankIds.includes(conn.toUnit);
        const isMainPath = conn.type === 'normal' && !['bio-tank-1', 'bio-tank-2', 'bio-tank-backup'].includes(conn.toUnit);

        if (isBackup) {
          return { ...conn, isActive: backupActive };
        }

        if (isEmergency) {
          return conn;
        }

        if (isMainPath) {
          return { ...conn, isActive: true };
        }

        return { ...conn, isActive: fromTankActive || toTankActive };
      });
      return { pipelineConnections: updatedConnections };
    });
  },

  getActivePipelineConnections: () => {
    return get().pipelineConnections.filter((c) => c.isActive);
  },

  completeMaintenanceOrder: (equipmentId) => {
    set((state) => {
      const eq = state.equipment.find((e) => e.id === equipmentId);
      if (!eq || !eq.maintenanceOrder) return state;

      const updatedEquipment = state.equipment.map((e) =>
        e.id === equipmentId
          ? {
              ...e,
              runHours: 0,
              maintenanceOrder: undefined,
              maintenanceHistory: [
                { description: e.maintenanceOrder!.description, date: new Date() },
                ...e.maintenanceHistory,
              ],
            }
          : e
      );

      return {
        equipment: updatedEquipment,
        maintenanceOrders: state.maintenanceOrders.filter((o) => o.equipmentId !== equipmentId),
        totalPowerConsumption: updatedEquipment.reduce((sum, e) => sum + e.powerConsumption, 0),
      };
    });
  },
}));
