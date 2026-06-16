import type {
  Workpiece, Fixture, WeldingProgram, WeldPoint, RepairRecord, CycleData,
  MaintenanceRecord, WeldingHistoryPoint, AlarmRecord, TraceEvent
} from '@/types';

const now = new Date();

const defaultRanges = {
  current: { min: 10000, max: 14500 },
  voltage: { min: 3.5, max: 5.2 },
  pressure: { min: 280, max: 420 },
  time: { min: 0.25, max: 0.50 },
};

export const mockWorkpieces: Workpiece[] = [
  {
    id: 'wp-001',
    code: 'BIW-20240617-001',
    name: '车身左侧围总成',
    type: '车身部件',
    loadingTime: new Date(now.getTime() - 1000 * 60 * 60),
    status: 'completed',
    position: { x: 0.02, y: -0.01, z: 0.00 },
    operator: '陈操作员',
  },
  {
    id: 'wp-002',
    code: 'BIW-20240617-002',
    name: '车身右侧围总成',
    type: '车身部件',
    loadingTime: new Date(now.getTime() - 1000 * 60 * 8),
    status: 'loaded',
    position: { x: 0.01, y: 0.01, z: 0.00 },
    operator: '陈操作员',
  },
  {
    id: 'wp-003',
    code: 'BIW-20240617-003',
    name: '前地板总成',
    type: '车身部件',
    loadingTime: new Date(),
    status: 'loading',
    position: { x: 0.03, y: -0.02, z: 0.01 },
    operator: '陈操作员',
  },
];

export const mockFixture: Fixture = {
  id: 'fx-001',
  name: '主焊接夹具A',
  status: 'clamped',
  clampForce: 8500,
  positionAccuracy: 0.02,
  operator: '陈操作员',
  clampTime: new Date(now.getTime() - 1000 * 60 * 5),
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
    description: '用于车身左侧围总成的标准点焊程序，48个焊点',
    defaultParams: { current: 12500, voltage: 4.2, pressure: 350, time: 0.35, programId: 'prog-001', programName: '左侧围标准焊接程序' },
    pointCount: 48,
    paramRanges: defaultRanges,
    savedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7),
  },
  {
    id: 'prog-002',
    name: '右侧围标准焊接程序',
    description: '用于车身右侧围总成的标准点焊程序，52个焊点',
    defaultParams: { current: 12800, voltage: 4.3, pressure: 360, time: 0.35, programId: 'prog-002', programName: '右侧围标准焊接程序' },
    pointCount: 52,
    paramRanges: defaultRanges,
    savedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5),
  },
  {
    id: 'prog-003',
    name: '前地板加强焊接程序',
    description: '用于前地板总成的加强焊接程序，36个焊点',
    defaultParams: { current: 13200, voltage: 4.5, pressure: 380, time: 0.40, programId: 'prog-003', programName: '前地板加强焊接程序' },
    pointCount: 36,
    paramRanges: { ...defaultRanges, current: { min: 11000, max: 15000 } },
    savedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3),
  },
];

function generateWeldPoints(count: number, programId: string = 'prog-001'): WeldPoint[] {
  const program = mockWeldingPrograms.find(p => p.id === programId) || mockWeldingPrograms[0];
  const points: WeldPoint[] = [];
  const rows = Math.ceil(count / 8);

  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / 8);
    const col = i % 8;
    const base = program.defaultParams;
    let status: WeldPoint['status'] = i < 30 ? 'completed' : i < 35 ? 'welding' : 'pending';
    let defectType: WeldPoint['defectType'] = 'none';
    let ultrasonicResult: WeldPoint['ultrasonicResult'] = undefined;
    let paramAbnormal = undefined;

    if (i < 30) {
      if (i === 28) {
        status = 'defective';
        defectType = 'cold';
        ultrasonicResult = 'fail';
      } else if (i === 18) {
        defectType = 'param_abnormal';
        ultrasonicResult = 'fail';
        status = 'defective';
        paramAbnormal = {
          param: 'current' as const,
          value: 9800,
          expectedMin: program.paramRanges.current.min,
          expectedMax: program.paramRanges.current.max,
          min: program.paramRanges.current.min,
          max: program.paramRanges.current.max,
        };
      } else {
        ultrasonicResult = 'pass';
      }
    }

    points.push({
      id: `pt-${i + 1}`,
      index: i + 1,
      position: { x: col * 12 + 10, y: row * 12 + 10 },
      status,
      ultrasonicResult,
      defectType,
      weldParams: {
        ...base,
        current: i === 18 ? 9800 : base.current + (Math.random() * 500 - 250),
        voltage: base.voltage + (Math.random() * 0.2 - 0.1),
      },
      paramAbnormal,
      weldingStartTime: new Date(now.getTime() - 1000 * (count - i) * 2),
      weldingEndTime: i < 30 ? new Date(now.getTime() - 1000 * (count - i) * 2 - 400) : undefined,
      inspector: i < 28 || i === 29 ? '王质检员' : undefined,
      inspectionTime: i < 28 || i === 29 ? new Date(now.getTime() - 1000 * 60 * 15) : i === 28 || i === 18 ? new Date(now.getTime() - 1000 * 60 * 10) : undefined,
    });
  }
  return points;
}

