export type WorkpieceStatus = 'pending' | 'loading' | 'loaded' | 'completed';
export type FixtureStatus = 'released' | 'clamping' | 'clamped' | 'error';
export type SensorStatus = 'normal' | 'warning' | 'error';
export type WeldPointStatus = 'pending' | 'welding' | 'completed' | 'defective' | 'repaired';
export type UltrasonicResult = 'pass' | 'fail' | 'pending';
export type DefectType = 'none' | 'cold' | 'missing' | 'spatter' | 'param_abnormal';
export type MaintenanceType = 'electrode_dressing' | 'preventive' | 'corrective';
export type ProcessModule = 'loading' | 'fixture' | 'welding' | 'inspection' | 'repair' | 'cycle' | 'maintenance' | 'traceability';
export type AlarmSeverity = 'info' | 'warning' | 'error' | 'high' | 'low';
export type ProcessPhase = 'loading' | 'fixture' | 'welding' | 'inspection' | 'repair' | 'maintenance' | 'cycle' | 'quality';
export type AlarmStatus = 'pending' | 'processing' | 'closed';
export type RepairReason = 'param_abnormal' | 'cold_weld' | 'missing_weld' | 'spatter' | 'ultrasonic_fail' | 'other';
export type RepairMethod = 'manual_spot' | 'rework' | 'replace' | 'grind_clean';
export type ReinspectionResult = 'pass' | 'fail' | 'pending';

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface Position2D {
  x: number;
  y: number;
}

export interface ParamRange {
  min: number;
  max: number;
}

export interface WeldingParamRanges {
  current: ParamRange;
  voltage: ParamRange;
  pressure: ParamRange;
  time: ParamRange;
}

export interface Workpiece {
  id: string;
  code: string;
  name: string;
  type: string;
  loadingTime: Date;
  status: WorkpieceStatus;
  position: Position3D;
  operator?: string;
}

export interface SensorData {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: SensorStatus;
  min: number;
  max: number;
}

export interface Fixture {
  id: string;
  name: string;
  status: FixtureStatus;
  clampForce: number;
  positionAccuracy: number;
  operator?: string;
  clampTime?: Date;
  sensors: SensorData[];
}

export interface WeldingParams {
  current: number;
  voltage: number;
  pressure: number;
  time: number;
  programId?: string;
  programName?: string;
  pointCount?: number;
}

export interface WeldingProgram {
  id: string;
  name: string;
  description: string;
  defaultParams: WeldingParams;
  pointCount: number;
  paramRanges: WeldingParamRanges;
  savedAt?: Date;
}

export interface WeldPoint {
  id: string;
  index: number;
  workpieceId: string;
  position: Position2D;
  status: WeldPointStatus;
  ultrasonicResult?: UltrasonicResult;
  defectType?: DefectType;
  weldParams?: WeldingParams;
  paramAbnormal?: {
    param: 'current' | 'voltage' | 'pressure' | 'time';
    value: number;
    expectedMin: number;
    expectedMax: number;
    min: number;
    max: number;
  };
  weldingStartTime?: Date;
  weldingEndTime?: Date;
  inspector?: string;
  inspectionTime?: Date;
}

export interface RepairRecord {
  id: string;
  workpieceId: string;
  weldPointId: string;
  weldPointIndex: number;
  operator: string;
  repairTime: Date;
  description: string;
  spatterCleaned: boolean;
  repairMethod?: RepairMethod;
  repairReason?: RepairReason;
  reinspectionResult?: ReinspectionResult;
  reinspectionOperator?: string;
  reinspectionTime?: Date;
  reinspectionNote?: string;
}

export interface DisposalRecord {
  id: string;
  alarmId: string;
  workpieceId: string;
  weldPointIndex?: number;
  phase: 'report' | 'assign' | 'repair' | 'reinspect' | 'close';
  operator: string;
  timestamp: Date;
  status: AlarmStatus;
  repairReason?: RepairReason;
  repairMethod?: RepairMethod;
  reinspectionResult?: ReinspectionResult;
  note?: string;
  relatedRecordId?: string;
}

export interface CycleData {
  id: string;
  workpieceId: string;
  workpieceCode: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  targetDuration: number;
  loadingTime: number;
  fixtureTime: number;
  weldingTime: number;
  inspectionTime: number;
  repairTime: number;
  status: 'running' | 'completed';
}

export interface MaintenanceRecord {
  id: string;
  deviceName: string;
  type: MaintenanceType;
  operator: string;
  time: Date;
  description: string;
  nextMaintenanceDate: Date;
  equipmentHealth: number;
  relatedWorkpieceId?: string;
}

export interface WeldingHistoryPoint {
  time: string;
  current: number;
  voltage: number;
  currentNormal: boolean;
  voltageNormal: boolean;
}

export interface AlarmRecord {
  id: string;
  time: Date;
  severity: AlarmSeverity;
  source: ProcessPhase;
  workpieceId?: string;
  weldPointIndex?: number;
  title: string;
  description: string;
  paramName?: string;
  paramValue?: number;
  paramMin?: number;
  paramMax?: number;
  status: AlarmStatus;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolution?: string;
  createdBy?: string;
  assignedTo?: string;
  assignedAt?: Date;
  disposalRecordIds?: string[];
}

export interface TraceEvent {
  id: string;
  phase: ProcessPhase;
  time: Date;
  timestamp?: Date;
  operator?: string;
  workpieceId: string;
  weldPointIndex?: number;
  title: string;
  description: string;
  data?: Record<string, any>;
  detail?: Record<string, any>;
  status?: string;
  abnormal?: boolean;
  duration?: number;
  relatedAlarmId?: string;
  relatedDisposalIds?: string[];
}

export interface WorkpieceComparison {
  workpieceA: {
    id: string;
    code: string;
  };
  workpieceB: {
    id: string;
    code: string;
  };
  metrics: {
    totalCycle: { a: number; b: number; diff: number; diffPercent: number };
    phaseBreakdown: {
      phase: ProcessPhase;
      a: number;
      b: number;
    }[];
    abnormalPoints: { a: number; b: number; diff: number };
    repairCount: { a: number; b: number; diff: number };
    alarmCount: { a: number; b: number; diff: number };
    passRate: { a: number; b: number; diff: number };
  };
}

export interface DashboardDisposalStats {
  pending: number;
  processing: number;
  closed: number;
  total: number;
  avgCloseTimeMinutes: number;
}

export interface QualityByWorkpiece {
  workpieceId: string;
  workpieceCode: string;
  totalPoints: number;
  defectiveCount: number;
  repairCount: number;
  alarmCount: number;
  passRate: number;
  avgCloseTimeMinutes: number;
}

export interface QualityByDefect {
  defectType: DefectType;
  label: string;
  count: number;
  repairCount: number;
  avgCloseTimeMinutes: number;
  affectedWorkpieces: number;
}

export interface QualityByOperator {
  operator: string;
  repairCount: number;
  closedCount: number;
  avgCloseTimeMinutes: number;
  role: '补焊工' | '质检员' | '工程师' | '系统';
}

export interface QualityBoardStats {
  byWorkpiece: QualityByWorkpiece[];
  byDefect: QualityByDefect[];
  byOperator: QualityByOperator[];
  totalRepairs: number;
  overallPassRate: number;
  overallAvgCloseMinutes: number;
}
