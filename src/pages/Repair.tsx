import { useState } from 'react';
import { useWeldingStore } from '@/store/weldingStore';
import { Wrench, CheckCircle2, AlertTriangle, Sparkles, User, Clock, FileText, Brush } from 'lucide-react';

export default function RepairPage() {
  const { weldPoints, repairRecords, addRepairRecord, updateWeldPoint, currentWorkpiece } = useWeldingStore();
  const [formData, setFormData] = useState({
    weldPointId: '',
    operator: '',
    description: '',
    spatterCleaned: false,
  });

  const defectivePoints = weldPoints.filter((p) => p.status === 'defective');
  const repairedPoints = weldPoints.filter((p) => p.status === 'repaired');

  const defectLabels: Record<string, string> = {
    cold: '虚焊',
    missing: '漏焊',
    spatter: '焊渣飞溅',
  };

  const handleSubmit = () => {
    if (!formData.weldPointId || !formData.operator || !formData.description) return;

    const targetPoint = weldPoints.find((p) => p.id === formData.weldPointId);
    const newRecord = {
      id: `rr-${Date.now()}`,
      workpieceId: currentWorkpiece?.id || '',
      weldPointId: formData.weldPointId,
      weldPointIndex: targetPoint?.index || 0,
      operator: formData.operator,
      repairTime: new Date(),
      description: formData.description,
      spatterCleaned: formData.spatterCleaned,
    };

    addRepairRecord(newRecord);
    updateWeldPoint(formData.weldPointId, { status: 'repaired', ultrasonicResult: 'pass', defectType: 'none' });

    setFormData({ weldPointId: '', operator: '', description: '', spatterCleaned: false });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center">
          <Wrench className="w-6 h-6 mr-2 text-accent-cyan" />
          补焊修整作业
        </h2>
        <p className="text-sm text-industrial-400 mt-1">人工补焊、焊渣飞溅清理、修整记录</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="panel">
          <div className="panel-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="data-label">待补焊点数</p>
                <p className="text-3xl font-bold font-mono text-accent-red mt-1">{defectivePoints.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-accent-red/50" />
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="data-label">已修整点数</p>
                <p className="text-3xl font-bold font-mono text-accent-green mt-1">{repairedPoints.length}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-accent-green/50" />
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="data-label">今日补焊记录</p>
                <p className="text-3xl font-bold font-mono text-accent-cyan mt-1">{repairRecords.length}</p>
              </div>
              <FileText className="w-8 h-8 text-accent-cyan/50" />
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="data-label">修整合格率</p>
                <p className="text-3xl font-bold font-mono text-accent-green mt-1">100<span className="text-lg">%</span></p>
              </div>
              <Sparkles className="w-8 h-8 text-accent-green/50" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="panel lg:col-span-1">
          <div className="panel-header">
            <h3 className="text-white font-semibold flex items-center">
              <Wrench className="w-4 h-4 mr-2 text-accent-cyan" />
              补焊操作登记
            </h3>
          </div>
          <div className="panel-body space-y-4">
            <div>
              <label className="block text-sm text-industrial-400 mb-2">选择缺陷焊点</label>
              <select
                value={formData.weldPointId}
                onChange={(e) => setFormData({ ...formData, weldPointId: e.target.value })}
                className="w-full px-3 py-2.5 bg-industrial-900 border border-industrial-700 rounded text-white text-sm focus:outline-none focus:border-accent-cyan"
              >
                <option value="">请选择缺陷焊点...</option>
                {defectivePoints.map((p) => (
                  <option key={p.id} value={p.id}>
                    焊点 #{p.index} - {p.defectType ? defectLabels[p.defectType] : '缺陷'}
                  </option>
                ))}
              </select>
              {defectivePoints.length === 0 && (
                <p className="text-xs text-accent-green mt-2 flex items-center"><CheckCircle2 className="w-3 h-3 mr-1" />暂无待补焊焊点</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-industrial-400 mb-2">操作员</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-industrial-500" />
                <input
                  type="text"
                  value={formData.operator}
                  onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                  placeholder="输入操作员姓名"
                  className="w-full pl-10 pr-3 py-2.5 bg-industrial-900 border border-industrial-700 rounded text-white text-sm focus:outline-none focus:border-accent-cyan"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-industrial-400 mb-2">补焊/修整说明</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="请描述补焊或修整内容..."
                rows={4}
                className="w-full px-3 py-2.5 bg-industrial-900 border border-industrial-700 rounded text-white text-sm focus:outline-none focus:border-accent-cyan resize-none"
              />
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.spatterCleaned}
                onChange={(e) => setFormData({ ...formData, spatterCleaned: e.target.checked })}
                className="w-4 h-4 rounded accent-cyan-500 bg-industrial-800 border-industrial-600"
              />
              <span className="text-sm text-industrial-300 flex items-center gap-1.5">
                <Brush className="w-4 h-4 text-accent-yellow" />
                已完成焊渣飞溅清理
              </span>
            </label>

            <button
              onClick={handleSubmit}
              disabled={!formData.weldPointId || !formData.operator || !formData.description}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3"
            >
              <CheckCircle2 className="w-4 h-4" />
              提交补焊记录
            </button>
          </div>
        </div>

        <div className="panel lg:col-span-2">
          <div className="panel-header">
            <h3 className="text-white font-semibold flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-accent-yellow" />
              待补焊焊点分布
            </h3>
            <span className="text-xs text-industrial-400">{defectivePoints.length} 个待处理</span>
          </div>
          <div className="panel-body">
            <div className="bg-industrial-900 rounded-lg p-6 border border-industrial-700 mb-6">
              <div className="grid grid-cols-8 gap-2">
                {weldPoints.map((p) => (
                  <div
                    key={p.id}
                    className={`relative aspect-square rounded-md flex items-center justify-center text-xs font-mono font-medium ${
                      p.status === 'defective' ? 'bg-accent-red text-white animate-pulse cursor-pointer hover:scale-110 transition-transform ring-2 ring-accent-red/50' :
                      p.status === 'repaired' ? 'bg-accent-green text-white' :
                      p.status === 'completed' ? 'bg-accent-green/40 text-white' :
                      'bg-industrial-700 text-industrial-400'
                    }`}
                    title={`焊点#${p.index} - ${p.status}`}
                  >
                    {p.index}
                    {p.status === 'defective' && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent-yellow rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-2.5 h-2.5 text-industrial-900" />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm text-industrial-300 font-medium">待补焊焊点详情</h4>
              {defectivePoints.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {defectivePoints.map((p) => (
                    <div key={p.id} className="bg-industrial-900 border border-accent-red/30 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-mono text-lg font-bold text-accent-red">焊点 #{p.index}</p>
                          <p className="text-xs text-industrial-400 mt-0.5">位置: ({p.position.x}, {p.position.y})</p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-accent-red/20 text-accent-red rounded">
                          {p.defectType ? defectLabels[p.defectType] : '缺陷'}
                        </span>
                      </div>
                      <p className="text-xs text-industrial-400 mt-2">超声检测: 不合格</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-industrial-900 rounded-lg p-8 text-center text-industrial-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-accent-green/40" />
                  <p>所有焊点均已通过检测，无需补焊</p>
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
            补焊修整记录
          </h3>
        </div>
        <div className="panel-body p-0">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-industrial-400 border-b border-industrial-700">
                <th className="px-4 py-3 font-medium">记录编号</th>
                <th className="px-4 py-3 font-medium">工件</th>
                <th className="px-4 py-3 font-medium">焊点</th>
                <th className="px-4 py-3 font-medium">操作员</th>
                <th className="px-4 py-3 font-medium">修整时间</th>
                <th className="px-4 py-3 font-medium">说明</th>
                <th className="px-4 py-3 font-medium">焊渣清理</th>
              </tr>
            </thead>
            <tbody>
              {repairRecords.map((r) => (
                <tr key={r.id} className="border-b border-industrial-800 hover:bg-industrial-800/50 text-sm">
                  <td className="px-4 py-3 font-mono text-accent-cyan text-xs">{r.id}</td>
                  <td className="px-4 py-3 text-industrial-300 font-mono text-xs">{r.workpieceId}</td>
                  <td className="px-4 py-3 text-white font-mono font-semibold">#{r.weldPointIndex}</td>
                  <td className="px-4 py-3 text-industrial-300">{r.operator}</td>
                  <td className="px-4 py-3 text-industrial-300 font-mono text-xs">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.repairTime.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3 text-industrial-300 max-w-xs truncate">{r.description}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center text-xs ${r.spatterCleaned ? 'text-accent-green' : 'text-accent-yellow'}`}>
                      {r.spatterCleaned ? <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> : <AlertTriangle className="w-3.5 h-3.5 mr-1" />}
                      {r.spatterCleaned ? '已清理' : '待清理'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
