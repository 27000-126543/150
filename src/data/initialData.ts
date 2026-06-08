import type { ProcessUnit, Equipment, Alert, ApprovalRequest, ChemicalInventory, Personnel, TreatmentLine, EmergencyDosing, WaterQuality, PipelineConnection, DispatchScenario, SparePart } from '@/types';

const generateTrendData = (baseCod: number, baseNh3n: number, baseTp: number): WaterQuality[] => {
  const data: WaterQuality[] = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      cod: baseCod + (Math.random() - 0.5) * 20,
      nh3n: baseNh3n + (Math.random() - 0.5) * 2,
      tp: baseTp + (Math.random() - 0.5) * 0.2,
      flow: 200 + (Math.random() - 0.5) * 50,
      level: 3 + (Math.random() - 0.5) * 0.5,
      do: 2 + (Math.random() - 0.5) * 1.5,
      timestamp: time.toISOString(),
    });
  }
  return data;
};

const generateRemovalRateTrendData = (inletData: WaterQuality[], outletData: WaterQuality[]) => {
  return inletData.map((inlet, index) => {
    const outlet = outletData[index] || inlet;
    return {
      cod: inlet.cod > 0 ? ((inlet.cod - outlet.cod) / inlet.cod) * 100 : 0,
      nh3n: inlet.nh3n > 0 ? ((inlet.nh3n - outlet.nh3n) / inlet.nh3n) * 100 : 0,
      tp: inlet.tp > 0 ? ((inlet.tp - outlet.tp) / inlet.tp) * 100 : 0,
      timestamp: inlet.timestamp,
    };
  });
};

const createProcessUnit = (
  base: Omit<ProcessUnit, 'trendDataInlet' | 'trendDataRemovalRate'>
): ProcessUnit => {
  const inletTrend = generateTrendData(base.inletWater.cod, base.inletWater.nh3n, base.inletWater.tp);
  const outletTrend = base.trendData;
  return {
    ...base,
    trendDataInlet: inletTrend,
    trendDataRemovalRate: generateRemovalRateTrendData(inletTrend, outletTrend),
  };
};

