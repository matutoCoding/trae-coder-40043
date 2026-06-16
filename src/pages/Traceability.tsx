import { useState, useMemo, useRef, useEffect } from 'react';
import { useWeldingStore } from '@/store/weldingStore';
import {
  GitCompare, ArrowRightLeft, ChevronDown, ChevronUp, Clock,
  AlertTriangle, CheckCircle, Users, Radio, Zap, Eye,
  Package, Clipboard, Bot, ScanLine, Wrench, Settings,
  ShieldCheck, Timer, History, ChevronRight, ArrowRight,
  User, FileText, XCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell
} from 'recharts';
import type {
  TraceEvent, ProcessPhase, AlarmRecord, DisposalRecord,
  WeldPoint, WorkpieceComparison, AlarmStatus
} from '@/types';

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
  loading: '上料',
  fixture: '夹具',
  welding: '焊接',
  inspection: '检测',
  repair: '补焊',
  cycle: '节拍',
  maintenance: '维护',
  quality: '质量',
};

const phaseColors: Record<ProcessPhase, string> = {
  loading: 'bg-sky-500 text-white',
  fixture: 'bg-indigo-500 text-white',
  welding: 'bg-cyan-400 text-slate-900',
  inspection: 'bg-violet-500 text-white',
  repair: 'bg-orange-500 text-slate-900',
  cycle: 'bg-emerald-500 text-white',
  maintenance: 'bg-yellow-500 text-slate-900',
  quality: 'bg-teal-500 text-white',
};

const phaseLineColors: Record<ProcessPhase, string> = {
  loading: 'bg-sky-500/40',
  fixture: 'bg-indigo-500/40',
  welding: 'bg-cyan-400/40',
  inspection: 'bg-violet-500/40',
  repair: 'bg-orange-500/40',
  cycle: 'bg-emerald-500/40',
  maintenance: 'bg-yellow-500/40',
  quality: 'bg-teal-500/40',
};

const phaseChartColors: Record<ProcessPhase, string> = {
  loading: '#0EA5E9',
  fixture: '#6366F1',
  welding: '#22D3EE',
  inspection: '#8B5CF6',
  repair: '#F97316',
  cycle: '#10B981',
  maintenance: '#EAB308',
  quality: '#14B8A6',
};

const disposalPhaseLabels: Record<DisposalRecord['phase'], string> = {
  report: '上报',
  assign: '分派',
  repair: '补焊',
  reinspect: '复检',
  close: '闭环',
};

const disposalPhaseIcons: Record<DisposalRecord['phase'], React.ElementType> = {
  report: Radio,
  assign: Users,
  repair: Wrench,
  reinspect: ScanLine,
  close: CheckCircle,
};

const allPhases: ProcessPhase[] = [
  'loading', 'fixture', 'welding', 'inspection',
  'repair', 'maintenance', 'cycle', 'quality'
];

