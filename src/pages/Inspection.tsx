import { useState } from 'react';
import { useWeldingStore } from '@/store/weldingStore';
import { ScanLine, CheckCircle2, XCircle, AlertTriangle, Activity, FileCheck, Eye } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const generateUltrasonicData = () => {
  const data = [];
  for (let i = 0; i < 100; i++) {
    const base = Math.sin(i * 0.1) * 30 + Math.random() * 20;
    const anomaly = i > 40 && i < 50 ? 60 + Math.random() * 40 : 0;
    data.push({ time: i, amplitude: Math.max(0, base + anomaly) });
  }
  return data;
};

export default function InspectionPage() {
  const { weldPoints, updateWeldPoint, currentWorkpiece } = useWeldingStore();
  const [selectedPoint, setSelectedPoint] = useState(weldPoints[27] || null);
  const ultrasonicData = generateUltrasonicData();

  const completedPoints = weldPoints.filter((p) => p.status === 'completed' || p.status === 'repaired');
  const passedPoints = completedPoints.filter((p) => p.ultrasonicResult === 'pass');
  const failedPoints = weldPoints.filter((p) => p.ultrasonicResult === 'fail' || p.status === 'defective');
  const inspectedPoints = completedPoints.filter((p) => p.ultrasonicResult !== undefined);

  const passRate = inspectedPoints.length > 0 ? ((passedPoints.length / inspectedPoints.length) * 100).toFixed(1) : '0';
  const defectRate = inspectedPoints.length > 0 ? ((failedPoints.length / inspectedPoints.length) * 100).toFixed(1) : '0';

  const defectLabels: Record<string, string> = {
    cold: '虚焊',
    missing: '漏焊',
    spatter: '焊渣飞溅',
    none: '无缺陷',
  };

  const handleMarkDefect = (id: string, type: 'cold' | 'missing' | 'spatter') => {
    updateWeldPoint(id, { status: 'defective', defectType: type, ultrasonicResult: 'fail' });
  };

  const handleMarkPass = (id: string) => {
    updateWeldPoint(id, { status: 'completed', ultrasonicResult: 'pass', defectType: 'none' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center">
          <ScanLine className="w-6 h-6 mr-2 text-accent-cyan" />
          焊点质量检测
        </h2>
        <p className="text-sm text-industrial-400 mt-1">焊点数量核对、超声检测、虚焊漏焊检查</p>
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
                <p className="data-label">缺陷点</p>
                <p className="text-3xl font-bold font-mono text-accent-red mt-1">{failedPoints.length}</p>
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
            <span className="text-xs text-industrial-400">点击焊点查看详情</span>
          </div>
          <div className="panel-body">
            <div className="bg-industrial-900 rounded-lg p-6 border border-industrial-700">
              <div className="grid grid-cols-8 gap-3">
                {weldPoints.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPoint(p)}
                    className={`relative aspect-square rounded-lg flex items-center justify-center text-sm font-mono font-medium transition-all ${
                      selectedPoint?.id === p.id ? 'ring-2 ring-accent-cyan ring-offset-2 ring-offset-industrial-900 scale-105' : ''
                    } ${
                      p.ultrasonicResult === 'pass' ? 'bg-accent-green text-white' :
                      p.ultrasonicResult === 'fail' || p.status === 'defective' ? 'bg-accent-red text-white' :
                      p.status === 'completed' ? 'bg-accent-cyan/70 text-white' :
                      p.status === 'welding' ? 'bg-accent-yellow text-white animate-pulse' :
                      'bg-industrial-700 text-industrial-400'
                    }`}
                  >
                    {p.index}
                    {(p.ultrasonicResult === 'fail' || p.status === 'defective') && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent-red rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-2.5 h-2.5 text-white" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-center gap-6 mt-4 text-xs text-industrial-400">
              <span className="flex items-center"><span className="w-3 h-3 rounded bg-accent-green mr-1.5" />检测合格</span>
              <span className="flex items-center"><span className="w-3 h-3 rounded bg-accent-red mr-1.5" />检测不合格</span>
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
                    <span className={`inline-flex items-center text-sm px-2 py-1 rounded ${
                      selectedPoint.ultrasonicResult === 'pass' ? 'bg-accent-green/20 text-accent-green' :
                      selectedPoint.ultrasonicResult === 'fail' ? 'bg-accent-red/20 text-accent-red' :
                      'bg-industrial-700 text-industrial-300'
                    }`}>
                      {selectedPoint.ultrasonicResult === 'pass' ? '检测合格' :
                       selectedPoint.ultrasonicResult === 'fail' ? '检测不合格' : '待检测'}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-1.5 border-b border-industrial-700">
                      <span className="text-industrial-400">位置坐标</span>
                      <span className="font-mono text-white">({selectedPoint.position.x}, {selectedPoint.position.y})</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-industrial-700">
                      <span className="text-industrial-400">焊接状态</span>
                      <span className="text-white">{selectedPoint.status}</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-industrial-400">缺陷类型</span>
                      <span className={selectedPoint.defectType && selectedPoint.defectType !== 'none' ? 'text-accent-red' : 'text-accent-green'}>
                        {selectedPoint.defectType ? defectLabels[selectedPoint.defectType] : '--'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-industrial-400">检测操作</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleMarkPass(selectedPoint.id)} className="btn-primary text-sm flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />标记合格
                    </button>
                    <button onClick={() => handleMarkDefect(selectedPoint.id, 'cold')} className="btn-warning text-sm flex items-center justify-center gap-1">
                      <XCircle className="w-3.5 h-3.5" />标记虚焊
                    </button>
                    <button onClick={() => handleMarkDefect(selectedPoint.id, 'missing')} className="btn-danger text-sm flex items-center justify-center gap-1">
                      <XCircle className="w-3.5 h-3.5" />标记漏焊
                    </button>
                    <button onClick={() => handleMarkDefect(selectedPoint.id, 'spatter')} className="btn-secondary text-sm flex items-center justify-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />焊渣飞溅
                    </button>
                  </div>
                </div>
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
            超声波检测波形图 {selectedPoint && <span className="text-industrial-400 font-normal text-sm ml-2">（焊点 #{selectedPoint.index}）</span>}
          </h3>
        </div>
        <div className="panel-body h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ultrasonicData}>
              <defs>
                <linearGradient id="ultraGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#64748B" fontSize={10} label={{ value: '时间 (μs)', position: 'insideBottom', offset: -5, fill: '#64748B', fontSize: 10 }} />
              <YAxis stroke="#64748B" fontSize={10} label={{ value: '幅度', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px' }}
                labelStyle={{ color: '#E2E8F0' }}
              />
              <Area type="monotone" dataKey="amplitude" stroke="#06B6D4" strokeWidth={1.5} fill="url(#ultraGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3 className="text-white font-semibold">缺陷焊点列表</h3>
          <span className="text-xs text-industrial-400">当前工件: {currentWorkpiece?.code}</span>
        </div>
        <div className="panel-body p-0">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-industrial-400 border-b border-industrial-700">
                <th className="px-4 py-3 font-medium">焊点编号</th>
                <th className="px-4 py-3 font-medium">位置</th>
                <th className="px-4 py-3 font-medium">缺陷类型</th>
                <th className="px-4 py-3 font-medium">检测结果</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {failedPoints.length > 0 ? failedPoints.map((p) => (
                <tr key={p.id} className="border-b border-industrial-800 hover:bg-industrial-800/50 text-sm">
                  <td className="px-4 py-3 font-mono text-accent-orange font-bold">#{p.index}</td>
                  <td className="px-4 py-3 font-mono text-industrial-300 text-xs">({p.position.x}, {p.position.y})</td>
                  <td className="px-4 py-3 text-accent-red">{p.defectType ? defectLabels[p.defectType] : '--'}</td>
                  <td className="px-4 py-3 text-accent-red flex items-center"><XCircle className="w-4 h-4 mr-1.5" />不合格</td>
                  <td className="px-4 py-3 text-accent-yellow">待补焊</td>
                  <td className="px-4 py-3">
                    <button className="text-accent-cyan hover:text-cyan-400 text-xs">安排补焊 →</button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-industrial-500 text-sm">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-accent-green/50" />
                    暂无缺陷焊点
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