export const initialProcessUnits: ProcessUnit[] = [
  createProcessUnit({
    id: 'inlet-pump',
    name: '进水泵房',
    type: 'inlet',
    position: [-12, 0, -8],
    size: [4, 3, 6],
    inletWater: { cod: 350, nh3n: 25, tp: 4, flow: 250, level: 3.2 },
    outletWater: { cod: 345, nh3n: 24.5, tp: 3.9, flow: 248, level: 3.0 },
    status: 'normal',
    trendData: generateTrendData(345, 24.5, 3.9),
  }),
  createProcessUnit({
    id: 'coarse-grille',
    name: '粗格栅',
    type: 'grille',
    position: [-6, 0, -8],
    size: [3, 2.5, 5],
    inletWater: { cod: 345, nh3n: 24.5, tp: 3.9, flow: 248, level: 3.0 },
    outletWater: { cod: 330, nh3n: 23.5, tp: 3.7, flow: 245, level: 2.8 },
    status: 'normal',
    trendData: generateTrendData(330, 23.5, 3.7),
  }),
  createProcessUnit({
    id: 'bio-tank-1',
    name: '1#生化池',
    type: 'biological',
    position: [0, 0, -6],
    size: [8, 3, 8],
    inletWater: { cod: 330, nh3n: 23.5, tp: 3.7, flow: 120, level: 2.8 },
    outletWater: { cod: 45, nh3n: 3.5, tp: 0.35, flow: 118, level: 2.5, do: 2.8 },
    status: 'normal',
    trendData: generateTrendData(45, 3.5, 0.35),
  }),
  createProcessUnit({
    id: 'bio-tank-2',
    name: '2#生化池',
    type: 'biological',
    position: [0, 0, 3],
    size: [8, 3, 8],
    inletWater: { cod: 330, nh3n: 23.5, tp: 3.7, flow: 125, level: 2.8 },
    outletWater: { cod: 42, nh3n: 3.2, tp: 0.32, flow: 123, level: 2.5, do: 3.1 },
    status: 'normal',
    trendData: generateTrendData(42, 3.2, 0.32),
  }),
  createProcessUnit({
    id: 'bio-tank-backup',
    name: '备用生化池',
    type: 'biological',
    position: [9, 0, -1.5],
    size: [6, 3, 8],
    inletWater: { cod: 0, nh3n: 0, tp: 0, flow: 0, level: 0 },
    outletWater: { cod: 0, nh3n: 0, tp: 0, flow: 0, level: 0, do: 0 },
    status: 'normal',
    trendData: generateTrendData(0, 0, 0),
  }),
  createProcessUnit({
    id: 'secondary-sediment',
    name: '二沉池',
    type: 'sediment',
    position: [9, 0, 8],
    size: [6, 2.5, 6],
    inletWater: { cod: 43, nh3n: 3.3, tp: 0.33, flow: 240, level: 2.5 },
    outletWater: { cod: 38, nh3n: 2.8, tp: 0.28, flow: 238, level: 2.2 },
    status: 'normal',
    trendData: generateTrendData(38, 2.8, 0.28),
  }),
  createProcessUnit({
    id: 'disinfection',
    name: '消毒池',
    type: 'disinfection',
    position: [15, 0, 8],
    size: [5, 2, 5],
    inletWater: { cod: 38, nh3n: 2.8, tp: 0.28, flow: 238, level: 2.2 },
    outletWater: { cod: 35, nh3n: 2.5, tp: 0.25, flow: 235, level: 2.0 },
    status: 'normal',
    trendData: generateTrendData(35, 2.5, 0.25),
  }),
  createProcessUnit({
    id: 'sludge-dewatering',
    name: '污泥脱水间',
    type: 'dewatering',
    position: [-12, 0, 2],
    size: [5, 4, 6],
    inletWater: { cod: 500, nh3n: 40, tp: 6, flow: 30, level: 2.0 },
    outletWater: { cod: 100, nh3n: 15, tp: 2, flow: 25, level: 1.5 },
    status: 'normal',
    trendData: generateTrendData(100, 15, 2),
  }),
  createProcessUnit({
    id: 'control-room',
    name: '中央控制室',
    type: 'control',
    position: [-12, 0, 10],
    size: [5, 3.5, 5],
    inletWater: { cod: 0, nh3n: 0, tp: 0, flow: 0, level: 0 },
    outletWater: { cod: 0, nh3n: 0, tp: 0, flow: 0, level: 0 },
    status: 'normal',
    trendData: generateTrendData(0, 0, 0),
  }),
];

