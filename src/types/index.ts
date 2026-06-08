export interface WaterQuality {
  cod: number;
  nh3n: number;
  tp: number;
  flow: number;
  level: number;
  do?: number;
  timestamp?: string;
}

export interface WaterQualityTrend {
  inlet: WaterQuality[];
  outlet: WaterQuality[];
  removalRate: {
    cod: number;
    nh3n: number;
    tp: number;
    timestamp?: string;
  }[];
}

export type UnitType = 'inlet' | 'grille' | 'biological' | 'sediment' | 'disinfection' | 'dewatering' | 'control';

export interface ProcessUnit {
  id: string;
  name: string;
  type: UnitType;
  position: [number, number, number];
  size: [number, number, number];
  inletWater: WaterQuality;
  outletWater: WaterQuality;
  status: 'normal' | 'warning' | 'alarm';
  trendData: WaterQuality[];
  trendDataInlet: WaterQuality[];
  trendDataRemovalRate: { cod: number; nh3n: number; tp: number; timestamp?: string }[];
}

export type EquipmentType = 'blower' | 'dewaterer' | 'pump';

export interface SparePart {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  inStock: boolean;
  currentStock: number;
}

export interface MaintenanceOrder {
  id: string;
  description: string;
  createdAt: Date;
  equipmentId: string;
  status: 'pending' | 'in_progress' | 'completed';
  spareParts: SparePart[];
  estimatedDowntime: number;
  assignee: string;
  progress: number;
  notes: string;
  lowStockAlert: string[];
}

export interface MaintenanceRecord {
  description: string;
  date: Date;
}

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  position: [number, number, number];
  runHours: number;
  maintenanceThreshold: number;
  status: 'running' | 'standby' | 'maintenance';
  frequency?: number;
  powerConsumption: number;
  efficiency: number;
  vibration: number;
  temperature: number;
  current: number;
  pressure: number;
  rpm: number;
  maintenanceOrder?: MaintenanceOrder;
  maintenanceHistory: MaintenanceRecord[];
}

export type AlertType = 'water_quality' | 'equipment' | 'safety' | 'emergency';
export type AlertLevel = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  type: AlertType;
  level: AlertLevel;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  unitId?: string;
}

export type ApprovalStatus = 'pending_operator' | 'pending_director' | 'pending_manager' | 'approved' | 'rejected';

export interface ApprovalStep {
  approved: boolean;
  comment: string;
  time: Date;
}

export interface ApprovalRequest {
  id: string;
  parameter: string;
  currentValue: number;
  requestedValue: number;
  unit: string;
  reason: string;
  applicant: string;
  status: ApprovalStatus;
  operatorApproval?: ApprovalStep;
  directorApproval?: ApprovalStep;
  managerApproval?: ApprovalStep;
  createdAt: Date;
}

export interface PurchaseRecord {
  id: string;
  quantity: number;
  date: Date;
  status: 'pending' | 'ordered' | 'completed' | 'received';
  unitPrice: number;
}

export interface PurchaseRequest {
  id: string;
  chemicalId: string;
  chemicalName: string;
  quantity: number;
  createdAt: Date;
  status: 'pending' | 'ordered' | 'received';
  estimatedArrivalDate?: string;
}

export interface ChemicalInventory {
  id: string;
  name: string;
  currentStock: number;
  safetyThreshold: number;
  maxStock: number;
  dailyConsumption: number;
  unit: string;
  unitPrice: number;
  purchaseRequest?: {
    id: string;
    chemicalName: string;
    quantity: number;
    createdAt: Date;
    status: 'pending' | 'ordered' | 'received';
    estimatedArrivalDate?: string;
  };
  purchaseHistory: PurchaseRecord[];
}

export interface Personnel {
  id: string;
  name: string;
  role: string;
  position: [number, number, number];
  targetPosition: [number, number, number];
  inDangerZone: boolean;
  zoneName?: string;
}

export interface TreatmentLine {
  id: string;
  name: string;
  capacity: number;
  currentLoad: number;
  loadPercentage: number;
  isActive: boolean;
  isBackup: boolean;
  isOverloaded: boolean;
  switchPath?: [number, number, number][];
}

export interface EmergencyDosing {
  id: string;
  chemicalType: 'carbon_source' | 'flocculant';
  isActive: boolean;
  pipelinePath: [number, number, number][];
  startTime?: Date;
}

export interface DailyReportData {
  date: string;
  processData: {
    unitName: string;
    inflow: number;
    outflow: number;
    removalRate: number;
  }[];
  complianceData: {
    parameter: string;
    standard: number;
    average: number;
    complianceRate: number;
  }[];
  energyData: {
    equipment: string;
    runHours: number;
    powerConsumption: number;
  }[];
  totalEnergy: number;
  totalInflow: number;
  totalOutflow: number;
}

export interface DispatchScenario {
  id: string;
  name: string;
  inflow: number;
  codLoad: number;
  nh3nLoad: number;
  description: string;
}

export interface DispatchStrategy {
  id: string;
  scenarioId: string;
  name: string;
  lineActivation: { lineId: string; active: boolean; loadRatio: number }[];
  aerationFrequency: { blowerId: string; frequency: number }[];
  returnSludgeRatio: number;
  chemicalDosing: { chemicalId: string; dosage: number }[];
  expectedEffluentQuality: WaterQuality;
  expectedComplianceRate: number;
  expectedEnergyConsumption: number;
  riskPoints: { level: 'low' | 'medium' | 'high'; description: string }[];
  score: number;
}

export interface DispatchPreview {
  isActive: boolean;
  scenario: DispatchScenario | null;
  strategies: DispatchStrategy[];
  selectedStrategy: DispatchStrategy | null;
  previewFlowPaths: [number, number, number][][];
}

export interface PipelineConnection {
  id: string;
  fromUnit: string;
  toUnit: string;
  fromPosition: [number, number, number];
  toPosition: [number, number, number];
  waypoints: [number, number, number][];
  type: 'normal' | 'backup' | 'emergency';
  isActive: boolean;
  flowDirection: [number, number, number];
}
