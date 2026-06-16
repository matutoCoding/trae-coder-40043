import { useState } from 'react';
import { useWeldingStore } from '@/store/weldingStore';
import { Settings, Wrench, Calendar, Heart, AlertTriangle, CheckCircle2, Clock, User, FileText, RefreshCw } from 'lucide-react';

export default function MaintenancePage() {
  const { maintenanceRecords, addMaintenanceRecord } = useWeldingStore();
  const [formData, setFormData] = useState({
    deviceName: '',
    type: 'electrode_dressing' as const,
    operator: '',
    description: '',
    equipmentHealth: 100,
  });

  const typeLabels: Record<string, string> = {
    electrode_dressing: '电极修磨',
    preventive: '预防性维护',
    corrective: '故障维修',
  };

  const typeColors: Record<string, string> = {
    electrode_dressing: 'bg-accent-cyan/20 text-accent-cyan',
    preventive: 'bg-accent-green/20 text-accent-green',
    corrective: 'bg-accent-orange/20 text-accent-orange',
  };

  const deviceList = [
    { name: '1号焊枪', health: 92, nextDate: '2026-06-18', type: '电极修磨' },
    { name: '2号焊枪', health: 88, nextDate: '2026-06-19', type: '电极修磨' },
    { name: '3号焊枪', health: 78, nextDate: '2026-06-17', type: '电极修磨' },
    { name: '夹具液压系统', health: 95, nextDate: '2026-06-20', type: '预防性维护' },
    { name: '机器人控制柜', health: 98, nextDate: '2026-07-01', type: '预防性维护' },
    { name: '冷却循环系统', health: 85, nextDate: '2026-06-17', type: '预防性维护' },
  ];

  const handleSubmit = () => {
    if (!formData.deviceName || !formData.operator || !formData.description) return;

    const newRecord = {
      id: `mr-${Date.now()}`,
      deviceName: formData.deviceName,
      type: formData.type,
      operator: formData.operator,
      time: new Date(),
      description: formData.description,
      nextMaintenanceDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      equipmentHealth: formData.equipmentHealth,
    };

    addMaintenanceRecord(newRecord);
    setFormData({ deviceName: '', type: 'electrode_dressing', operator: '', description: '', equipmentHealth: 100 });
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'text-accent-green';
    if (health >= 75) return 'text-accent-yellow';
    return 'text-accent-red';
  };

  const getHealthBgColor = (health: number) => {
    if (health >= 90) return 'bg-accent-green';
    if (health >= 75) return 'bg-accent-yellow';
    return 'bg-accent-red';
  };

  const today = new Date();
  const calendarDays = Array.from({ length: 35 }, (_, i) => {
    const day = new Date(today.getFullYear(), today.getMonth(), 1);
    day.setDate(day.getDate() - day.getDay() + i);
    return day;
  });

  const maintenanceDates = maintenanceRecords.map((r) => r.time.toDateString());

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center">
          <Settings className="w-6 h-6 mr-2 text-accent-cyan" />
          设备维护管理
        </h2>
        <p className="text-sm text-industrial-400 mt-1">焊枪电极修磨、维护计划、设备健康状态监控</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="panel">
          <div className="panel-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="data-label">设备总数</p>
                <p className="text-3xl font-bold font-mono text-white mt-1">{deviceList.length}</p>
              </div>
              <Settings className="w-8 h-8 text-industrial-500" />
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="data-label">今日待维护</p>
                <p className="text-3xl font-bold font-mono text-accent-yellow mt-1">
                  {deviceList.filter((d) => d.nextDate === '2026-06-17').length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-accent-yellow/50" />
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="data-label">平均健康度</p>
                <p className="text-3xl font-bold font-mono text-accent-green mt-1">
                  {Math.round(deviceList.reduce((a, d) => a + d.health, 0) / deviceList.length)}
                  <span className="text-lg">%</span>
                </p>
              </div>
              <Heart className="w-8 h-8 text-accent-green/50" />
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="data-label">本月维护记录</p>
                <p className="text-3xl font-bold font-mono text-accent-cyan mt-1">{maintenanceRecords.length}</p>
              </div>
              <FileText className="w-8 h-8 text-accent-cyan/50" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="panel lg:col-span-1">
          <div className="panel-header">
            <h3 className="text-white font-semibold flex items-center">
              <Wrench className="w-4 h-4 mr-2 text-accent-cyan" />
              维护作业登记
            </h3>
          </div>
          <div className="panel-body space-y-4">
            <div>
              <label className="block text-sm text-industrial-400 mb-2">设备名称</label>
              <select
                value={formData.deviceName}
                onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
                className="w-full px-3 py-2.5 bg-industrial-900 border border-industrial-700 rounded text-white text-sm focus:outline-none focus:border-accent-cyan"
              >
                <option value="">请选择设备...</option>
                {deviceList.map((d) => (
                  <option key={d.name} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-industrial-400 mb-2">维护类型</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(typeLabels).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setFormData({ ...formData, type: key as any })}
                    className={`px-3 py-2 text-xs rounded transition-colors ${
                      formData.type === key
                        ? 'bg-accent-cyan/20 border border-accent-cyan/50 text-accent-cyan'
                        : 'bg-industrial-800 border border-industrial-700 text-industrial-300 hover:border-industrial-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
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
              <label className="block text-sm text-industrial-400 mb-2">
                设备健康评分 <span className={`font-mono font-bold ${getHealthColor(formData.equipmentHealth)}`}>{formData.equipmentHealth}%</span>
              </label>
              <input
                type="range"
                min="0" max="100" step="1"
                value={formData.equipmentHealth}
                onChange={(e) => setFormData({ ...formData, equipmentHealth: Number(e.target.value) })}
                className="w-full accent-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm text-industrial-400 mb-2">维护说明</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="描述维护内容，如：电极帽修磨、更换电极..."
                rows={3}
                className="w-full px-3 py-2.5 bg-industrial-900 border border-industrial-700 rounded text-white text-sm focus:outline-none focus:border-accent-cyan resize-none"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!formData.deviceName || !formData.operator || !formData.description}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3"
            >
              <CheckCircle2 className="w-4 h-4" />
              提交维护记录
            </button>
          </div>
        </div>

        <div className="panel lg:col-span-2">
          <div className="panel-header">
            <h3 className="text-white font-semibold flex items-center">
              <Heart className="w-4 h-4 mr-2 text-accent-cyan" />
              设备健康状态
            </h3>
            <span className="text-xs text-industrial-400">{deviceList.length} 台设备</span>
          </div>
          <div className="panel-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deviceList.map((device) => {
                const isDue = device.nextDate === '2026-06-17';
                return (
                  <div
                    key={device.name}
                    className={`bg-industrial-900 rounded-lg p-4 border ${
                      isDue ? 'border-accent-yellow/40' : 'border-industrial-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{device.name}</p>
                          {isDue && (
                            <span className="text-xs px-1.5 py-0.5 bg-accent-yellow/20 text-accent-yellow rounded flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              今日待维护
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-industrial-400 mt-0.5">维护类型: {device.type}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-mono text-2xl font-bold ${getHealthColor(device.health)}`}>{device.health}%</p>
                        <p className="text-xs text-industrial-500">健康度</p>
                      </div>
                    </div>
                    <div className="h-2 bg-industrial-700 rounded-full overflow-hidden mb-3">
                      <div
                        className={`h-full rounded-full ${getHealthBgColor(device.health)}`}
                        style={{ width: `${device.health}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-industrial-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        下次维护: {device.nextDate}
                      </span>
                      <button className="text-accent-cyan hover:text-cyan-400 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" />
                        立即维护
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="panel lg:col-span-1">
          <div className="panel-header">
            <h3 className="text-white font-semibold flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-accent-cyan" />
              维护日历
            </h3>
            <span className="text-xs text-industrial-400">
              {today.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
            </span>
          </div>
          <div className="panel-body">
            <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
              {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
                <div key={d} className="py-1.5 text-industrial-500 font-medium">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => {
                const isToday = day.toDateString() === today.toDateString();
                const isCurrentMonth = day.getMonth() === today.getMonth();
                const hasMaintenance = maintenanceDates.includes(day.toDateString());
                return (
                  <div
                    key={idx}
                    className={`aspect-square rounded flex flex-col items-center justify-center text-xs relative ${
                      isToday ? 'bg-accent-cyan text-white font-bold' :
                      isCurrentMonth ? 'text-industrial-200 hover:bg-industrial-700' : 'text-industrial-600'
                    }`}
                  >
                    {day.getDate()}
                    {hasMaintenance && (
                      <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isToday ? 'bg-white' : 'bg-accent-orange'}`} />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center gap-4 mt-4 text-xs text-industrial-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent-cyan" />今日
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent-orange" />有维护
              </span>
            </div>
          </div>
        </div>

        <div className="panel lg:col-span-2">
          <div className="panel-header">
            <h3 className="text-white font-semibold flex items-center">
              <FileText className="w-4 h-4 mr-2 text-accent-cyan" />
              维护记录列表
            </h3>
          </div>
          <div className="panel-body p-0">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-industrial-400 border-b border-industrial-700">
                  <th className="px-4 py-3 font-medium">设备名称</th>
                  <th className="px-4 py-3 font-medium">类型</th>
                  <th className="px-4 py-3 font-medium">操作员</th>
                  <th className="px-4 py-3 font-medium">维护时间</th>
                  <th className="px-4 py-3 font-medium">说明</th>
                  <th className="px-4 py-3 font-medium">健康度</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceRecords.map((r) => (
                  <tr key={r.id} className="border-b border-industrial-800 hover:bg-industrial-800/50 text-sm">
                    <td className="px-4 py-3 text-white font-medium">{r.deviceName}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${typeColors[r.type]}`}>
                        {typeLabels[r.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-industrial-300">{r.operator}</td>
                    <td className="px-4 py-3 text-industrial-300 font-mono text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />{r.time.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-industrial-300 max-w-xs truncate">{r.description}</td>
                    <td className="px-4 py-3">
                      <span className={`font-mono font-bold ${getHealthColor(r.equipmentHealth)}`}>
                        {r.equipmentHealth}%
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