export const initialEquipment: Equipment[] = [
  {
    id: 'blower-1',
    name: '1#鼓风机',
    type: 'blower',
    position: [-2, 2.5, -6],
    runHours: 720,
    maintenanceThreshold: 1000,
    status: 'running',
    frequency: 45,
    powerConsumption: 45,
    efficiency: 92,
    vibration: 2.1,
    temperature: 65,
    current: 85,
    pressure: 55,
    rpm: 2800,
    maintenanceHistory: [
      { description: '常规保养', date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      { description: '更换滤芯', date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
    ],
  },
  {
    id: 'blower-2',
    name: '2#鼓风机',
    type: 'blower',
    position: [-2, 2.5, 3],
    runHours: 850,
    maintenanceThreshold: 1000,
    status: 'running',
    frequency: 48,
    powerConsumption: 48,
    efficiency: 90,
    vibration: 2.5,
    temperature: 68,
    current: 90,
    pressure: 58,
    rpm: 2900,
    maintenanceHistory: [
      { description: '常规保养', date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) },
    ],
  },
  {
    id: 'blower-3',
    name: '3#鼓风机(备用)',
    type: 'blower',
    position: [7, 2.5, -1.5],
    runHours: 150,
    maintenanceThreshold: 1000,
    status: 'standby',
    frequency: 0,
    powerConsumption: 0,
    efficiency: 95,
    vibration: 0.1,
    temperature: 25,
    current: 0,
    pressure: 0,
    rpm: 0,
    maintenanceHistory: [
      { description: '设备调试', date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
    ],
  },
  {
    id: 'dewaterer-1',
    name: '1#污泥脱水机',
    type: 'dewaterer',
    position: [-12, 3, 2],
    runHours: 950,
    maintenanceThreshold: 1000,
    status: 'running',
    powerConsumption: 35,
    efficiency: 85,
    vibration: 3.2,
    temperature: 55,
    current: 65,
    pressure: 45,
    rpm: 1500,
    maintenanceHistory: [
      { description: '更换滤带', date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) },
      { description: '常规保养', date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
    ],
  },
  {
    id: 'dewaterer-2',
    name: '2#污泥脱水机',
    type: 'dewaterer',
    position: [-10, 3, 2],
    runHours: 680,
    maintenanceThreshold: 1000,
    status: 'standby',
    powerConsumption: 0,
    efficiency: 88,
    vibration: 0.2,
    temperature: 25,
    current: 0,
    pressure: 0,
    rpm: 0,
    maintenanceHistory: [
      { description: '常规保养', date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000) },
    ],
  },
  {
    id: 'inlet-pump-1',
    name: '1#进水泵',
    type: 'pump',
    position: [-12, 2, -8],
    runHours: 1200,
    maintenanceThreshold: 2000,
    status: 'running',
    powerConsumption: 25,
    efficiency: 88,
    vibration: 1.8,
    temperature: 45,
    current: 45,
    pressure: 35,
    rpm: 1450,
    maintenanceHistory: [
      { description: '更换机械密封', date: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000) },
      { description: '常规保养', date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) },
    ],
  },
  {
    id: 'inlet-pump-2',
    name: '2#进水泵',
    type: 'pump',
    position: [-10, 2, -8],
    runHours: 1100,
    maintenanceThreshold: 2000,
    status: 'running',
    powerConsumption: 24,
    efficiency: 89,
    vibration: 1.6,
    temperature: 43,
    current: 43,
    pressure: 33,
    rpm: 1420,
    maintenanceHistory: [
      { description: '常规保养', date: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000) },
    ],
  },
];

export const initialAlerts: Alert[] = [];

export const initialApprovals: ApprovalRequest[] = [];

export const initialInventory: ChemicalInventory[] = [
  {
    id: 'pac',
    name: '聚合氯化铝(PAC)',
    currentStock: 2500,
    safetyThreshold: 1000,
    maxStock: 5000,
    dailyConsumption: 80,
    unit: 'kg',
    unitPrice: 3.5,
    purchaseHistory: [
      { id: 'pur-pac-1', quantity: 2000, date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), status: 'completed', unitPrice: 3.5 },
      { id: 'pur-pac-2', quantity: 1500, date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), status: 'completed', unitPrice: 3.4 },
    ],
  },
  {
    id: 'pam',
    name: '聚丙烯酰胺(PAM)',
    currentStock: 800,
    safetyThreshold: 300,
    maxStock: 2000,
    dailyConsumption: 25,
    unit: 'kg',
    unitPrice: 15,
    purchaseHistory: [
      { id: 'pur-pam-1', quantity: 1000, date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), status: 'completed', unitPrice: 15 },
    ],
  },
  {
    id: 'carbon',
    name: '碳源(乙酸钠)',
    currentStock: 3500,
    safetyThreshold: 1500,
    maxStock: 8000,
    dailyConsumption: 120,
    unit: 'kg',
    unitPrice: 4.2,
    purchaseHistory: [
      { id: 'pur-carbon-1', quantity: 5000, date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), status: 'completed', unitPrice: 4.2 },
      { id: 'pur-carbon-2', quantity: 3000, date: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000), status: 'completed', unitPrice: 4.0 },
    ],
  },
  {
    id: 'disinfectant',
    name: '次氯酸钠',
    currentStock: 1200,
    safetyThreshold: 500,
    maxStock: 3000,
    dailyConsumption: 45,
    unit: 'L',
    unitPrice: 2.8,
    purchaseHistory: [
      { id: 'pur-disinfectant-1', quantity: 2000, date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), status: 'completed', unitPrice: 2.8 },
    ],
  },
];

