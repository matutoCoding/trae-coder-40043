import { useWeldingStore } from '@/store/weldingStore';
import {
  Package, Clipboard, Bot, ScanLine, Wrench, Timer, Settings,
  TrendingUp, CheckCircle2, AlertTriangle, Activity, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ReferenceLine } from 'recharts';

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
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color.replace('text-', 'bg-').replace('cyan', 'cyan/20').replace('green', 'green/20').replace('orange', 'orange/20')}`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { dashboardStats, cycleStats, weldPoints, fixture, currentWorkpiece } = useWeldingStore();

  const completedPoints = weldPoints.filter(p => p.status === 'completed' || p.status === 'repaired').length;
  const defectivePoints = weldPoints.filter(p => p.status === 'defective').length;
  const weldingProgress = Math.round((completedPoints / weldPoints.length) * 100);

  const modules: ModuleCard[] = [
    { icon: Package, title: '工件上料', desc: currentWorkpiece?.status === 'loading' ? '上料定位中' : '上料已完成', path: '/loading', status: currentWorkpiece?.status === 'loading' ? 'active' : 'idle', progress: currentWorkpiece?.status === 'loaded' ? 100 : currentWorkpiece?.status === 'loading' ? 65 : 0 },
    { icon: Clipboard, title: '夹具定位', desc: fixture.status === 'clamped' ? '夹具已夹紧' : '定位夹紧中', path: '/fixture', status: fixture.status === 'clamped' ? 'active' : 'idle', progress: fixture.status === 'clamped' ? 100 : 45 },
    { icon: Bot, title: '机器人焊接', desc: `焊接进度 ${weldingProgress}%`, path: '/welding', status: 'active', progress: weldingProgress },
    { icon: ScanLine, title: '焊点检测', desc: defectivePoints > 0 ? `发现${defectivePoints}个缺陷点` : '待检测', path: '/inspection', status: defectivePoints > 0 ? 'warning' : 'idle' },
    { icon: Wrench, title: '补焊修整', desc: defectivePoints > 0 ? '待补焊修整' : '无待修整项', path: '/repair', status: defectivePoints > 0 ? 'warning' : 'idle' },
    { icon: Timer, title: '节拍监控', desc: '实时监控中', path: '/cycle', status: 'active' },
    { icon: Settings, title: '设备维护', desc: `设备健康度 ${dashboardStats.equipmentHealth}%`, path: '/maintenance', status: dashboardStats.equipmentHealth > 90 ? 'active' : 'warning' },
  ];

  const statusColors = {
    active: 'bg-accent-green',
    idle: 'bg-industrial-500',
    warning: 'bg-accent-yellow',
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="今日产量" value={dashboardStats.todayOutput} unit={`/ ${dashboardStats.targetOutput}`} trend="较昨日提升 12%" color="text-accent-cyan" />
        <StatCard icon={CheckCircle2} label="焊接合格率" value={dashboardStats.passRate} unit="%" trend="稳定达标" color="text-accent-green" />
        <StatCard icon={Clock} label="平均节拍" value={dashboardStats.avgCycleTime} unit="秒" trend="目标 300秒" color="text-accent-cyan" />
        <StatCard icon={Activity} label="设备健康度" value={dashboardStats.equipmentHealth} unit="%" color="text-accent-orange" />
      </div>

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
                <YAxis stroke="#64748B" fontSize={11} domain={[250, 350]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px' }}
                  labelStyle={{ color: '#E2E8F0' }}
                  itemStyle={{ color: '#06B6D4' }}
                />
                <ReferenceLine y={300} stroke="#F97316" strokeDasharray="5 5" label={{ value: '目标', fill: '#F97316', fontSize: 10, position: 'right' }} />
                <Line type="monotone" dataKey="duration" stroke="#06B6D4" strokeWidth={2} dot={{ fill: '#06B6D4', r: 3 }} name="实际节拍" />
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
                  <circle cx="60" cy="60" r="52" stroke="#06B6D4" strokeWidth="8" fill="none"
                    strokeDasharray={`${(weldingProgress / 100) * 326} 326`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-mono font-bold text-accent-cyan">{weldingProgress}%</span>
                  <span className="text-xs text-industrial-400">完成进度</span>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-industrial-400">已完成焊点</span>
                <span className="text-accent-green font-mono">{completedPoints} / {weldPoints.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-industrial-400">缺陷焊点</span>
                <span className="text-accent-red font-mono">{defectivePoints}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-industrial-400">当前工件</span>
                <span className="text-white font-mono text-xs">{currentWorkpiece?.code}</span>
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
                  className="text-left bg-industrial-900 border border-industrial-700 rounded-lg p-4 hover:border-accent-cyan/50 hover:bg-industrial-800 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-industrial-800 flex items-center justify-center group-hover:bg-accent-cyan/15 transition-colors">
                      <Icon className="w-5 h-5 text-accent-cyan" />
                    </div>
                    <span className={`status-dot ${statusColors[mod.status]} animate-pulse`} />
                  </div>
                  <h4 className="text-white font-medium">{mod.title}</h4>
                  <p className="text-xs text-industrial-400 mt-1">{mod.desc}</p>
                  {mod.progress !== undefined && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-industrial-700 rounded-full overflow-hidden">
                        <div className="h-full bg-accent-cyan rounded-full transition-all" style={{ width: `${mod.progress}%` }} />
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
              焊点分布状态
            </h3>
          </div>
          <div className="panel-body">
            <div className="relative bg-industrial-900 rounded-lg p-4" style={{ minHeight: '180px' }}>
              <div className="grid grid-cols-8 gap-2">
                {weldPoints.slice(0, 32).map((p) => (
                  <div
                    key={p.id}
                    className={`w-full aspect-square rounded-sm ${
                      p.status === 'completed' ? 'bg-accent-green' :
                      p.status === 'repaired' ? 'bg-accent-green/60' :
                      p.status === 'defective' ? 'bg-accent-red animate-pulse' :
                      p.status === 'welding' ? 'bg-accent-cyan animate-pulse' :
                      'bg-industrial-700'
                    }`}
                    title={`焊点#${p.index}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-industrial-400">
              <span className="flex items-center"><span className="w-3 h-3 rounded-sm bg-accent-green mr-1.5" />已完成</span>
              <span className="flex items-center"><span className="w-3 h-3 rounded-sm bg-accent-cyan mr-1.5" />焊接中</span>
              <span className="flex items-center"><span className="w-3 h-3 rounded-sm bg-accent-red mr-1.5" />缺陷</span>
              <span className="flex items-center"><span className="w-3 h-3 rounded-sm bg-industrial-700 mr-1.5" />待焊接</span>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3 className="text-white font-semibold flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-accent-yellow" />
              生产统计
            </h3>
          </div>
          <div className="panel-body h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cycleStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px' }}
                  labelStyle={{ color: '#E2E8F0' }}
                />
                <Bar dataKey="duration" fill="#06B6D4" radius={[4, 4, 0, 0]} name="实际节拍(秒)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
