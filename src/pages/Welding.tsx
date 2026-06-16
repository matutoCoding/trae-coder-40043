import { useEffect, useState } from 'react';
import { useWeldingStore } from '@/store/weldingStore';
import { Bot, Zap, Activity, Play, Square, Settings2, Timer, CircleDot } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function WeldingPage() {
  const {
    weldingPrograms, selectedProgram, setSelectedProgram,
    weldingParams, setWeldingParams, isWelding, setIsWelding,
    weldingHistory, addWeldingHistoryPoint, weldPoints, updateWeldPoint
  } = useWeldingStore();

  const [currentPointIndex, setCurrentPointIndex] = useState(30);

  useEffect(() => {
    if (!isWelding) return;

    const interval = setInterval(() => {
      const current = Math.floor(Math.random() * 13000) + 12000;
      const voltage = 4 + Math.random();
      addWeldingHistoryPoint({
        time: `${weldingHistory.length}s`,
        current,
        voltage,
      });
    }, 800);

    return () => clearInterval(interval);
  }, [isWelding, weldingHistory.length, addWeldingHistoryPoint]);

  useEffect(() => {
    if (!isWelding) return;

    const pointInterval = setInterval(() => {
      setCurrentPointIndex((prev) => {
        const next = prev + 1;
        if (next < weldPoints.length) {
          updateWeldPoint(weldPoints[next - 1].id, { status: 'completed', ultrasonicResult: Math.random() > 0.1 ? 'pass' : 'fail' });
          updateWeldPoint(weldPoints[next].id, { status: 'welding' });
          return next;
        } else {
          setIsWelding(false);
          return prev;
        }
      });
    }, 2000);

    return () => clearInterval(pointInterval);
  }, [isWelding, weldPoints, updateWeldPoint, setIsWelding]);

  const completedCount = weldPoints.filter((p) => p.status === 'completed' || p.status === 'repaired').length;
  const totalCount = weldPoints.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  const handleStartWelding = () => {
    if (!selectedProgram) return;
    setIsWelding(true);
  };

  const handleStopWelding = () => {
    setIsWelding(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center">
          <Bot className="w-6 h-6 mr-2 text-accent-cyan" />
          机器人焊接控制
        </h2>
        <p className="text-sm text-industrial-400 mt-1">选择焊接轨迹程序，监控焊接电流电压和点焊参数</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="panel">
            <div className="panel-header">
              <h3 className="text-white font-semibold flex items-center">
                <Settings2 className="w-4 h-4 mr-2 text-accent-cyan" />
                轨迹程序
              </h3>
            </div>
            <div className="panel-body space-y-2">
              {weldingPrograms.map((prog) => (
                <button
                  key={prog.id}
                  onClick={() => setSelectedProgram(prog)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    selectedProgram?.id === prog.id
                      ? 'bg-accent-cyan/15 border border-accent-cyan/50'
                      : 'bg-industrial-900 border border-industrial-700 hover:border-industrial-600'
                  }`}
                >
                  <p className={`text-sm font-medium ${selectedProgram?.id === prog.id ? 'text-accent-cyan' : 'text-white'}`}>
                    {prog.name}
                  </p>
                  <p className="text-xs text-industrial-400 mt-0.5">{prog.pointCount} 个焊点</p>
                </button>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3 className="text-white font-semibold flex items-center">
                <Zap className="w-4 h-4 mr-2 text-accent-orange" />
                点焊参数
              </h3>
            </div>
            <div className="panel-body space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-industrial-400">焊接电流</span>
                  <span className="font-mono text-accent-cyan">{weldingParams.current} A</span>
                </div>
                <input
                  type="range"
                  min="8000" max="15000" step="100"
                  value={weldingParams.current}
                  onChange={(e) => setWeldingParams({ current: Number(e.target.value) })}
                  className="w-full accent-cyan-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-industrial-400">焊接电压</span>
                  <span className="font-mono text-accent-cyan">{weldingParams.voltage.toFixed(1)} V</span>
                </div>
                <input
                  type="range"
                  min="2" max="8" step="0.1"
                  value={weldingParams.voltage}
                  onChange={(e) => setWeldingParams({ voltage: Number(e.target.value) })}
                  className="w-full accent-cyan-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-industrial-400">电极压力</span>
                  <span className="font-mono text-accent-cyan">{weldingParams.pressure} daN</span>
                </div>
                <input
                  type="range"
                  min="200" max="500" step="10"
                  value={weldingParams.pressure}
                  onChange={(e) => setWeldingParams({ pressure: Number(e.target.value) })}
                  className="w-full accent-cyan-500"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-industrial-400">焊接时间</span>
                  <span className="font-mono text-accent-cyan">{weldingParams.time.toFixed(2)} s</span>
                </div>
                <input
                  type="range"
                  min="0.1" max="1" step="0.01"
                  value={weldingParams.time}
                  onChange={(e) => setWeldingParams({ time: Number(e.target.value) })}
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-body">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="data-label">焊接状态</p>
                  <p className={`mt-1 font-medium ${isWelding ? 'text-accent-green' : 'text-industrial-400'}`}>
                    {isWelding ? (
                      <span className="flex items-center">
                        <span className="status-dot bg-accent-green animate-pulse" />
                        自动焊接中
                      </span>
                    ) : '待机'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="data-label">当前焊点</p>
                  <p className="mt-1 font-mono text-2xl font-bold text-accent-cyan">#{currentPointIndex + 1}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {!isWelding ? (
                  <button
                    onClick={handleStartWelding}
                    disabled={!selectedProgram}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    启动焊接
                  </button>
                ) : (
                  <button onClick={handleStopWelding} className="btn-danger flex-1 flex items-center justify-center gap-2">
                    <Square className="w-4 h-4" />
                    停止
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="panel">
            <div className="panel-header">
              <h3 className="text-white font-semibold flex items-center">
                <Activity className="w-4 h-4 mr-2 text-accent-cyan" />
                焊接电流 / 电压实时曲线
              </h3>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center"><span className="w-3 h-0.5 bg-accent-cyan mr-1.5" />电流</span>
                <span className="flex items-center"><span className="w-3 h-0.5 bg-accent-orange mr-1.5" />电压</span>
              </div>
            </div>
            <div className="panel-body h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weldingHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#64748B" fontSize={10} />
                  <YAxis yAxisId="left" stroke="#64748B" fontSize={10} domain={[10000, 15000]} />
                  <YAxis yAxisId="right" orientation="right" stroke="#64748B" fontSize={10} domain={[2, 8]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '6px' }}
                    labelStyle={{ color: '#E2E8F0' }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="current" stroke="#06B6D4" strokeWidth={1.5} dot={false} name="电流(A)" />
                  <Line yAxisId="right" type="monotone" dataKey="voltage" stroke="#F97316" strokeWidth={1.5} dot={false} name="电压(V)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3 className="text-white font-semibold flex items-center">
                <CircleDot className="w-4 h-4 mr-2 text-accent-cyan" />
                焊点进度
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-industrial-400">
                  进度: <span className="text-accent-cyan font-mono font-bold">{completedCount}/{totalCount}</span>
                </span>
                <span className="text-xs text-industrial-400">
                  <Timer className="w-3 h-3 inline mr-1" />
                  <span className="text-accent-green font-mono font-bold">{progress}%</span>
                </span>
              </div>
            </div>
            <div className="panel-body">
              <div className="h-3 bg-industrial-700 rounded-full overflow-hidden mb-6">
                <div
                  className="h-full bg-gradient-to-r from-accent-cyan to-cyan-400 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="grid grid-cols-12 gap-1.5">
                {weldPoints.map((p, idx) => (
                  <div
                    key={p.id}
                    className={`relative aspect-square rounded-sm flex items-center justify-center text-xs font-mono cursor-pointer transition-all hover:scale-110 ${
                      p.status === 'completed' ? 'bg-accent-green text-white' :
                      p.status === 'repaired' ? 'bg-accent-green/60 text-white' :
                      p.status === 'defective' ? 'bg-accent-red text-white animate-pulse' :
                      p.status === 'welding' ? 'bg-accent-cyan text-white animate-pulse ring-2 ring-accent-cyan/50 ring-offset-1 ring-offset-industrial-800' :
                      'bg-industrial-700 text-industrial-400'
                    }`}
                    title={`焊点#${p.index}`}
                  >
                    {idx + 1}
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-6 mt-4 text-xs text-industrial-400">
                <span className="flex items-center"><span className="w-3 h-3 rounded-sm bg-accent-green mr-1.5" />已完成</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-sm bg-accent-cyan mr-1.5" />焊接中</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-sm bg-accent-red mr-1.5" />缺陷</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-sm bg-industrial-700 mr-1.5" />待焊接</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
