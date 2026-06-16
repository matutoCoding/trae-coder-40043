import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeldingStore } from '@/store/weldingStore';
import {
  Bot, Zap, Activity, Play, Square, Settings2, Timer, CircleDot,
  Save, AlertTriangle, FileText, CheckCircle2, Wrench, ShieldCheck,
  Clock, UserRound, ArrowRight,
} from 'lucide-react';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend, Scatter,
} from 'recharts';
import type { WeldingParams, WeldingParamRanges, WeldPoint, AlarmRecord, AlarmStatus } from '@/types';

export default function WeldingPage() {
  const navigate = useNavigate();
  const {
    weldingPrograms, selectedProgram, setSelectedProgram,
    weldingParams, setWeldingParams, isWelding, setIsWelding,
    weldingHistory, addWeldingHistoryPoint, weldPoints,
    saveProgramParams, currentWorkpiece, alarmRecords,
    advanceWeldingProgress,
  } = useWeldingStore();

  const [currentPointIndex, setCurrentPointIndex] = useState<number>(() =>
    weldPoints.findIndex((p) => p.status === 'welding')
  );
  const [showSaveSuccess, setShowSaveSuccess] = useState<boolean>(false);

  const ranges: WeldingParamRanges = selectedProgram?.paramRanges || {
    current: { min: 10000, max: 14500 },
    voltage: { min: 3.5, max: 5.2 },
    pressure: { min: 280, max: 420 },
    time: { min: 0.25, max: 0.50 },
  };

  useEffect(() => {
    if (!isWelding) return;
    const historyInterval = setInterval(() => {
      const ranges2 = selectedProgram?.paramRanges || ranges;
      let current = weldingParams.current + (Math.random() * 1500 - 750);
      let voltage = weldingParams.voltage + (Math.random() * 0.4 - 0.2);
      if (Math.random() < 0.03) current = ranges2.current.min - 400 - Math.random() * 200;
      if (Math.random() < 0.02) voltage = ranges2.voltage.max + 0.2 + Math.random() * 0.3;
      const currentNormal = current >= ranges2.current.min && current <= ranges2.current.max;
      const voltageNormal = voltage >= ranges2.voltage.min && voltage <= ranges2.voltage.max;
      addWeldingHistoryPoint({
        time: `${weldingHistory.length}s`,
        current: Math.round(current),
        voltage: Number(voltage.toFixed(2)),
        currentNormal,
        voltageNormal,
      });
    }, 800);
    return () => clearInterval(historyInterval);
  }, [isWelding, selectedProgram, weldingParams, weldingHistory.length, addWeldingHistoryPoint, ranges]);

  useEffect(() => {
    if (!isWelding) return;
    const progressInterval = setInterval(() => {
      const nextId = advanceWeldingProgress();
      if (!nextId) {
        const hasPending = weldPoints.some((p) => p.status === 'pending');
        if (!hasPending) {
          setIsWelding(false);
        }
      }
      const weldingIdx = weldPoints.findIndex((p) => p.status === 'welding');
      if (weldingIdx >= 0) {
        setCurrentPointIndex(weldingIdx);
      }
    }, 2000);
    return () => clearInterval(progressInterval);
  }, [isWelding, weldPoints, advanceWeldingProgress, setIsWelding]);

  const completedCount = useMemo(
    () => weldPoints.filter((p) => p.status === 'completed' || p.status === 'repaired').length,
    [weldPoints]
  );
  const totalCount = weldPoints.length;
  const progress = Math.round((completedCount / totalCount) * 100);
  const defectiveCount = useMemo(
    () => weldPoints.filter((p) => p.status === 'defective').length,
    [weldPoints]
  );

  const handleStartWelding = () => {
    if (!selectedProgram || !currentWorkpiece) return;
    setIsWelding(true);
  };

  const handleStopWelding = () => setIsWelding(false);

  const handleSaveProgram = () => {
    if (!selectedProgram) return;
    saveProgramParams(selectedProgram.id, weldingParams);
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2000);
  };

  const paramWarnings = {
    current: weldingParams.current < ranges.current.min || weldingParams.current > ranges.current.max,
    voltage: weldingParams.voltage < ranges.voltage.min || weldingParams.voltage > ranges.voltage.max,
    pressure: weldingParams.pressure < ranges.pressure.min || weldingParams.pressure > ranges.pressure.max,
    time: weldingParams.time < ranges.time.min || weldingParams.time > ranges.time.max,
  };

  const activeAlarms = useMemo(
    () => alarmRecords.filter(
      (a) => !a.resolved && a.source === 'welding' && a.workpieceId === currentWorkpiece?.id
    ),
    [alarmRecords, currentWorkpiece]
  );

  const chartData = useMemo(
    () => weldingHistory.map((p) => ({
      ...p,
      abnormalCurrent: !p.currentNormal ? p.current : null,
      abnormalVoltage: !p.voltageNormal ? p.voltage : null,
    })),
    [weldingHistory]
  );

  const getStatusBadgeStyle = (status: AlarmStatus): { bg: string; text: string; label: string } => {
    switch (status) {
      case 'pending':
        return { bg: 'bg-accent-orange/20 border-accent-orange/40', text: 'text-accent-orange', label: '待分派' };
      case 'processing':
        return { bg: 'bg-accent-yellow/20 border-accent-yellow/40', text: 'text-accent-yellow', label: '处理中' };
      case 'closed':
        return { bg: 'bg-accent-green/20 border-accent-green/40', text: 'text-accent-green', label: '已闭环' };
    }
  };

  const getWeldPointTooltip = (p: WeldPoint): string => {
    const lines: string[] = [`焊点#${p.index}`];
    if (p.status === 'defective') {
      const abnormalInfo = p.paramAbnormal
        ? `${p.paramAbnormal.param}参数异常`
        : p.defectType && p.defectType !== 'none'
        ? `缺陷类型: ${p.defectType}`
        : '';
      lines.push(`待处理异常: ${abnormalInfo || '未知'}`);
    } else {
      const statusMap: Record<string, string> = {
        pending: '待焊接',
        welding: '焊接中',
        completed: '已完成',
        repaired: '补焊后合格',
      };
      lines.push(`状态: ${statusMap[p.status] || p.status}`);
    }
    if (p.paramAbnormal) {
      lines.push(`参数: ${p.paramAbnormal.param} = ${p.paramAbnormal.value}`);
    }
    if (p.defectType && p.defectType !== 'none' && p.status !== 'defective') {
      lines.push(`缺陷: ${p.defectType}`);
    }
    return lines.join('\n');
  };

  const handleAlarmClick = (alarm: AlarmRecord) => {
    const targetIndex = alarm.weldPointIndex;
    navigate('/inspection', {
      state: targetIndex !== undefined ? { focusWeldPointIndex: targetIndex } : undefined,
    });
  };

  const formatValue = (key: string, value: number): string => {
    if (key === 'time') return value.toFixed(2);
    return String(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center">
            <Bot className="w-6 h-6 mr-2 text-accent-cyan" />
            机器人焊接控制
          </h2>
          <p className="text-sm text-industrial-400 mt-1">
            轨迹程序配方管理 · 参数范围校验 · 异常焊点自动追溯 · 当前工件:
            <span className="text-accent-cyan font-mono ml-1">{currentWorkpiece?.code || '--'}</span>
          </p>
        </div>
        {activeAlarms.length > 0 && (
          <div className="bg-accent-red/15 border border-accent-red/40 rounded-lg px-4 py-2 flex items-center gap-2 animate-pulse">
            <AlertTriangle className="w-5 h-5 text-accent-red" />
            <div className="text-sm">
              <span className="text-accent-red font-medium">{activeAlarms.length}项参数异常</span>
              <span className="text-industrial-400 ml-2">已自动关联待处理焊点</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="panel">
            <div className="panel-header">
              <h3 className="text-white font-semibold flex items-center">
                <Settings2 className="w-4 h-4 mr-2 text-accent-cyan" />
                轨迹程序配方
              </h3>
              <button
                onClick={handleSaveProgram}
                disabled={!selectedProgram}
                className="text-xs px-2.5 py-1 rounded bg-accent-cyan/15 text-accent-cyan hover:bg-accent-cyan/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {showSaveSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                {showSaveSuccess ? '已保存' : '保存参数'}
              </button>
            </div>
            <div className="panel-body space-y-2">
              {weldingPrograms.map((prog) => (
                <button
                  key={prog.id}
                  onClick={() => setSelectedProgram(prog)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedProgram?.id === prog.id
                      ? 'bg-accent-cyan/15 border border-accent-cyan/50'
                      : 'bg-industrial-900 border border-industrial-700 hover:border-industrial-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${selectedProgram?.id === prog.id ? 'text-accent-cyan' : 'text-white'}`}>
                      {prog.name}
                    </p>
                    {prog.savedAt && (
                      <span className="text-xs text-industrial-500">
                        {prog.savedAt.toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-industrial-400 mt-0.5">{prog.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-industrial-500">{prog.pointCount}个焊点</span>
                    <span className="font-mono text-xs text-industrial-400">
                      {prog.defaultParams.current}A / {prog.defaultParams.voltage}V
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3 className="text-white font-semibold flex items-center">
                <Zap className="w-4 h-4 mr-2 text-accent-orange" />
                点焊参数配方
              </h3>
              {selectedProgram && (
                <span className="text-xs text-industrial-500">
                  {Object.values(paramWarnings).some(Boolean) && (
                    <span className="text-accent-yellow flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1" />参数超范围
                    </span>
                  )}
                </span>
              )}
            </div>
            <div className="panel-body space-y-5">
              {([
                { key: 'current', label: '焊接电流', value: weldingParams.current, unit: 'A', min: ranges.current.min, max: ranges.current.max, step: 100, color: paramWarnings.current ? 'accent-yellow' : 'accent-cyan' },
                { key: 'voltage', label: '焊接电压', value: weldingParams.voltage, unit: 'V', min: ranges.voltage.min, max: ranges.voltage.max, step: 0.1, color: paramWarnings.voltage ? 'accent-yellow' : 'accent-cyan' },
                { key: 'pressure', label: '电极压力', value: weldingParams.pressure, unit: 'daN', min: ranges.pressure.min, max: ranges.pressure.max, step: 10, color: paramWarnings.pressure ? 'accent-yellow' : 'accent-cyan' },
                { key: 'time', label: '焊接时间', value: weldingParams.time, unit: 's', min: ranges.time.min, max: ranges.time.max, step: 0.01, color: paramWarnings.time ? 'accent-yellow' : 'accent-cyan' },
              ] as const).map((item) => (
                <div key={item.key}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-industrial-400 flex items-center gap-1.5">
                      {item.label}
                      {item.value < item.min && <span className="text-accent-yellow text-xs">⚠低于下限</span>}
                      {item.value > item.max && <span className="text-accent-yellow text-xs">⚠高于上限</span>}
                    </span>
                    <span className={`font-mono ${item.color === 'accent-yellow' ? 'text-accent-yellow' : 'text-accent-cyan'}`}>
                      {formatValue(item.key, item.value)} {item.unit}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min={item.min}
                      max={item.max}
                      step={item.step}
                      value={item.value}
                      onChange={(e) => setWeldingParams({ [item.key]: Number(e.target.value) } as Partial<WeldingParams>)}
                      className="w-full accent-cyan-500"
                    />
                    <div className="flex justify-between text-[10px] text-industrial-500 mt-0.5">
                      <span>最小 {item.min}{item.unit}</span>
                      <span>最大 {item.max}{item.unit}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-industrial-700">
                <p className="text-[11px] text-industrial-500 flex items-start gap-1.5 leading-relaxed">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent-cyan flex-shrink-0 mt-0.5" />
                  <span>
                    <span className="text-accent-cyan">进度自动保护:</span>{' '}
                    异常焊点保持待处理，即使后续焊点完成也不会被覆盖，须走补焊+复检闭环
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-body">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="data-label">焊接状态</p>
                  <p className={`mt-1 font-medium ${isWelding ? 'text-accent-green' : defectiveCount > 0 ? 'text-accent-yellow' : 'text-industrial-400'}`}>
                    {isWelding ? (
                      <span className="flex items-center">
                        <span className="status-dot bg-accent-green animate-pulse" />
                        自动焊接中
                      </span>
                    ) : defectiveCount > 0 ? (
                      <span className="flex items-center">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                        {defectiveCount}个异常点待处理
                      </span>
                    ) : '待机'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="data-label">当前焊点</p>
                  <p className="mt-1 font-mono text-2xl font-bold text-accent-cyan">
                    #{Math.max(0, currentPointIndex) + 1}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {!isWelding ? (
                  <button
                    onClick={handleStartWelding}
                    disabled={!selectedProgram || !currentWorkpiece}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    {!selectedProgram ? '请先选程序' : '启动焊接'}
                  </button>
                ) : (
                  <button onClick={handleStopWelding} className="btn-danger flex-1 flex items-center justify-center gap-2">
                    <Square className="w-4 h-4" />
                    紧急停止
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="panel">
            <div className="panel-header">
              <h3 className="text-white font-semibold flex items-center">
                <Activity className="w-4 h-4 mr-2 text-accent-cyan" />
                焊接电流 / 电压实时曲线
              </h3>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center"><span className="w-3 h-0.5 bg-accent-cyan mr-1.5" />正常电流</span>
                <span className="flex items-center"><span className="w-3 h-0.5 bg-accent-orange mr-1.5" />正常电压</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-sm bg-accent-red mr-1.5" />超范围异常</span>
              </div>
            </div>
            <div className="panel-body h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 40, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="time"
                    stroke="#64748B"
                    fontSize={10}
                    label={{ value: '采样时间 (s)', position: 'insideBottom', offset: -10, fill: '#64748B', fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#06B6D4"
                    fontSize={10}
                    domain={[9000, 15500]}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    label={{ value: '电流(A)', angle: -90, position: 'insideLeft', fill: '#06B6D4', fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#F97316"
                    fontSize={10}
                    domain={[2.5, 6]}
                    tickFormatter={(v) => v.toFixed(1)}
                    label={{ value: '电压(V)', angle: 90, position: 'insideRight', fill: '#F97316', fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px' }}
                    labelStyle={{ color: '#E2E8F0' }}
                    formatter={(value: number | null, name: string) => [
                      value != null
                        ? name.includes('电流') || name === 'current' || name === 'abnormalCurrent'
                          ? `${value} A`
                          : `${value} V`
                        : null,
                      name === 'current' ? '电流(A)' :
                      name === 'voltage' ? '电压(V)' :
                      name === 'abnormalCurrent' ? '异常电流' :
                      name === 'abnormalVoltage' ? '异常电压' : name,
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine yAxisId="left" y={ranges.current.min} stroke="#EF4444" strokeDasharray="3 3" strokeWidth={1} />
                  <ReferenceLine yAxisId="left" y={ranges.current.max} stroke="#EF4444" strokeDasharray="3 3" strokeWidth={1} />
                  <ReferenceLine yAxisId="right" y={ranges.voltage.min} stroke="#F59E0B" strokeDasharray="3 3" strokeWidth={1} />
                  <ReferenceLine yAxisId="right" y={ranges.voltage.max} stroke="#F59E0B" strokeDasharray="3 3" strokeWidth={1} />
                  <Line yAxisId="left" type="monotone" dataKey="current" stroke="#06B6D4" strokeWidth={1.5} dot={false} name="电流" connectNulls />
                  <Line yAxisId="right" type="monotone" dataKey="voltage" stroke="#F97316" strokeWidth={1.5} dot={false} name="电压" connectNulls />
                  <Scatter yAxisId="left" dataKey="abnormalCurrent" fill="#EF4444" shape="star" legendType="circle" name="异常电流点" />
                  <Scatter yAxisId="right" dataKey="abnormalVoltage" fill="#EF4444" shape="star" legendType="circle" name="异常电压点" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {activeAlarms.length > 0 && (
            <div className="panel border-accent-red/30">
              <div className="panel-header border-accent-red/30">
                <h3 className="text-white font-semibold flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2 text-accent-red" />
                  焊接异常告警（已关联对应焊点）
                </h3>
                <span className="text-xs text-accent-red">{activeAlarms.length}项未处理</span>
              </div>
              <div className="panel-body">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeAlarms.slice(0, 4).map((alarm) => {
                    const relatedPoint = weldPoints.find((p) => p.index === alarm.weldPointIndex);
                    const badgeStyle = getStatusBadgeStyle(alarm.status);
                    return (
                      <div
                        key={alarm.id}
                        onClick={() => handleAlarmClick(alarm)}
                        className="bg-accent-red/10 border border-accent-red/30 rounded-lg p-3 cursor-pointer hover:bg-accent-red/15 hover:border-accent-red/50 transition-all group"
                      >
                        <div className="flex items-start justify-between mb-1.5 gap-2">
                          <p className="text-sm text-accent-red font-medium flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                            {alarm.title}
                          </p>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {alarm.weldPointIndex && (
                              <span className="text-xs px-1.5 py-0.5 bg-accent-red/20 rounded font-mono text-accent-red">
                                #{alarm.weldPointIndex}
                              </span>
                            )}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${badgeStyle.bg} ${badgeStyle.text}`}>
                              {badgeStyle.label}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-industrial-300 mb-2">{alarm.description}</p>
                        {alarm.paramName && (
                          <div className="flex items-center gap-3 text-xs font-mono">
                            <span className="text-industrial-400">{alarm.paramName}:</span>
                            <span className="text-accent-red">
                              {alarm.paramValue?.toLocaleString()}
                            </span>
                            <span className="text-industrial-500">
                              (正常范围 {alarm.paramMin?.toLocaleString()} ~ {alarm.paramMax?.toLocaleString()})
                            </span>
                          </div>
                        )}
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-3 text-[10px] text-industrial-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {alarm.time.toLocaleTimeString()}
                            </span>
                            {alarm.assignedTo && (
                              <span className="flex items-center gap-1">
                                <UserRound className="w-3 h-3" />
                                {alarm.assignedTo}
                              </span>
                            )}
                          </div>
                          {relatedPoint && relatedPoint.status === 'defective' && (
                            <p className="text-xs text-accent-yellow flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              待补焊
                            </p>
                          )}
                          <span className="text-[10px] text-accent-cyan opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            去处理 <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="panel">
            <div className="panel-header">
              <h3 className="text-white font-semibold flex items-center">
                <CircleDot className="w-4 h-4 mr-2 text-accent-cyan" />
                焊点进度（可追溯异常来源）
              </h3>
              <div className="flex items-center gap-4">
                <span className="text-xs text-industrial-400">
                  进度: <span className="text-accent-cyan font-mono font-bold">{completedCount}/{totalCount}</span>
                </span>
                <span className="text-xs text-industrial-400">
                  <Timer className="w-3 h-3 inline mr-1" />
                  <span className="text-accent-green font-mono font-bold">{progress}%</span>
                </span>
                {defectiveCount > 0 && (
                  <span className="text-xs text-accent-red flex items-center">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {defectiveCount}个异常
                  </span>
                )}
              </div>
            </div>
            <div className="panel-body">
              <div className="h-3 bg-industrial-700 rounded-full overflow-hidden mb-5">
                <div
                  className="h-full bg-gradient-to-r from-accent-cyan to-cyan-400 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="grid grid-cols-12 gap-1.5">
                {weldPoints.map((p, idx) => {
                  const hasAlarm = alarmRecords.some(
                    (a) => a.weldPointIndex === p.index && a.workpieceId === currentWorkpiece?.id
                  );
                  const isDefective = p.status === 'defective';
                  const isRepaired = p.status === 'repaired';
                  const isWeldingStatus = p.status === 'welding';
                  const isCompleted = p.status === 'completed';
                  return (
                    <div
                      key={p.id}
                      title={getWeldPointTooltip(p)}
                      className={`relative aspect-square rounded-md flex items-center justify-center text-xs font-mono transition-all select-none ${
                        isDefective
                          ? 'bg-accent-red text-white ring-2 ring-accent-red/60'
                          : isRepaired
                          ? 'bg-emerald-600 text-white'
                          : isWeldingStatus
                          ? 'bg-accent-cyan text-white ring-2 ring-accent-cyan/50 ring-offset-1 ring-offset-industrial-800'
                          : isCompleted
                          ? 'bg-accent-green text-white'
                          : 'bg-industrial-700 text-industrial-400'
                      } ${isDefective ? '' : 'cursor-pointer hover:scale-110'}`}
                    >
                      {isDefective ? (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      ) : isRepaired ? (
                        <span className="flex items-center justify-center leading-none">
                          <CheckCircle2 className="w-2.5 h-2.5 -mr-0.5" />
                          <CheckCircle2 className="w-2.5 h-2.5" />
                        </span>
                      ) : isWeldingStatus ? (
                        <Wrench className="w-3.5 h-3.5 animate-pulse" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                      {hasAlarm && !isDefective && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-accent-yellow rounded-full flex items-center justify-center ring-1 ring-industrial-800">
                          <span className="text-[8px] font-bold text-industrial-900">!</span>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-5 text-xs text-industrial-400">
                <span className="flex items-center"><span className="w-3 h-3 rounded bg-accent-green mr-1.5" />已完成合格</span>
                <span className="flex items-center">
                  <span className="w-3 h-3 rounded bg-emerald-600 mr-1.5 flex items-center justify-center">
                    <span className="text-[6px] text-white font-bold">✓✓</span>
                  </span>
                  补焊后合格
                </span>
                <span className="flex items-center">
                  <span className="w-3 h-3 rounded bg-accent-cyan mr-1.5 flex items-center justify-center">
                    <Wrench className="w-2 h-2 text-white" />
                  </span>
                  当前焊接
                </span>
                <span className="flex items-center">
                  <span className="w-3 h-3 rounded bg-accent-red mr-1.5 flex items-center justify-center">
                    <AlertTriangle className="w-2 h-2 text-white" />
                  </span>
                  异常待处理
                </span>
                <span className="flex items-center"><span className="w-3 h-3 rounded bg-industrial-700 mr-1.5" />待焊接</span>
                <span className="flex items-center">
                  <span className="w-3.5 h-3.5 rounded-full bg-accent-yellow mr-1.5 flex items-center justify-center text-industrial-900 text-[8px] font-bold">!</span>
                  有关联告警
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
