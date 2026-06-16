import { useState } from 'react';
import { useWeldingStore } from '@/store/weldingStore';
import { Package, ScanLine, MapPin, CheckCircle2, Clock, AlertCircle, QrCode } from 'lucide-react';

export default function LoadingPage() {
  const { workpieces, currentWorkpiece, setCurrentWorkpiece, updateWorkpieceStatus } = useWeldingStore();
  const [scanCode, setScanCode] = useState('');
  const [scanning, setScanning] = useState(false);

  const handleScan = () => {
    if (!scanCode) return;
    setScanning(true);
    setTimeout(() => {
      const found = workpieces.find((w) => w.code === scanCode);
      if (found) {
        setCurrentWorkpiece(found);
      }
      setScanning(false);
    }, 1500);
  };

  const handlePositionConfirm = () => {
    if (currentWorkpiece) {
      updateWorkpieceStatus(currentWorkpiece.id, 'loaded');
    }
  };

  const statusMap = {
    pending: { text: '待上料', color: 'text-industrial-400', dot: 'bg-industrial-500' },
    loading: { text: '上料中', color: 'text-accent-yellow', dot: 'bg-accent-yellow animate-pulse' },
    loaded: { text: '已定位', color: 'text-accent-green', dot: 'bg-accent-green' },
    completed: { text: '已完成', color: 'text-accent-cyan', dot: 'bg-accent-cyan' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center">
            <Package className="w-6 h-6 mr-2 text-accent-cyan" />
            工件上料定位
          </h2>
          <p className="text-sm text-industrial-400 mt-1">扫码录入工件信息，确认工件定位精度</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="panel">
          <div className="panel-header">
            <h3 className="text-white font-semibold flex items-center">
              <ScanLine className="w-4 h-4 mr-2 text-accent-cyan" />
              工件扫码录入
            </h3>
          </div>
          <div className="panel-body space-y-4">
            <div>
              <label className="block text-sm text-industrial-400 mb-2">工件条码扫描</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <QrCode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-industrial-400" />
                  <input
                    type="text"
                    value={scanCode}
                    onChange={(e) => setScanCode(e.target.value)}
                    placeholder="请扫描或输入工件条码"
                    className="w-full pl-10 pr-4 py-2.5 bg-industrial-900 border border-industrial-700 rounded text-white text-sm focus:outline-none focus:border-accent-cyan font-mono"
                  />
                </div>
                <button onClick={handleScan} disabled={scanning} className="btn-primary flex items-center gap-2 min-w-24">
                  {scanning ? <Clock className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
                  {scanning ? '扫描中' : '扫描'}
                </button>
              </div>
            </div>

            <div className="bg-industrial-900 rounded-lg p-4 border border-industrial-700">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-industrial-400">快速选择工件</span>
                <span className="text-xs text-accent-cyan">{workpieces.length} 个工件</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {workpieces.map((wp) => (
                  <button
                    key={wp.id}
                    onClick={() => setCurrentWorkpiece(wp)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center justify-between ${
                      currentWorkpiece?.id === wp.id
                        ? 'bg-accent-cyan/15 border border-accent-cyan/50 text-accent-cyan'
                        : 'bg-industrial-800 hover:bg-industrial-700 border border-transparent text-industrial-200'
                    }`}
                  >
                    <div>
                      <p className="font-mono text-sm">{wp.code}</p>
                      <p className="text-xs text-industrial-400">{wp.name}</p>
                    </div>
                    <span className={`flex items-center ${statusMap[wp.status].color}`}>
                      <span className={`status-dot ${statusMap[wp.status].dot}`} />
                      {statusMap[wp.status].text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="panel lg:col-span-2">
          <div className="panel-header">
            <h3 className="text-white font-semibold flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-accent-green" />
              工件定位信息
            </h3>
            {currentWorkpiece && (
              <span className={`flex items-center text-sm ${statusMap[currentWorkpiece.status].color}`}>
                <span className={`status-dot ${statusMap[currentWorkpiece.status].dot}`} />
                {statusMap[currentWorkpiece.status].text}
              </span>
            )}
          </div>
          <div className="panel-body">
            {currentWorkpiece ? (
              <div className="space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-industrial-900 rounded p-3">
                    <p className="data-label">工件编号</p>
                    <p className="data-value text-base mt-1">{currentWorkpiece.code}</p>
                  </div>
                  <div className="bg-industrial-900 rounded p-3">
                    <p className="data-label">工件名称</p>
                    <p className="text-white text-base mt-1">{currentWorkpiece.name}</p>
                  </div>
                  <div className="bg-industrial-900 rounded p-3">
                    <p className="data-label">工件类型</p>
                    <p className="text-white text-base mt-1">{currentWorkpiece.type}</p>
                  </div>
                  <div className="bg-industrial-900 rounded p-3">
                    <p className="data-label">上料时间</p>
                    <p className="text-white text-sm mt-1 font-mono">
                      {currentWorkpiece.loadingTime.toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-industrial-900 rounded-lg p-5 border border-industrial-700">
                    <h4 className="text-sm text-industrial-300 mb-4 flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-accent-cyan" />
                      定位坐标 (XYZ)
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-industrial-400">X 轴</span>
                          <span className="font-mono text-accent-cyan">{currentWorkpiece.position.x.toFixed(3)} mm</span>
                        </div>
                        <div className="h-2 bg-industrial-800 rounded-full overflow-hidden">
                          <div className="h-full bg-accent-cyan rounded-full" style={{ width: '60%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-industrial-400">Y 轴</span>
                          <span className="font-mono text-accent-green">{currentWorkpiece.position.y.toFixed(3)} mm</span>
                        </div>
                        <div className="h-2 bg-industrial-800 rounded-full overflow-hidden">
                          <div className="h-full bg-accent-green rounded-full" style={{ width: '45%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-industrial-400">Z 轴</span>
                          <span className="font-mono text-accent-yellow">{currentWorkpiece.position.z.toFixed(3)} mm</span>
                        </div>
                        <div className="h-2 bg-industrial-800 rounded-full overflow-hidden">
                          <div className="h-full bg-accent-yellow rounded-full" style={{ width: '10%' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-industrial-900 rounded-lg p-5 border border-industrial-700">
                    <h4 className="text-sm text-industrial-300 mb-4 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2 text-accent-yellow" />
                      定位精度检查
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between py-2 border-b border-industrial-700">
                        <span className="text-industrial-400">X 轴偏差</span>
                        <span className="flex items-center text-accent-green"><CheckCircle2 className="w-4 h-4 mr-1.5" />公差范围内</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-industrial-700">
                        <span className="text-industrial-400">Y 轴偏差</span>
                        <span className="flex items-center text-accent-green"><CheckCircle2 className="w-4 h-4 mr-1.5" />公差范围内</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-industrial-700">
                        <span className="text-industrial-400">Z 轴偏差</span>
                        <span className="flex items-center text-accent-green"><CheckCircle2 className="w-4 h-4 mr-1.5" />公差范围内</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-industrial-400">综合精度</span>
                        <span className="flex items-center text-accent-green font-medium"><CheckCircle2 className="w-4 h-4 mr-1.5" />定位合格</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handlePositionConfirm}
                    disabled={currentWorkpiece.status === 'loaded'}
                    className="btn-primary flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {currentWorkpiece.status === 'loaded' ? '已确认定位' : '确认工件定位'}
                  </button>
                  <button className="btn-secondary">重新扫描</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-industrial-500">
                <Package className="w-16 h-16 mb-4 opacity-30" />
                <p>请先扫码或选择工件</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3 className="text-white font-semibold">历史上料记录</h3>
        </div>
        <div className="panel-body p-0">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-industrial-400 border-b border-industrial-700">
                <th className="px-4 py-3 font-medium">工件编号</th>
                <th className="px-4 py-3 font-medium">工件名称</th>
                <th className="px-4 py-3 font-medium">类型</th>
                <th className="px-4 py-3 font-medium">上料时间</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">定位精度</th>
              </tr>
            </thead>
            <tbody>
              {workpieces.map((wp) => (
                <tr key={wp.id} className="border-b border-industrial-800 hover:bg-industrial-800/50 text-sm">
                  <td className="px-4 py-3 font-mono text-accent-cyan">{wp.code}</td>
                  <td className="px-4 py-3 text-white">{wp.name}</td>
                  <td className="px-4 py-3 text-industrial-300">{wp.type}</td>
                  <td className="px-4 py-3 text-industrial-300 font-mono text-xs">{wp.loadingTime.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center ${statusMap[wp.status].color}`}>
                      <span className={`status-dot ${statusMap[wp.status].dot}`} />
                      {statusMap[wp.status].text}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-accent-green">合格</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
