import { useEffect, useCallback } from 'react';
import { usePlantStore } from '@/store/usePlantStore';
import { useAlertStore } from '@/store/useAlertStore';
import { useApprovalStore } from '@/store/useApprovalStore';
import { useInventoryStore } from '@/store/useInventoryStore';
import { simulationConfig, waterQualityStandards } from '@/data/simulationConfig';

export const useSimulation = () => {
  const {
    isSimulationRunning,
    simulationSpeed,
    updateWaterQuality,
    updateEquipment,
    updatePersonnel,
    updateTreatmentLines,
    checkEmergencyConditions,
    processUnits,
    equipment,
    personnel,
    treatmentLines,
    emergencyDosing,
    switchToBackupLine,
    checkAndCreateMaintenanceOrders,
    updatePipelineConnections,
    pipelineConnections,
  } = usePlantStore();

  const { addAlert, alerts } = useAlertStore();
  const { getPendingRequests, approveAtLevel } = useApprovalStore();
  const { updateInventory, inventory } = useInventoryStore();

  const checkAlerts = useCallback(() => {
    processUnits.forEach((unit) => {
      if (unit.type === 'control') return;

      if (unit.status === 'alarm' && !alerts.some((a) => a.unitId === unit.id && a.type === 'water_quality' && !a.acknowledged)) {
        addAlert(
          'water_quality',
          'critical',
          `${unit.name}出水水质超标`,
          unit.id
        );
      }

      if (unit.type === 'biological' && unit.outletWater.do !== undefined && unit.outletWater.do < 1) {
        if (!alerts.some((a) => a.unitId === unit.id && a.type === 'water_quality' && a.message.includes('溶解氧') && !a.acknowledged)) {
          addAlert(
            'water_quality',
            'critical',
            `${unit.name}溶解氧过低: ${unit.outletWater.do.toFixed(1)}mg/L`,
            unit.id
          );
        }
      }
    });

    equipment.forEach((eq) => {
      if (eq.runHours >= eq.maintenanceThreshold && !alerts.some((a) => a.message.includes(eq.name) && a.type === 'equipment' && !a.acknowledged)) {
        addAlert(
          'equipment',
          'warning',
          `${eq.name}累计运行${eq.runHours.toFixed(0)}小时，需要保养`,
          eq.id
        );
      }
    });

    personnel.forEach((p) => {
      if (p.inDangerZone && !alerts.some((a) => a.message.includes(p.name) && a.type === 'safety' && !a.acknowledged)) {
        addAlert(
          'safety',
          'critical',
          `${p.name}(${p.role})进入危险区域${p.zoneName ? ': ' + p.zoneName : ''}`,
          p.id
        );
      }
    });

    const overloadedLine = treatmentLines.find((l) => l.isOverloaded);
    if (overloadedLine && !alerts.some((a) => a.message.includes(overloadedLine.name) && a.type === 'emergency' && !a.acknowledged)) {
      addAlert(
        'emergency',
        'warning',
        `${overloadedLine.name}超负荷运行，负荷率${overloadedLine.currentLoad.toFixed(0)}%`,
        overloadedLine.id
      );
      setTimeout(() => switchToBackupLine(), 5000);
    }

    emergencyDosing.forEach((d) => {
      if (d.isActive && !alerts.some((a) => a.message.includes(d.chemicalType === 'carbon_source' ? '碳源' : '絮凝剂') && !a.acknowledged)) {
        addAlert(
          'emergency',
          'critical',
          `启动应急投加${d.chemicalType === 'carbon_source' ? '碳源' : '絮凝剂'}`,
          d.id
        );
      }
    });

    inventory.forEach((item) => {
      if (item.currentStock < item.safetyThreshold && !alerts.some((a) => a.message.includes(item.name) && a.type === 'equipment' && !a.acknowledged)) {
        addAlert(
          'equipment',
          'warning',
          `${item.name}库存不足，当前库存${item.currentStock.toFixed(0)}${item.unit}`,
          item.id
        );
      }
    });
  }, [processUnits, equipment, personnel, treatmentLines, emergencyDosing, inventory, alerts, addAlert, switchToBackupLine]);

  const autoApprove = useCallback(() => {
    const pending = getPendingRequests();
    pending.forEach((req) => {
      const timeSinceCreation = Date.now() - req.createdAt.getTime();
      if (timeSinceCreation > simulationConfig.approval.autoApproveDelay) {
        if (req.status === 'pending_operator' && !req.operatorApproval) {
          approveAtLevel(req.id, 'operator', true, '自动审批通过');
        } else if (req.status === 'pending_director' && !req.directorApproval) {
          approveAtLevel(req.id, 'director', true, '自动审批通过');
        } else if (req.status === 'pending_manager' && !req.managerApproval) {
          approveAtLevel(req.id, 'manager', true, '自动审批通过');
        }
      }
    });
  }, [getPendingRequests, approveAtLevel]);

  useEffect(() => {
    if (!isSimulationRunning) return;

    const interval = setInterval(() => {
      updateWaterQuality();
      updateEquipment();
      updatePersonnel();
      updateTreatmentLines();
      checkEmergencyConditions();
      checkAlerts();
      updateInventory();
      autoApprove();
      checkAndCreateMaintenanceOrders();
      updatePipelineConnections();
    }, simulationConfig.updateInterval / simulationSpeed);

    return () => clearInterval(interval);
  }, [isSimulationRunning, simulationSpeed, updateWaterQuality, updateEquipment, updatePersonnel, updateTreatmentLines, checkEmergencyConditions, checkAlerts, updateInventory, autoApprove]);

  return {
    isSimulationRunning,
    simulationSpeed,
  };
};