export const mockWeldPoints: WeldPoint[] = generateWeldPoints(48);

export const mockRepairRecords: RepairRecord[] = [
  {
    id: 'rr-001',
    workpieceId: 'wp-001',
    weldPointId: 'pt-28',
    weldPointIndex: 28,
    operator: '刘补焊工',
    repairTime: new Date(now.getTime() - 1000 * 60 * 30),
    description: '第28号焊点存在虚焊，已采用手工补焊完成，补焊参数符合标准',
    spatterCleaned: true,
    repairMethod: 'manual',
  },
  {
    id: 'rr-002',
    workpieceId: 'wp-001',
    weldPointId: 'pt-15',
    weldPointIndex: 15,
    operator: '刘补焊工',
    repairTime: new Date(now.getTime() - 1000 * 60 * 25),
    description: '焊点周围焊渣飞溅严重，已进行清理并人工复核合格',
    spatterCleaned: true,
    repairMethod: 'rework',
  },
];

export const mockCycleDataList: CycleData[] = [
  {
    id: 'cd-001',
    workpieceId: 'wp-001',
    workpieceCode: 'BIW-20240617-001',
    startTime: new Date(now.getTime() - 1000 * 60 * 60),
    endTime: new Date(now.getTime() - 1000 * 60 * 54),
    duration: 336,
    targetDuration: 300,
    loadingTime: 35,
    fixtureTime: 28,
    weldingTime: 148,
    inspectionTime: 48,
    repairTime: 77,
    status: 'completed',
  },
  {
    id: 'cd-002',
    workpieceId: 'wp-002',
    workpieceCode: 'BIW-20240617-002',
    startTime: new Date(now.getTime() - 1000 * 60 * 6),
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
    operator: '王工程师',
    time: new Date(now.getTime() - 1000 * 60 * 60 * 4),
    description: '电极帽修磨，端面修整完毕，更换备用电极帽1个',
    nextMaintenanceDate: new Date(now.getTime() + 1000 * 60 * 60 * 8),
    equipmentHealth: 92,
    relatedWorkpieceId: 'wp-001',
  },
  {
    id: 'mr-002',
    deviceName: '2号焊枪',
    type: 'preventive',
    operator: '赵工程师',
    time: new Date(now.getTime() - 1000 * 60 * 60 * 8),
    description: '定期保养，检查焊枪通水冷却系统，清理水路过滤器',
    nextMaintenanceDate: new Date(now.getTime() + 1000 * 60 * 60 * 16),
    equipmentHealth: 88,
  },
  {
    id: 'mr-003',
    deviceName: '夹具液压系统',
    type: 'preventive',
    operator: '刘工程师',
    time: new Date(now.getTime() - 1000 * 60 * 60 * 24),
    description: '液压油检查，补充N46抗磨液压油3L',
    nextMaintenanceDate: new Date(now.getTime() + 1000 * 60 * 60 * 72),
    equipmentHealth: 95,
  },
];

export function generateWeldingHistory(ranges = defaultRanges): WeldingHistoryPoint[] {
  const data: WeldingHistoryPoint[] = [];
  for (let i = 0; i < 60; i++) {
    let current = 12500 + Math.random() * 1500 - 750;
    let voltage = 4.2 + Math.random() * 0.4 - 0.2;
    if (i === 25 || i === 26) current = 9700 + Math.random() * 300;
    if (i === 45) voltage = 5.4 + Math.random() * 0.2;
    const currentNormal = current >= ranges.current.min && current <= ranges.current.max;
    const voltageNormal = voltage >= ranges.voltage.min && voltage <= ranges.voltage.max;
    data.push({
      time: `${i}s`,
      current: Math.round(current),
      voltage: Number(voltage.toFixed(2)),
      currentNormal,
      voltageNormal,
    });
  }
  return data;
}

