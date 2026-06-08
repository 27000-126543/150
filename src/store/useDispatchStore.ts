import { create } from 'zustand';
import type { DispatchScenario, DispatchStrategy, DispatchPreview, WaterQuality, TreatmentLine, Equipment } from '@/types';
import { dispatchScenarios, pipelineConnections, initialTreatmentLines, initialEquipment } from '@/data/initialData';
import { waterQualityStandards, simulationConfig } from '@/data/simulationConfig';
import { generateId, clamp } from '@/utils/formatters';

interface DispatchState extends DispatchPreview {
  scenarios: DispatchScenario[];
  setScenario: (scenario: DispatchScenario) => void;
  generateStrategies: () => void;
  selectStrategy: (strategy: DispatchStrategy | null) => void;
  applyStrategy: () => void;
  cancelPreview: () => void;
  togglePreviewMode: () => void;
  getPreviewFlowPaths: () => [number, number, number][][];
}

const calculateExpectedQuality = (
  inflow: number,
  codLoad: number,
  nh3nLoad: number,
  activeLines: number,
  aerationFreq: number,
  returnRatio: number
): WaterQuality => {
  const loadPerLine = codLoad / Math.max(activeLines, 1);
  const aerationEffect = Math.min(aerationFreq / 50, 1.2);
  const returnEffect = returnRatio / 100;

  const expectedCod = clamp(loadPerLine * 0.12 / aerationEffect / (1 + returnEffect * 0.1), 20, 100);
  const expectedNh3n = clamp((nh3nLoad / Math.max(activeLines, 1)) * 0.1 / aerationEffect, 1, 8);
  const expectedTp = clamp(4 * 0.08 / aerationEffect, 0.2, 1);

  return {
    cod: expectedCod,
    nh3n: expectedNh3n,
    tp: expectedTp,
    flow: inflow * 0.95,
    level: 2.5,
    do: 2 + aerationEffect * 1.5,
  };
};

const calculateComplianceRate = (quality: WaterQuality): number => {
  let compliant = 0;
  if (quality.cod <= waterQualityStandards.cod) compliant++;
  if (quality.nh3n <= waterQualityStandards.nh3n) compliant++;
  if (quality.tp <= waterQualityStandards.tp) compliant++;
  return (compliant / 3) * 100;
};

const calculateEnergyConsumption = (
  activeLines: number,
  blowerFreqs: number[],
  returnRatio: number
): number => {
  const baseEnergy = activeLines * 30;
  const blowerEnergy = blowerFreqs.reduce((sum, f) => sum + f * 0.8, 0);
  const pumpEnergy = returnRatio * 0.5;
  return baseEnergy + blowerEnergy + pumpEnergy;
};

const calculateRiskPoints = (
  scenario: DispatchScenario,
  activeLines: number,
  loadRatio: number
): { level: 'low' | 'medium' | 'high'; description: string }[] => {
  const risks: { level: 'low' | 'medium' | 'high'; description: string }[] = [];

  if (loadRatio > 90) {
    risks.push({ level: 'high', description: `处理线负荷超过90%，存在溢流风险` });
  } else if (loadRatio > 75) {
    risks.push({ level: 'medium', description: `处理线负荷较高，建议关注` });
  }

  if (scenario.codLoad > 450) {
    risks.push({ level: 'high', description: `COD负荷过高，出水达标风险大` });
  } else if (scenario.codLoad > 350) {
    risks.push({ level: 'medium', description: `COD负荷偏高，需加大曝气量` });
  }

  if (scenario.nh3nLoad > 35) {
    risks.push({ level: 'high', description: `氨氮负荷过高，硝化效果可能不足` });
  }

  if (activeLines === 1 && scenario.inflow > 200) {
    risks.push({ level: 'medium', description: `单池运行处理量偏大，建议开启第二池` });
  }

  if (risks.length === 0) {
    risks.push({ level: 'low', description: `工况平稳，无明显风险` });
  }

  return risks;
};

