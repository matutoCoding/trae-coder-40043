import { useState, useMemo } from 'react';
import { useWeldingStore } from '@/store/weldingStore';
import {
  History, Package, Clipboard, Bot, ScanLine, Wrench, Timer,
  Settings, ChevronRight, FileText, AlertTriangle, CheckCircle2,
  Clock, User, Layers, Filter, XCircle, ShieldCheck
} from 'lucide-react';
import type { TraceEvent, ProcessPhase } from '@/types';

const phaseIcons: Record<ProcessPhase, React.ElementType> = {
  loading: Package,
  fixture: Clipboard,
  welding: Bot,
  inspection: ScanLine,
  repair: Wrench,
  cycle: Timer,
  maintenance: Settings,
  quality: ShieldCheck,
};

const phaseLabels: Record<ProcessPhase, string> = {
  loading: '工件上料',
  fixture: '夹具定位',
  welding: '机器人焊接',
  inspection: '焊点检测',
  repair: '补焊修整',
  cycle: '节拍记录',
  maintenance: '设备维护',
  quality: '质量判定',
};

const phaseColors: Record<ProcessPhase, string> = {
  loading: 'bg-sky-500 text-white',
  fixture: 'bg-indigo-500 text-white',
  welding: 'bg-accent-cyan text-industrial-900',
  inspection: 'bg-violet-500 text-white',
  repair: 'bg-accent-orange text-industrial-900',
  cycle: 'bg-emerald-500 text-white',
  maintenance: 'bg-accent-yellow text-industrial-900',
  quality: 'bg-teal-500 text-white',
};

const phaseLineColors: Record<ProcessPhase, string> = {
  loading: 'bg-sky-500/40',
  fixture: 'bg-indigo-500/40',
  welding: 'bg-accent-cyan/40',
  inspection: 'bg-violet-500/40',
  repair: 'bg-accent-orange/40',
  cycle: 'bg-emerald-500/40',
  maintenance: 'bg-accent-yellow/40',
  quality: 'bg-teal-500/40',
};

const workpieceOptions = [
  { code: 'CAR-20250115-0176', id: 'wp-001', status: '完成生产', desc: '左前侧围总成 - 当前工件' },
  { code: 'CAR-20250115-0175', id: 'wp-002', status: '完成生产', desc: '左前侧围总成 - 含2个缺陷补焊' },
  { code: 'CAR-20250115-0174', id: 'wp-003', status: '完成生产', desc: '右前侧围总成' },
  { code: 'CAR-20250115-0173', id: 'wp-004', status: '完成生产', desc: '左后侧围总成' },
  { code: 'CAR-20250115-0172', id: 'wp-005', status: '节拍超时', desc: '前底板总成 - 参数异常' },
];

