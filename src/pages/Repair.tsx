import { useState, useMemo } from 'react';
import { useWeldingStore } from '@/store/weldingStore';
import type { RepairReason, RepairMethod, ReinspectionResult } from '@/types';
import {
  Wrench, CheckCircle2, AlertTriangle, Sparkles, User, Clock,
  FileText, Brush, Link2, Bell, XCircle, ClipboardList, ShieldCheck, Search
} from 'lucide-react';

const REPAIR_REASON_OPTIONS: { value: RepairReason; label: string }[] = [
  { value: 'param_abnormal', label: '参数异常' },
  { value: 'cold_weld', label: '虚焊' },
  { value: 'missing_weld', label: '漏焊' },
  { value: 'spatter', label: '焊渣飞溅' },
  { value: 'ultrasonic_fail', label: '超声不合格' },
  { value: 'other', label: '其他' },
];

const REPAIR_METHOD_OPTIONS: { value: RepairMethod; label: string }[] = [
  { value: 'manual_spot', label: '手工点焊' },
  { value: 'rework', label: '重焊' },
  { value: 'replace', label: '更换工件' },
  { value: 'grind_clean', label: '打磨清理' },
];

export default function RepairPage() {
  const {
    weldPoints, repairRecords, submitRepair,
    currentWorkpiece, alarmRecords, dashboardStats,
  } = useWeldingStore();

  const [formData, setFormData] = useState({
    weldPointId: '',
    operator: '',
    description: '',
    spatterCleaned: false,
  });
  const [selectedReason, setSelectedReason] = useState<RepairReason>('param_abnormal');
  const [selectedMethod, setSelectedMethod] = useState<RepairMethod>('manual_spot');
  const [reinspectionResult, setReinspectionResult] = useState<ReinspectionResult>('pass');
  const [reinspectionOperator, setReinspectionOperator] = useState<string>('王质检员');
  const [reinspectionNote, setReinspectionNote] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState<string | null>(null);

  const defectivePoints = useMemo(
    () => weldPoints.filter((p) => p.status === 'defective'),
    [weldPoints]
  );
  const repairedPoints = useMemo(
    () => weldPoints.filter((p) => p.status === 'repaired'),
    [weldPoints]
  );

  const defectLabels: Record<string, string> = {
    cold: '虚焊',
    missing: '漏焊',
    spatter: '焊渣飞溅',
    param_abnormal: '参数异常',
    none: '无缺陷',
  };

  const handleSubmit = () => {
    if (!formData.weldPointId) return;
    const targetPoint = weldPoints.find(p => p.id === formData.weldPointId);
    submitRepair({
      weldPointId: formData.weldPointId,
      operator: formData.operator,
      description: formData.description,
      spatterCleaned: formData.spatterCleaned,
      repairReason: selectedReason,
      repairMethod: selectedMethod,
      reinspectionResult,
      reinspectionOperator,
      reinspectionNote,
    });
    if (targetPoint) {
      setShowSuccess(`焊点 #${targetPoint.index} 补焊完成，已自动同步检测结果、解决关联告警并更新仪表盘`);
      setTimeout(() => setShowSuccess(null), 3500);
    }
    setFormData({ weldPointId: '', operator: '', description: '', spatterCleaned: false });
    setSelectedReason('param_abnormal');
    setSelectedMethod('manual_spot');
    setReinspectionResult('pass');
    setReinspectionOperator('王质检员');
    setReinspectionNote('');
  };

  const relatedAlarmCount = useMemo(() =>
    alarmRecords.filter(a =>
      a.workpieceId === currentWorkpiece?.id &&
      !a.resolved &&
      weldPoints.some(p => p.id === formData.weldPointId && p.index === a.weldPointIndex)
    ).length,
  [alarmRecords, currentWorkpiece?.id, weldPoints, formData.weldPointId]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center">
            <Wrench className="w-6 h-6 mr-2 text-accent-cyan" />
            补焊修整作业
          </h2>
          <p className="text-sm text-industrial-400 mt-1">
            人工补焊 · 焊渣飞溅清理 · 补焊完成自动同步检测结果和仪表盘统计 · 当前工件:
            <span className="text-accent-cyan font-mono ml-1">{currentWorkpiece?.code || '--'}</span>
          </p>
        </div>
        {showSuccess && (
          <div className="bg-accent-green/15 border border-accent-green/40 rounded-lg px-4 py-2 flex items-center gap-2 animate-pulse">
            <CheckCircle2 className="w-5 h-5 text-accent-green" />
            <div className="text-sm text-accent-green">{showSuccess}</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="panel">
          <div className="panel-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="data-label">待补焊点数</p>
                <p className="text-3xl font-bold font-mono text-accent-red mt-1">{dashboardStats.defectivePoints || 0}</p>
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
                <p className="data-label">补焊记录总数</p>
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
              <label className="block text-sm text-industrial-400 mb-2">选择缺陷焊点
                <span className="text-industrial-600 text-xs ml-2">（来自检测不合格 / 焊接异常）</span>
              </label>
              <select
                value={formData.weldPointId}
                onChange={(e) => setFormData({ ...formData, weldPointId: e.target.value })}
                className="w-full px-3 py-2.5 bg-industrial-900 border border-industrial-700 rounded text-white text-sm focus:outline-none focus:border-accent-cyan"
              >
                <option value="">请选择缺陷焊点...</option>
                {defectivePoints.map((p) => (
                  <option key={p.id} value={p.id}>
                    焊点 #{p.index} - {defectLabels[p.defectType as keyof typeof defectLabels] || (p.paramAbnormal ? '参数异常' : '缺陷')}
                  </option>
                ))}
              </select>
              {defectivePoints.length === 0 && (
                <p className="text-xs text-accent-green mt-2 flex items-center"><CheckCircle2 className="w-3 h-3 mr-1" />暂无待补焊焊点</p>
              )}
              {relatedAlarmCount > 0 && formData.weldPointId && (
                <p className="text-xs text-accent-yellow mt-2 flex items-center gap-1.5">
                  <Bell className="w-3 h-3" />
                  该焊点关联 {relatedAlarmCount} 条告警，补焊后将自动解决
                </p>
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
                  placeholder="例：补焊工-李刚"
                  className="w-full pl-10 pr-3 py-2.5 bg-industrial-900 border border-industrial-700 rounded text-white text-sm focus:outline-none focus:border-accent-cyan"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-industrial-400 mb-2">补焊 / 修整说明</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="请描述补焊方式、参数调整、清理情况等..."
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

            <div className="border border-accent-cyan/30 rounded-lg bg-industrial-800/30 overflow-hidden">
              <div className="px-3 py-2 border-b border-accent-cyan/30 bg-accent-cyan/5 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-accent-cyan" />
                <h4 className="text-sm font-semibold text-accent-cyan">返修原因</h4>
              </div>
              <div className="p-3">
                <select
                  value={selectedReason}
                  onChange={(e) => setSelectedReason(e.target.value as RepairReason)}
                  className="w-full px-3 py-2.5 bg-industrial-900 border border-industrial-700 rounded text-white text-sm focus:outline-none focus:border-accent-cyan"
                >
                  {REPAIR_REASON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border border-accent-cyan/30 rounded-lg bg-industrial-800/30 overflow-hidden">
              <div className="px-3 py-2 border-b border-accent-cyan/30 bg-accent-cyan/5 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-accent-cyan" />
                <h4 className="text-sm font-semibold text-accent-cyan">处理方式</h4>
              </div>
              <div className="p-3">
                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value as RepairMethod)}
                  className="w-full px-3 py-2.5 bg-industrial-900 border border-industrial-700 rounded text-white text-sm focus:outline-none focus:border-accent-cyan"
                >
                  {REPAIR_METHOD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border border-accent-cyan/30 rounded-lg bg-industrial-800/30 overflow-hidden">
              <div className="px-3 py-2 border-b border-accent-cyan/30 bg-accent-cyan/5 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-accent-cyan" />
                <h4 className="text-sm font-semibold text-accent-cyan">复检结论</h4>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-3 gap-2">
                  <label
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded cursor-pointer border transition-all ${
                      reinspectionResult === 'pass'
                        ? 'bg-accent-green/20 border-accent-green/60 text-accent-green'
                        : 'bg-industrial-800 border-industrial-600 text-industrial-400 hover:border-industrial-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reinspection"
                      value="pass"
                      checked={reinspectionResult === 'pass'}
                      onChange={() => setReinspectionResult('pass')}
                      className="sr-only"
                    />
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-medium">合格</span>
                  </label>
                  <label
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded cursor-pointer border transition-all ${
                      reinspectionResult === 'fail'
                        ? 'bg-accent-red/20 border-accent-red/60 text-accent-red'
                        : 'bg-industrial-800 border-industrial-600 text-industrial-400 hover:border-industrial-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reinspection"
                      value="fail"
                      checked={reinspectionResult === 'fail'}
                      onChange={() => setReinspectionResult('fail')}
                      className="sr-only"
                    />
                    <XCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">不合格</span>
                  </label>
                  <label
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded cursor-pointer border transition-all ${
                      reinspectionResult === 'pending'
                        ? 'bg-industrial-600/40 border-industrial-500 text-industrial-200'
                        : 'bg-industrial-800 border-industrial-600 text-industrial-400 hover:border-industrial-500'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reinspection"
                      value="pending"
                      checked={reinspectionResult === 'pending'}
                      onChange={() => setReinspectionResult('pending')}
                      className="sr-only"
                    />
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">待检</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="border border-accent-cyan/30 rounded-lg bg-industrial-800/30 overflow-hidden">
              <div className="px-3 py-2 border-b border-accent-cyan/30 bg-accent-cyan/5 flex items-center gap-2">
                <Search className="w-4 h-4 text-accent-cyan" />
                <h4 className="text-sm font-semibold text-accent-cyan">复检信息</h4>
              </div>
              <div className="p-3 space-y-3">
                <div>
                  <label className="block text-xs text-industrial-400 mb-1.5">复检员</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-industrial-500" />
                    <input
                      type="text"
                      value={reinspectionOperator}
                      onChange={(e) => setReinspectionOperator(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-industrial-900 border border-industrial-700 rounded text-white text-sm focus:outline-none focus:border-accent-cyan"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-industrial-400 mb-1.5">复检备注</label>
                  <textarea
                    value={reinspectionNote}
                    onChange={(e) => setReinspectionNote(e.target.value)}
                    placeholder="填写复检观察、测量数据、异常说明等..."
                    rows={2}
                    className="w-full px-3 py-2 bg-industrial-900 border border-industrial-700 rounded text-white text-sm focus:outline-none focus:border-accent-cyan resize-none"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!formData.weldPointId}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-4 h-4" />
              提交补焊
            </button>

            <div className="mt-3 space-y-1.5 p-3 rounded-lg bg-industrial-800/50 border border-industrial-700">
              <p className="text-xs font-medium text-industrial-300 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-accent-cyan" />
                提交后将自动执行：
              </p>
              <ul className="text-[11px] text-industrial-400 space-y-1 ml-5 list-disc">
                <li>焊点状态更新为「补焊后合格」</li>
                <li>自动通过超声复检（ultrasonicResult=pass）</li>
                <li>写入生产追溯时间线（补焊+复检）</li>
                <li>自动解决所有关联告警记录</li>
                <li>仪表盘合格率、异常点数实时重算</li>
                <li>自动写入处置记录: report→assign→repair→reinspect→close 五阶段流转</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="panel lg:col-span-2">
          <div className="panel-header">
            <h3 className="text-white font-semibold flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-accent-yellow" />
              待补焊焊点分布（来自质检检出 + 焊接过程异常）
            </h3>
            <span className="text-xs text-industrial-400">{defectivePoints.length} 个待处理</span>
          </div>
          <div className="panel-body">
            <div className="bg-industrial-900 rounded-lg p-6 border border-industrial-700 mb-6">
              <div className="grid grid-cols-10 gap-2">
                {weldPoints.map((p) => {
                  const hasAlarm = alarmRecords.some(a =>
                    a.weldPointIndex === p.index && a.workpieceId === currentWorkpiece?.id
                  );
                  return (
                    <div
                      key={p.id}
                      onClick={() => p.status === 'defective' && setFormData(prev => ({ ...prev, weldPointId: p.id }))}
                      className={`relative aspect-square rounded-md flex items-center justify-center text-xs font-mono font-medium ${
                        p.status === 'defective'
                          ? 'bg-accent-red text-white cursor-pointer hover:scale-110 transition-transform ring-2 ring-accent-red/50'
                          : p.status === 'repaired'
                          ? 'bg-emerald-600 text-white'
                          : p.status === 'completed' || p.ultrasonicResult === 'pass'
                          ? 'bg-accent-green/50 text-white'
                          : 'bg-industrial-700 text-industrial-400'
                      }`}
                      title={`焊点#${p.index} - ${p.status}${hasAlarm ? '（有关联告警）' : ''}`}
                    >
                      {p.index}
                      {p.status === 'defective' && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent-yellow rounded-full flex items-center justify-center border border-industrial-900">
                          <AlertTriangle className="w-2.5 h-2.5 text-industrial-900" />
                        </span>
                      )}
                      {hasAlarm && p.status !== 'defective' && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-accent-orange rounded-full border border-industrial-900" />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4 text-xs text-industrial-400">
                <span className="flex items-center"><span className="w-3 h-3 rounded bg-accent-red mr-1.5" />待补焊</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded bg-emerald-600 mr-1.5" />补焊后合格</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded bg-accent-green/50 mr-1.5" />检测合格</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded bg-industrial-700 mr-1.5" />未焊接</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm text-industrial-300 font-medium flex items-center gap-2">
                <XCircle className="w-4 h-4 text-accent-red" />
                待补焊焊点详情
              </h4>
              {defectivePoints.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {defectivePoints.map((p) => {
                    const alarms = alarmRecords.filter(a =>
                      a.weldPointIndex === p.index && a.workpieceId === currentWorkpiece?.id
                    );
                    const defectType = p.defectType && p.defectType !== 'none'
                      ? defectLabels[p.defectType as keyof typeof defectLabels]
                      : p.paramAbnormal
                      ? `${p.paramAbnormal.param}参数异常`
                      : '待处理';
                    const source = alarms.some(a => a.source === 'welding') ? '焊接过程异常' : '质检检出';
                    return (
                      <div
                        key={p.id}
                        onClick={() => setFormData(prev => ({ ...prev, weldPointId: p.id }))}
                        className={`bg-industrial-900 border rounded-lg p-4 cursor-pointer transition-all ${
                          formData.weldPointId === p.id ? 'border-accent-cyan ring-2 ring-accent-cyan/20' : 'border-accent-red/30 hover:border-accent-red/50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-mono text-lg font-bold text-accent-red">焊点 #{p.index}</p>
                            <p className="text-xs text-industrial-400 mt-0.5">位置: ({p.position.x}, {p.position.y})</p>
                          </div>
                          <span className="text-xs px-2 py-1 bg-accent-red/20 text-accent-red rounded">
                            {defectType}
                          </span>
                        </div>
                        <div className="mt-3 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-industrial-500">来源:</span>
                            <span className={source.includes('焊接') ? 'text-accent-orange' : 'text-industrial-300'}>{source}</span>
                          </div>
                          {p.inspector && (
                            <div className="flex justify-between">
                              <span className="text-industrial-500">处理人:</span>
                              <span className="text-industrial-300">{p.inspector}</span>
                            </div>
                          )}
                          {alarms.length > 0 && (
                            <div className="flex justify-between">
                              <span className="text-industrial-500">关联告警:</span>
                              <span className="text-accent-red flex items-center gap-1">
                                <Bell className="w-3 h-3" />{alarms.length}条
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
                <th className="px-4 py-3 font-medium">状态</th>
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
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />
                      {typeof r.repairTime === 'string' ? r.repairTime : (r.repairTime as unknown as Date).toLocaleString?.()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-industrial-300 max-w-xs truncate">{r.description}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center text-xs ${r.spatterCleaned ? 'text-accent-green' : 'text-accent-yellow'}`}>
                      {r.spatterCleaned ? <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> : <AlertTriangle className="w-3.5 h-3.5 mr-1" />}
                      {r.spatterCleaned ? '已清理' : '待清理'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center text-xs px-2 py-0.5 rounded bg-emerald-600/20 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> 已完成（自动复检合格）
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