export const useDispatchStore = create<DispatchState>((set, get) => ({
  isActive: false,
  scenario: null,
  strategies: [],
  selectedStrategy: null,
  previewFlowPaths: [],
  scenarios: dispatchScenarios,

  setScenario: (scenario) => {
    set({ scenario, strategies: [], selectedStrategy: null });
  },

  generateStrategies: () => {
    const { scenario } = get();
    if (!scenario) return;

    const strategies: DispatchStrategy[] = [];
    const blowers = initialEquipment.filter((e) => e.type === 'blower');
    const lines = initialTreatmentLines;

    const baseFreq = 40 + (scenario.codLoad / 600) * 30;
    const baseReturnRatio = 50 + (scenario.nh3nLoad / 50) * 50;

    if (scenario.inflow <= 200) {
      const strategy1Freq = [{ blowerId: blowers[0].id, frequency: clamp(baseFreq, 30, 60) }];
      const expectedQuality1 = calculateExpectedQuality(
        scenario.inflow, scenario.codLoad, scenario.nh3nLoad, 1, baseFreq, baseReturnRatio
      );
      strategies.push({
        id: generateId(),
        scenarioId: scenario.id,
        name: '节能模式',
        lineActivation: [
          { lineId: lines[0].id, active: true, loadRatio: clamp((scenario.inflow / lines[0].capacity) * 100, 0, 100) },
          { lineId: lines[1].id, active: false, loadRatio: 0 },
          { lineId: lines[2].id, active: false, loadRatio: 0 },
        ],
        aerationFrequency: strategy1Freq,
        returnSludgeRatio: clamp(baseReturnRatio, 40, 100),
        chemicalDosing: [],
        expectedEffluentQuality: expectedQuality1,
        expectedComplianceRate: calculateComplianceRate(expectedQuality1),
        expectedEnergyConsumption: calculateEnergyConsumption(1, strategy1Freq.map(f => f.frequency), baseReturnRatio),
        riskPoints: calculateRiskPoints(scenario, 1, (scenario.inflow / lines[0].capacity) * 100),
        score: 75,
      });
    }

    const strategy2Freq = [
      { blowerId: blowers[0].id, frequency: clamp(baseFreq * 0.9, 30, 60) },
      { blowerId: blowers[1].id, frequency: clamp(baseFreq * 0.9, 30, 60) },
    ];
    const loadPerLine = scenario.inflow / 2 / lines[0].capacity * 100;
    const expectedQuality2 = calculateExpectedQuality(
      scenario.inflow, scenario.codLoad, scenario.nh3nLoad, 2, baseFreq * 0.9, baseReturnRatio
    );
    strategies.push({
      id: generateId(),
      scenarioId: scenario.id,
      name: '均衡模式',
      lineActivation: [
        { lineId: lines[0].id, active: true, loadRatio: clamp(loadPerLine, 0, 100) },
        { lineId: lines[1].id, active: true, loadRatio: clamp(loadPerLine, 0, 100) },
        { lineId: lines[2].id, active: false, loadRatio: 0 },
      ],
      aerationFrequency: strategy2Freq,
      returnSludgeRatio: clamp(baseReturnRatio, 40, 100),
      chemicalDosing: scenario.codLoad > 400 ? [{ chemicalId: 'carbon', dosage: 50 }] : [],
      expectedEffluentQuality: expectedQuality2,
      expectedComplianceRate: calculateComplianceRate(expectedQuality2),
      expectedEnergyConsumption: calculateEnergyConsumption(2, strategy2Freq.map(f => f.frequency), baseReturnRatio),
      riskPoints: calculateRiskPoints(scenario, 2, loadPerLine),
      score: 85,
    });

    if (scenario.inflow > 300 || scenario.codLoad > 450) {
      const strategy3Freq = [
        { blowerId: blowers[0].id, frequency: clamp(baseFreq * 0.8, 30, 60) },
        { blowerId: blowers[1].id, frequency: clamp(baseFreq * 0.8, 30, 60) },
        { blowerId: blowers[2].id, frequency: clamp(baseFreq * 0.8, 30, 60) },
      ];
      const loadPerLine3 = scenario.inflow / 3 / lines[0].capacity * 100;
      const expectedQuality3 = calculateExpectedQuality(
        scenario.inflow, scenario.codLoad, scenario.nh3nLoad, 3, baseFreq * 0.8, baseReturnRatio + 10
      );
      strategies.push({
        id: generateId(),
        scenarioId: scenario.id,
        name: '强化模式',
        lineActivation: [
          { lineId: lines[0].id, active: true, loadRatio: clamp(loadPerLine3, 0, 100) },
          { lineId: lines[1].id, active: true, loadRatio: clamp(loadPerLine3, 0, 100) },
          { lineId: lines[2].id, active: true, loadRatio: clamp(loadPerLine3, 0, 100) },
        ],
        aerationFrequency: strategy3Freq,
        returnSludgeRatio: clamp(baseReturnRatio + 10, 50, 120),
        chemicalDosing: [
          { chemicalId: 'carbon', dosage: 80 },
          { chemicalId: 'pac', dosage: 60 },
        ],
        expectedEffluentQuality: expectedQuality3,
        expectedComplianceRate: calculateComplianceRate(expectedQuality3),
        expectedEnergyConsumption: calculateEnergyConsumption(3, strategy3Freq.map(f => f.frequency), baseReturnRatio + 10),
        riskPoints: calculateRiskPoints(scenario, 3, loadPerLine3),
        score: 90,
      });
    }

    strategies.sort((a, b) => b.score - a.score);

    set({ strategies, selectedStrategy: strategies[0] || null });
  },

  selectStrategy: (strategy) => set({ selectedStrategy: strategy }),

  applyStrategy: () => {
    const { selectedStrategy } = get();
    if (!selectedStrategy) return;

    const { usePlantStore } = require('@/store/usePlantStore');
    const plantState = usePlantStore.getState();

    const updatedLines = plantState.treatmentLines.map((line: TreatmentLine) => {
      const activation = selectedStrategy.lineActivation.find(a => a.lineId === line.id);
      if (activation) {
        return {
          ...line,
          isActive: activation.active,
          currentLoad: activation.loadRatio,
          isOverloaded: activation.loadRatio > simulationConfig.dispatch.overloadThreshold,
        };
      }
      return line;
    });

    const updatedEquipment = plantState.equipment.map((eq: Equipment) => {
      const freqConfig = selectedStrategy.aerationFrequency.find(f => f.blowerId === eq.id);
      if (freqConfig) {
        return { ...eq, frequency: freqConfig.frequency };
      }
      return eq;
    });

    usePlantStore.setState({
      treatmentLines: updatedLines,
      equipment: updatedEquipment,
    });

    set({ isActive: false, scenario: null, strategies: [], selectedStrategy: null, previewFlowPaths: [] });
  },

  cancelPreview: () => {
    set({ isActive: false, scenario: null, strategies: [], selectedStrategy: null, previewFlowPaths: [] });
  },

  togglePreviewMode: () => {
    set((state) => ({
      isActive: !state.isActive,
      scenario: !state.isActive ? null : state.scenario,
      strategies: [],
      selectedStrategy: null,
      previewFlowPaths: [],
    }));
  },

  getPreviewFlowPaths: () => {
    const { selectedStrategy } = get();
    if (!selectedStrategy) return [];

    const paths: [number, number, number][][] = [];

    selectedStrategy.lineActivation.forEach((activation) => {
      if (activation.active) {
        const pipes = pipelineConnections.filter(
          (p) => p.type === 'normal' || (p.type === 'backup' && activation.lineId.includes('backup'))
        );
        pipes.forEach((pipe) => {
          if (pipe.toUnit === activation.lineId || pipe.fromUnit === activation.lineId) {
            const path: [number, number, number][] = [pipe.fromPosition];
            path.push(...pipe.waypoints);
            path.push(pipe.toPosition);
            paths.push(path);
          }
        });
      }
    });

    return paths;
  },
}));
