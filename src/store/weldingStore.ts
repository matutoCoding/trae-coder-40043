import { create } from 'zustand';
import type {
  Workpiece, Fixture, WeldingParams, WeldPoint, RepairRecord,
  CycleData, MaintenanceRecord, ProcessModule, WeldingProgram,
  WeldingHistoryPoint, AlarmRecord, TraceEvent, WeldingParamRanges,
  DefectType,
} from '@/types';
import {
  mockWorkpieces, mockFixture, mockWeldPoints, mockRepairRecords,
  mockCycleDataList, mockMaintenanceRecords, mockWeldingPrograms,
  generateWeldingHistory, mockAlarmRecords, mockTraceEvents,
  mockCycleStats, mockDashboardStats,
} from '@/data/mockData';

type WeldingState = {
  currentModule: ProcessModule;
  setCurrentModule: (module: ProcessModule) => void;

  workpieces: Workpiece[];
  currentWorkpiece: Workpiece | null;
  setCurrentWorkpiece: (wp: Workpiece) => void;
  addWorkpiece: (wp: Workpiece) => void;
  updateWorkpieceStatus: (id: string, status: Workpiece['status']) => void;

  fixture: Fixture;
  setFixtureStatus: (status: Fixture['status']) => void;
  updateFixtureSensor: (sensorId: string, value: number) => void;

  selectedProgram: WeldingProgram | null;
  setSelectedProgram: (program: WeldingProgram | null) => void;
  weldingPrograms: WeldingProgram[];
  saveProgramParams: (programId: string, params: Partial<WeldingParams>) => void;
  createNewProgram: (name: string, description: string, params: WeldingParams, ranges: WeldingParamRanges) => void;

  weldingParams: WeldingParams;
  setWeldingParams: (params: Partial<WeldingParams>) => void;
  isWelding: boolean;
  setIsWelding: (val: boolean) => void;
  weldingHistory: WeldingHistoryPoint[];
  addWeldingHistoryPoint: (point: WeldingHistoryPoint) => void;

  weldPoints: WeldPoint[];
  updateWeldPoint: (id: string, updates: Partial<WeldPoint>) => void;

  repairRecords: RepairRecord[];
  submitRepair: (record: Partial<Omit<RepairRecord, 'id' | 'repairTime'>> & Pick<RepairRecord, 'weldPointId' | 'operator' | 'description' | 'spatterCleaned'>) => void;

  markInspectionFail: (weldPointId: string, defectType: DefectType, inspector: string) => void;
  markInspectionPass: (weldPointId: string, inspector: string) => void;

  cycleDataList: CycleData[];
  currentCycle: CycleData | null;
  startNewCycle: (workpieceId: string, workpieceCode: string) => void;
  endCurrentCycle: () => void;
  updateCyclePhase: (phase: keyof Pick<CycleData, 'loadingTime' | 'fixtureTime' | 'weldingTime' | 'inspectionTime' | 'repairTime'>, value: number) => void;
  cycleStats: typeof mockCycleStats;

  maintenanceRecords: MaintenanceRecord[];
  addMaintenanceRecord: (record: Omit<MaintenanceRecord, 'id' | 'time'>) => void;

  alarmRecords: AlarmRecord[];
  addAlarm: (alarm: Omit<AlarmRecord, 'id' | 'time' | 'resolved'>) => void;
  resolveAlarm: (alarmId: string, resolvedBy: string, resolution: string) => void;

  traceEvents: TraceEvent[];
  addTraceEvent: (event: Omit<TraceEvent, 'id' | 'time'>) => void;
  getTraceByWorkpiece: (workpieceId: string) => TraceEvent[];

  dashboardStats: typeof mockDashboardStats;
  recomputeDashboardStats: () => void;
};

