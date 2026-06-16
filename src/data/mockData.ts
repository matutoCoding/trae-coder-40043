import type {
  Workpiece, Fixture, WeldingProgram, WeldPoint, RepairRecord, CycleData, MaintenanceRecord, WeldingHistoryPoint } from '@/types';

const now = new Date();

export const mockWorkpieces: Workpiece[] = [
  {
    id: 'wp-001',
    code: 'BIW-20240617-001',
    name: '车身左侧围总成',
    type: '车身部件',
    loadingTime: new Date(now.getTime() - 1000 * 60 * 5),
    status: 'completed',
    position: { x: 0.02, y: -0.01, z: 0.00 },
  },
  {
    id: 'wp-002',
    code: 'BIW-20240617-002',
    name: '车身右侧围总成',
    type: '车身部件',
    loadingTime: new Date(now.getTime() - 1000 * 60 * 3),
    status: 'loaded',
    position: { x: 0.01, y: 0.01, z: 0.00 },
  },
  {
    id: 'wp-003',
    code: 'BIW-20240617-003',
    name: '前地板总成',
    type: '车身部件',
    loadingTime: new Date(),
    status: 'loading',
    position: { x: 0.03, y: -0.02, z: 0.01 },
  },
];

export const mockFixture: Fixture = {
  id: 'fx-001',
  name: '主焊接夹具A',
  status: 'clamped',
  clampForce: 8500,
  positionAccuracy: 0.02,
  sensors: [
    { id: 's1', name: '夹紧气缸压力', value: 8.5, unit: 'bar', status: 'normal', min: 6, max: 10 },
    { id: 's2', name: '定位销位置', value: 0.015, unit: 'mm', status: 'normal', min: 0, max: 0.05 },
    { id: 's3', name: '工件存在检测', value: 1, unit: '', status: 'normal', min: 1, max: 1 },
    { id: 's4', name: '左夹爪位置', value: 98.2, unit: '%', status: 'normal', min: 95, max: 100 },
    { id: 's5', name: '右夹爪位置', value: 97.8, unit: '%', status: 'normal', min: 95, max: 100 },
    { id: 's6', name: '液压系统压力', value: 165, unit: 'bar', status: 'normal', min: 140, max: 180 },
  ],
};

export const mockWeldingPrograms: WeldingProgram[] = [
  {
    id: 'prog-001',
    name: '左侧围标准焊接程序',
    description: '用于车身左侧围总成的标准点焊程序',
    defaultParams: { current: 12500, voltage: 4.2, pressure: 350, time: 0.35, programId: 'prog-001', programName: '左侧围标准焊接程序' },
    pointCount: 48,
  },
  {
    id: 'prog-002',
    name: '右侧围标准焊接程序',
    description: '用于车身右侧围总成的标准点焊程序',
    defaultParams: { current: 12800, voltage: 4.3, pressure: 360, time: 0.35, programId: 'prog-002', programName: '右侧围标准焊接程序' },
    pointCount: 52,
  },
  {
    id: 'prog-003',
    name: '前地板加强焊接程序',
    description: '用于前地板总成的加强焊接程序',
    defaultParams: { current: 13200, voltage: 4.5, pressure: 380, time: 0.40, programId: 'prog-003', programName: '前地板加强焊接程序' },
    pointCount: 36,
  },
];

function generateWeldPoints(count: number): WeldPoint[] {
  const points: WeldPoint[] = [];
  const rows = Math.ceil(count / 8);
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / 8);
    const col = i % 8;
    points.push({
      id: `wp-${i + 1}`,
      index: i + 1,
      position: { x: col * 12 + 10, y: row * 12 + 10 },
      status: i < 30 ? 'completed' : i < 35 ? 'welding' : 'pending',
      ultrasonicResult: i < 28 ? 'pass' : i === 28 ? 'fail' : i === 29 ? 'pass' : undefined,
      defectType: i === 28 ? 'cold' : 'none',
    });
  }
  return points;
}

export const mockWeldPoints: WeldPoint[] = generateWeldPoints(48);