export const initialPersonnel: Personnel[] = [
  {
    id: 'p1',
    name: '张三',
    role: '运营操作员',
    position: [0, 0, 8],
    targetPosition: [5, 0, 8],
    inDangerZone: false,
  },
  {
    id: 'p2',
    name: '李四',
    role: '维修工程师',
    position: [-12, 0, 5],
    targetPosition: [-12, 0, 2],
    inDangerZone: false,
  },
  {
    id: 'p3',
    name: '王五',
    role: '化验员',
    position: [15, 0, 5],
    targetPosition: [15, 0, 8],
    inDangerZone: false,
  },
];

export const initialTreatmentLines: TreatmentLine[] = [
  {
    id: 'line-1',
    name: '1#处理线',
    capacity: 150,
    currentLoad: 80,
    loadPercentage: 80,
    isActive: true,
    isBackup: false,
    isOverloaded: false,
  },
  {
    id: 'line-2',
    name: '2#处理线',
    capacity: 150,
    currentLoad: 83,
    loadPercentage: 83,
    isActive: true,
    isBackup: false,
    isOverloaded: false,
  },
  {
    id: 'line-backup',
    name: '备用处理线',
    capacity: 150,
    currentLoad: 0,
    loadPercentage: 0,
    isActive: false,
    isBackup: true,
    isOverloaded: false,
    switchPath: [
      [-3, 0.5, -1.5],
      [3, 0.5, -1.5],
      [6, 0.5, -1.5],
      [9, 0.5, -1.5],
    ],
  },
];

export const initialEmergencyDosing: EmergencyDosing[] = [
  {
    id: 'emergency-carbon',
    chemicalType: 'carbon_source',
    isActive: false,
    pipelinePath: [
      [12, 1, 5],
      [12, 1, 8],
      [15, 1, 8],
    ],
  },
  {
    id: 'emergency-flocculant',
    chemicalType: 'flocculant',
    isActive: false,
    pipelinePath: [
      [6, 1, 5],
      [6, 1, 8],
      [9, 1, 8],
    ],
  },
];

export const dangerZones: { id: string; name: string; position: [number, number, number]; size: [number, number, number] }[] = [
  {
    id: 'dosing-room',
    name: '加药间',
    position: [12, 0, 5],
    size: [3, 3, 3],
  },
  {
    id: 'sludge-room',
    name: '污泥间',
    position: [-12, 0, 2],
    size: [5, 3, 4],
  },
];

export const pipelineConnections: PipelineConnection[] = [
  {
    id: 'pipe-1',
    fromUnit: 'inlet-pump',
    toUnit: 'coarse-grille',
    fromPosition: [-10, 1, -8],
    toPosition: [-7.5, 1, -8],
    waypoints: [],
    type: 'normal',
    isActive: true,
    flowDirection: [1, 0, 0],
  },
  {
    id: 'pipe-2',
    fromUnit: 'coarse-grille',
    toUnit: 'bio-tank-1',
    fromPosition: [-4.5, 1, -8],
    toPosition: [-4, 1, -6],
    waypoints: [[-4, 1, -7]],
    type: 'normal',
    isActive: true,
    flowDirection: [0, 0, 1],
  },
  {
    id: 'pipe-3',
    fromUnit: 'coarse-grille',
    toUnit: 'bio-tank-2',
    fromPosition: [-4.5, 1, -8],
    toPosition: [-4, 1, 3],
    waypoints: [[-4, 1, -2]],
    type: 'normal',
    isActive: true,
    flowDirection: [0, 0, 1],
  },
  {
    id: 'pipe-4',
    fromUnit: 'coarse-grille',
    toUnit: 'bio-tank-backup',
    fromPosition: [-4.5, 1, -8],
    toPosition: [6, 1, -1.5],
    waypoints: [[-4, 1, -2], [4, 1, -2]],
    type: 'backup',
    isActive: false,
    flowDirection: [1, 0, 0],
  },
  {
    id: 'pipe-5',
    fromUnit: 'bio-tank-1',
    toUnit: 'secondary-sediment',
    fromPosition: [4, 1, -6],
    toPosition: [6, 1, 8],
    waypoints: [[4, 1, -2], [6, 1, -2], [6, 1, 0]],
    type: 'normal',
    isActive: true,
    flowDirection: [0, 0, 1],
  },
  {
    id: 'pipe-6',
    fromUnit: 'bio-tank-2',
    toUnit: 'secondary-sediment',
    fromPosition: [4, 1, 3],
    toPosition: [6, 1, 8],
    waypoints: [[4, 1, 0], [6, 1, 0]],
    type: 'normal',
    isActive: true,
    flowDirection: [0, 0, 1],
  },
  {
    id: 'pipe-7',
    fromUnit: 'bio-tank-backup',
    toUnit: 'secondary-sediment',
    fromPosition: [12, 1, -1.5],
    toPosition: [6, 1, 8],
    waypoints: [[12, 1, 0], [6, 1, 0]],
    type: 'backup',
    isActive: false,
    flowDirection: [0, 0, 1],
  },
  {
    id: 'pipe-8',
    fromUnit: 'secondary-sediment',
    toUnit: 'disinfection',
    fromPosition: [12, 1, 8],
    toPosition: [12.5, 1, 8],
    waypoints: [],
    type: 'normal',
    isActive: true,
    flowDirection: [1, 0, 0],
  },
  {
    id: 'pipe-9',
    fromUnit: 'disinfection',
    toUnit: 'outlet',
    fromPosition: [17.5, 1, 8],
    toPosition: [20, 1, 8],
    waypoints: [],
    type: 'normal',
    isActive: true,
    flowDirection: [1, 0, 0],
  },
  {
    id: 'pipe-10',
    fromUnit: 'secondary-sediment',
    toUnit: 'sludge-dewatering',
    fromPosition: [6, 1, 8],
    toPosition: [-12, 1, 2],
    waypoints: [[-12, 1, 8], [-12, 1, 5]],
    type: 'normal',
    isActive: true,
    flowDirection: [-1, 0, 0],
  },
];

