import { useState, useMemo } from 'react';
import { useWeldingStore } from '@/store/weldingStore';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, ClipboardList, Wrench, CheckCircle2, Clock,
  Package, AlertTriangle, TrendingUp, User, ShieldCheck, Layers
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell
} from 'recharts';
import type { QualityByWorkpiece, QualityByDefect, QualityByOperator, DefectType } from '@/types';

type TabKey = 'workpiece' | 'defect' | 'operator';

function StatCard({
  icon: Icon, label, value, unit, trend, color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  unit?: string;
  trend?: string;
  color: string;
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
            {trend && (
              <p className="text-xs text-accent-green mt-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />{trend}
              </p>
            )}
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            color
              .replace('text-', 'bg-')
              .replace('cyan', 'cyan/20')
              .replace('green', 'green/20')
              .replace('orange', 'orange/20')
              .replace('red', 'red/20')
          }`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

const DEFECT_LABELS: Record<DefectType, string> = {
  cold: '虚焊',
  missing: '漏焊',
  spatter: '焊渣飞溅',
  param_abnormal: '参数异常',
  none: '无',
};

const DEFECT_COLORS: Record<string, string> = {
  '虚焊': '#F97316',
  '漏焊': '#EF4444',
  '焊渣飞溅': '#F59E0B',
  '参数异常': '#8B5CF6',
  '无': '#64748B',
};

export default function QualityBoard() {
  const navigate = useNavigate();
  const { computeQualityBoardStats, workpieces, setCurrentWorkpiece } = useWeldingStore();
  const [activeTab, setActiveTab] = useState<TabKey>('workpiece');

  const stats = useMemo(() => computeQualityBoardStats(), [computeQualityBoardStats]);
  const workpieceCount = workpieces.length;

  const handleWorkpieceClick = (wp: QualityByWorkpiece) => {
    const target = workpieces.find(w => w.id === wp.workpieceId);
    if (target) {
      setCurrentWorkpiece(target);
    }
    navigate('/traceability');
  };

  const defectChartData = stats.byDefect.map(d => ({
    name: d.label,
    发生次数: d.count,
    返修次数: d.repairCount,
  }));

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'workpiece', label: '按工件统计', icon: Package },
    { key: 'defect', label: '按缺陷类型', icon: AlertTriangle },
    { key: 'operator', label: '按处理人', icon: User },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-accent-cyan" />
            质量责任看板
          </h2>
          <p className="text-sm text-industrial-400 mt-1">
            返修次数与平均闭环时间统计
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Wrench}
          label="总返修次数"
          value={stats.totalRepairs}
          unit="次"
          color="text-accent-cyan"
        />
        <StatCard
          icon={CheckCircle2}
          label="总体合格率"
          value={stats.overallPassRate}
          unit="%"
          trend={stats.overallPassRate >= 95 ? '优秀达标' : '需关注'}
          color="text-accent-green"
        />
        <StatCard
          icon={Clock}
          label="平均闭环时间"
          value={stats.overallAvgCloseMinutes}
          unit="分钟"
          color="text-accent-orange"
        />
        <StatCard
          icon={Layers}
          label="涉及工件数"
          value={workpieceCount}
          unit="件"
          color="text-accent-cyan"
        />
      </div>

      <div className="panel">
        <div className="panel-header border-b-0 pb-0">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-all border-b-2 -mb-px ${
                    isActive
                      ? 'bg-industrial-800/60 text-accent-cyan border-accent-cyan'
                      : 'text-industrial-400 border-transparent hover:text-industrial-200 hover:bg-industrial-800/30'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="panel-body">
          {activeTab === 'workpiece' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-industrial-400 border-b border-industrial-700">
                    <th className="px-4 py-3 font-medium">工件编号</th>
                    <th className="px-4 py-3 font-medium">总焊点数</th>
                    <th className="px-4 py-3 font-medium">缺陷数</th>
                    <th className="px-4 py-3 font-medium">返修次数</th>
                    <th className="px-4 py-3 font-medium">告警数</th>
 <th className="px-4 py-3 font-medium">合格率</th>
                    <th className="px-4 py-3 font-medium">平均闭环分钟数</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byWorkpiece.map((wp) => (
                    <tr
                      key={wp.workpieceId}
                      className="border-b border-industrial-800 hover:bg-industrial-800/50 text-sm"
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleWorkpieceClick(wp)}
                          className="text-accent-cyan hover:text-accent-cyan/80 font-mono font-medium flex items-center gap-1 hover:underline"
                        >
                          {wp.workpieceCode}
                          <ClipboardList className="w-3.5 h-3.5" />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-white font-mono">{wp.totalPoints}</td>
                      <td className="px-4 py-3">
                        <span className={`font-mono ${wp.defectiveCount > 0 ? 'text-accent-red' : 'text-industrial-300'}`}>
                          {wp.defectiveCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-mono ${wp.repairCount > 0 ? 'text-accent-orange' : 'text-industrial-300'}`}>
                          {wp.repairCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-mono ${wp.alarmCount > 0 ? 'text-accent-yellow' : 'text-industrial-300'}`}>
                          {wp.alarmCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-mono font-semibold ${
                          wp.passRate >= 95 ? 'text-accent-green' : wp.passRate >= 85 ? 'text-accent-yellow' : 'text-accent-red'
                        }`}>
                          {wp.passRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-industrial-300 font-mono">
                        {wp.avgCloseTimeMinutes || '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'defect' && (
            <div className="space-y-6">
              <div className="bg-industrial-900 rounded-lg p-4 border border-industrial-700">
                <h4 className="text-sm font-medium text-industrial-300 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-accent-yellow" />
                  缺陷类型分布
                </h4>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={defectChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                      <YAxis stroke="#64748B" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1E293B',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                        }}
                        labelStyle={{ color: '#E2E8F0' }}
                      />
                      <Legend
                        wrapperStyle={{ color: '#94A3B8', fontSize: '12px' }}
                      />
                      <Bar dataKey="发生次数" radius={[4, 4, 0, 0]} name="发生次数">
                        {defectChartData.map((entry, index) => (
                          <Cell
                            key={`cell-occur-${index}`}
                            fill={DEFECT_COLORS[entry.name] || '#06B6D4'}
                            fillOpacity={0.9}
                          />
                        ))}
                      </Bar>
                      <Bar dataKey="返修次数" radius={[4, 4, 0, 0]} name="返修次数" fill="#06B6D4" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-industrial-400 border-b border-industrial-700">
                      <th className="px-4 py-3 font-medium">缺陷类型</th>
                      <th className="px-4 py-3 font-medium">发生次数</th>
                      <th className="px-4 py-3 font-medium">返修次数</th>
                      <th className="px-4 py-3 font-medium">平均闭环分钟</th>
                      <th className="px-4 py-3 font-medium">影响工件数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.byDefect.map((d) => (
                      <tr
                        key={d.defectType}
                        className="border-b border-industrial-800 hover:bg-industrial-800/50 text-sm"
                      >
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="w-3 h-3 rounded-sm"
                              style={{ backgroundColor: DEFECT_COLORS[d.label] || '#06B6D4' }}
                            />
                            <span className="text-white font-medium">{DEFECT_LABELS[d.defectType] || d.label}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white font-mono">{d.count}</td>
                        <td className="px-4 py-3 text-accent-cyan font-mono">{d.repairCount}</td>
                        <td className="px-4 py-3 text-industrial-300 font-mono">
                          {d.avgCloseTimeMinutes || '--'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-accent-orange font-mono">
                            <Package className="w-3.5 h-3.5" />
                            {d.affectedWorkpieces}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'operator' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-industrial-400 border-b border-industrial-700">
                    <th className="px-4 py-3 font-medium">处理人</th>
                    <th className="px-4 py-3 font-medium">角色</th>
                    <th className="px-4 py-3 font-medium">返修次数</th>
                    <th className="px-4 py-3 font-medium">闭环次数</th>
                    <th className="px-4 py-3 font-medium">平均闭环分钟</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byOperator.map((op) => (
                    <tr
                      key={op.operator}
                      className="border-b border-industrial-800 hover:bg-industrial-800/50 text-sm"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-accent-cyan/15 flex items-center justify-center">
                            <User className="w-4 h-4 text-accent-cyan" />
                          </div>
                          <span className="text-white font-medium">{op.operator}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30">
                          <ShieldCheck className="w-3 h-3" />
                          {op.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-accent-orange font-mono font-semibold">
                        {op.repairCount}
                      </td>
                      <td className="px-4 py-3 text-accent-green font-mono font-semibold">
                        {op.closedCount}
                      </td>
                      <td className="px-4 py-3 text-industrial-300 font-mono">
                        {op.avgCloseTimeMinutes || '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