export const mockAlarmRecords: AlarmRecord[] = [
  {
    id: 'al-001',
    time: new Date(now.getTime() - 1000 * 60 * 20),
    severity: 'high',
    source: 'welding',
    workpieceId: 'wp-001',
    weldPointIndex: 19,
    title: '焊接电流超范围',
    description: '第19号焊点焊接时电流低于正常范围下限，可能存在虚焊风险',
    paramName: '电流',
    paramValue: 9780,
    paramMin: 10000,
    paramMax: 14500,
    resolved: true,
    resolvedBy: '刘补焊工',
    resolvedAt: new Date(now.getTime() - 1000 * 60 * 18),
    resolution: '已确认虚焊，完成补焊并复核合格',
    createdBy: '监测系统',
  },
  {
    id: 'al-002',
    time: new Date(now.getTime() - 1000 * 60 * 35),
    severity: 'warning',
    source: 'inspection',
    workpieceId: 'wp-001',
    weldPointIndex: 28,
    title: '超声检测不合格',
    description: '第28号焊点超声波检测发现虚焊缺陷，已自动转入补焊任务队列',
    resolved: true,
    resolvedBy: '刘补焊工',
    resolvedAt: new Date(now.getTime() - 1000 * 60 * 30),
    resolution: '完成手工补焊，检测合格',
    createdBy: '王质检员',
  },
  {
    id: 'al-003',
    time: new Date(now.getTime() - 1000 * 60 * 5),
    severity: 'warning',
    source: 'welding',
    workpieceId: 'wp-002',
    title: '电压瞬时波动',
    description: '焊接过程中检测到电压瞬时异常波动，建议密切关注后续焊点',
    paramName: '电压',
    paramValue: 5.45,
    paramMin: 3.5,
    paramMax: 5.2,
    resolved: false,
    createdBy: '监测系统',
  },
];