export const dispatchScenarios: DispatchScenario[] = [
  {
    id: 'scenario-1',
    name: '常规工况',
    inflow: 250,
    codLoad: 350,
    nh3nLoad: 25,
    description: '正常来水水质水量，双生化池并联运行',
  },
  {
    id: 'scenario-2',
    name: '高负荷工况',
    inflow: 350,
    codLoad: 500,
    nh3nLoad: 40,
    description: '雨季或工业废水高峰，需启用备用处理线',
  },
  {
    id: 'scenario-3',
    name: '低负荷工况',
    inflow: 150,
    codLoad: 200,
    nh3nLoad: 15,
    description: '夜间或节假日低水量，可单池运行节能',
  },
  {
    id: 'scenario-4',
    name: '冲击负荷',
    inflow: 400,
    codLoad: 600,
    nh3nLoad: 50,
    description: '异常高浓度废水，需应急投加药剂',
  },
];

export const sparePartsData: Record<string, SparePart[]> = {
  blower: [
    { id: 'sp-1', name: '空气滤芯', quantity: 2, unit: '个', inStock: true, currentStock: 15 },
    { id: 'sp-2', name: '润滑油', quantity: 20, unit: 'L', inStock: true, currentStock: 50 },
    { id: 'sp-3', name: '传动皮带', quantity: 2, unit: '条', inStock: false, currentStock: 1 },
    { id: 'sp-4', name: '轴承', quantity: 2, unit: '套', inStock: true, currentStock: 8 },
  ],
  dewaterer: [
    { id: 'sp-5', name: '滤带', quantity: 1, unit: '条', inStock: false, currentStock: 0 },
    { id: 'sp-6', name: '张紧弹簧', quantity: 4, unit: '个', inStock: true, currentStock: 20 },
    { id: 'sp-7', name: '冲洗喷嘴', quantity: 10, unit: '个', inStock: true, currentStock: 30 },
  ],
  pump: [
    { id: 'sp-8', name: '机械密封', quantity: 1, unit: '套', inStock: true, currentStock: 5 },
    { id: 'sp-9', name: '叶轮', quantity: 1, unit: '个', inStock: false, currentStock: 0 },
    { id: 'sp-10', name: '轴承', quantity: 2, unit: '套', inStock: true, currentStock: 10 },
  ],
};

export const maintenanceAssignees = ['张工', '李工', '王工', '赵工'];