export const mockRepairRecords: RepairRecord[] = [
  {
    id: 'rr-001',
    workpieceId: 'wp-001',
    weldPointId: 'wp-28',
    weldPointIndex: 28,
    operator: '张工',
    repairTime: new Date(now.getTime() - 1000 * 60 * 30),
    description: '第28号焊点存在虚焊，已补焊完成',
    spatterCleaned: true,
  },
  {
    id: 'rr-002',
    workpieceId: 'wp-001',
    weldPointId: 'wp-15',
    weldPointIndex: 15,
    operator: '李工',
    repairTime: new Date(now.getTime() - 1000 * 60 * 25),
    description: '焊点周围焊渣飞溅严重，已清理并复核',
    spatterCleaned: true,
  },
];

export const mockCycleDataList: CycleData[] = [
  {
    id: 'cd-001',
    workpieceId: 'wp-001',
    workpieceCode: 'BIW-20240617-001',
    startTime: new Date(now.getTime() - 1000 * 60 * 60),
    endTime: new Date(now.getTime() - 1000 * 60 * 52),
    duration: 328,
    targetDuration: 300,
    loadingTime: 35,
    fixtureTime: 28,
    weldingTime: 152,
    inspectionTime: 68,
    repairTime: 45,
    status: 'completed',
  },
  {
    id: 'cd-002',
    workpieceId: 'wp-001',
    workpieceCode: 'BIW-20240617-002',
    startTime: new Date(now.getTime() - 1000 * 60 * 5),
    targetDuration: 300,
    loadingTime: 32,
    fixtureTime: 25,
    weldingTime: 148,
    inspectionTime: 0,
    repairTime: 0,
    status: 'running',
  },
];

export const mockCycleStats = [
  { time: '08:00', duration: 295, target: 300 },
  { time: '08:05', duration: 312, target: 300 },
  { time: '08:10', duration: 288, target: 300 },
  { time: '08:15', duration: 305, target: 300 },
  { time: '08:20', duration: 298, target: 300 },
  { time: '08:25', duration: 322, target: 300 },
  { time: '08:30', duration: 290, target: 300 },
  { time: '08:35', duration: 318, target: 300 },
  { time: '08:40', duration: 302, target: 300 },
  { time: '08:45', duration: 296, target: 300 },
];

export const mockMaintenanceRecords: MaintenanceRecord[] = [
  {
    id: 'mr-001',
    deviceName: '1号焊枪',
    type: 'electrode_dressing',
    operator: '王工',
    time: new Date(now.getTime() - 1000 * 60 * 60 * 4),
    description: '电极帽修磨，更换电极帽端面修整',
    nextMaintenanceDate: new Date(now.getTime() + 1000 * 60 * 60 * 8),
    equipmentHealth: 92,
  },
  {
    id: 'mr-002',
    deviceName: '2号焊枪',
    type: 'preventive',
    operator: '赵工',
    time: new Date(now.getTime() - 1000 * 60 * 60 * 8),
    description: '定期保养，检查焊枪通水冷却系统',
    nextMaintenanceDate: new Date(now.getTime() + 1000 * 60 * 60 * 16),
    equipmentHealth: 88,
  },
  {
    id: 'mr-003',
    deviceName: '夹具液压系统',
    type: 'preventive',
    operator: '刘工',
    time: new Date(now.getTime() - 1000 * 60 * 60 * 24),
    description: '液压油检查，补充液压油',
    nextMaintenanceDate: new Date(now.getTime() + 1000 * 60 * 60 * 72),
    equipmentHealth: 95,
  },
];

export function generateWeldingHistory(): WeldingHistoryPoint[] {
  const data: WeldingHistoryPoint[] = [];
  for (let i = 0; i < 60; i++) {
    data.push({
      time: `${i}s`,
      current: 12000 + Math.random() * 2000 - 1000,
      voltage: 4 + Math.random() * 1 - 0.5,
    });
  }
  return data;
}

export const mockDashboardStats = {
  todayOutput: 128,
  targetOutput: 150,
  passRate: 96.8,
  avgCycleTime: 302,
  equipmentHealth: 91,
  runningStatus: 'running' as const,
  currentWorkpiece: mockWorkpieces[2],
  defectivePoints: 2,
  completedPoints: 30,
  totalPoints: 48,
};
