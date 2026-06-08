import * as XLSX from 'xlsx';
import type { DailyReportData, ProcessUnit, Equipment, ChemicalInventory } from '@/types';
import { formatDate, formatNumber } from './formatters';

export const generateDailyReportData = (
  date: Date,
  processUnits: ProcessUnit[],
  equipment: Equipment[],
  inventory: ChemicalInventory[]
): DailyReportData => {
  const processData = processUnits
    .filter((u) => u.type !== 'control' && u.outletWater.flow > 0)
    .map((unit) => ({
      unitName: unit.name,
      inflow: unit.inletWater.flow * 24,
      outflow: unit.outletWater.flow * 24,
      removalRate: ((unit.inletWater.cod - unit.outletWater.cod) / unit.inletWater.cod) * 100,
    }));

  const disinfectionUnit = processUnits.find((u) => u.type === 'disinfection');
  const complianceData = [
    {
      parameter: 'COD',
      standard: 50,
      average: disinfectionUnit?.outletWater.cod || 0,
      complianceRate: (disinfectionUnit?.outletWater.cod || 0) <= 50 ? 100 : 85,
    },
    {
      parameter: '氨氮',
      standard: 5,
      average: disinfectionUnit?.outletWater.nh3n || 0,
      complianceRate: (disinfectionUnit?.outletWater.nh3n || 0) <= 5 ? 100 : 90,
    },
    {
      parameter: '总磷',
      standard: 0.5,
      average: disinfectionUnit?.outletWater.tp || 0,
      complianceRate: (disinfectionUnit?.outletWater.tp || 0) <= 0.5 ? 100 : 92,
    },
  ];

  const energyData = equipment
    .filter((e) => e.status === 'running')
    .map((e) => ({
      equipment: e.name,
      runHours: 24,
      powerConsumption: e.type === 'blower' ? 120 * 24 : e.type === 'dewaterer' ? 80 * 24 : 30 * 24,
    }));

  const totalEnergy = energyData.reduce((sum, d) => sum + d.powerConsumption, 0);
  const totalInflow = processData.reduce((sum, d) => sum + d.inflow, 0);
  const totalOutflow = processData.reduce((sum, d) => sum + d.outflow, 0);

  return {
    date: formatDate(date),
    processData,
    complianceData,
    energyData,
    totalEnergy,
    totalInflow,
    totalOutflow,
  };
};

export const exportToExcel = (reportData: DailyReportData): void => {
  const wb = XLSX.utils.book_new();

  const summaryData = [
    ['污水处理厂运营日报'],
    [`日期: ${reportData.date}`],
    [],
    ['一、总体指标'],
    ['指标', '数值', '单位'],
    ['总进水量', formatNumber(reportData.totalInflow, 0), 'm³/d'],
    ['总出水量', formatNumber(reportData.totalOutflow, 0), 'm³/d'],
    ['总能耗', formatNumber(reportData.totalEnergy, 0), 'kWh/d'],
    ['单位能耗', formatNumber(reportData.totalEnergy / reportData.totalOutflow, 2), 'kWh/m³'],
  ];

  const processSheetData = [
    [],
    ['二、各工艺段处理量'],
    ['工艺单元', '进水量(m³/d)', '出水量(m³/d)', 'COD去除率(%)'],
    ...reportData.processData.map((d) => [
      d.unitName,
      formatNumber(d.inflow, 0),
      formatNumber(d.outflow, 0),
      formatNumber(d.removalRate, 1),
    ]),
  ];

  const complianceSheetData = [
    [],
    ['三、出水达标情况'],
    ['水质参数', '排放标准(mg/L)', '日均值(mg/L)', '达标率(%)'],
    ...reportData.complianceData.map((d) => [
      d.parameter,
      formatNumber(d.standard, d.parameter === '总磷' ? 1 : 0),
      formatNumber(d.average, d.parameter === '总磷' ? 2 : 1),
      formatNumber(d.complianceRate, 0),
    ]),
  ];

  const energySheetData = [
    [],
    ['四、能耗统计'],
    ['设备名称', '运行时间(h)', '耗电量(kWh)'],
    ...reportData.energyData.map((d) => [
      d.equipment,
      formatNumber(d.runHours, 0),
      formatNumber(d.powerConsumption, 0),
    ]),
  ];

  const allData = [...summaryData, ...processSheetData, ...complianceSheetData, ...energySheetData];

  const ws = XLSX.utils.aoa_to_sheet(allData);

  ws['!cols'] = [
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, '运营日报');

  const fileName = `污水处理厂运营日报_${reportData.date.replace(/\//g, '-')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

export const exportDailyReport = (
  date: Date,
  processUnits: ProcessUnit[],
  equipment: Equipment[],
  inventory: ChemicalInventory[]
): void => {
  const reportData = generateDailyReportData(date, processUnits, equipment, inventory);
  exportToExcel(reportData);
};
