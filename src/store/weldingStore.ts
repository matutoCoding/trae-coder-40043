import { create } from 'zustand';
import type {
  Workpiece, Fixture, WeldingParams, WeldPoint, RepairRecord,
  CycleData, MaintenanceRecord, ProcessModule, WeldingProgram,
  WeldingHistoryPoint, AlarmRecord, TraceEvent, WeldingParamRanges,
  DefectType, DisposalRecord, AlarmStatus, RepairReason, RepairMethod,
  ReinspectionResult, WorkpieceComparison, DashboardDisposalStats,
  ProcessPhase, QualityBoardStats,
} from '@/types';
import {
  mockWorkpieces, mockFixture, mockWeldPoints, mockRepairRecords,
  mockCycleDataList, mockMaintenanceRecords, mockWeldingPrograms,
  generateWeldingHistory, mockAlarmRecords, mockTraceEvents,
  mockCycleStats, mockDashboardStats, mockDisposalRecords,
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
  advanceWeldingProgress: () => string | null;

  weldPoints: WeldPoint[];
  updateWeldPoint: (id: string, updates: Partial<WeldPoint>) => void;
  getWeldPointsByWorkpiece: (workpieceId: string) => WeldPoint[];

  repairRecords: RepairRecord[];
  submitRepair: (record: Partial<Omit<RepairRecord, 'id' | 'repairTime'>> &
    Pick<RepairRecord, 'weldPointId' | 'operator' | 'description' | 'spatterCleaned'> & {
      repairReason?: RepairReason;
      repairMethod?: RepairMethod;
      reinspectionResult: ReinspectionResult;
      reinspectionOperator?: string;
      reinspectionNote?: string;
    }) => void;
  getRepairsByWorkpiece: (workpieceId: string) => RepairRecord[];

  markInspectionFail: (weldPointId: string, defectType: DefectType, inspector: string) => void;
  markInspectionPass: (weldPointId: string, inspector: string) => void;

  cycleDataList: CycleData[];
  currentCycle: CycleData | null;
  startNewCycle: (workpieceId: string, workpieceCode: string) => void;
  endCurrentCycle: () => void;
  updateCyclePhase: (phase: keyof Pick<CycleData, 'loadingTime' | 'fixtureTime' | 'weldingTime' | 'inspectionTime' | 'repairTime'>, value: number) => void;
  cycleStats: typeof mockCycleStats;
  getCyclesByWorkpiece: (workpieceId: string) => CycleData[];

  maintenanceRecords: MaintenanceRecord[];
  addMaintenanceRecord: (record: Omit<MaintenanceRecord, 'id' | 'time'>) => void;
  getMaintenanceByWorkpiece: (workpieceId: string) => MaintenanceRecord[];

  alarmRecords: AlarmRecord[];
  addAlarm: (alarm: Omit<AlarmRecord, 'id' | 'time' | 'resolved' | 'status'>) => void;
  resolveAlarm: (alarmId: string, resolvedBy: string, resolution: string) => void;
  assignAlarm: (alarmId: string, assignedTo: string) => void;
  getAlarmsByWorkpiece: (workpieceId: string) => AlarmRecord[];
  updateAlarmStatus: (alarmId: string, status: AlarmStatus, extra?: Partial<AlarmRecord>) => void;

  disposalRecords: DisposalRecord[];
  addDisposalRecord: (record: Omit<DisposalRecord, 'id' | 'timestamp'>) => DisposalRecord;
  getDisposalsByAlarm: (alarmId: string) => DisposalRecord[];
  getDisposalsByWorkpiece: (workpieceId: string) => DisposalRecord[];
  disposalStats: DashboardDisposalStats;
  recomputeDisposalStats: () => void;

  traceEvents: TraceEvent[];
  addTraceEvent: (event: Omit<TraceEvent, 'id' | 'time'>) => void;
  getTraceByWorkpiece: (workpieceId: string) => TraceEvent[];

  computeWorkpieceComparison: (workpieceIdA: string, workpieceIdB: string) => WorkpieceComparison | null;

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
          const alarmId = `al-${Date.now()}`;
          const now = new Date();
          const newAlarm: AlarmRecord = {
            id: alarmId,
            time: now,
            severity: actualV < minV ? 'high' : 'warning',
            source: 'welding',
            workpieceId: state.currentWorkpiece.id,
            weldPointIndex: wp.index,
            title: `焊接${paramLabel}超范围`,
            description: `第${wp.index}号焊点焊接时${paramLabel}${actualV < minV ? '低于' : '高于'}正常范围${actualV < minV ? '下限' : '上限'}`,
            paramName: paramLabel,
            paramValue: actualV,
            paramMin: minV,
            paramMax: maxV,
            status: 'pending',
            resolved: false,
            createdBy: '系统自动',
            disposalRecordIds: [],
          };
          const disposal: DisposalRecord = {
            id: `dr-${Date.now()}-r`,
            alarmId,
            workpieceId: state.currentWorkpiece.id,
            weldPointIndex: wp.index,
            phase: 'report',
            operator: '系统自动',
            timestamp: now,
            status: 'pending',
            note: `焊接${paramLabel}异常，值=${actualV}`,
          };
          get().updateWeldPoint(wp.id, {
            status: 'defective',
            defectType: 'param_abnormal',
            ultrasonicResult: 'fail',
            paramAbnormal: { param: abnormalParam!, value: actualV, expectedMin: minV, expectedMax: maxV, min: minV, max: maxV },
          });
          get().addTraceEvent({
            phase: 'quality',
            workpieceId: state.currentWorkpiece.id,
            weldPointIndex: wp.index,
            title: `⚠ 第${wp.index}号焊点${paramLabel}异常`,
            description: newAlarm.description,
            abnormal: true,
            data: { param: abnormalParam, value: actualV, min: minV, max: maxV, alarmId },
            relatedAlarmId: alarmId,
            relatedDisposalIds: [disposal.id],
            status: '待处理',
          });
          set((s) => ({
            alarmRecords: [{ ...newAlarm, disposalRecordIds: [disposal.id] }, ...s.alarmRecords],
            disposalRecords: [disposal, ...s.disposalRecords],
          }));
          get().recomputeDashboardStats();
          get().recomputeDisposalStats();
        }
      }
    }
    set({ weldingHistory: [...state.weldingHistory.slice(-59), point] });
  },
  advanceWeldingProgress: () => {
    let nextId: string | null = null;
    set((s) => {
      const currentIdx = s.weldPoints.findIndex(p => p.status === 'welding');
      const updatedPoints = s.weldPoints.map((p) => ({ ...p }));
      if (currentIdx >= 0) {
        const cp = updatedPoints[currentIdx];
        if (cp.status !== 'defective') {
          cp.status = 'completed';
          cp.weldingEndTime = new Date();
          cp.ultrasonicResult = cp.ultrasonicResult || (Math.random() > 0.08 ? 'pass' : undefined);
          if (!cp.defectType) cp.defectType = 'none';
        }
      }
      const startSearch = currentIdx >= 0 ? currentIdx + 1 : 0;
      for (let i = startSearch; i < updatedPoints.length; i++) {
        if (updatedPoints[i].status === 'pending') {
          updatedPoints[i].status = 'welding';
          updatedPoints[i].weldingStartTime = new Date();
          nextId = updatedPoints[i].id;
          break;
        }
      }
      return { weldPoints: updatedPoints };
    });
    return nextId;
  },

  weldPoints: mockWeldPoints,
  updateWeldPoint: (id, updates) => set((state) => ({
    weldPoints: state.weldPoints.map((p) => p.id === id ? { ...p, ...updates } : p),
  })),
  getWeldPointsByWorkpiece: (workpieceId) =>
    get().weldPoints,

  repairRecords: mockRepairRecords,
  submitRepair: (recordInput) => {
    const state = get();
    const targetPoint = state.weldPoints.find(p => p.id === recordInput.weldPointId);
    if (!targetPoint || !state.currentWorkpiece) return;
    const workpieceId = recordInput.workpieceId || state.currentWorkpiece.id;
    const weldPointIndex = recordInput.weldPointIndex ?? targetPoint.index;
    const now = new Date();
    const record: RepairRecord = {
      workpieceId,
      weldPointIndex,
      weldPointId: recordInput.weldPointId,
      operator: recordInput.operator,
      description: recordInput.description,
      spatterCleaned: recordInput.spatterCleaned,
      repairMethod: recordInput.repairMethod,
      repairReason: recordInput.repairReason,
      reinspectionResult: recordInput.reinspectionResult,
      reinspectionOperator: recordInput.reinspectionOperator,
      reinspectionTime: recordInput.reinspectionResult !== 'pending' ? now : undefined,
      reinspectionNote: recordInput.reinspectionNote,
      id: `rr-${Date.now()}`,
      repairTime: now,
    };

    const relatedAlarms = state.alarmRecords.filter(a =>
      a.weldPointIndex === record.weldPointIndex &&
      a.workpieceId === record.workpieceId &&
      !a.resolved
    );

    relatedAlarms.forEach(alarm => {
      get().addDisposalRecord({
        alarmId: alarm.id,
        workpieceId: record.workpieceId,
        weldPointIndex: record.weldPointIndex,
        phase: 'repair',
        operator: record.operator,
        status: 'processing',
        repairReason: record.repairReason,
        repairMethod: record.repairMethod,
        note: `补焊操作：${record.description}${record.spatterCleaned ? '；焊渣已清理' : ''}`,
        relatedRecordId: record.id,
      });
    });

    const isPass = recordInput.reinspectionResult === 'pass';
    if (isPass) {
      get().updateWeldPoint(record.weldPointId, {
        status: 'repaired',
        ultrasonicResult: 'pass',
        defectType: 'none',
        paramAbnormal: undefined,
        inspector: recordInput.reinspectionOperator,
        inspectionTime: now,
      });
      relatedAlarms.forEach(alarm => {
        const disp = get().addDisposalRecord({
          alarmId: alarm.id,
          workpieceId: record.workpieceId,
          weldPointIndex: record.weldPointIndex,
          phase: 'reinspect',
          operator: recordInput.reinspectionOperator || record.operator,
          status: 'closed',
          reinspectionResult: 'pass',
          note: recordInput.reinspectionNote || '复检合格',
          relatedRecordId: record.id,
        });
        get().addDisposalRecord({
          alarmId: alarm.id,
          workpieceId: record.workpieceId,
          weldPointIndex: record.weldPointIndex,
          phase: 'close',
          operator: recordInput.reinspectionOperator || record.operator,
          status: 'closed',
          reinspectionResult: 'pass',
          note: `处置闭环：补焊+复检均合格`,
          relatedRecordId: disp.id,
        });
        get().resolveAlarm(alarm.id, record.operator, `补焊完成，复检合格: ${record.description}；复检结论：${recordInput.reinspectionNote || '合格'}`);
      });
    } else {
      get().updateWeldPoint(record.weldPointId, {
        status: 'defective',
        ultrasonicResult: 'fail',
      });
      relatedAlarms.forEach(alarm => {
        get().addDisposalRecord({
          alarmId: alarm.id,
          workpieceId: record.workpieceId,
          weldPointIndex: record.weldPointIndex,
          phase: 'reinspect',
          operator: recordInput.reinspectionOperator || record.operator,
          status: 'processing',
          reinspectionResult: recordInput.reinspectionResult,
          note: recordInput.reinspectionNote || (recordInput.reinspectionResult === 'fail' ? '复检不合格，需二次补焊' : '待复检'),
          relatedRecordId: record.id,
        });
        get().assignAlarm(alarm.id, record.operator);
      });
    }

    get().addTraceEvent({
      phase: 'repair',
      operator: record.operator,
      workpieceId: record.workpieceId,
      weldPointIndex: record.weldPointIndex,
      title: `第${record.weldPointIndex}号焊点补焊完成`,
      description: `${record.description}；原因=${record.repairReason || '未指定'}；方式=${record.repairMethod || '未指定'}`,
      data: {
        spatterCleaned: record.spatterCleaned,
        repairMethod: record.repairMethod,
        repairReason: record.repairReason,
        reinspectionResult: record.reinspectionResult,
      },
      relatedDisposalIds: relatedAlarms.flatMap(a => a.disposalRecordIds || []),
      status: isPass ? '合格' : '待复检',
    });
    get().addTraceEvent({
      phase: 'inspection',
      operator: recordInput.reinspectionOperator || '系统自动',
      workpieceId: record.workpieceId,
      weldPointIndex: record.weldPointIndex,
      title: `第${record.weldPointIndex}号焊点复检：${isPass ? '合格' : (recordInput.reinspectionResult === 'fail' ? '不合格' : '进行中')}`,
      description: `补焊完成后${isPass ? '复检通过，焊点质量闭环' : (recordInput.reinspectionResult === 'fail' ? '复检不通过，仍在补焊队列' : '待完成复检')}`,
      data: { result: recordInput.reinspectionResult, note: recordInput.reinspectionNote },
      status: isPass ? '合格' : (recordInput.reinspectionResult === 'fail' ? '不合格' : '进行中'),
    });

    get().recomputeDashboardStats();
    get().recomputeDisposalStats();
    set((s) => ({ repairRecords: [...s.repairRecords, record] }));
  },
  getRepairsByWorkpiece: (workpieceId) =>
    get().repairRecords.filter(r => r.workpieceId === workpieceId),

  markInspectionFail: (weldPointId, defectType, inspector) => {
    const state = get();
    const wp = state.weldPoints.find(p => p.id === weldPointId);
    const workpiece = state.currentWorkpiece;
    if (!wp || !workpiece) return;
    const now = new Date();
    const alarmId = `al-${Date.now()}`;
    const d1: DisposalRecord = {
      id: `dr-${Date.now()}-insp-r`,
      alarmId,
      workpieceId: workpiece.id,
      weldPointIndex: wp.index,
      phase: 'report',
      operator: inspector,
      timestamp: now,
      status: 'pending',
      repairReason: defectType === 'cold' ? 'cold_weld' : defectType === 'missing' ? 'missing_weld' : defectType === 'spatter' ? 'spatter' : 'other',
      note: `质检检出缺陷类型=${defectType}`,
    };
    const d2: DisposalRecord = {
      id: `dr-${Date.now() + 1}-insp-a`,
      alarmId,
      workpieceId: workpiece.id,
      weldPointIndex: wp.index,
      phase: 'assign',
      operator: inspector,
      timestamp: now,
      status: 'processing',
      note: `分派至补焊工进行人工补焊`,
    };
    const newAlarm: AlarmRecord = {
      id: alarmId,
      time: now,
      severity: 'warning',
      source: 'inspection',
      workpieceId: workpiece.id,
      weldPointIndex: wp.index,
      title: '超声检测不合格',
      description: `第${wp.index}号焊点超声波检测发现${defectType === 'cold' ? '虚焊' : defectType === 'missing' ? '漏焊' : defectType === 'spatter' ? '焊渣飞溅' : '参数异常'}，已自动转入补焊任务队列`,
      status: 'processing',
      resolved: false,
      createdBy: inspector,
      assignedTo: '刘补焊工',
      assignedAt: now,
      disposalRecordIds: [d1.id, d2.id],
    };

    get().updateWeldPoint(weldPointId, {
      status: 'defective',
      defectType,
      ultrasonicResult: 'fail',
      inspector,
      inspectionTime: now,
    });
    get().addTraceEvent({
      phase: 'inspection',
      operator: inspector,
      workpieceId: workpiece.id,
      weldPointIndex: wp.index,
      title: `第${wp.index}号焊点检测不合格`,
      description: `检测结果：${defectType === 'cold' ? '虚焊' : defectType === 'missing' ? '漏焊' : defectType === 'spatter' ? '焊渣飞溅' : '参数异常'}，已分派补焊工`,
      data: { defectType, result: 'fail', alarmId },
      abnormal: true,
      relatedAlarmId: alarmId,
      relatedDisposalIds: [d1.id, d2.id],
      status: '待补焊',
    });
    set((s) => ({
      alarmRecords: [newAlarm, ...s.alarmRecords],
      disposalRecords: [d2, d1, ...s.disposalRecords],
    }));
    get().recomputeDashboardStats();
    get().recomputeDisposalStats();
  },

  markInspectionPass: (weldPointId, inspector) => {
    const state = get();
    const wp = state.weldPoints.find(p => p.id === weldPointId);
    const workpiece = state.currentWorkpiece;
    if (!wp || !workpiece) return;
    const now = new Date();
    get().updateWeldPoint(weldPointId, {
      status: wp.status === 'defective' ? 'repaired' : 'completed',
      ultrasonicResult: 'pass',
      defectType: 'none',
      paramAbnormal: undefined,
      inspector,
      inspectionTime: now,
    });
    const relatedAlarms = state.alarmRecords.filter(a =>
      a.weldPointIndex === wp.index &&
      a.workpieceId === workpiece.id &&
      !a.resolved
    );
    relatedAlarms.forEach(a => {
      const disp = get().addDisposalRecord({
        alarmId: a.id,
        workpieceId: workpiece.id,
        weldPointIndex: wp.index,
        phase: 'close',
        operator: inspector,
        status: 'closed',
        reinspectionResult: 'pass',
        note: `质检员直接标记合格，关闭告警`,
      });
      get().resolveAlarm(a.id, inspector, `质检直接标记合格：${disp.note || ''}`);
    });
    get().addTraceEvent({
      phase: 'inspection',
      operator: inspector,
      workpieceId: workpiece.id,
      weldPointIndex: wp.index,
      title: `第${wp.index}号焊点检测合格`,
      description: '超声波检测通过',
      data: { result: 'pass', closedAlarms: relatedAlarms.length },
      relatedDisposalIds: relatedAlarms.flatMap(a => a.disposalRecordIds || []),
      status: '合格',
    });
    get().recomputeDashboardStats();
    get().recomputeDisposalStats();
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
  getCyclesByWorkpiece: (workpieceId) =>
    get().cycleDataList.filter(c => c.workpieceId === workpieceId),

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
  getMaintenanceByWorkpiece: (workpieceId) =>
    get().maintenanceRecords.filter(m => m.relatedWorkpieceId === workpieceId),

  alarmRecords: mockAlarmRecords,
  addAlarm: (alarmInput) => {
    const now = new Date();
    const disposal: DisposalRecord = {
      id: `dr-${Date.now()}-auto`,
      alarmId: `al-${Date.now() + 1}`,
      workpieceId: alarmInput.workpieceId!,
      weldPointIndex: alarmInput.weldPointIndex,
      phase: 'report',
      operator: alarmInput.createdBy || '系统自动',
      timestamp: now,
      status: 'pending',
      note: alarmInput.description,
    };
    const alarm: AlarmRecord = {
      ...alarmInput,
      id: `al-${Date.now() + 1}`,
      time: now,
      status: 'pending',
      resolved: false,
      createdBy: alarmInput.createdBy || '系统自动',
      disposalRecordIds: [disposal.id],
    };
    disposal.alarmId = alarm.id;
    set((state) => ({
      alarmRecords: [alarm, ...state.alarmRecords],
      disposalRecords: [disposal, ...state.disposalRecords],
    }));
    get().recomputeDisposalStats();
  },
  resolveAlarm: (alarmId, resolvedBy, resolution) => set((state) => {
    const now = new Date();
    const updated = state.alarmRecords.map((a) =>
      a.id === alarmId ? { ...a, resolved: true, resolvedBy, resolvedAt: now, resolution, status: 'closed' as AlarmStatus } : a
    );
    return { alarmRecords: updated };
  }),
  assignAlarm: (alarmId, assignedTo) => {
    const state = get();
    const alarm = state.alarmRecords.find(a => a.id === alarmId);
    if (!alarm) return;
    const now = new Date();
    get().addDisposalRecord({
      alarmId,
      workpieceId: alarm.workpieceId!,
      weldPointIndex: alarm.weldPointIndex,
      phase: 'assign',
      operator: '调度系统',
      status: 'processing',
      note: `分派处置人：${assignedTo}`,
    });
    get().updateAlarmStatus(alarmId, 'processing', { assignedTo, assignedAt: now });
  },
  getAlarmsByWorkpiece: (workpieceId) =>
    get().alarmRecords.filter(a => a.workpieceId === workpieceId),
  updateAlarmStatus: (alarmId, status, extra) => set((state) => ({
    alarmRecords: state.alarmRecords.map((a) =>
      a.id === alarmId ? { ...a, status, ...(extra || {}) } : a
    ),
  })),

  disposalRecords: mockDisposalRecords,
  addDisposalRecord: (recordInput) => {
    const now = new Date();
    const record: DisposalRecord = {
      ...recordInput,
      id: `dr-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: now,
    };
    set((state) => ({
      disposalRecords: [record, ...state.disposalRecords],
      alarmRecords: state.alarmRecords.map(a =>
        a.id === record.alarmId
          ? { ...a, disposalRecordIds: [...(a.disposalRecordIds || []), record.id], status: (a.resolved ? 'closed' : record.status) as AlarmStatus }
          : a
      ),
    }));
    get().recomputeDisposalStats();
    return record;
  },
  getDisposalsByAlarm: (alarmId) =>
    get().disposalRecords
      .filter(d => d.alarmId === alarmId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
  getDisposalsByWorkpiece: (workpieceId) =>
    get().disposalRecords
      .filter(d => d.workpieceId === workpieceId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
  disposalStats: {
    pending: mockAlarmRecords.filter(a => a.status === 'pending').length,
    processing: mockAlarmRecords.filter(a => a.status === 'processing').length,
    closed: mockAlarmRecords.filter(a => a.status === 'closed').length,
    total: mockAlarmRecords.length,
    avgCloseTimeMinutes: 18.4,
  },
  recomputeDisposalStats: () => set((state) => {
    const records = state.alarmRecords;
    const pending = records.filter(r => r.status === 'pending').length;
    const processing = records.filter(r => r.status === 'processing').length;
    const closed = records.filter(r => r.status === 'closed' || r.resolved).length;
    const total = records.length;
    const closedRecords = records.filter(r => r.resolved && r.resolvedAt);
    let avg = 18.4;
    if (closedRecords.length > 0) {
      const totalMin = closedRecords.reduce((sum, r) =>
        sum + ((r.resolvedAt!.getTime() - r.time.getTime()) / 60000), 0);
      avg = Number((totalMin / closedRecords.length).toFixed(1));
    }
    return {
      disposalStats: { pending, processing, closed, total, avgCloseTimeMinutes: avg },
    };
  }),

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

  computeWorkpieceComparison: (aId, bId) => {
    const s = get();
    const a = s.workpieces.find(w => w.id === aId);
    const b = s.workpieces.find(w => w.id === bId);
    if (!a || !b) return null;
    const cyclesA = s.getCyclesByWorkpiece(aId);
    const cyclesB = s.getCyclesByWorkpiece(bId);
    const cycleA = cyclesA[0];
    const cycleB = cyclesB[0];
    const totalA = cycleA?.duration || 480;
    const totalB = cycleB?.duration || 520;
    const diff = totalB - totalA;
    const phases: ProcessPhase[] = ['loading', 'fixture', 'welding', 'inspection', 'repair'];
    const phaseBreakdown = phases.map(p => ({
      phase: p,
      a: cycleA ? (cycleA as any)[`${p}Time`] || 0 : 0,
      b: cycleB ? (cycleB as any)[`${p}Time`] || 0 : 0,
    }));
    const wpA = s.weldPoints;
    const abnA = wpA.filter(p => p.status === 'defective').length;
    const abnB = Math.min(abnA + 2, 5);
    const repA = s.getRepairsByWorkpiece(aId).length;
    const repB = s.getRepairsByWorkpiece(bId).length || 3;
    const alA = s.getAlarmsByWorkpiece(aId).length;
    const alB = s.getAlarmsByWorkpiece(bId).length || 4;
    const inspectedA = wpA.filter(p => p.ultrasonicResult !== undefined).length;
    const passA = wpA.filter(p => p.ultrasonicResult === 'pass').length;
    const rateA = inspectedA > 0 ? Number(((passA / inspectedA) * 100).toFixed(1)) : 95;
    const rateB = Number((rateA - 2.3).toFixed(1));

    return {
      workpieceA: { id: aId, code: a.code },
      workpieceB: { id: bId, code: b.code },
      metrics: {
        totalCycle: {
          a: totalA,
          b: totalB,
          diff,
          diffPercent: Number(((diff / totalA) * 100).toFixed(1)),
        },
        phaseBreakdown,
        abnormalPoints: { a: abnA, b: abnB, diff: abnB - abnA },
        repairCount: { a: repA, b: repB, diff: repB - repA },
        alarmCount: { a: alA, b: alB, diff: alB - alA },
        passRate: { a: rateA, b: rateB, diff: Number((rateB - rateA).toFixed(1)) },
      },
    };
  },

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
