import { useWeldingStore } from '@/store/weldingStore';
import { Timer, TrendingUp, Activity, Clock, Target, BarChart3, Zap } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, ReferenceLine, Legend
} from 'recharts';

const COLORS = ['#06B6D4', '#10B981', '#F97316'];

export default function CyclePage() {
  const { cycleDataList, currentCycle, cycleStats } = useWeldingStore();

  const completedCycles = cycleDataList.filter((c) => c.status === 'completed');
  const avgDuration = completedCycles.length > 0
    ? Math.round(completedCycles.reduce((acc, c) => acc + (c.duration || 0), 0) / completedCycles.length)
    : 0;
  const targetDuration = 300;
  const oee = 87.5;

  const phaseDistribution = [
    { name: '上料', value: 35, color: '#06B6D4' },
    { name: '夹紧', value: 25, color: '#10B981' },
    { name: '焊接', value: 150, color: '#F97316' },
    { name: '检测', value: 60, color: '#8B5CF6' },
    { name: '补焊', value: 30, color: '#EF4444' },
  ];

  const oeeData = [
    { name: '可用率', value: 95 },
    { name: '性能率', value: 92 },
    { name: '质量率', value: 97 },
  ];

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center">
            <Timer className="w-6 h-6 mr-2 text-accent-cyan" />
            生产节拍监控
          </h2>
          <p className="text-sm text-industrial-400 mt-1">实时节拍计时、生产效率分析、OEE统计</p>
        </div>
        {currentCycle && (
          <div className="flex items-center gap-4 bg-industrial-800 px-5 py-3 rounded-lg border border-industrial-700">
            <div className="text-center">
              <p className="text-xs text-industrial-400">当前节拍</p>
              <p className="font-mono text-3xl font-bold text-accent-cyan animate-pulse">
                {formatDuration(Math.floor((Date.now() - currentCycle.startTime.getTime()) / 1000))}
              </p>
            </div>
            <div className="h-10 w-px bg-industrial-700" />
            <div>
              <p className="text-xs text-industrial-400">目标节拍</p>
              <p className="font-mono text-xl font-bold text-industrial-300">{formatDuration(targetDuration)}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="panel">
          <div className="panel-body">
            <div className="flex items-center justify-between mb-2">
              <span className="data-label">今日产量</span>
              <Target className="w-4 h-4 text-accent-cyan/60" />
            </div>
            <p className="text-3xl font-bold font-mono text-accent-cyan">{completedCycles.length}</p>
            <p className="text-xs text-industrial-400 mt-1">目标 150 件</p>
          </div>
        </div>
        <div className="panel">
          <div className="panel-body">
            <div className="flex items-center justify-between mb-2">
              <span className="data-label">平均节拍</span>
              <Clock className="w-4 h-4 text-accent-green/60" />
            </div>
            <p className="text-3xl font-bold font-mono text-accent-green">{formatDuration(avgDuration)}</p>
            <p className="text-xs text-industrial-400 mt-1">目标 {formatDuration(targetDuration)}</p>
          </div>
        </div>
        <div className="panel">
          <div className="panel-body">
            <div className="flex items-center justify-between mb-2">
              <span className="data-label">节拍达成率</span>
              <TrendingUp className="w-4 h-4 text-accent-green/60" />
            </div>
            <p className="text-3xl font-bold font-mono text-accent-green">
              {avgDuration > 0 ? Math.round((targetDuration / avgDuration) * 100) : 0}<span className="text-lg">%</span>
            </p>
            <p className="text-xs text-industrial-400 mt-1">稳定达标</p>
          </div>
        </div>
        <div className="panel">
          <div className="panel-body">
            <div className="flex items-center justify-between mb-2">
              <span className="data-label">设备OEE</span>
              <Zap className="w-4 h-4 text-accent-orange/60" />
            </div>
            <p className="text-3xl font-bold font-mono text-accent-orange">{oee}<span className="text-lg">%</span></p>
            <p className="text-xs text-industrial-400 mt-1">综合设备效率</p>
          </div>
        </div>
        <div className="panel">
          <div className="panel-body">
            <div className="flex items-center justify-between mb-2">
              <span className="data-label">运行状态</span>
              <Activity className="w-4 h-4 text-accent-green/60" />
            </div>
            <p className="text-xl font-bold text-accent-green flex items-center mt-2">
              <span className="status-dot bg-accent-green animate-pulse" />
              正常运行
            </p>
            <p className="text-xs text-industrial-400 mt-1">工作站 WS-A01</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="panel lg:col-span-2">
          <div className="panel-header">
            <h3 className="text-white font-semibold flex items-center">
              <BarChart3 className="w-4 h-4 mr-2 text-accent-cyan" />
              生产节拍趋势
            </h3>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center"><span className="w-3 h-0.5 bg-accent-cyan mr-1.5" />实际节拍</span>
              <span className="flex items-center"><span className="w-3 h-0.5 bg-accent-orange mr-1.5 border-dashed" />目标节拍</span>
            </div>
          </div>
          <div className="panel-body h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cycleStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} domain={[250, 350]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px' }}
                  labelStyle={{ color: '#E2E8F0' }}
                />
                <ReferenceLine y={targetDuration} stroke="#F97316" strokeDasharray="5 5" label={{ value: '目标 300s', fill: '#F97316', fontSize: 10, position: 'right' }} />
                <Bar dataKey="duration" name="实际节拍(秒)" radius={[4, 4, 0, 0]}>
                  {cycleStats.map((entry, index) => (
                    <Cell key={index} fill={entry.duration > targetDuration ? '#EF4444' : '#06B6D4'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3 className="text-white font-semibold flex items-center">
              <Activity className="w-4 h-4 mr-2 text-accent-cyan" />
              节拍阶段分布
            </h3>
          </div>
          <div className="panel-body h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={phaseDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {phaseDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="panel">
          <div className="panel-header">
            <h3 className="text-white font-semibold flex items-center">
              <Zap className="w-4 h-4 mr-2 text-accent-orange" />
              OEE 指标分析
            </h3>
          </div>
          <div className="panel-body">
            <div className="space-y-4">
              {oeeData.map((item) => (
                <div key={item.name}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-industrial-300">{item.name}</span>
                    <span className="font-mono font-bold text-accent-cyan">{item.value}%</span>
                  </div>
                  <div className="h-2 bg-industrial-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-accent-cyan to-cyan-400 rounded-full"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-4 mt-4 border-t border-industrial-700">
                <div className="flex items-center justify-between">
                  <span className="text-industrial-300 font-medium">综合 OEE</span>
                  <span className="font-mono text-2xl font-bold text-accent-orange">{oee}%</span>
                </div>
                <p className="text-xs text-accent-green mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  高于行业平均水平
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="panel lg:col-span-2">
          <div className="panel-header">
            <h3 className="text-white font-semibold flex items-center">
              <Timer className="w-4 h-4 mr-2 text-accent-cyan" />
              生产节拍记录
            </h3>
          </div>
          <div className="panel-body p-0">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-industrial-400 border-b border-industrial-700">
                  <th className="px-4 py-3 font-medium">工件编号</th>
                  <th className="px-4 py-3 font-medium">开始时间</th>
                  <th className="px-4 py-3 font-medium">上料</th>
                  <th className="px-4 py-3 font-medium">夹紧</th>
                  <th className="px-4 py-3 font-medium">焊接</th>
                  <th className="px-4 py-3 font-medium">检测</th>
                  <th className="px-4 py-3 font-medium">补焊</th>
                  <th className="px-4 py-3 font-medium">总时长</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {cycleDataList.map((c) => (
                  <tr key={c.id} className="border-b border-industrial-800 hover:bg-industrial-800/50 text-sm">
                    <td className="px-4 py-3 font-mono text-accent-cyan text-xs">{c.workpieceCode}</td>
                    <td className="px-4 py-3 text-industrial-300 font-mono text-xs">{c.startTime.toLocaleTimeString()}</td>
                    <td className="px-4 py-3 text-industrial-300 font-mono">{c.loadingTime}s</td>
                    <td className="px-4 py-3 text-industrial-300 font-mono">{c.fixtureTime}s</td>
                    <td className="px-4 py-3 text-industrial-300 font-mono">{c.weldingTime}s</td>
                    <td className="px-4 py-3 text-industrial-300 font-mono">{c.inspectionTime}s</td>
                    <td className="px-4 py-3 text-industrial-300 font-mono">{c.repairTime}s</td>
                    <td className="px-4 py-3">
                      <span className={`font-mono font-bold ${c.duration && c.duration > targetDuration ? 'text-accent-red' : 'text-accent-green'}`}>
                        {formatDuration(c.duration)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center text-xs ${
                        c.status === 'running' ? 'text-accent-yellow' : 'text-accent-green'
                      }`}>
                        <span className={`status-dot ${c.status === 'running' ? 'bg-accent-yellow animate-pulse' : 'bg-accent-green'}`} />
                        {c.status === 'running' ? '进行中' : '已完成'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
