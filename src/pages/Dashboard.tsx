import { useWeldingStore } from '@/store/weldingStore';
import {
  Package, Clipboard, Bot, ScanLine, Wrench, Timer, Settings,
  TrendingUp, CheckCircle2, AlertTriangle, Activity, Clock,
  History, XCircle, Bell, CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ReferenceLine } from 'recharts';
import type { WeldPoint } from '@/types';

interface ModuleCard {
  icon: React.ElementType;
  title: string;
  desc: string;
  path: string;
  status: 'active' | 'idle' | 'warning';
  progress?: number;
}

function StatCard({ icon: Icon, label, value, unit, trend, color }: {
  icon: React.ElementType; label: string; value: string | number; unit?: string; trend?: string; color: string;
}) {
  return (
    <div className="panel">
      <div className="panel-body">
        <div className="flex items-start justify-between">
          <div>
            <p className="data-label">{label}</p>
            <div className="flex items-end gap-1 mt-1">
              <span className={`font-mono text-3xl font-bold ${color}`}>{value}</span>
              {unit && <span className="text-industrial-400 text-sm mb-1">{unit}</span>}
            </div>
            {trend && <p className="text-xs text-accent-green mt-1 flex items-center"><TrendingUp className="w-3 h-3 mr-1" />{trend}</p>}
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color.replace('text-', 'bg-').replace('cyan', 'cyan/20').replace('green', 'green/20').replace('orange', 'orange/20').replace('red', 'red/20')}`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { dashboardStats, cycleStats, weldPoints, fixture, currentWorkpiece, alarmRecords, isWelding } = useWeldingStore();

  const completedPoints = dashboardStats.completedPoints || 0;
  const defectivePoints = dashboardStats.defectivePoints || 0;
  const weldingProgress = weldPoints.length > 0 ? Math.round((completedPoints / weldPoints.length) * 100) : 0;

  const modules: ModuleCard[] = [
    { icon: Package, title: '工件上料', desc: currentWorkpiece?.status === 'loaded' ? '上料已完成' : (currentWorkpiece?.status === 'loading' ? '上料定位中' : '待上料'), path: '/loading', status: currentWorkpiece?.status === 'loaded' ? 'active' : (currentWorkpiece?.status === 'loading' ? 'active' : 'idle'), progress: currentWorkpiece?.status === 'loaded' ? 100 : currentWorkpiece?.status === 'loading' ? 65 : 0 },
    { icon: Clipboard, title: '夹具定位', desc: fixture.status === 'clamped' ? '夹具已夹紧' : (fixture.status === 'clamping' ? '定位夹紧中' : '待夹紧'), path: '/fixture', status: fixture.status === 'clamped' ? 'active' : 'idle', progress: fixture.status === 'clamped' ? 100 : (fixture.status === 'clamping' ? 50 : 0) },
    { icon: Bot, title: '机器人焊接', desc: isWelding ? `自动焊接中 ${weldingProgress}%` : (weldingProgress >= 100 ? '已完成焊接' : `焊接进度 ${weldingProgress}%`), path: '/welding', status: isWelding ? 'active' : (defectivePoints > 0 ? 'warning' : 'idle'), progress: weldingProgress },
    { icon: ScanLine, title: '焊点检测', desc: defectivePoints > 0 ? `发现${defectivePoints}个缺陷/异常` : '待检测/已完成', path: '/inspection', status: defectivePoints > 0 ? 'warning' : 'idle' },
    { icon: Wrench, title: '补焊修整', desc: defectivePoints > 0 ? `${defectivePoints}个待补焊` : '无待修整项', path: '/repair', status: defectivePoints > 0 ? 'warning' : 'idle' },
    { icon: History, title: '生产追溯', desc: '工件批次时间线', path: '/traceability', status: 'idle' },
    { icon: Timer, title: '节拍监控', desc: '实时监控中', path: '/cycle', status: 'active' },
    { icon: Settings, title: '设备维护', desc: `设备健康度 ${dashboardStats.equipmentHealth}%`, path: '/maintenance', status: dashboardStats.equipmentHealth > 90 ? 'active' : 'warning' },
  ];

  const statusColors = {
    active: 'bg-accent-green',
    idle: 'bg-industrial-500',
    warning: 'bg-accent-yellow',
  };

  const activeAlarms = alarmRecords.filter(a => !a.resolved);
  const weldingAlarms = activeAlarms.filter(a => a.source === 'welding');
  const inspectionAlarms = activeAlarms.filter(a => a.source === 'inspection');

  const statusOfPoint = (p: WeldPoint) => {
    if (p.status === 'completed' && p.ultrasonicResult === 'pass') return 'bg-accent-green';
    if (p.status === 'repaired') return 'bg-emerald-600';
    if (p.status === 'defective' || p.ultrasonicResult === 'fail') return 'bg-accent-red animate-pulse';
    if (p.status === 'welding') return 'bg-accent-cyan animate-pulse';
    if (p.status === 'completed') return 'bg-accent-cyan/70';
    return 'bg-industrial-700';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Package} label="今日产量" value={dashboardStats.todayOutput} unit={`/ ${dashboardStats.targetOutput}`} trend="较昨日 +12%" color="text-accent-cyan" />
        <StatCard icon={CheckCircle2} label="焊点合格率" value={dashboardStats.passRate} unit="%" trend="稳定达标" color="text-accent-green" />
        <StatCard icon={XCircle} label="异常焊点" value={defectivePoints} unit="个" color="text-accent-red" />
        <StatCard icon={Clock} label="平均节拍" value={dashboardStats.avgCycleTime} unit="秒" trend="目标 300秒" color="text-accent-cyan" />
        <StatCard icon={Activity} label="设备健康度" value={dashboardStats.equipmentHealth} unit="%" color="text-accent-orange" />
      </div>

      {activeAlarms.length > 0 && (
        <div className="panel border-accent-red/30">
          <div className="panel-header border-accent-red/30">
            <h3 className="text-white font-semibold flex items-center">
              <Bell className="w-4 h-4 mr-2 text-accent-red" />
              活动告警（实时联动）
            </h3>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-accent-orange flex items-center"><Bell className="w-3 h-3 mr-1" />焊接异常 {weldingAlarms.length}</span>
              <span className="text-accent-yellow flex items-center"><AlertTriangle className="w-3 h-3 mr-1" />检测异常 {inspectionAlarms.length}</span>
              <span className="text-accent-red">{activeAlarms.length} 项未处理</span>
            </div>
          </div>
          <div className="panel-body">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeAlarms.slice(0, 6).map((alarm) => (
                <div key={alarm.id} className={`rounded-lg p-3 border ${
                  alarm.severity === 'high'
                    ? 'bg-accent-red/10 border-accent-red/30'
                    : 'bg-accent-yellow/10 border-accent-yellow/30'
                }`}>
                  <div className="flex items-start justify-between mb-1.5">
                    <p className={`text-sm font-medium flex items-center gap-1.5 ${alarm.severity === 'high' ? 'text-accent-red' : 'text-accent-yellow'}`}>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {alarm.title}
                    </p>
                    {alarm.weldPointIndex && (
                      <button onClick={() => navigate('/inspection')} className="text-[10px] px-1.5 py-0.5 bg-industrial-800 rounded hover:bg-industrial-700 text-industrial-300 font-mono">
                        #{alarm.weldPointIndex} →
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-industrial-400 mb-1.5">{alarm.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-industrial-500">
                    <span>{alarm.source === 'welding' ? '机器人焊接' : '焊点检测'}</span>
                    <span className="font-mono">{alarm.createdBy}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 panel">
          <div className="panel-header">
            <h3 className="text-white font-semibold flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-accent-cyan" />
              生产节拍趋势
            </h3>
            <span className="text-xs text-industrial-400">最近10个工件</span>
          </div>
          <div className="panel-body h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cycleStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} domain={[250, 350]}
                  label={{ value: '秒', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px' }}
                  labelStyle={{ color: '#E2E8F0' }}
                  itemStyle={{ color: '#06B6D4' }}
                />
                <ReferenceLine y={300} stroke="#F97316" strokeDasharray="5 5" label={{ value: '目标节拍 300s', fill: '#F97316', fontSize: 10, position: 'right' }} />
                <Line type="monotone" dataKey="duration" stroke="#06B6D4" strokeWidth={2} dot={{ fill: '#06B6D4', r: 3 }} name="实际节拍(秒)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3 className="text-white font-semibold flex items-center">
              <Activity className="w-4 h-4 mr-2 text-accent-green" />
              当前工件焊接进度
            </h3>
          </div>
          <div className="panel-body">
            <div className="text-center mb-4">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" stroke="#334155" strokeWidth="8" fill="none" />
                  <circle cx="60" cy="60" r="52" stroke={defectivePoints > 0 ? '#F59E0B' : '#06B6D4'} strokeWidth="8" fill="none"
                    strokeDasharray={`${(weldingProgress / 100) * 326} 326`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-mono font-bold ${defectivePoints > 0 ? 'text-accent-yellow' : 'text-accent-cyan'}`}>{weldingProgress}%</span>
                  <span className="text-xs text-industrial-400">完成进度</span>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-industrial-700/50">
                <span className="text-industrial-400">已完成焊点</span>
                <span className="text-accent-green font-mono">{completedPoints} / {weldPoints.length}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-industrial-700/50">
                <span className="text-industrial-400">缺陷/异常焊点</span>
                <span className="text-accent-red font-mono flex items-center gap-1">
                  {defectivePoints}
                  {defectivePoints > 0 && <AlertTriangle className="w-3 h-3" />}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-industrial-700/50">
                <span className="text-industrial-400">合格率</span>
                <span className="text-accent-green font-mono">{dashboardStats.passRate}%</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-industrial-400">工件编号</span>
                <span className="text-white font-mono text-xs">{currentWorkpiece?.code || '--'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3 className="text-white font-semibold">工艺流程模块</h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center"><span className="status-dot bg-accent-green animate-pulse" />运行中</span>
            <span className="flex items-center"><span className="status-dot bg-industrial-500" />待机</span>
            <span className="flex items-center"><span className="status-dot bg-accent-yellow" />警告</span>
          </div>
        </div>
        <div className="panel-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {modules.map((mod) => {
              const Icon = mod.icon;
              return (
                <button
                  key={mod.title}
                  onClick={() => navigate(mod.path)}
                  className={`text-left bg-industrial-900 border rounded-lg p-4 hover:bg-industrial-800 transition-all group ${
                    mod.status === 'warning'
                      ? 'border-accent-yellow/40 hover:border-accent-yellow/70'
                      : 'border-industrial-700 hover:border-accent-cyan/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center group-hover:bg-accent-cyan/15 transition-colors ${
                      mod.status === 'warning' ? 'bg-accent-yellow/15' : 'bg-industrial-800'
                    }`}>
                      <Icon className={`w-5 h-5 ${mod.status === 'warning' ? 'text-accent-yellow' : 'text-accent-cyan'}`} />
                    </div>
                    <span className={`status-dot ${statusColors[mod.status]} animate-pulse`} />
                  </div>
                  <h4 className="text-white font-medium flex items-center gap-1.5">
                    {mod.title}
                    {mod.status === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-accent-yellow" />}
                  </h4>
                  <p className="text-xs text-industrial-400 mt-1">{mod.desc}</p>
                  {mod.progress !== undefined && (
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] text-industrial-500 mb-1">
                        <span>进度</span>
                        <span className="font-mono">{mod.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-industrial-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${
                          mod.status === 'warning' ? 'bg-accent-yellow' : 'bg-accent-cyan'
                        }`} style={{ width: `${mod.progress}%` }} />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="panel">
          <div className="panel-header">
            <h3 className="text-white font-semibold flex items-center">
              <ScanLine className="w-4 h-4 mr-2 text-accent-cyan" />
              焊点分布状态（全链路同步）
            </h3>
            <span className="text-xs text-industrial-400">共{weldPoints.length}个焊点</span>
          </div>
          <div className="panel-body">
            <div className="relative bg-industrial-900 rounded-lg p-4" style={{ minHeight: '180px' }}>
              <div className="grid grid-cols-10 gap-1.5">
                {weldPoints.map((p) => {
                  const hasAlarm = alarmRecords.some(a =>
                    a.weldPointIndex === p.index &&
                    a.workpieceId === currentWorkpiece?.id &&
                    !a.resolved
                  );
                  return (
                    <div
                      key={p.id}
                      onClick={() => navigate('/inspection')}
                      className={`relative w-full aspect-square rounded-sm cursor-pointer transition-transform hover:scale-110 ${statusOfPoint(p)}`}
                      title={`焊点#${p.index} · ${p.status}${p.defectType ? ' · ' + p.defectType : ''}${hasAlarm ? ' · 有关联告警' : ''}`}
                    >
                      {hasAlarm && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent-yellow rounded-full border border-industrial-900" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-4 text-xs text-industrial-400">
              <span className="flex items-center"><span className="w-3 h-3 rounded-sm bg-accent-green mr-1.5" />检测合格</span>
              <span className="flex items-center"><span className="w-3 h-3 rounded-sm bg-emerald-600 mr-1.5" />补焊后合格</span>
              <span className="flex items-center"><span className="w-3 h-3 rounded-sm bg-accent-cyan/70 mr-1.5" />完成待检测</span>
              <span className="flex items-center"><span className="w-3 h-3 rounded-sm bg-accent-cyan mr-1.5" />焊接中</span>
              <span className="flex items-center"><span className="w-3 h-3 rounded-sm bg-accent-red mr-1.5" />缺陷/异常</span>
              <span className="flex items-center"><span className="w-3 h-3 rounded-sm bg-industrial-700 mr-1.5" />待焊接</span>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3 className="text-white font-semibold flex items-center">
              <Clock className="w-4 h-4 mr-2 text-accent-yellow" />
              生产节拍柱状图
            </h3>
            <span className="text-xs text-industrial-400">目标：≤300秒</span>
          </div>
          <div className="panel-body h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cycleStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} domain={[0, 360]}
                  label={{ value: '秒', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px' }}
                  labelStyle={{ color: '#E2E8F0' }}
                />
                <ReferenceLine y={300} stroke="#EF4444" strokeDasharray="4 4" strokeWidth={1.5}
                  label={{ value: '目标线', fill: '#EF4444', fontSize: 10, position: 'right' }} />
                <Bar dataKey="duration" fill="#06B6D4" radius={[4, 4, 0, 0]} name="实际节拍(秒)">
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 border-t border-industrial-700/50 pt-3 flex justify-around text-xs">
            <div className="text-center">
              <p className="text-industrial-500">最快节拍</p>
              <p className="font-mono text-accent-green font-bold">
                {cycleStats.length > 0 ? Math.min(...cycleStats.map(c => c.duration)) : '--'}
                <span className="text-industrial-500 ml-0.5">s</span>
              </p>
            </div>
            <div className="text-center">
              <p className="text-industrial-500">平均节拍</p>
              <p className="font-mono text-accent-cyan font-bold">{dashboardStats.avgCycleTime}<span className="text-industrial-500 ml-0.5">s</span></p>
            </div>
            <div className="text-center">
              <p className="text-industrial-500">最慢节拍</p>
              <p className="font-mono text-accent-orange font-bold">
                {cycleStats.length > 0 ? Math.max(...cycleStats.map(c => c.duration)) : '--'}
                <span className="text-industrial-500 ml-0.5">s</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