export const useWeldingStore = create<WeldingState>((set, get) => ({
  currentModule: 'loading',
  setCurrentModule: (module) => set({ currentModule: module }),

  workpieces: mockWorkpieces,
  currentWorkpiece: mockWorkpieces[1],
  setCurrentWorkpiece: (wp) => set({ currentWorkpiece: wp }),
  addWorkpiece: (wp) => set((state) => ({ workpieces: [...state.workpieces, wp] })),
  updateWorkpieceStatus: (id, status) => set((state) => ({
    workpieces: state.workpieces.map((w) => w.id === id ? { ...w, status } : w),
    currentWorkpiece: state.currentWorkpiece?.id === id ? { ...state.currentWorkpiece, status } : state.currentWorkpiece,
  })),

  fixture: mockFixture,
  setFixtureStatus: (status) => set((state) => {
    const wp = state.currentWorkpiece;
    if (status === 'clamped' && wp) {
      get().addTraceEvent({
        phase: 'fixture',
        operator: state.fixture.operator || '操作员',
        workpieceId: wp.id,
        title: '夹具夹紧确认',
        description: `${state.fixture.name}夹紧力${state.fixture.clampForce}N，定位精度±${state.fixture.positionAccuracy}mm`,
        data: { clampForce: state.fixture.clampForce, accuracy: state.fixture.positionAccuracy },
      });
    }
    return { fixture: { ...state.fixture, status, clampTime: status === 'clamped' ? new Date() : state.fixture.clampTime } };
  }),
  updateFixtureSensor: (sensorId, value) => set((state) => ({
    fixture: {
      ...state.fixture,
      sensors: state.fixture.sensors.map((s) => s.id === sensorId ? { ...s, value } : s),
    },
  })),

  selectedProgram: null,
  setSelectedProgram: (program) => set({
    selectedProgram: program,
    weldingParams: program?.defaultParams || get().weldingParams,
  }),
  weldingPrograms: mockWeldingPrograms,
  saveProgramParams: (programId, params) => set((state) => {
    const programs = state.weldingPrograms.map((p) => {
      if (p.id !== programId) return p;
      return {
        ...p,
        defaultParams: { ...p.defaultParams, ...params },
        savedAt: new Date(),
      };
    });
    const selected = state.selectedProgram?.id === programId
      ? programs.find(p => p.id === programId) || null
      : state.selectedProgram;
    return { weldingPrograms: programs, selectedProgram: selected };
  }),
  createNewProgram: (name, description, params, ranges) => set((state) => {
    const newProg: WeldingProgram = {
      id: `prog-${Date.now()}`,
      name,
      description,
      defaultParams: { ...params, programId: `prog-${Date.now()}`, programName: name },
      pointCount: params.pointCount || 48,
      paramRanges: ranges,
      savedAt: new Date(),
    } as any;
    return { weldingPrograms: [...state.weldingPrograms, newProg] };
  }),

  weldingParams: mockWeldingPrograms[0].defaultParams,
  setWeldingParams: (params) => set((state) => ({ weldingParams: { ...state.weldingParams, ...params } })),
  isWelding: false,
  setIsWelding: (val) => set({ isWelding: val }),
  weldingHistory: generateWeldingHistory(mockWeldingPrograms[0].paramRanges),
  addWeldingHistoryPoint: (point) => {
    const state = get();
    const prog = state.selectedProgram;
    const ranges = prog?.paramRanges || mockWeldingPrograms[0].paramRanges;
    let abnormalParam: 'current' | 'voltage' | null = null;
    if (point.current < ranges.current.min || point.current > ranges.current.max) abnormalParam = 'current';
    if (point.voltage < ranges.voltage.min || point.voltage > ranges.voltage.max) abnormalParam = 'voltage';

    if (abnormalParam && state.currentWorkpiece && state.isWelding) {
      const idx = state.weldPoints.findIndex(p => p.status === 'welding');
      const wp = idx >= 0 ? state.weldPoints[idx] : null;
      const minV = abnormalParam === 'current' ? ranges.current.min : ranges.voltage.min;
      const maxV = abnormalParam === 'current' ? ranges.current.max : ranges.voltage.max;
      const actualV = abnormalParam === 'current' ? point.current : point.voltage;
      const paramLabel = abnormalParam === 'current' ? '电流' : '电压';

      if (wp) {
        const existingAlarm = state.alarmRecords.find(a =>
          a.weldPointIndex === wp.index &&
          a.workpieceId === state.currentWorkpiece!.id &&
          a.paramName === paramLabel &&
          !a.resolved
        );
        if (!existingAlarm) {
          get().addAlarm({
            severity: actualV < minV ? 'error' : 'warning',
            source: 'welding',
            workpieceId: state.currentWorkpiece.id,
            weldPointIndex: wp.index,
            title: `焊接${paramLabel}超范围`,
            description: `第${wp.index}号焊点焊接时${paramLabel}${actualV < minV ? '低于' : '高于'}正常范围${actualV < minV ? '下限' : '上限'}`,
            paramName: paramLabel,
            paramValue: actualV,
            paramMin: minV,
            paramMax: maxV,
          });
          get().updateWeldPoint(wp.id, {
            status: 'defective',
            defectType: 'param_abnormal',
            ultrasonicResult: 'fail',
            paramAbnormal: { param: abnormalParam!, value: actualV, expectedMin: minV, expectedMax: maxV, min: minV, max: maxV },
          });
          get().recomputeDashboardStats();
        }
      }
    }
    set({ weldingHistory: [...state.weldingHistory.slice(-59), point] });
  },

  weldPoints: mockWeldPoints,
  updateWeldPoint: (id, updates) => set((state) => ({
    weldPoints: state.weldPoints.map((p) => p.id === id ? { ...p, ...updates } : p),
  })),

  repairRecords: mockRepairRecords,
  submitRepair: (recordInput) => {
    const state = get();
    const targetPoint = state.weldPoints.find(p => p.id === recordInput.weldPointId);
    if (!targetPoint || !state.currentWorkpiece) return;
    const workpieceId = recordInput.workpieceId || state.currentWorkpiece.id;
    const weldPointIndex = recordInput.weldPointIndex ?? targetPoint.index;
    const record: RepairRecord = {
      workpieceId,
      weldPointIndex,
      weldPointId: recordInput.weldPointId,
      operator: recordInput.operator,
      description: recordInput.description,
      spatterCleaned: recordInput.spatterCleaned,
      repairMethod: recordInput.repairMethod,
      id: `rr-${Date.now()}`,
      repairTime: new Date(),
    };
    get().updateWeldPoint(record.weldPointId, {
      status: 'repaired',
      ultrasonicResult: 'pass',
      defectType: 'none',
      paramAbnormal: undefined,
    });
    get().addTraceEvent({
      phase: 'repair',
      operator: record.operator,
      workpieceId: record.workpieceId,
      weldPointIndex: record.weldPointIndex,
      title: `第${record.weldPointIndex}号焊点补焊完成`,
      description: record.description,
      data: { spatterCleaned: record.spatterCleaned, repairMethod: record.repairMethod },
    });
    get().addTraceEvent({
      phase: 'inspection',
      operator: '系统自动',
      workpieceId: record.workpieceId,
      weldPointIndex: record.weldPointIndex,
      title: `第${record.weldPointIndex}号焊点复检合格`,
      description: '补焊完成后系统同步更新检测结果为合格',
      data: { result: 'pass' },
    });
    const relatedAlarms = state.alarmRecords.filter(a =>
      a.weldPointIndex === record.weldPointIndex &&
      a.workpieceId === record.workpieceId &&
      !a.resolved
    );
    relatedAlarms.forEach(a => get().resolveAlarm(a.id, record.operator, `补焊完成，复检合格: ${record.description}`));
    get().recomputeDashboardStats();
    set({ repairRecords: [...state.repairRecords, record] });
  },

  markInspectionFail: (weldPointId, defectType, inspector) => {
    const state = get();
    const wp = state.weldPoints.find(p => p.id === weldPointId);
    const workpiece = state.currentWorkpiece;
    if (!wp || !workpiece) return;
    get().updateWeldPoint(weldPointId, {
      status: 'defective',
      defectType,
      ultrasonicResult: 'fail',
      inspector,
      inspectionTime: new Date(),
    });
    get().addAlarm({
      severity: 'warning',
      source: 'inspection',
      workpieceId: workpiece.id,
      weldPointIndex: wp.index,
      title: '超声检测不合格',
      description: `第${wp.index}号焊点超声波检测发现${defectType === 'cold' ? '虚焊' : defectType === 'missing' ? '漏焊' : '焊渣飞溅'}，已自动转入补焊任务队列`,
    });
    get().addTraceEvent({
      phase: 'inspection',
      operator: inspector,
      workpieceId: workpiece.id,
      weldPointIndex: wp.index,
      title: `第${wp.index}号焊点检测不合格`,
      description: `检测结果：${defectType === 'cold' ? '虚焊' : defectType === 'missing' ? '漏焊' : '焊渣飞溅'}，已进入补焊队列`,
      data: { defectType, result: 'fail' },
    });
    get().recomputeDashboardStats();
  },

  markInspectionPass: (weldPointId, inspector) => {
    const state = get();
    const wp = state.weldPoints.find(p => p.id === weldPointId);
    const workpiece = state.currentWorkpiece;
    if (!wp || !workpiece) return;
    get().updateWeldPoint(weldPointId, {
      status: wp.status === 'defective' ? 'repaired' : 'completed',
      ultrasonicResult: 'pass',
      defectType: 'none',
      paramAbnormal: undefined,
      inspector,
      inspectionTime: new Date(),
    });
    get().addTraceEvent({
      phase: 'inspection',
      operator: inspector,
      workpieceId: workpiece.id,
      weldPointIndex: wp.index,
      title: `第${wp.index}号焊点检测合格`,
      description: '超声波检测通过',
      data: { result: 'pass' },
    });
    get().recomputeDashboardStats();
  },

  cycleDataList: mockCycleDataList,
  currentCycle: mockCycleDataList.find((c) => c.status === 'running') || null,
  startNewCycle: (workpieceId, workpieceCode) => {
    const newCycle: CycleData = {
      id: `cd-${Date.now()}`,
      workpieceId,
      workpieceCode,
      startTime: new Date(),
      targetDuration: 300,
      loadingTime: 0,
      fixtureTime: 0,
      weldingTime: 0,
      inspectionTime: 0,
      repairTime: 0,
      status: 'running',
    };
    set((state) => ({
      cycleDataList: [...state.cycleDataList, newCycle],
      currentCycle: newCycle,
    }));
  },
  endCurrentCycle: () => set((state) => {
    if (!state.currentCycle) return state;
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - state.currentCycle.startTime.getTime()) / 1000);
    const updatedCycle = { ...state.currentCycle, endTime, duration, status: 'completed' as const };
    return {
      cycleDataList: state.cycleDataList.map((c) => c.id === updatedCycle.id ? updatedCycle : c),
      currentCycle: null,
    };
  }),
  updateCyclePhase: (phase, value) => set((state) => {
    if (!state.currentCycle) return state;
    const updated = { ...state.currentCycle, [phase]: value };
    return {
      cycleDataList: state.cycleDataList.map((c) => c.id === updated.id ? updated : c),
      currentCycle: updated,
    };
  }),
  cycleStats: mockCycleStats,

  maintenanceRecords: mockMaintenanceRecords,
  addMaintenanceRecord: (recordInput) => {
    const record: MaintenanceRecord = {
      ...recordInput,
      id: `mr-${Date.now()}`,
      time: new Date(),
    };
    if (record.relatedWorkpieceId) {
      get().addTraceEvent({
        phase: 'maintenance',
        operator: record.operator,
        workpieceId: record.relatedWorkpieceId,
        title: `设备维护：${record.deviceName}`,
        description: record.description,
        data: { equipmentHealth: record.equipmentHealth, type: record.type },
      });
    }
    set((state) => ({ maintenanceRecords: [...state.maintenanceRecords, record] }));
  },

  alarmRecords: mockAlarmRecords,
  addAlarm: (alarmInput) => {
    const alarm: AlarmRecord = {
      ...alarmInput,
      id: `al-${Date.now()}`,
      time: new Date(),
      resolved: false,
      createdBy: alarmInput.createdBy || '系统自动',
    };
    set((state) => ({ alarmRecords: [alarm, ...state.alarmRecords] }));
  },
  resolveAlarm: (alarmId, resolvedBy, resolution) => set((state) => ({
    alarmRecords: state.alarmRecords.map((a) =>
      a.id === alarmId ? { ...a, resolved: true, resolvedBy, resolvedAt: new Date(), resolution } : a
    ),
  })),

  traceEvents: mockTraceEvents,
  addTraceEvent: (eventInput) => {
    const now = new Date();
    const event: TraceEvent = {
      ...eventInput,
      id: `te-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      time: now,
      timestamp: now,
      detail: eventInput.detail || eventInput.data,
    };
    set((state) => ({ traceEvents: [...state.traceEvents, event] }));
  },
  getTraceByWorkpiece: (workpieceId) =>
    get().traceEvents
      .filter((e) => e.workpieceId === workpieceId)
      .sort((a, b) => a.time.getTime() - b.time.getTime()),

  dashboardStats: mockDashboardStats,
  recomputeDashboardStats: () => set((state) => {
    const defective = state.weldPoints.filter(p => p.status === 'defective').length;
    const completed = state.weldPoints.filter(p => p.status === 'completed' || p.status === 'repaired').length;
    const inspected = state.weldPoints.filter(p => p.ultrasonicResult !== undefined);
    const passed = inspected.filter(p => p.ultrasonicResult === 'pass');
    const passRate = inspected.length > 0
      ? Number(((passed.length / inspected.length) * 100).toFixed(1))
      : state.dashboardStats.passRate;
    return {
      dashboardStats: {
        ...state.dashboardStats,
        defectivePoints: defective,
        completedPoints: completed,
        passRate,
      },
    };
  }),
}));
