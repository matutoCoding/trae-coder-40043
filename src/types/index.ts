export type WorkpieceStatus = 'pending' | 'loading' | 'loaded' | 'completed';
export type FixtureStatus = 'released' | 'clamping' | 'clamped' | 'error';
export type SensorStatus = 'normal' | 'warning' | 'error';
export type WeldPointStatus = 'pending' | 'welding' | 'completed' | 'defective' | 'repaired';
export type UltrasonicResult = 'pass' | 'fail' | 'pending';
export type DefectType = 'none' | 'cold' | 'missing' | 'spatter';
export type MaintenanceType = 'electrode_dressing' | 'preventive' | 'corrective';
export type ProcessModule = 'loading' | 'fixture' | 'welding' | 'inspection' | 'repair' | 'cycle' | 'maintenance';

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface Position2D {
  x: number;
  y: number;
}

export interface Workpiece {
  id: string;
  code: string;
  name: string;
  type: string;
  loadingTime: Date;
  status: WorkpieceStatus;
  position: Position3D;
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
  sensors: SensorData[];
}

export interface WeldingParams {
  current: number;
  voltage: number;
  pressure: number;
  time: number;
  programId: string;
  programName: string;
}

export interface WeldingProgram {
  id: string;
  name: string;
  description: string;
  defaultParams: WeldingParams;
  pointCount: number;
}

export interface WeldPoint {
  id: string;
  index: number;
  position: Position2D;
  status: WeldPointStatus;
  ultrasonicResult?: UltrasonicResult;
  defectType?: DefectType;
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
}

export interface WeldingHistoryPoint {
  time: string;
  current: number;
  voltage: number;
}
