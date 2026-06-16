import { useState, useMemo } from 'react';
import { useWeldingStore } from '@/store/weldingStore';
import { ScanLine, CheckCircle2, XCircle, AlertTriangle, Activity, FileCheck, Eye, ArrowRight, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { DefectType, AlarmStatus, DisposalRecord } from '@/types';

const generateUltrasonicData = (isFail = false) => {
  const data = [];
  for (let i = 0; i < 100; i++) {
    const base = Math.sin(i * 0.1) * 30 + Math.random() * 15;
    const anomaly = isFail && i > 38 && i < 55 ? 70 + Math.random() * 45 : 0;
    data.push({ time: i, amplitude: Math.max(0, base + anomaly) });
  }
  return data;
};

const DEFECT_BUTTONS: Array<{ type: DefectType; label: string; className: string }> = [
  { type: 'cold', label: '虚焊', className: 'btn-warning' },
  { type: 'missing', label: '漏焊', className: 'btn-danger' },
  { type: 'spatter', label: '焊渣飞溅', className: 'btn-secondary' },
  { type: 'param_abnormal', label: '参数异常', className: 'btn-outline bg-accent-orange/10 text-accent-orange border-accent-orange/40 hover:bg-accent-orange/20' },
];

const PHASE_ORDER: Array<{ phase: DisposalRecord['phase']; label: string }> = [
  { phase: 'report', label: '报告' },
  { phase: 'assign', label: '分派' },
  { phase: 'repair', label: '补焊' },
  { phase: 'reinspect', label: '复检' },
  { phase: 'close', label: '关闭' },
];

const getStatusColor = (status: AlarmStatus): string => {
  switch (status) {
    case 'pending': return 'bg-accent-orange';
    case 'processing': return 'bg-accent-yellow';
    case 'closed': return 'bg-accent-green';
  }
};

const getStatusBadge = (status: AlarmStatus): string => {
  switch (status) {
    case 'pending': return 'bg-accent-orange/15 text-accent-orange';
    case 'processing': return 'bg-accent-yellow/15 text-accent-yellow';
    case 'closed': return 'bg-accent-green/15 text-accent-green';
  }
};

const getStatusLabel = (status: AlarmStatus): string => {
  switch (status) {
    case 'pending': return '待处置';
    case 'processing': return '处置中';
    case 'closed': return '已闭环';
  }
};

const getParamName = (param: 'current' | 'voltage' | 'pressure' | 'time'): string => {
  switch (param) {
    case 'current': return '电流';
    case 'voltage': return '电压';
    case 'pressure': return '压力';
    case 'time': return '时间';
  }
};

export default function InspectionPage() {
  const {
    weldPoints,
    markInspectionFail, markInspectionPass,
    currentWorkpiece, dashboardStats,
    alarmRecords, disposalRecords, getDisposalsByAlarm,
  } = useWeldingStore();

  const [selectedPointId, setSelectedPointId] = useState<string | undefined>(() => {
    const defaultFail = weldPoints.find(p => p.status === 'defective');
    return (defaultFail || weldPoints.find(p => p.status === 'completed'))?.id;
  });

  const [disposalExpanded, setDisposalExpanded] = useState<Record<string, boolean>>({});

  const selectedPoint = useMemo(
    () => weldPoints.find(p => p.id === selectedPointId) || null,
    [selectedPointId, weldPoints]
  );

  const defectiveList = useMemo(
    () => weldPoints.filter(p => p.status === 'defective'),
    [weldPoints]
  );

  const ultrasonicData = useMemo(
    () => generateUltrasonicData(selectedPoint?.ultrasonicResult === 'fail' || selectedPoint?.status === 'defective'),
    [selectedPoint?.id, selectedPoint?.ultrasonicResult, selectedPoint?.status]
  );

  const completedPoints = weldPoints.filter((p) => p.status === 'completed' || p.status === 'repaired');
  const passedPoints = completedPoints.filter((p) => p.ultrasonicResult === 'pass');
  const failedPoints = weldPoints.filter((p) => p.ultrasonicResult === 'fail' || p.status === 'defective');
  const inspectedPoints = completedPoints.filter((p) => p.ultrasonicResult !== undefined);

  const passRate = dashboardStats.passRate || '0';
  const defectRate = inspectedPoints.length > 0 ? ((failedPoints.length / inspectedPoints.length) * 100).toFixed(1) : '0';

  const defectLabels: Record<string, string> = {
    cold: '虚焊',
    missing: '漏焊',
    spatter: '焊渣飞溅',
    param_abnormal: '参数异常',
    none: '无缺陷',
  };

  const handleMarkDefect = (id: string, type: DefectType) => {
    markInspectionFail(id, type, '质检工程师-王明');
    setSelectedPointId(id);
  };

  const handleMarkPass = (id: string) => {
    markInspectionPass(id, '质检工程师-王明');
    setSelectedPointId(id);
  };

  const relatedAlarms = useMemo(() => {
    if (!selectedPoint || !currentWorkpiece) return [];
    return alarmRecords.filter(
      a => a.weldPointIndex === selectedPoint.index && a.workpieceId === currentWorkpiece.id
    );
  }, [selectedPoint, currentWorkpiece, alarmRecords]);

  const toggleDisposalExpanded = (alarmId: string) => {
    setDisposalExpanded(prev => ({ ...prev, [alarmId]: !prev[alarmId] }));
  };

  const getPointAlarmStatus = (p: typeof weldPoints[number]): AlarmStatus => {
    if (!currentWorkpiece) return 'pending';
    const alarms = alarmRecords.filter(
      a => a.weldPointIndex === p.index && a.workpieceId === currentWorkpiece.id
    );
    if (alarms.length === 0) return 'pending';
    if (alarms.every(a => a.status === 'closed' || a.resolved)) return 'closed';
    if (alarms.some(a => a.status === 'processing')) return 'processing';
    return 'pending';
  };

  return (
    <div className="space-y-6">
      <div className="bg-accent-cyan/10 border border-accent-cyan/40 rounded-lg px-4 py-3 flex items-center gap-3">
        <div className="w-2 h-8 bg-accent-cyan rounded-full" />
        <span className="text-sm text-industrial-400">当前工件：</span>
        <span className="inline-flex items-center px-3 py-1 rounded-md bg-accent-cyan/20 text-accent-cyan font-mono font-semibold text-sm border border-accent-cyan/30">
          {currentWorkpiece?.code || '--'}
        </span>
        <span className="text-white font-medium">{currentWorkpiece?.name || '--'}</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center">
            <ScanLine className="w-6 h-6 mr-2 text-accent-cyan" />
            焊点质量检测
          </h2>
          <p className="text-sm text-industrial-400 mt-1">
            数量核对 · 超声检测 · 虚焊漏焊检查 · 不合格点自动进入补焊队列
          </p>
        </div>
        {failedPoints.length > 0 && (
          <div className="bg-accent-orange/10 border border-accent-orange/40 rounded-lg px-4 py-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-accent-orange" />
            <div className="text-sm">
              <span className="text-accent-orange font-medium">{failedPoints.length}个不合格</span>
              <span className="text-industrial-400 ml-2">已同步至补焊修整队列</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="panel">
          <div className="panel-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="data-label">焊点总数</p>
                <p className="text-3xl font-bold font-mono text-white mt-1">{weldPoints.length}</p>
              </div>
              <FileCheck className="w-8 h-8 text-industrial-500" />
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="data-label">已检测</p>
                <p className="text-3xl font-bold font-mono text-accent-cyan mt-1">{inspectedPoints.length}</p>
              </div>
              <Eye className="w-8 h-8 text-accent-cyan/50" />
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="data-label">合格率</p>
                <p className="text-3xl font-bold font-mono text-accent-green mt-1">{passRate}<span className="text-lg">%</span></p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-accent-green/50" />
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="data-label">缺陷点（含焊接异常）</p>
                <p className="text-3xl font-bold font-mono text-accent-red mt-1">{dashboardStats.defectivePoints || 0}</p>
              </div>
              <XCircle className="w-8 h-8 text-accent-red/50" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="panel lg:col-span-2">
          <div className="panel-header">
            <h3 className="text-white font-semibold flex items-center">
              <ScanLine className="w-4 h-4 mr-2 text-accent-cyan" />
              焊点分布图
            </h3>
            <span className="text-xs text-industrial-400">点击焊点查看详情并执行标记</span>
          </div>
          <div className="panel-body">
            <div className="bg-industrial-900 rounded-lg p-6 border border-industrial-700">
              <div className="grid grid-cols-12 gap-2">
                {weldPoints.map((p) => {
                  const hasAlarm = alarmRecords.some(a =>
                    a.weldPointIndex === p.index && a.workpieceId === currentWorkpiece?.id
                  );
                  const isSelected = selectedPoint?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPointId(p.id)}
                      className={`relative aspect-square rounded-md flex items-center justify-center text-xs font-mono font-medium transition-all ${
                        isSelected ? 'ring-2 ring-accent-cyan ring-offset-2 ring-offset-industrial-900 scale-105 z-10' : 'hover:scale-110'
                      } ${
                        p.ultrasonicResult === 'pass' ? 'bg-accent-green text-white' :
                        p.status === 'repaired' ? 'bg-emerald-600 text-white' :
                        p.ultrasonicResult === 'fail' || p.status === 'defective' ? 'bg-accent-red text-white' :
                        p.status === 'completed' ? 'bg-accent-cyan/70 text-white' :
                        p.status === 'welding' ? 'bg-accent-yellow text-white animate-pulse' :
                        'bg-industrial-700 text-industrial-400'
                      }`}
                    >
                      {p.index}
                      {(p.ultrasonicResult === 'fail' || p.status === 'defective') && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent-red rounded-full flex items-center justify-center border border-industrial-900">
                          <AlertTriangle className="w-2.5 h-2.5 text-white" />
                        </span>
                      )}
                      {hasAlarm && !(p.ultrasonicResult === 'fail' || p.status === 'defective') && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-accent-yellow rounded-full flex items-center justify-center border border-industrial-900">
                          <span className="text-[8px] font-bold text-industrial-900">!</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4 text-xs text-industrial-400">
              <span className="flex items-center"><span className="w-3 h-3 rounded bg-accent-green mr-1.5" />检测合格</span>
              <span className="flex items-center"><span className="w-3 h-3 rounded bg-emerald-600 mr-1.5" />补焊后复检合格</span>
              <span className="flex items-center"><span className="w-3 h-3 rounded bg-accent-red mr-1.5" />不合格/异常</span>
              <span className="flex items-center"><span className="w-3 h-3 rounded bg-accent-cyan/70 mr-1.5" />已完成待检测</span>
              <span className="flex items-center"><span className="w-3 h-3 rounded bg-industrial-700 mr-1.5" />未焊接</span>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3 className="text-white font-semibold flex items-center">
              <Activity className="w-4 h-4 mr-2 text-accent-cyan" />
              焊点详情
            </h3>
          </div>
          <div className="panel-body">
            {selectedPoint ? (
              <div className="space-y-4">
                <div className="bg-industrial-900 rounded-lg p-4 border border-industrial-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold font-mono text-white">焊点 #{selectedPoint.index}</span>
                    <span className={`inline-flex items-center text-sm px-2.5 py-1 rounded ${
                      selectedPoint.ultrasonicResult === 'pass' ? 'bg-accent-green/20 text-accent-green' :
                      selectedPoint.ultrasonicResult === 'fail' || selectedPoint.status === 'defective' ? 'bg-accent-red/20 text-accent-red' :
                      selectedPoint.status === 'repaired' ? 'bg-emerald-600/20 text-emerald-400' :
                      'bg-industrial-700 text-industrial-300'
                    }`}>
                      {selectedPoint.ultrasonicResult === 'pass' ? '✓ 检测合格' :
                       selectedPoint.status === 'repaired' ? '✓ 补焊复检合格' :
                       selectedPoint.ultrasonicResult === 'fail' || selectedPoint.status === 'defective' ? '✗ 不合格/异常' :
                       '待检测'}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1.5 border-b border-industrial-700">
                      <span className="text-industrial-400">位置坐标</span>
                      <span className="font-mono text-white">({selectedPoint.position.x}, {selectedPoint.position.y})</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-industrial-700">
                      <span className="text-industrial-400">焊接状态</span>
                      <span className="text-white capitalize">{selectedPoint.status}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-industrial-700">
                      <span className="text-industrial-400">缺陷类型</span>
                      <span className={selectedPoint.defectType && selectedPoint.defectType !== 'none' ? 'text-accent-red' : 'text-accent-green'}>
                        {selectedPoint.defectType ? defectLabels[selectedPoint.defectType] : '--'}
                      </span>
                    </div>
                    {selectedPoint.paramAbnormal && (
                      <div className="flex justify-between py-1.5 border-b border-industrial-700">
                        <span className="text-industrial-400">参数异常</span>
                        <span className="text-accent-orange font-mono text-xs">
                          {selectedPoint.paramAbnormal.param}={selectedPoint.paramAbnormal.value}
                          <span className="text-industrial-500 ml-1">
                            (范围{selectedPoint.paramAbnormal.min}~{selectedPoint.paramAbnormal.max})
                          </span>
                        </span>
                      </div>
                    )}
                    {selectedPoint.inspector && (
                      <div className="flex justify-between py-1.5 border-b border-industrial-700">
                        <span className="text-industrial-400">处理人</span>
                        <span className="text-white text-xs">{selectedPoint.inspector}</span>
                      </div>
                    )}
                    {selectedPoint.inspectionTime && (
                      <div className="flex justify-between py-1.5">
                        <span className="text-industrial-400">处理时间</span>
                        <span className="text-white text-xs font-mono">
                          {(selectedPoint.inspectionTime as unknown as Date).toLocaleString?.() || String(selectedPoint.inspectionTime)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {relatedAlarms.length > 0 && (
                  <div className="space-y-2">
                    {relatedAlarms.map((alarm) => {
                      const disposals = getDisposalsByAlarm(alarm.id);
                      const isExpanded = disposalExpanded[alarm.id] ?? true;
                      const maxPhaseIdx = disposals.length > 0
                        ? PHASE_ORDER.findIndex(p => disposals.some(d => d.phase === p.phase))
                        : -1;
                      return (
                        <div key={alarm.id} className="bg-industrial-800/80 border border-industrial-700 rounded-lg overflow-hidden">
                          <button
                            onClick={() => toggleDisposalExpanded(alarm.id)}
                            className="w-full px-3 py-2 flex items-center justify-between hover:bg-industrial-700/50 transition-colors"
                          >
                            <div className="flex items-center gap-2 text-left">
                              <FileText className="w-4 h-4 text-accent-cyan" />
                              <div>
                                <p className="text-xs font-medium text-industrial-200 flex items-center gap-1.5">
                                  处置记录
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] ${getStatusBadge(alarm.status)}`}>
                                    {getStatusLabel(alarm.status)}
                                  </span>
                                </p>
                                <p className="text-[11px] text-industrial-500">告警#{alarm.id.slice(-6)}</p>
                              </div>
                            </div>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-industrial-400" /> : <ChevronDown className="w-4 h-4 text-industrial-400" />}
                          </button>
                          {isExpanded && (
                            <div className="px-3 pb-3 pt-1 space-y-3 border-t border-industrial-700/50">
                              <div className="bg-industrial-900/60 rounded-lg p-2.5">
                                <div className="flex items-center gap-1.5">
                                  {PHASE_ORDER.map((phaseItem, idx) => {
                                    const disp = disposals.find(d => d.phase === phaseItem.phase);
                                    const isActive = disp !== undefined;
                                    const isLast = idx === PHASE_ORDER.length - 1;
                                    return (
                                      <div key={phaseItem.phase} className="flex items-center gap-1.5 flex-1 min-w-0">
                                        <div className="flex flex-col items-center flex-shrink-0">
                                          <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                                            isActive
                                              ? `${getStatusColor(disp!.status)} border-transparent`
                                              : 'bg-industrial-700 border-industrial-600'
                                          }`}>
                                            {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                          </div>
                                          <span className={`text-[9px] mt-1 whitespace-nowrap ${isActive ? 'text-industrial-200' : 'text-industrial-500'}`}>
                                            {phaseItem.label}
                                          </span>
                                        </div>
                                        {!isLast && (
                                          <div className={`h-0.5 flex-1 ${idx < maxPhaseIdx ? 'bg-accent-cyan/50' : 'bg-industrial-700'}`} />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                {disposals.map((d) => (
                                  <div key={d.id} className="flex items-start gap-2 text-[11px]">
                                    <span className={`w-2 h-2 mt-1 rounded-full flex-shrink-0 ${getStatusColor(d.status)}`} />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-accent-cyan font-medium">
                                          {PHASE_ORDER.find(p => p.phase === d.phase)?.label || d.phase}
                                        </span>
                                        <span className="text-industrial-500">·</span>
                                        <span className="text-industrial-300">{d.operator}</span>
                                        <span className={`ml-auto inline-flex px-1.5 py-0.5 rounded text-[10px] flex-shrink-0 ${getStatusBadge(d.status)}`}>
                                          {getStatusLabel(d.status)}
                                        </span>
                                      </div>
                                      {d.note && (
                                        <p className="text-industrial-400 mt-0.5 leading-tight">{d.note}</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                {disposals.length === 0 && (
                                  <p className="text-[11px] text-industrial-500 italic">暂无处置记录</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {(selectedPoint.status === 'completed' || selectedPoint.status === 'repaired' || selectedPoint.status === 'defective') && (
                  <div className="space-y-2">
                    <p className="text-sm text-industrial-400">检测操作（标记后立即联动补焊队列）</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => handleMarkPass(selectedPoint.id)} className="btn-primary text-sm flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />标记合格
                      </button>
                      {DEFECT_BUTTONS.map((btn) => (
                        <button
                          key={btn.type}
                          onClick={() => handleMarkDefect(selectedPoint.id, btn.type)}
                          className={`${btn.className} text-sm flex items-center justify-center gap-1`}
                        >
                          {btn.type === 'param_abnormal' ? <AlertTriangle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPoint.status === 'defective' && (
                  <div className="bg-industrial-700/50 rounded-lg p-2.5 border border-industrial-600">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-industrial-300 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-accent-cyan" />
                        已加入补焊待处理队列
                      </span>
                      <button className="text-accent-cyan hover:text-cyan-400 text-xs font-medium flex items-center">
                        前往补焊 <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 text-industrial-500">
                <ScanLine className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>请在左侧选择一个焊点</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3 className="text-white font-semibold flex items-center">
            <Activity className="w-4 h-4 mr-2 text-accent-cyan" />
            超声波检测波形图 {selectedPoint && <span className="text-industrial-400 font-normal text-sm ml-2">（焊点 #{selectedPoint.index} · {
              selectedPoint.ultrasonicResult === 'pass' ? '合格曲线' :
              selectedPoint.ultrasonicResult === 'fail' || selectedPoint.status === 'defective' ? '异常曲线' : '参考曲线'
            }）</span>}
          </h3>
        </div>
        <div className="panel-body">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ultrasonicData}>
                <defs>
                  <linearGradient id="ultraGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} label={{ value: '时间 (μs)', position: 'insideBottom', offset: -5, fill: '#64748B', fontSize: 10 }} />
                <YAxis stroke="#64748B" fontSize={10} domain={[0, 150]}
                  label={{ value: '幅度 (dB)', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 10 }} />
                <ReferenceLine y={80} stroke="#EF4444" strokeDasharray="4 4" strokeWidth={1} label={{ value: '阈值线', fill: '#EF4444', fontSize: 10, position: 'right' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px' }}
                  labelStyle={{ color: '#E2E8F0' }}
                />
                <Area type="monotone" dataKey="amplitude" stroke="#06B6D4" strokeWidth={1.5} fill="url(#ultraGrad2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {selectedPoint?.paramAbnormal && (
            <div className="mt-3 bg-red-500/20 border border-red-500/40 rounded-md p-3 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-accent-red flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="text-accent-red font-medium">⚠ 参数异常：</span>
                <span className="text-industrial-200 font-mono">
                  {getParamName(selectedPoint.paramAbnormal.param)}={selectedPoint.paramAbnormal.value}
                </span>
                <span className="text-industrial-400 ml-2">
                  （正常范围 {selectedPoint.paramAbnormal.min}~{selectedPoint.paramAbnormal.max}）
                </span>
                <span className="text-accent-red font-medium ml-2">
                  超出{selectedPoint.paramAbnormal.value < selectedPoint.paramAbnormal.min ? '下限' : '上限'}
                </span>
                <span className="text-accent-orange font-mono ml-1">
                  {Math.abs(selectedPoint.paramAbnormal.value - (selectedPoint.paramAbnormal.value < selectedPoint.paramAbnormal.min ? selectedPoint.paramAbnormal.min : selectedPoint.paramAbnormal.max))}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3 className="text-white font-semibold flex items-center">
            <AlertTriangle className="w-4 h-4 mr-2 text-accent-red" />
            不合格 / 异常焊点列表（自动同步至补焊队列）
          </h3>
          <span className="text-xs text-industrial-400">共{defectiveList.length}项</span>
        </div>
        <div className="panel-body p-0">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-industrial-400 border-b border-industrial-700">
                <th className="px-4 py-3 font-medium">焊点编号</th>
                <th className="px-4 py-3 font-medium">位置</th>
                <th className="px-4 py-3 font-medium">来源</th>
                <th className="px-4 py-3 font-medium">缺陷/异常类型</th>
                <th className="px-4 py-3 font-medium">处理人</th>
                <th className="px-4 py-3 font-medium">处置进度</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {defectiveList.length > 0 ? defectiveList.map((p) => {
                const alarm = alarmRecords.find(a =>
                  a.weldPointIndex === p.index && a.workpieceId === currentWorkpiece?.id
                );
                const status = getPointAlarmStatus(p);
                return (
                  <tr key={p.id} className="border-b border-industrial-800 hover:bg-industrial-800/50 text-sm">
                    <td className="px-4 py-3 font-mono text-accent-orange font-bold">#{p.index}</td>
                    <td className="px-4 py-3 font-mono text-industrial-300 text-xs">({p.position.x}, {p.position.y})</td>
                    <td className="px-4 py-3 text-xs">
                      {alarm?.source === 'welding' ? (
                        <span className="text-accent-orange">焊接过程异常</span>
                      ) : (
                        <span className="text-industrial-300">质检检出</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-accent-red">{p.defectType ? defectLabels[p.defectType] : p.paramAbnormal ? `参数异常(${getParamName(p.paramAbnormal.param)})` : '--'}</td>
                    <td className="px-4 py-3 text-xs text-industrial-300">{p.inspector || alarm?.createdBy || '--'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded ${getStatusBadge(status)}`}>
                        {getStatusLabel(status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center text-xs px-2 py-0.5 rounded bg-accent-orange/15 text-accent-orange">
                        待补焊
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedPointId(p.id)}
                        className="text-accent-cyan hover:text-cyan-400 text-xs flex items-center"
                      >查看详情 <ArrowRight className="w-3 h-3 ml-1" /></button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-industrial-500 text-sm">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-accent-green/50" />
                    暂无非合格焊点
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