export const mockTraceEvents: TraceEvent[] = [
  {
    id: 'te-001',
    phase: 'loading',
    time: new Date(now.getTime() - 1000 * 60 * 60),
    timestamp: new Date(now.getTime() - 1000 * 60 * 60),
    operator: '陈操作员',
    workpieceId: 'wp-001',
    title: '工件上料完成',
    description: '工件 BIW-20240617-001（车身左侧围总成）扫码上料，定位精度合格',
    data: { code: 'BIW-20240617-001', position: { x: 0.02, y: -0.01, z: 0.00 } },
    detail: { code: 'BIW-20240617-001', position: { x: 0.02, y: -0.01, z: 0.00 } },
    status: '完成',
  },
  {
    id: 'te-002',
    phase: 'fixture',
    time: new Date(now.getTime() - 1000 * 60 * 58),
    timestamp: new Date(now.getTime() - 1000 * 60 * 58),
    operator: '陈操作员',
    workpieceId: 'wp-001',
    title: '夹具夹紧确认',
    description: '主焊接夹具A夹紧力8500N，定位精度±0.02mm，所有传感器正常',
    data: { clampForce: 8500, accuracy: 0.02 },
    detail: { clampForce: 8500, accuracy: 0.02 },
    status: '完成',
    duration: 95,
  },
  {
    id: 'te-003',
    phase: 'welding',
    time: new Date(now.getTime() - 1000 * 60 * 56),
    timestamp: new Date(now.getTime() - 1000 * 60 * 56),
    workpieceId: 'wp-001',
    title: '机器人焊接启动',
    description: '调用左侧围标准焊接程序，共48个焊点，设定电流12500A/电压4.2V',
    data: { program: 'prog-001', pointCount: 48, params: { current: 12500, voltage: 4.2, pressure: 350, time: 0.35 } },
    detail: { program: 'prog-001', pointCount: 48, params: { current: 12500, voltage: 4.2, pressure: 350, time: 0.35 } },
    status: '运行',
  },
  {
    id: 'te-004',
    phase: 'welding',
    time: new Date(now.getTime() - 1000 * 60 * 40),
    timestamp: new Date(now.getTime() - 1000 * 60 * 40),
    workpieceId: 'wp-001',
    weldPointIndex: 19,
    title: '⚠ 第19号焊点焊接异常',
    description: '焊接电流超范围，实际9780A低于最小限值10000A，存在焊接缺陷风险',
    data: { expected: { min: 10000, max: 14500 }, actual: 9780, param: 'current' },
    detail: { expected: { min: 10000, max: 14500 }, actual: 9780, param: 'current' },
    abnormal: true,
    status: '异常',
  },
  {
    id: 'te-005',
    phase: 'welding',
    time: new Date(now.getTime() - 1000 * 60 * 32),
    timestamp: new Date(now.getTime() - 1000 * 60 * 32),
    workpieceId: 'wp-001',
    title: '机器人焊接完成',
    description: '完成全部48个焊点焊接，耗时148秒，其中2个焊点标记为待处理',
    data: { totalPoints: 48, defective: 2, weldingTime: 148 },
    detail: { totalPoints: 48, defective: 2, weldingTime: 148 },
    status: '完成',
    duration: 1440,
  },
  {
    id: 'te-006',
    phase: 'inspection',
    time: new Date(now.getTime() - 1000 * 60 * 28),
    timestamp: new Date(now.getTime() - 1000 * 60 * 28),
    operator: '王质检员',
    workpieceId: 'wp-001',
    title: '焊点超声检测',
    description: '完成48个焊点超声检测，46个合格，第19、28号焊点不合格，自动转入补焊队列',
    data: { total: 48, pass: 46, fail: 2, defects: [19, 28] },
    detail: { total: 48, pass: 46, fail: 2, defects: [19, 28] },
    status: '完成',
    duration: 245,
  },
  {
    id: 'te-007',
    phase: 'repair',
    time: new Date(now.getTime() - 1000 * 60 * 22),
    timestamp: new Date(now.getTime() - 1000 * 60 * 22),
    operator: '刘补焊工',
    workpieceId: 'wp-001',
    weldPointIndex: 19,
    title: '第19号焊点补焊',
    description: '因焊接参数异常导致虚焊，采用手工补焊，清理焊渣，完成后二次复核',
    data: { method: 'manual', spatterCleaned: true },
    detail: { method: 'manual', spatterCleaned: true },
    status: '完成',
    duration: 165,
  },
  {
    id: 'te-008',
    phase: 'repair',
    time: new Date(now.getTime() - 1000 * 60 * 18),
    timestamp: new Date(now.getTime() - 1000 * 60 * 18),
    operator: '刘补焊工',
    workpieceId: 'wp-001',
    weldPointIndex: 28,
    title: '第28号焊点补焊',
    description: '超声波检测发现虚焊，补焊后重新检测合格，焊渣飞溅已清理',
    data: { method: 'manual', spatterCleaned: true },
    detail: { method: 'manual', spatterCleaned: true },
    status: '完成',
    duration: 130,
  },
  {
    id: 'te-009',
    phase: 'inspection',
    time: new Date(now.getTime() - 1000 * 60 * 12),
    timestamp: new Date(now.getTime() - 1000 * 60 * 12),
    operator: '王质检员',
    workpieceId: 'wp-001',
    title: '复检合格',
    description: '补焊完成后对19、28号焊点复检超声检测，结果均为合格',
    data: { recheckedPoints: [19, 28], result: 'all_pass' },
    detail: { recheckedPoints: [19, 28], result: 'all_pass' },
    status: '合格',
  },
  {
    id: 'te-010',
    phase: 'maintenance',
    time: new Date(now.getTime() - 1000 * 60 * 6),
    timestamp: new Date(now.getTime() - 1000 * 60 * 6),
    operator: '王工程师',
    workpieceId: 'wp-001',
    title: '焊枪电极修磨',
    description: '批次生产完成，对1号焊枪电极帽进行修磨保养，为下一批次做准备',
    data: { device: '1号焊枪', healthAfter: 92 },
    detail: { device: '1号焊枪', healthAfter: 92 },
    status: '完成',
    duration: 420,
  },
];

export const mockDashboardStats = (() => {
  const defective = mockWeldPoints.filter(p => p.status === 'defective').length;
  const completed = mockWeldPoints.filter(p => p.status === 'completed' || p.status === 'repaired').length;
  return {
    todayOutput: 128,
    targetOutput: 150,
    passRate: 95.8,
    avgCycleTime: 305,
    equipmentHealth: 91,
    runningStatus: 'running' as const,
    currentWorkpiece: mockWorkpieces[2],
    defectivePoints: defective,
    completedPoints: completed,
    totalPoints: 48,
  };
})();
