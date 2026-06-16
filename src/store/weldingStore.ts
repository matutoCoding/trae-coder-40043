import { create } from 'zustand';
import type {
  Workpiece, Fixture, WeldingParams, WeldPoint, RepairRecord,
  CycleData, MaintenanceRecord, ProcessModule, WeldingHistoryPoint
} from '@/types';
import {
  mockWorkpieces, mockFixture, mockWeldPoints, mockRepairRecords,
  mockCycleDataList, mockMaintenanceRecords, mockWeldingPrograms,
  generateWeldingHistory, mockDashboardStats, mockCycleStats
} from '@/data/mockData';

interface WeldingStore {
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

  selectedProgram: typeof mockWeldingPrograms[0] | null;
  setSelectedProgram: (program: typeof mockWeldingPrograms[0] | null) => void;
  weldingPrograms: typeof mockWeldingPrograms;
  weldingParams: WeldingParams;
  setWeldingParams: (params: Partial<WeldingParams>) => void;
  isWelding: boolean;
  setIsWelding: (val: boolean) => void;
  weldingHistory: WeldingHistoryPoint[];
  addWeldingHistoryPoint: (point: WeldingHistoryPoint) => void;

  weldPoints: WeldPoint[];
  updateWeldPoint: (id: string, updates: Partial<WeldPoint>) => void;

  repairRecords: RepairRecord[];
  addRepairRecord: (record: RepairRecord) => void;

  cycleDataList: CycleData[];
  currentCycle: CycleData | null;
  startNewCycle: (workpieceId: string, workpieceCode: string) => void;
  endCurrentCycle: () => void;
  updateCyclePhase: (phase: keyof Pick<CycleData, 'loadingTime' | 'fixtureTime' | 'weldingTime' | 'inspectionTime' | 'repairTime'>, value: number) => void;
  cycleStats: typeof mockCycleStats;

  maintenanceRecords: MaintenanceRecord[];
  addMaintenanceRecord: (record: MaintenanceRecord) => void;

  dashboardStats: typeof mockDashboardStats;
}

export const useWeldingStore = create<WeldingStore>((set, get) => ({
  currentModule: 'loading',
  setCurrentModule: (module) => set({ currentModule: module }),

  workpieces: mockWorkpieces,
  currentWorkpiece: mockWorkpieces[2],
  setCurrentWorkpiece: (wp) => set({ currentWorkpiece: wp }),
  addWorkpiece: (wp) => set((state) => ({ workpieces: [...state.workpieces, wp] })),
  updateWorkpieceStatus: (id, status) => set((state) => ({
    workpieces: state.workpieces.map((w) => w.id === id ? { ...w, status } : w),
    currentWorkpiece: state.currentWorkpiece?.id === id ? { ...state.currentWorkpiece, status } : state.currentWorkpiece,
  })),

  fixture: mockFixture,
  setFixtureStatus: (status) => set((state) => ({ fixture: { ...state.fixture, status } })),
  updateFixtureSensor: (sensorId, value) => set((state) => ({
    fixture: {
      ...state.fixture,
      sensors: state.fixture.sensors.map((s) => s.id === sensorId ? { ...s, value } : s),
    },
  })),

  selectedProgram: null,
  setSelectedProgram: (program) => set({ selectedProgram: program, weldingParams: program?.defaultParams || get().weldingParams }),
  weldingPrograms: mockWeldingPrograms,
  weldingParams: mockWeldingPrograms[0].defaultParams,
  setWeldingParams: (params) => set((state) => ({ weldingParams: { ...state.weldingParams, ...params } })),
  isWelding: false,
  setIsWelding: (val) => set({ isWelding: val }),
  weldingHistory: generateWeldingHistory(),
  addWeldingHistoryPoint: (point) => set((state) => ({
    weldingHistory: [...state.weldingHistory.slice(-59), point],
  })),

  weldPoints: mockWeldPoints,
  updateWeldPoint: (id, updates) => set((state) => ({
    weldPoints: state.weldPoints.map((p) => p.id === id ? { ...p, ...updates } : p),
  })),

  repairRecords: mockRepairRecords,
  addRepairRecord: (record) => set((state) => ({ repairRecords: [...state.repairRecords, record] })),

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
  addMaintenanceRecord: (record) => set((state) => ({ maintenanceRecords: [...state.maintenanceRecords, record] })),

  dashboardStats: mockDashboardStats,
}));