function formatTime(ts: Date | string | undefined): string {
  if (!ts) return '-';
  const d = typeof ts === 'string' ? new Date(ts) : ts;
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDateTime(ts: Date | string | undefined): string {
  if (!ts) return '-';
  const d = typeof ts === 'string' ? new Date(ts) : ts;
  return d.toLocaleString('zh-CN');
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}分${s}秒`;
}

function alarmStatusColor(status: AlarmStatus): string {
  switch (status) {
    case 'pending': return 'bg-orange-500';
    case 'processing': return 'bg-yellow-500';
    case 'closed': return 'bg-emerald-500';
  }
}

function defectTypeLabel(t: string | undefined): string {
  if (!t || t === 'none') return '-';
  const map: Record<string, string> = {
    cold: '虚焊', missing: '漏焊', spatter: '焊渣',
    param_abnormal: '参数异常'
  };
  return map[t] || t;
}

type WorkpieceSelectProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; code: string; name: string }[];
  accent?: 'A' | 'B';
};

function WorkpieceSelect({ label, value, onChange, options, accent = 'A' }: WorkpieceSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.id === value);
  const borderColor = accent === 'A' ? 'border-cyan-400/50' : 'border-fuchsia-400/50';
  const focusRing = accent === 'A' ? 'ring-cyan-400/30' : 'ring-fuchsia-400/30';
  const textAccent = accent === 'A' ? 'text-cyan-400' : 'text-fuchsia-400';
  const dotColor = accent === 'A' ? 'bg-cyan-400' : 'bg-fuchsia-400';

  return (
    <div className="flex-1 relative">
      <div className={`text-[11px] ${textAccent} mb-1.5 font-medium flex items-center gap-1.5`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        工件 {label}
      </div>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between bg-slate-800 ${borderColor} border rounded-lg px-3.5 py-2.5 text-left hover:bg-slate-750 transition-all ${open ? focusRing : ''}`}
      >
        <div className="min-w-0">
          <div className={`font-mono text-sm font-bold truncate ${textAccent}`}>
            {selected?.code || '请选择工件'}
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            {selected?.name || '-'}
          </div>
        </div>
        {open
          ? <ChevronUp className={`w-4 h-4 shrink-0 ${textAccent}`} />
          : <ChevronDown className={`w-4 h-4 shrink-0 text-slate-500`} />
        }
      </button>
      {open && (
        <div className={`absolute z-20 top-full mt-1.5 w-full max-h-64 overflow-y-auto bg-slate-800 border ${borderColor} rounded-lg shadow-xl`}>
          {options.map(opt => (
            <button
              key={opt.id}
              onClick={() => { onChange(opt.id); setOpen(false); }}
              className={`w-full text-left px-3.5 py-2.5 hover:bg-slate-700 transition-colors ${
                opt.id === value ? 'bg-slate-700/80' : ''
              }`}
            >
              <div className={`font-mono text-xs font-bold truncate ${opt.id === value ? textAccent : 'text-white'}`}>
                {opt.code}
              </div>
              <div className="text-[10px] text-slate-400 truncate">{opt.name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type OverviewCardProps = {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
};

function OverviewCard({ icon: Icon, label, value, sub, color }: OverviewCardProps) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <span className="text-[11px] text-slate-400 font-medium">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color.replace('text-', 'bg-')}/15`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
      <div className={`font-mono text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

type DisposalFlowProps = {
  disposals: DisposalRecord[];
};

function DisposalFlow({ disposals }: DisposalFlowProps) {
  const ordered: DisposalRecord['phase'][] = ['report', 'assign', 'repair', 'reinspect', 'close'];
  const steps = ordered.map(phase => disposals.find(d => d.phase === phase));

  return (
    <div className="mt-3 pt-3 border-t border-slate-700/70 ml-2">
      <div className="text-[10px] text-slate-500 mb-2 flex items-center gap-1">
        <Eye className="w-3 h-3" />
        处置流程
      </div>
      <div className="flex items-start gap-1 overflow-x-auto pb-1">
        {ordered.map((phase, idx) => {
          const record = steps[idx];
          const StepIcon = disposalPhaseIcons[phase];
          const isDone = !!record;
          const isLast = idx === ordered.length - 1;

          return (
            <div key={phase} className="flex items-start shrink-0">
              <div
                className={`relative group flex flex-col items-center w-20 ${
                  isDone ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isDone
                      ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/40'
                      : 'bg-slate-700 text-slate-500 border border-slate-600'
                  }`}
                >
                  <StepIcon className="w-3.5 h-3.5" />
                </div>
                <div className="mt-1.5 text-center">
                  <div className={`text-[10px] font-medium ${isDone ? 'text-white' : 'text-slate-500'}`}>
                    {disposalPhaseLabels[phase]}
                  </div>
                  {record && (
                    <>
                      <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">
                        {record.operator}
                      </div>
                      <div className="text-[9px] font-mono text-slate-500">
                        {formatTime(record.timestamp)}
                      </div>
                    </>
                  )}
                </div>
                {record?.note && (
                  <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-30 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-[10px] text-slate-200 whitespace-nowrap shadow-xl">
                      {record.note}
                    </div>
                  </div>
                )}
              </div>
              {!isLast && (
                <div className="flex items-center shrink-0 h-8 mx-0.5">
                  <ArrowRight className={`w-3 h-3 ${isDone ? 'text-cyan-400/60' : 'text-slate-600'}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type TimelineNodeProps = {
  event: TraceEvent;
  index: number;
  isLast: boolean;
  expanded: boolean;
  onToggle: () => void;
  getDisposalsByAlarm: (id: string) => DisposalRecord[];
  side?: 'A' | 'B';
};

function TimelineNode({
  event, index, isLast, expanded, onToggle, getDisposalsByAlarm, side = 'A'
}: TimelineNodeProps) {
  const Icon = phaseIcons[event.phase];
  const isAbnormal = !!event.abnormal;
  const disposals = event.relatedAlarmId ? getDisposalsByAlarm(event.relatedAlarmId) : [];

  const sideAccentBorder = side === 'B'
    ? (isAbnormal ? 'border-fuchsia-400/30 hover:border-fuchsia-400/60' : 'border-slate-700 hover:border-slate-600')
    : (isAbnormal ? 'border-red-500/30 hover:border-red-500/60' : 'border-slate-700 hover:border-slate-600');
  const sideAccentBg = side === 'B' && !isAbnormal ? 'bg-slate-800/40' : 'bg-slate-800/60';

  return (
    <div className="relative flex gap-3 pb-5">
      {!isLast && (
        <div className={`absolute left-[17px] top-9 w-0.5 h-full ${phaseLineColors[event.phase]}`} />
      )}
      <div
        className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center shrink-0 ring-4 ring-slate-900 ${
          isAbnormal
            ? 'bg-red-500 text-white'
            : phaseColors[event.phase]
        }`}
        style={isAbnormal ? { animation: 'pulse 1.5s ease-in-out infinite' } : undefined}
      >
        <Icon className="w-4 h-4" />
      </div>

      <div
        onClick={onToggle}
        className={`flex-1 rounded-lg border p-3 cursor-pointer transition-all ${
          expanded
            ? `${sideAccentBg} border-cyan-400/60`
            : `${sideAccentBg} ${sideAccentBorder}`
        }`}
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[9px] px-1.5 py-0.5 rounded ${phaseColors[event.phase]} opacity-90`}>
              {phaseLabels[event.phase]}
            </span>
            {isAbnormal && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 flex items-center gap-0.5">
                <AlertTriangle className="w-2.5 h-2.5" />
                异常
              </span>
            )}
            {event.status && !isAbnormal && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 flex items-center gap-0.5">
                <CheckCircle className="w-2.5 h-2.5" />
                {event.status}
              </span>
            )}
          </div>
          <span className="text-[9px] text-slate-500 font-mono shrink-0">#{index + 1}</span>
        </div>

        <div className="text-sm text-white font-medium leading-snug mb-1.5">{event.title}</div>
        <div className="text-[11px] text-slate-400 leading-relaxed mb-2">{event.description}</div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {formatTime(event.timestamp || event.time)}
          </span>
          {event.operator && (
            <span className="flex items-center gap-1">
              <User className="w-2.5 h-2.5" />
              {event.operator}
            </span>
          )}
          {event.weldPointIndex !== undefined && (
            <span className="flex items-center gap-1 font-mono">
              <FileText className="w-2.5 h-2.5" />
              焊点 #{event.weldPointIndex}
            </span>
          )}
          {disposals.length > 0 && (
            <span className="flex items-center gap-1 text-cyan-400">
              <ChevronDown className={`w-2.5 h-2.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
              {disposals.length}步处置
            </span>
          )}
        </div>

        {expanded && disposals.length > 0 && (
          <DisposalFlow disposals={disposals} />
        )}

        {expanded && event.detail && typeof event.detail === 'object' && Object.keys(event.detail).length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-700/70 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
            {Object.entries(event.detail as Record<string, unknown>).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <span className="text-slate-500">{k}</span>
                <span className="text-slate-300 font-mono truncate text-right">{String(v)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type TimelineProps = {
  events: TraceEvent[];
  getDisposalsByAlarm: (id: string) => DisposalRecord[];
  side?: 'A' | 'B';
  scrollRef?: React.RefObject<HTMLDivElement | null>;
};

function Timeline({ events, getDisposalsByAlarm, side = 'A', scrollRef }: TimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div
      ref={scrollRef}
      className="h-full max-h-[600px] overflow-y-auto pr-2 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-700"
    >
      {events.length > 0 ? (
        <div className="relative pl-0.5 py-1">
          {events.map((evt, idx) => (
            <TimelineNode
              key={evt.id}
              event={evt}
              index={idx}
              isLast={idx === events.length - 1}
              expanded={expandedId === evt.id}
              onToggle={() => setExpandedId(expandedId === evt.id ? null : evt.id)}
              getDisposalsByAlarm={getDisposalsByAlarm}
              side={side}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-slate-500">
          <History className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-xs">暂无追溯记录</p>
        </div>
      )}
    </div>
  );
}

type AlarmItemProps = {
  alarm: AlarmRecord;
  expanded: boolean;
  onToggle: () => void;
  disposals: DisposalRecord[];
};

function AlarmItem({ alarm, expanded, onToggle, disposals }: AlarmItemProps) {
  return (
    <div
      onClick={onToggle}
      className={`rounded-lg p-2.5 border text-xs cursor-pointer transition-all ${
        alarm.resolved
          ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40'
          : alarm.status === 'processing'
          ? 'bg-yellow-500/5 border-yellow-500/25 hover:border-yellow-500/50'
          : 'bg-orange-500/8 border-orange-500/25 hover:border-orange-500/50'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-start gap-1.5 min-w-0">
          <span className={`w-2 h-2 rounded-full mt-0.5 shrink-0 ${alarmStatusColor(alarm.status)}`} />
          <p className={`font-medium leading-tight ${
            alarm.resolved ? 'text-emerald-400' : alarm.status === 'processing' ? 'text-yellow-400' : 'text-orange-400'
          }`}>
            {alarm.title}
          </p>
        </div>
        <ChevronDown className={`w-3 h-3 shrink-0 mt-0.5 transition-transform text-slate-500 ${expanded ? 'rotate-180' : ''}`} />
      </div>
      <p className="text-slate-400 leading-snug ml-3.5">{alarm.description}</p>
      {alarm.weldPointIndex !== undefined && (
        <p className="mt-1 text-[10px] text-slate-500 font-mono ml-3.5">
          焊点 #{alarm.weldPointIndex} · {alarm.createdBy || '系统'}
        </p>
      )}
      {expanded && disposals.length > 0 && (
        <DisposalFlow disposals={disposals} />
      )}
      {alarm.resolved && alarm.resolvedBy && (
        <p className="mt-1.5 text-[10px] text-emerald-400/80 ml-3.5">
          ✓ {alarm.resolvedBy} · {formatDateTime(alarm.resolvedAt)}
        </p>
      )}
    </div>
  );
}

type WeldPointsTableProps = {
  points: WeldPoint[];
};

function WeldPointsTable({ points }: WeldPointsTableProps) {
  const statusBadge = (p: WeldPoint) => {
    if (p.status === 'repaired' || p.ultrasonicResult === 'pass') {
      return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400">合格</span>;
    }
    if (p.status === 'defective' || p.ultrasonicResult === 'fail') {
      return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400">待补焊</span>;
    }
    if (p.status === 'completed') {
      return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-cyan-400/20 text-cyan-400">完成待检</span>;
    }
    if (p.status === 'welding') {
      return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-cyan-400/20 text-cyan-400 animate-pulse">焊接中</span>;
    }
    return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-slate-700 text-slate-400">待焊</span>;
  };

  return (
    <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
      <table className="w-full text-xs">
        <thead className="sticky top-0 z-10 bg-slate-800/95 backdrop-blur">
          <tr className="text-left text-slate-400 border-b border-slate-700">
            <th className="px-4 py-2.5 font-medium">焊点#</th>
            <th className="px-4 py-2.5 font-medium">坐标</th>
            <th className="px-4 py-2.5 font-medium">质量状态</th>
            <th className="px-4 py-2.5 font-medium">缺陷类型</th>
            <th className="px-4 py-2.5 font-medium">参数异常</th>
            <th className="px-4 py-2.5 font-medium">处理人</th>
            <th className="px-4 py-2.5 font-medium">时间</th>
          </tr>
        </thead>
        <tbody>
          {points.length > 0 ? points.map(p => (
            <tr key={p.id} className="border-b border-slate-800 hover:bg-slate-800/50">
              <td className="px-4 py-2.5 font-mono font-bold text-white">#{p.index}</td>
              <td className="px-4 py-2.5 font-mono text-slate-400">
                ({p.position.x}, {p.position.y})
              </td>
              <td className="px-4 py-2.5">{statusBadge(p)}</td>
              <td className="px-4 py-2.5">
                {p.defectType && p.defectType !== 'none' ? (
                  <span className="text-red-400">{defectTypeLabel(p.defectType)}</span>
                ) : (
                  <span className="text-slate-500">-</span>
                )}
              </td>
              <td className="px-4 py-2.5">
                {p.paramAbnormal ? (
                  <span className="text-orange-400 font-mono flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    {p.paramAbnormal.param}={p.paramAbnormal.value}
                  </span>
                ) : (
                  <span className="text-slate-500">-</span>
                )}
              </td>
              <td className="px-4 py-2.5">
                <span className={p.inspector ? 'text-slate-200' : 'text-slate-500'}>
                  {p.inspector || '-'}
                </span>
              </td>
              <td className="px-4 py-2.5">
                <span className={`font-mono ${p.inspectionTime ? 'text-slate-400' : 'text-slate-500'}`}>
                  {p.inspectionTime ? formatTime(p.inspectionTime) : '-'}
                </span>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-slate-500 text-xs">
                无焊点数据
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

type PhaseFilterProps = {
  active: ProcessPhase | 'all';
  onChange: (p: ProcessPhase | 'all') => void;
  counts: Partial<Record<ProcessPhase, number>>;
};

function PhaseFilter({ active, onChange, counts }: PhaseFilterProps) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button
        onClick={() => onChange('all')}
        className={`text-[11px] px-3 py-1.5 rounded-md font-medium transition-all ${
          active === 'all'
            ? 'bg-cyan-400/15 text-cyan-400 border border-cyan-400/40'
            : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:border-slate-600 hover:text-slate-300'
        }`}
      >
        全部
      </button>
      {allPhases.map(phase => {
        const Icon = phaseIcons[phase];
        const isActive = active === phase;
        const count = counts[phase] || 0;
        return (
          <button
            key={phase}
            onClick={() => onChange(isActive ? 'all' : phase)}
            className={`text-[11px] px-2.5 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
              isActive
                ? 'bg-cyan-400/15 text-cyan-400 border border-cyan-400/40'
                : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:border-slate-600 hover:text-slate-300'
            }`}
          >
            <Icon className="w-3 h-3" />
            {phaseLabels[phase]}
            <span className={`font-mono text-[9px] ${count > 0 ? 'text-slate-400' : 'text-slate-600'}`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

type CompareSummaryProps = {
  comparison: WorkpieceComparison;
};

function CompareSummary({ comparison }: CompareSummaryProps) {
  const { metrics } = comparison;
  const cycleDiff = metrics.totalCycle.diff;
  const cycleDiffPct = metrics.totalCycle.diffPercent;
  const passDiff = metrics.passRate.diff;

  const cycleColor = cycleDiff < 0 ? 'text-emerald-400' : cycleDiff > 0 ? 'text-red-400' : 'text-slate-400';
  const cycleArrow = cycleDiff < 0 ? '↓' : cycleDiff > 0 ? '↑' : '=';
  const cycleBg = cycleDiff < 0 ? 'bg-emerald-500/10 border-emerald-500/30' : cycleDiff > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-700/30 border-slate-600';

  const passColor = passDiff > 0 ? 'text-emerald-400' : passDiff < 0 ? 'text-red-400' : 'text-slate-400';
  const passArrow = passDiff > 0 ? '↑' : passDiff < 0 ? '↓' : '=';

  return (
    <div className={`rounded-xl border p-5 ${cycleBg}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <GitCompare className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-white font-semibold flex items-center gap-2">
              <span className="text-cyan-400">{comparison.workpieceA.code}</span>
              <ArrowRightLeft className="w-4 h-4 text-slate-500" />
              <span className="text-fuchsia-400">{comparison.workpieceB.code}</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              工件A (基准) vs 工件B (对比)
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="text-[11px] text-slate-400 mb-1.5">总节拍差异</div>
          <div className="flex items-baseline gap-2">
            <span className={`font-mono text-2xl font-bold ${cycleColor}`}>
              {cycleArrow}{formatDuration(Math.abs(cycleDiff))}
            </span>
          </div>
          <div className={`text-[11px] mt-1 ${cycleColor}`}>
            {cycleDiff === 0 ? '无差异' : `相对A ${cycleDiffPct > 0 ? '+' : ''}${cycleDiffPct}%`}
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="text-[11px] text-slate-400 mb-1.5">合格率差异</div>
          <div className="flex items-baseline gap-2">
            <span className={`font-mono text-2xl font-bold ${passColor}`}>
              {passArrow}{Math.abs(passDiff).toFixed(1)}%
            </span>
          </div>
          <div className={`text-[11px] mt-1 ${passColor}`}>
            {passDiff === 0 ? '无差异' : `B vs A ${passDiff > 0 ? '+' : ''}${passDiff.toFixed(1)}%`}
          </div>
        </div>
      </div>
    </div>
  );
}

type CompareChartProps = {
  comparison: WorkpieceComparison;
};

function CompareChart({ comparison }: CompareChartProps) {
  const data = comparison.metrics.phaseBreakdown.map(pb => ({
    phase: phaseLabels[pb.phase],
    A: pb.a,
    B: pb.b,
    colorA: phaseChartColors[pb.phase],
    colorB: phaseChartColors[pb.phase],
  }));

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm text-white font-semibold flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          阶段耗时对比
        </h4>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1 text-cyan-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" /> 工件A
          </span>
          <span className="flex items-center gap-1 text-fuchsia-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-fuchsia-400" /> 工件B
          </span>
        </div>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="phase" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748B" fontSize={10} tickLine={false} axisLine={false}
              label={{ value: '秒', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 10 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px', fontSize: 11 }}
              labelStyle={{ color: '#E2E8F0', marginBottom: 4 }}
              formatter={(value: number, name: string) => [`${value}秒`, `工件${name}`]}
              cursor={{ fill: 'rgba(34, 211, 238, 0.05)' }}
            />
            <Bar dataKey="A" name="A" radius={[4, 4, 0, 0]} maxBarSize={28}>
              {data.map((_, i) => (
                <Cell key={`a-${i}`} fill="#22D3EE" />
              ))}
            </Bar>
            <Bar dataKey="B" name="B" radius={[4, 4, 0, 0]} maxBarSize={28}>
              {data.map((_, i) => (
                <Cell key={`b-${i}`} fill="#E879F9" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

type MetricsCompareTableProps = {
  comparison: WorkpieceComparison;
};

function MetricsCompareTable({ comparison }: MetricsCompareTableProps) {
  const { metrics } = comparison;
  const rows = [
    { label: '异常点数', a: metrics.abnormalPoints.a, b: metrics.abnormalPoints.b, diff: metrics.abnormalPoints.diff, unit: '个', lowerBetter: true },
    { label: '补焊次数', a: metrics.repairCount.a, b: metrics.repairCount.b, diff: metrics.repairCount.diff, unit: '次', lowerBetter: true },
    { label: '告警数量', a: metrics.alarmCount.a, b: metrics.alarmCount.b, diff: metrics.alarmCount.diff, unit: '条', lowerBetter: true },
    { label: '合格率', a: metrics.passRate.a, b: metrics.passRate.b, diff: metrics.passRate.diff, unit: '%', lowerBetter: false },
  ];

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
      <h4 className="text-sm text-white font-semibold mb-3 flex items-center gap-1.5">
        <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
        关键指标对比
      </h4>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-slate-400 border-b border-slate-700">
            <th className="text-left py-2 font-medium">指标</th>
            <th className="text-right py-2 font-medium text-cyan-400">工件A</th>
            <th className="text-right py-2 font-medium text-fuchsia-400">工件B</th>
            <th className="text-right py-2 font-medium">差值</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const bBetter = row.lowerBetter ? row.diff < 0 : row.diff > 0;
            const bWorse = row.lowerBetter ? row.diff > 0 : row.diff < 0;
            const diffColor = bBetter ? 'text-emerald-400' : bWorse ? 'text-red-400' : 'text-slate-400';
            const diffSign = row.diff > 0 ? '+' : '';
            return (
              <tr key={row.label} className="border-b border-slate-800 last:border-0">
                <td className="py-2.5 text-slate-300">{row.label}</td>
                <td className="text-right py-2.5 font-mono text-cyan-400">{row.a}{row.unit}</td>
                <td className="text-right py-2.5 font-mono text-fuchsia-400">{row.b}{row.unit}</td>
                <td className={`text-right py-2.5 font-mono font-bold ${diffColor}`}>
                  {diffSign}{row.diff}{row.unit}
                  {bBetter && <CheckCircle className="w-3 h-3 inline ml-1 -mt-0.5" />}
                  {bWorse && <XCircle className="w-3 h-3 inline ml-1 -mt-0.5" />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function TraceabilityPage() {
  const {
    workpieces, currentWorkpiece, traceEvents, alarmRecords, repairRecords,
    disposalRecords, weldPoints, cycleDataList, getTraceByWorkpiece,
    getAlarmsByWorkpiece, getRepairsByWorkpiece, getDisposalsByWorkpiece,
    computeWorkpieceComparison
  } = useWeldingStore();

  const [workpieceAId, setWorkpieceAId] = useState<string>(
    currentWorkpiece?.id || workpieces[0]?.id || ''
  );
  const [workpieceBId, setWorkpieceBId] = useState<string>(
    workpieces.length > 1 ? (workpieces[0].id === currentWorkpiece?.id ? workpieces[1]?.id : workpieces[0]?.id) : ''
  );
  const [compareMode, setCompareMode] = useState(false);
  const [filterPhase, setFilterPhase] = useState<ProcessPhase | 'all'>('all');
  const [expandedAlarmId, setExpandedAlarmId] = useState<string | null>(null);

  const scrollLeftRef = useRef<HTMLDivElement | null>(null);
  const scrollRightRef = useRef<HTMLDivElement | null>(null);
  const isSyncing = useRef(false);

  const workpieceOpts = useMemo(() =>
    workpieces.map(w => ({ id: w.id, code: w.code, name: w.name })),
    [workpieces]
  );

  const workpieceA = useMemo(() => workpieces.find(w => w.id === workpieceAId), [workpieces, workpieceAId]);
  const workpieceB = useMemo(() => workpieces.find(w => w.id === workpieceBId), [workpieces, workpieceBId]);

  const cycleA = useMemo(() => {
    if (!workpieceAId) return undefined;
    return cycleDataList.find(c => c.workpieceId === workpieceAId);
  }, [cycleDataList, workpieceAId]);

  const cycleB = useMemo(() => {
    if (!workpieceBId) return undefined;
    return cycleDataList.find(c => c.workpieceId === workpieceBId);
  }, [cycleDataList, workpieceBId]);

  const traceA = useMemo(() => {
    if (!workpieceAId) return [] as TraceEvent[];
    const all = getTraceByWorkpiece(workpieceAId);
    return filterPhase === 'all' ? all : all.filter(e => e.phase === filterPhase);
  }, [workpieceAId, filterPhase, getTraceByWorkpiece, traceEvents]);

  const traceB = useMemo(() => {
    if (!workpieceBId) return [] as TraceEvent[];
    const all = getTraceByWorkpiece(workpieceBId);
    return filterPhase === 'all' ? all : all.filter(e => e.phase === filterPhase);
  }, [workpieceBId, filterPhase, getTraceByWorkpiece, traceEvents]);

  const phaseCounts = useMemo(() => {
    const counts: Partial<Record<ProcessPhase, number>> = {};
    const base = workpieceAId ? getTraceByWorkpiece(workpieceAId) : [];
    base.forEach(e => { counts[e.phase] = (counts[e.phase] || 0) + 1; });
    return counts;
  }, [workpieceAId, getTraceByWorkpiece, traceEvents]);

  const alarmsA = useMemo(() => workpieceAId ? getAlarmsByWorkpiece(workpieceAId) : [], [workpieceAId, getAlarmsByWorkpiece, alarmRecords]);
  const repairsA = useMemo(() => workpieceAId ? getRepairsByWorkpiece(workpieceAId) : [], [workpieceAId, getRepairsByWorkpiece, repairRecords]);
  const disposalsA = useMemo(() => workpieceAId ? getDisposalsByWorkpiece(workpieceAId) : [], [workpieceAId, getDisposalsByWorkpiece, disposalRecords]);

  const weldPointsA = useMemo(() => {
    if (!workpieceAId) return weldPoints;
    const events = getTraceByWorkpiece(workpieceAId);
    const indices = new Set<number>();
    events.forEach(e => { if (e.weldPointIndex !== undefined) indices.add(e.weldPointIndex); });
    if (indices.size === 0) return weldPoints;
    return weldPoints.filter(p => indices.has(p.index));
  }, [workpieceAId, getTraceByWorkpiece, traceEvents, weldPoints]);

  const getDisposalsByAlarm = useMemo(() => {
    return (alarmId: string): DisposalRecord[] =>
      disposalRecords
        .filter(d => d.alarmId === alarmId)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [disposalRecords]);

  const overviewStats = useMemo(() => {
    const totalSeconds = cycleA?.duration || 0;
    const defectiveCount = weldPointsA.filter(p => p.status === 'defective').length;
    const inspectorSet = new Set<string>();
    repairsA.forEach(r => inspectorSet.add(r.operator));
    disposalsA.forEach(d => inspectorSet.add(d.operator));
    traceA.forEach(e => { if (e.operator) inspectorSet.add(e.operator); });
    return {
      code: workpieceA?.code || '-',
      totalDuration: formatDuration(totalSeconds),
      weldCount: weldPointsA.length,
      defectiveCount,
      alarmCount: alarmsA.length,
      peopleCount: inspectorSet.size || 1,
    };
  }, [workpieceA, cycleA, weldPointsA, alarmsA, repairsA, disposalsA, traceA]);

  const comparison = useMemo(() => {
    if (!compareMode || !workpieceAId || !workpieceBId) return null;
    return computeWorkpieceComparison(workpieceAId, workpieceBId);
  }, [compareMode, workpieceAId, workpieceBId, computeWorkpieceComparison]);

  useEffect(() => {
    const handler = (e: Event) => {
      if (isSyncing.current) return;
      isSyncing.current = true;
      const target = e.currentTarget as HTMLDivElement;
      const other = target === scrollLeftRef.current ? scrollRightRef.current : scrollLeftRef.current;
      if (other) other.scrollTop = target.scrollTop;
      requestAnimationFrame(() => { isSyncing.current = false; });
    };
    const l = scrollLeftRef.current;
    const r = scrollRightRef.current;
    l?.addEventListener('scroll', handler);
    r?.addEventListener('scroll', handler);
    return () => {
      l?.removeEventListener('scroll', handler);
      r?.removeEventListener('scroll', handler);
    };
  }, [compareMode]);

  return (
    <div className="min-h-screen bg-slate-900 space-y-5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center">
            <History className="w-6 h-6 mr-2 text-cyan-400" />
            工件批次生产追溯
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            按工件编号追溯上料、夹具、焊接、检测、补焊全流程，支持双工件横向对比
          </p>
        </div>
      </div>

      <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4">
        <div className="flex items-center gap-4">
          <WorkpieceSelect
            label="A"
            value={workpieceAId}
            onChange={setWorkpieceAId}
            options={workpieceOpts}
            accent="A"
          />

          <div className="flex flex-col items-center gap-2 shrink-0 px-2 pt-5">
            <button
              onClick={() => setCompareMode(!compareMode)}
              className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-all ${
                compareMode
                  ? 'bg-gradient-to-br from-cyan-400 to-fuchsia-400 text-slate-900 shadow-lg shadow-cyan-400/20'
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200'
              }`}
              title={compareMode ? '关闭对比' : '开启对比模式'}
            >
              <GitCompare className="w-5 h-5" />
              {compareMode && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center">
                  ON
                </span>
              )}
            </button>
            <span className="text-[10px] text-slate-500 font-medium">VS</span>
          </div>

          <div className={`flex-1 transition-all duration-300 ${compareMode ? 'opacity-100 pointer-events-auto' : 'opacity-40 pointer-events-none'}`}>
            <WorkpieceSelect
              label="B"
              value={workpieceBId}
              onChange={setWorkpieceBId}
              options={workpieceOpts.filter(o => o.id !== workpieceAId)}
              accent="B"
            />
          </div>
        </div>
      </div>

      {!compareMode ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <OverviewCard icon={Radio} label="工件编号" value={overviewStats.code} sub={workpieceA?.name} color="text-cyan-400" />
            <OverviewCard icon={Clock} label="总耗时" value={overviewStats.totalDuration} sub={`${cycleA?.targetDuration || 300}s 目标`} color="text-white" />
            <OverviewCard icon={Zap} label="焊点数" value={overviewStats.weldCount} sub="个焊点" color="text-cyan-400" />
            <OverviewCard icon={AlertTriangle} label="缺陷点" value={overviewStats.defectiveCount} sub={`${repairsA.length}次补焊`} color="text-red-400" />
            <OverviewCard icon={Radio} label="告警数" value={overviewStats.alarmCount} sub={`${alarmsA.filter(a => a.resolved).length}已解`} color="text-orange-400" />
            <OverviewCard icon={Users} label="处理人数" value={overviewStats.peopleCount} sub="人参与" color="text-emerald-400" />
          </div>

          <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-3">
            <PhaseFilter active={filterPhase} onChange={setFilterPhase} counts={phaseCounts} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl">
                <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                  <h3 className="text-sm text-white font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    异常告警
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">{alarmsA.length}条</span>
                </div>
                <div className="p-3 space-y-2 max-h-[560px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                  {alarmsA.length > 0 ? alarmsA.map(alarm => (
                    <AlarmItem
                      key={alarm.id}
                      alarm={alarm}
                      expanded={expandedAlarmId === alarm.id}
                      onToggle={() => setExpandedAlarmId(expandedAlarmId === alarm.id ? null : alarm.id)}
                      disposals={getDisposalsByAlarm(alarm.id)}
                    />
                  )) : (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-30 text-emerald-500" />
                      <p>无异常告警</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl h-full">
                <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                  <h3 className="text-sm text-white font-semibold flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    全流程追溯时间线
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {workpieceA?.code} · {traceA.length}条
                  </span>
                </div>
                <div className="p-4">
                  <Timeline events={traceA} getDisposalsByAlarm={getDisposalsByAlarm} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-sm text-white font-semibold flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan-400" />
                焊点质量明细
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">
                {workpieceA?.code} · 共{weldPointsA.length}个焊点
              </span>
            </div>
            <WeldPointsTable points={weldPointsA} />
          </div>
        </>
      ) : (
        <>
          {comparison ? (
            <>
              <CompareSummary comparison={comparison} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <CompareChart comparison={comparison} />
                <MetricsCompareTable comparison={comparison} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-slate-800/60 border border-cyan-400/30 rounded-xl">
                  <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                    <h3 className="text-sm text-white font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      工件A · <span className="text-cyan-400 font-mono">{workpieceA?.code}</span>
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono">{traceA.length}条</span>
                  </div>
                  <div className="p-4">
                    <Timeline
                      events={traceA}
                      getDisposalsByAlarm={getDisposalsByAlarm}
                      side="A"
                      scrollRef={scrollLeftRef}
                    />
                  </div>
                </div>
                <div className="bg-slate-800/60 border border-fuchsia-400/30 rounded-xl">
                  <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                    <h3 className="text-sm text-white font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-fuchsia-400" />
                      工件B · <span className="text-fuchsia-400 font-mono">{workpieceB?.code}</span>
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono">{traceB.length}条</span>
                  </div>
                  <div className="p-4">
                    <Timeline
                      events={traceB}
                      getDisposalsByAlarm={getDisposalsByAlarm}
                      side="B"
                      scrollRef={scrollRightRef}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-16 text-center">
              <GitCompare className="w-16 h-16 mx-auto mb-4 opacity-30 text-slate-500" />
              <p className="text-slate-400 text-sm">请选择两个不同的工件进行对比</p>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { opacity: 0.85; box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
        }
        .scrollbar-thin::-webkit-scrollbar { width: 6px; height: 6px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
}
