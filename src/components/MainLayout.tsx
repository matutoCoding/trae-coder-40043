import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, Clipboard, Bot, ScanLine,
  Wrench, Timer, Settings, Bell, User, ChevronRight, History, BarChart3
} from 'lucide-react';
import { useWeldingStore } from '@/store/weldingStore';
import type { ProcessModule } from '@/types';

interface NavItem {
  path: string;
  module: ProcessModule;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { path: '/', module: 'loading', label: '总控仪表盘', icon: LayoutDashboard },
  { path: '/loading', module: 'loading', label: '工件上料', icon: Package },
  { path: '/fixture', module: 'fixture', label: '夹具定位', icon: Clipboard },
  { path: '/welding', module: 'welding', label: '机器人焊接', icon: Bot },
  { path: '/inspection', module: 'inspection', label: '焊点检测', icon: ScanLine },
  { path: '/repair', module: 'repair', label: '补焊修整', icon: Wrench },
  { path: '/traceability', module: 'traceability', label: '生产追溯', icon: History },
  { path: '/quality', module: 'quality', label: '质量责任看板', icon: BarChart3 },
  { path: '/cycle', module: 'cycle', label: '节拍监控', icon: Timer },
  { path: '/maintenance', module: 'maintenance', label: '设备维护', icon: Settings },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentModule = useWeldingStore((s) => s.currentModule);
  const setCurrentModule = useWeldingStore((s) => s.setCurrentModule);

  return (
    <aside className="w-60 bg-industrial-900 border-r border-industrial-700 flex flex-col h-screen">
      <div className="h-16 flex items-center px-5 border-b border-industrial-700">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-cyan to-cyan-600 flex items-center justify-center mr-3">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white">焊装工作站</h1>
          <p className="text-xs text-industrial-400">Welding Workstation</p>
        </div>
      </div>
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className="px-3 mb-2">
          <p className="text-xs text-industrial-500 uppercase tracking-wider px-2 mb-2">功能模块</p>
        </div>
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <button
                  onClick={() => {
                    navigate(item.path);
                    setCurrentModule(item.module);
                  }}
                  className={`w-full flex items-center px-3 py-2.5 rounded-md text-sm transition-all ${
                    isActive
                      ? 'bg-accent-cyan/15 text-accent-cyan border-l-2 border-accent-cyan'
                      : 'text-industrial-300 hover:bg-industrial-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4" />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="p-3 border-t border-industrial-700">
        <div className="bg-industrial-800 rounded-md p-3">
          <div className="flex items-center">
            <span className="status-dot bg-accent-green animate-pulse-slow" />
            <span className="text-xs text-industrial-300">设备在线运行中</span>
          </div>
          <p className="text-xs text-industrial-500 mt-1">工作站 WS-A01</p>
        </div>
      </div>
    </aside>
  );
}

function Header() {
  const dashboardStats = useWeldingStore((s) => s.dashboardStats);
  const currentWorkpiece = useWeldingStore((s) => s.currentWorkpiece);
  const alarmRecords = useWeldingStore((s) => s.alarmRecords);
  const activeAlarmCount = alarmRecords.filter(a => !a.resolved).length;

  return (
    <header className="h-16 bg-industrial-900 border-b border-industrial-700 flex items-center px-6 justify-between">
      <div>
        <h2 className="text-lg font-semibold text-white">焊接机器人工作站车身焊装系统</h2>
        <div className="flex items-center gap-4 mt-0.5">
          <span className="text-xs text-industrial-400">
            当前工件：<span className="text-accent-cyan font-mono">{currentWorkpiece?.code || '--'}</span>
          </span>
          <span className="text-xs text-industrial-400">
            今日产量：<span className="text-accent-green font-mono">{dashboardStats.todayOutput}</span>
            <span className="text-industrial-500">/{dashboardStats.targetOutput}</span>
          </span>
          <span className="text-xs text-industrial-400">
            合格率：<span className="text-accent-cyan font-mono">{dashboardStats.passRate}%</span>
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-md text-industrial-300 hover:bg-industrial-800 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          {activeAlarmCount > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-accent-red rounded-full text-[10px] font-bold text-white flex items-center justify-center">
              {activeAlarmCount}
            </span>
          )}
        </button>
        <div className="h-8 w-px bg-industrial-700" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-industrial-700 flex items-center justify-center">
            <User className="w-4 h-4 text-industrial-300" />
          </div>
          <div>
            <p className="text-sm text-white font-medium">操作员</p>
            <p className="text-xs text-industrial-400">工号: OP-2024</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function MainLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-industrial-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto bg-industrial-950 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
