import { useWeldingStore } from '@/store/weldingStore';
import { Clipboard, Gauge, Lock, Unlock, AlertTriangle, CheckCircle2, Activity, Cpu } from 'lucide-react';

export default function FixturePage() {
  const { fixture, setFixtureStatus, currentWorkpiece } = useWeldingStore();

  const statusMap = {
    released: { text: '已释放', color: 'text-industrial-400', dot: 'bg-industrial-500' },
    clamping: { text: '夹紧中', color: 'text-accent-yellow', dot: 'bg-accent-yellow animate-pulse' },
    clamped: { text: '已夹紧', color: 'text-accent-green', dot: 'bg-accent-green' },
    error: { text: '故障', color: 'text-accent-red', dot: 'bg-accent-red animate-pulse' },
  };

  const handleClamp = () => {
    setFixtureStatus('clamping');
    setTimeout(() => setFixtureStatus('clamped'), 2000);
  };

  const handleRelease = () => {
    setFixtureStatus('released');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center">
          <Clipboard className="w-6 h-6 mr-2 text-accent-cyan" />
          夹具定位夹紧
        </h2>
        <p className="text-sm text-industrial-400 mt-1">监控夹具夹紧状态与定位传感器数据</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="panel lg:col-span-2">
          <div className="panel-header">
            <h3 className="text-white font-semibold flex items-center">
              <Cpu className="w-4 h-4 mr-2 text-accent-cyan" />
              {fixture.name}
            </h3>
            <span className={`inline-flex items-center text-sm ${statusMap[fixture.status].color}`}>
              <span className={`status-dot ${statusMap[fixture.status].dot}`} />
              {statusMap[fixture.status].text}
            </span>
          </div>
          <div className="panel-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-industrial-900 rounded-lg p-4 border border-industrial-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="data-label">夹紧力</span>
                  <Gauge className="w-4 h-4 text-accent-cyan" />
                </div>
                <p className="font-mono text-3xl font-bold text-accent-cyan">{fixture.clampForce.toLocaleString()}</p>
                <p className="text-xs text-industrial-400 mt-1">牛顿 (N)</p>
                <div className="mt-3 h-2 bg-industrial-700 rounded-full overflow-hidden">
                  <div className="h-full bg-accent-cyan rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
              <div className="bg-industrial-900 rounded-lg p-4 border border-industrial-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="data-label">定位精度</span>
                  <Activity className="w-4 h-4 text-accent-green" />
                </div>
                <p className="font-mono text-3xl font-bold text-accent-green">±{fixture.positionAccuracy}</p>
                <p className="text-xs text-industrial-400 mt-1">毫米 (mm)</p>
                <div className="mt-3 h-2 bg-industrial-700 rounded-full overflow-hidden">
                  <div className="h-full bg-accent-green rounded-full" style={{ width: '95%' }} />
                </div>
              </div>
              <div className="bg-industrial-900 rounded-lg p-4 border border-industrial-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="data-label">关联工件</span>
                </div>
                <p className="text-lg font-medium text-white truncate">{currentWorkpiece?.name || '--'}</p>
                <p className="text-xs text-industrial-400 mt-1 font-mono">{currentWorkpiece?.code || '--'}</p>
                <div className="mt-3">
                  <span className={`inline-flex items-center text-xs ${currentWorkpiece ? 'text-accent-green' : 'text-industrial-400'}`}>
                    <span className={`status-dot ${currentWorkpiece ? 'bg-accent-green' : 'bg-industrial-500'} mr-1.5`} />
                    {currentWorkpiece ? '工件在位' : '无工件'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-center mb-6">
              <div className="relative bg-industrial-900 rounded-lg p-8 border border-industrial-700" style={{ minWidth: '400px' }}>
                <svg viewBox="0 0 400 200" className="w-full h-auto">
                  <rect x="20" y="60" width="360" height="80" rx="4" fill="#334155" stroke="#475569" />
                  <rect x="40" y="80" width="320" height="40" rx="2" fill="#1E293B" stroke="#475569" />
                  {[1, 2, 3, 4, 5].map((i) => (
                    <g key={i}>
                      <rect x={40 + i * 55} y="70" width="12" height="60" rx="2"
                        fill={fixture.status === 'clamped' ? '#10B981' : fixture.status === 'clamping' ? '#F59E0B' : '#475569'}
                        className={fixture.status === 'clamping' ? 'animate-pulse' : ''}
                      />
                      <circle cx={46 + i * 55} cy="65" r="5"
                        fill={fixture.status === 'clamped' ? '#10B981' : fixture.status === 'clamping' ? '#F59E0B' : '#475569'}
                      />
                    </g>
                  ))}
                  <text x="200" y="175" textAnchor="middle" fill="#94A3B8" fontSize="12">
                    工件定位基准面
                  </text>
                </svg>
                <div className="flex justify-center gap-6 mt-4 text-xs">
                  <span className="flex items-center"><span className="status-dot bg-accent-green" />夹爪夹紧</span>
                  <span className="flex items-center"><span className="status-dot bg-accent-yellow" />夹紧中</span>
                  <span className="flex items-center"><span className="status-dot bg-industrial-500" />已释放</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={handleClamp}
                disabled={fixture.status === 'clamped' || fixture.status === 'clamping'}
                className="btn-primary flex items-center gap-2 min-w-32 justify-center"
              >
                <Lock className="w-4 h-4" />
                夹具夹紧
              </button>
              <button
                onClick={handleRelease}
                disabled={fixture.status === 'released'}
                className="btn-secondary flex items-center gap-2 min-w-32 justify-center"
              >
                <Unlock className="w-4 h-4" />
                夹具释放
              </button>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3 className="text-white font-semibold flex items-center">
              <Gauge className="w-4 h-4 mr-2 text-accent-cyan" />
              传感器实时数据
            </h3>
          </div>
          <div className="panel-body space-y-3">
            {fixture.sensors.map((sensor) => {
              const pct = ((sensor.value - sensor.min) / (sensor.max - sensor.min)) * 100;
              const isNormal = sensor.status === 'normal';
              return (
                <div key={sensor.id} className="bg-industrial-900 rounded-lg p-3 border border-industrial-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-industrial-200">{sensor.name}</span>
                    <span className={`inline-flex items-center text-xs ${
                      sensor.status === 'normal' ? 'text-accent-green' :
                      sensor.status === 'warning' ? 'text-accent-yellow' : 'text-accent-red'
                    }`}>
                      {isNormal ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                      {sensor.status === 'normal' ? '正常' : sensor.status === 'warning' ? '警告' : '异常'}
                    </span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="font-mono text-xl font-bold text-accent-cyan">{sensor.value.toFixed(sensor.unit === '' ? 0 : 1)}</span>
                    <span className="text-xs text-industrial-400 mb-0.5">{sensor.unit || '状态'}</span>
                  </div>
                  {sensor.unit !== '' && (
                    <div className="mt-2 h-1.5 bg-industrial-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isNormal ? 'bg-accent-green' : 'bg-accent-yellow'}`}
                        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                      />
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-industrial-500 mt-1">
                    <span>最小值: {sensor.min}{sensor.unit}</span>
                    <span>最大值: {sensor.max}{sensor.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