export default function TraceabilityPage() {
  const { traceEvents, weldPoints, alarmRecords, repairRecords, currentWorkpiece, fixture, dashboardStats } = useWeldingStore();

  const [selectedWorkpieceId, setSelectedWorkpieceId] = useState('wp-001');
  const [filterPhase, setFilterPhase] = useState<ProcessPhase | 'all'>('all');
  const [showDetail, setShowDetail] = useState<TraceEvent | null>(null);

  const selectedWorkpiece = workpieceOptions.find(w => w.id === selectedWorkpieceId) || workpieceOptions[0];

  const filteredEvents = useMemo(() => {
    return traceEvents
      .filter(e => selectedWorkpieceId === 'wp-001' ? e.workpieceId === currentWorkpiece?.id : true)
      .filter(e => filterPhase === 'all' ? true : e.phase === filterPhase)
      .sort((a, b) => {
        const ta = typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : a.timestamp.getTime();
        const tb = typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : b.timestamp.getTime();
        return ta - tb;
      });
  }, [traceEvents, filterPhase, selectedWorkpieceId, currentWorkpiece?.id]);

  const stats = useMemo(() => {
    const phaseCounts: Record<ProcessPhase, number> = {
      loading: 0, fixture: 0, welding: 0, inspection: 0, repair: 0, cycle: 0, maintenance: 0, quality: 0,
    };
    traceEvents.forEach(e => phaseCounts[e.phase]++);
    return phaseCounts;
  }, [traceEvents]);

  const totalDuration = useMemo(() => {
    if (filteredEvents.length < 2) return 0;
    const first = filteredEvents[0];
    const last = filteredEvents[filteredEvents.length - 1];
    const tf = typeof first.timestamp === 'string' ? new Date(first.timestamp).getTime() : first.timestamp.getTime();
    const tl = typeof last.timestamp === 'string' ? new Date(last.timestamp).getTime() : last.timestamp.getTime();
    return Math.round((tl - tf) / 1000);
  }, [filteredEvents]);

  const passPoints = weldPoints.filter(p => p.ultrasonicResult === 'pass' || p.status === 'repaired');
  const failPoints = weldPoints.filter(p => p.status === 'defective' || p.ultrasonicResult === 'fail');

  const formatTime = (ts: Date | string) => {
    if (typeof ts === 'string') return new Date(ts).toLocaleString('zh-CN');
    return ts.toLocaleString('zh-CN');
  };
  const formatHMS = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}时${m}分${s}秒`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center">
            <History className="w-6 h-6 mr-2 text-accent-cyan" />
            工件批次生产追溯
          </h2>
          <p className="text-sm text-industrial-400 mt-1">
            按工件编号追溯上料、夹紧、焊接、检测、补焊、节拍、维护全流程记录，时间线串联各阶段时间与处理人
          </p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3 className="text-white font-semibold flex items-center">
            <Layers className="w-4 h-4 mr-2 text-accent-cyan" />
            工件选择器
          </h3>
          <div className="text-xs text-industrial-400">共 {workpieceOptions.length} 件可追溯工件</div>
        </div>
        <div className="panel-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {workpieceOptions.map((wp) => {
              const isSelected = wp.id === selectedWorkpieceId;
              const isCurrent = wp.id === 'wp-001';
              return (
                <button
                  key={wp.id}
                  onClick={() => setSelectedWorkpieceId(wp.id)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-accent-cyan/10 border-accent-cyan ring-2 ring-accent-cyan/20'
                      : 'bg-industrial-900 border-industrial-700 hover:border-industrial-600'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <p className={`text-xs font-mono font-bold ${isSelected ? 'text-accent-cyan' : 'text-white'}`}>
                      {wp.code}
                    </p>
                    {isCurrent && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-accent-green/20 rounded text-accent-green">
                        当前
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-industrial-300 mb-2">{wp.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] ${
                      wp.status.includes('超时') || wp.status.includes('异常') ? 'text-accent-red' : 'text-accent-green'
                    }`}>
                      {wp.status}
                    </span>
                    {isSelected && <ChevronRight className="w-3.5 h-3.5 text-accent-cyan" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="panel">
          <div className="panel-body">
            <p className="data-label">工件编号</p>
            <p className="mt-1 font-mono text-sm text-accent-cyan font-bold">{selectedWorkpiece.code}</p>
            <p className="mt-1 text-[11px] text-industrial-500">{selectedWorkpiece.desc}</p>
          </div>
        </div>
        <div className="panel">
          <div className="panel-body">
            <p className="data-label">总耗时</p>
            <p className="mt-1 text-xl font-mono text-white font-bold">{formatHMS(totalDuration || 287)}</p>
            <p className="mt-1 text-[11px] text-industrial-500">上料→完成</p>
          </div>
        </div>
        <div className="panel">
          <div className="panel-body">
            <p className="data-label">焊点数量</p>
            <p className="mt-1 text-xl font-mono text-white font-bold">{weldPoints.length}</p>
            <p className="mt-1 text-[11px] text-accent-green">{passPoints.length} 合格</p>
          </div>
        </div>
        <div className="panel">
          <div className="panel-body">
            <p className="data-label">缺陷/异常点</p>
            <p className="mt-1 text-xl font-mono text-accent-red font-bold">{failPoints.length}</p>
            <p className="mt-1 text-[11px] text-accent-orange">{repairRecords.length} 次补焊</p>
          </div>
        </div>
        <div className="panel">
          <div className="panel-body">
            <p className="data-label">告警记录</p>
            <p className="mt-1 text-xl font-mono text-accent-orange font-bold">{alarmRecords.length}</p>
            <p className="mt-1 text-[11px] text-accent-green">
              {alarmRecords.filter(a => a.resolved).length} 已解决
            </p>
          </div>
        </div>
        <div className="panel">
          <div className="panel-body">
            <p className="data-label">处理人员</p>
            <p className="mt-1 text-xl font-mono text-white font-bold">6</p>
            <p className="mt-1 text-[11px] text-industrial-500">覆盖全流程</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="panel">
            <div className="panel-header">
              <h3 className="text-white font-semibold flex items-center">
                <Filter className="w-4 h-4 mr-2 text-accent-cyan" />
                阶段筛选
              </h3>
              <button
                onClick={() => setFilterPhase('all')}
                className={`text-[10px] px-2 py-0.5 rounded ${
                  filterPhase === 'all'
                    ? 'bg-accent-cyan/20 text-accent-cyan'
                    : 'text-industrial-500 hover:text-industrial-300'
                }`}
              >全部</button>
            </div>
            <div className="panel-body space-y-1.5">
              {(Object.keys(phaseLabels) as ProcessPhase[]).map(phase => {
                const Icon = phaseIcons[phase];
                const active = filterPhase === phase;
                const count = stats[phase];
                return (
                  <button
                    key={phase}
                    onClick={() => setFilterPhase(active ? 'all' : phase)}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-md transition-all ${
                      active ? 'bg-industrial-800 border border-accent-cyan/40' : 'hover:bg-industrial-800/60'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${phaseColors[phase]}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="flex-1 text-left">
                      <span className={`block text-xs ${active ? 'text-accent-cyan font-medium' : 'text-industrial-200'}`}>
                        {phaseLabels[phase]}
                      </span>
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      count > 0 ? 'bg-industrial-700 text-industrial-200' : 'text-industrial-600'
                    }`}>
                      {count > 0 ? count : '-'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3 className="text-white font-semibold flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-accent-yellow" />
                异常 & 告警
              </h3>
            </div>
            <div className="panel-body space-y-2">
              {alarmRecords.length > 0 ? alarmRecords.map(alarm => {
                const wp = weldPoints.find(p => p.index === alarm.weldPointIndex);
                return (
                  <div key={alarm.id} className={`rounded-lg p-2.5 border text-xs ${
                    alarm.resolved
                      ? 'bg-accent-green/5 border-accent-green/20'
                      : 'bg-accent-red/10 border-accent-red/30'
                  }`}>
                    <div className="flex items-start justify-between mb-1">
                      <p className={`font-medium flex items-center gap-1 ${
                        alarm.resolved ? 'text-accent-green' : 'text-accent-red'
                      }`}>
                        {alarm.resolved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                        {alarm.title}
                      </p>
                    </div>
                    <p className="text-industrial-400 mt-1">{alarm.description}</p>
                    {alarm.weldPointIndex && (
                      <p className="mt-1 text-[10px] text-industrial-500 font-mono">
                        焊点#{alarm.weldPointIndex} · {alarm.createdBy}
                      </p>
                    )}
                    {alarm.resolved && alarm.resolvedBy && (
                      <p className="mt-1 text-[10px] text-accent-green/80">
                        ✓ {alarm.resolvedBy} 于 {formatTime(alarm.resolvedAt!)} 解决
                      </p>
                    )}
                  </div>
                );
              }) : (
                <p className="text-center text-industrial-500 text-xs py-4">无异常告警</p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="panel h-full">
            <div className="panel-header">
              <h3 className="text-white font-semibold flex items-center">
                <Clock className="w-4 h-4 mr-2 text-accent-cyan" />
                全流程追溯时间线
              </h3>
              <span className="text-xs text-industrial-400">
                {selectedWorkpiece.code} · {filteredEvents.length} 条记录
              </span>
            </div>
            <div className="panel-body">
              {filteredEvents.length > 0 ? (
                <div className="relative pl-2">
                  {filteredEvents.map((event, idx) => {
                    const Icon = phaseIcons[event.phase];
                    const isLast = idx === filteredEvents.length - 1;
                    const isAbnormal = event.abnormal;
                    const isSelected = showDetail?.id === event.id;

                    return (
                      <div key={event.id} className="relative flex gap-4 pb-6">
                        {!isLast && (
                          <div className={`absolute left-[1.05rem] top-10 w-0.5 h-full ${phaseLineColors[event.phase]}`} />
                        )}
                        <div
                          className={`relative z-10 w-[2.6rem] h-[2.6rem] rounded-full flex items-center justify-center shrink-0 ring-4 ring-industrial-800 ${
                            isAbnormal
                              ? 'bg-accent-red text-white animate-pulse'
                              : phaseColors[event.phase]
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>

                        <div
                          onClick={() => setShowDetail(isSelected ? null : event)}
                          className={`flex-1 rounded-lg border p-3.5 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-industrial-800 border-accent-cyan/60'
                              : isAbnormal
                              ? 'bg-accent-red/5 border-accent-red/30 hover:border-accent-red/60'
                              : 'bg-industrial-900 border-industrial-700 hover:border-industrial-600'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded ${phaseColors[event.phase]} opacity-90`}>
                                {phaseLabels[event.phase]}
                              </span>
                              {isAbnormal && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-accent-red/20 text-accent-red flex items-center">
                                  <AlertTriangle className="w-3 h-3 mr-0.5" />
                                  异常
                                </span>
                              )}
                              {event.status && !isAbnormal && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-accent-green/20 text-accent-green flex items-center">
                                  <CheckCircle2 className="w-3 h-3 mr-0.5" />
                                  {event.status}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-industrial-500 font-mono shrink-0 mt-0.5">
                              #{idx + 1}
                            </span>
                          </div>

                          <p className="text-sm text-white font-medium mb-1.5">{event.description}</p>

                          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-industrial-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(event.timestamp)}
                            </span>
                            {event.operator && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {event.operator}
                              </span>
                            )}
                            {event.weldPointIndex && (
                              <span className="flex items-center gap-1 font-mono">
                                <FileText className="w-3 h-3" />
                                焊点 #{event.weldPointIndex}
                              </span>
                            )}
                            {event.duration && (
                              <span className="flex items-center gap-1">
                                <Timer className="w-3 h-3" />
                                耗时 {event.duration}s
                              </span>
                            )}
                            {event.detail && typeof event.detail === 'object' && 'program' in (event.detail as any) && (
                              <span className="flex items-center gap-1">
                                <Bot className="w-3 h-3" />
                                {(event.detail as any).program}
                              </span>
                            )}
                          </div>

                          {isSelected && (
                            <div className="mt-3 pt-3 border-t border-industrial-700 space-y-1.5 text-[11px]">
                              {event.detail ? (
                                Object.entries(event.detail as Record<string, any>).map(([k, v]) => (
                                  <div key={k} className="flex justify-between gap-4">
                                    <span className="text-industrial-500">{k}</span>
                                    <span className="text-industrial-200 font-mono">{String(v)}</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-industrial-500">无额外详细信息</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 text-industrial-500">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">{filterPhase === 'all' ? '暂无追溯记录' : '该阶段暂无记录'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3 className="text-white font-semibold flex items-center">
            <FileText className="w-4 h-4 mr-2 text-accent-cyan" />
            关联焊点质量明细
          </h3>
          <span className="text-xs text-industrial-400">
            合格率 {dashboardStats.passRate}% · {weldPoints.length} 个焊点
          </span>
        </div>
        <div className="panel-body p-0 max-h-80 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-industrial-800/95 backdrop-blur">
              <tr className="text-left text-industrial-400 border-b border-industrial-700">
                <th className="px-4 py-2.5 font-medium">焊点#</th>
                <th className="px-4 py-2.5 font-medium">位置</th>
                <th className="px-4 py-2.5 font-medium">状态</th>
                <th className="px-4 py-2.5 font-medium">缺陷类型</th>
                <th className="px-4 py-2.5 font-medium">参数异常</th>
                <th className="px-4 py-2.5 font-medium">处理人/时间</th>
                <th className="px-4 py-2.5 font-medium">关联事件</th>
              </tr>
            </thead>
            <tbody>
              {weldPoints.map(p => {
                const relatedEvents = traceEvents.filter(e => e.weldPointIndex === p.index);
                const alarms = alarmRecords.filter(a => a.weldPointIndex === p.index);
                return (
                  <tr key={p.id} className="border-b border-industrial-800 hover:bg-industrial-800/50">
                    <td className="px-4 py-2.5 font-mono font-bold text-white">#{p.index}</td>
                    <td className="px-4 py-2.5 font-mono text-industrial-400">({p.position.x}, {p.position.y})</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] ${
                        p.ultrasonicResult === 'pass' || p.status === 'repaired'
                          ? 'bg-accent-green/20 text-accent-green'
                          : p.status === 'defective' || p.ultrasonicResult === 'fail'
                          ? 'bg-accent-red/20 text-accent-red'
                          : p.status === 'completed'
                          ? 'bg-accent-cyan/20 text-accent-cyan'
                          : 'bg-industrial-700 text-industrial-400'
                      }`}>
                        {p.status === 'repaired' ? '补焊合格' :
                         p.ultrasonicResult === 'pass' ? '检测合格' :
                         p.status === 'defective' ? '待补焊' :
                         p.status === 'completed' ? '完成待检' : p.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {p.defectType && p.defectType !== 'none' ? (
                        <span className="text-accent-red">{p.defectType}</span>
                      ) : (
                        <span className="text-industrial-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {p.paramAbnormal ? (
                        <span className="text-accent-orange font-mono flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {p.paramAbnormal.param}={p.paramAbnormal.value}
                        </span>
                      ) : (
                        <span className="text-industrial-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {p.inspector ? (
                        <div>
                          <div className="text-industrial-200">{p.inspector}</div>
                          {p.inspectionTime && (
                            <div className="text-industrial-500 font-mono text-[10px]">
                              {formatTime(p.inspectionTime)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-industrial-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {relatedEvents.slice(0, 3).map(e => (
                          <span key={e.id} className={`text-[9px] px-1.5 py-0.5 rounded ${phaseColors[e.phase]} opacity-90`}>
                            {phaseLabels[e.phase]}
                          </span>
                        ))}
                        {alarms.map(a => (
                          <span key={a.id} className="text-[9px] px-1.5 py-0.5 rounded bg-accent-red/20 text-accent-red">
                            告警
                          </span>
                        ))}
                        {relatedEvents.length === 0 && alarms.length === 0 && (
                          <span className="text-industrial-500">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
