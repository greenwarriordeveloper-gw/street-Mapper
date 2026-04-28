import { useNavigate, useLocation } from 'react-router';
import {
  Radio, Map, Ruler, Hexagon, FileBarChart2,
  Download, Settings, Bell, LayoutDashboard,
} from 'lucide-react';

interface MapToolNavProps {
  isOnline?: boolean;
  completedCount?: number;
  totalCount?: number;
  progressPct?: number;
  onToggleOnline?: () => void;
  rightSlot?: React.ReactNode;
}

const MAP_TOOLS = [
  { label: 'GPS Mapper', icon: Map,     color: '#16a34a', activeBg: '#f0fdf4', activeBorder: '#bbf7d0', path: '/map' },
  { label: 'Measure',    icon: Ruler,   color: '#d97706', activeBg: '#fffbeb', activeBorder: '#fde68a', path: '/measure' },
  { label: 'Polygons',   icon: Hexagon, color: '#7c3aed', activeBg: '#f5f3ff', activeBorder: '#ddd6fe', path: '/polygons' },
];

export function MapToolNav({
  isOnline = true,
  completedCount = 2341,
  totalCount = 4052,
  progressPct = 57,
  onToggleOnline,
  rightSlot,
}: MapToolNavProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <header
      className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4"
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
        height: 52,
      }}
    >
      {/* ── Left: Logo ── */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center justify-center rounded-xl shrink-0 hover:opacity-80 transition-opacity"
          style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
          title="Back to Dashboard"
        >
          <Radio size={16} color="#fff" />
        </button>

        <div className="hidden sm:block">
          <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', letterSpacing: 0.3, lineHeight: 1.2 }}>
            Street GPS Mapper
          </div>
          <div style={{ fontSize: 9, color: '#94a3b8', letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Pondicherry
          </div>
        </div>

        <div className="w-px h-6 mx-1 hidden sm:block" style={{ background: '#e2e8f0' }} />

        {/* Online badge */}
        <button
          onClick={onToggleOnline}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all"
          style={{
            background: isOnline ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${isOnline ? '#bbf7d0' : '#fecaca'}`,
          }}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'animate-pulse' : ''}`}
            style={{ background: isOnline ? '#22c55e' : '#ef4444' }}
          />
          <span style={{ fontSize: 9, color: isOnline ? '#16a34a' : '#dc2626', fontWeight: 700, letterSpacing: 0.5 }}>
            {isOnline ? 'LIVE' : 'OFFLINE'}
          </span>
        </button>
      </div>

      {/* ── Centre: Map Tool Tabs ── */}
      <div
        className="flex items-center gap-1 p-0.5 rounded-xl"
        style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
      >
        {MAP_TOOLS.map(({ label, icon: Icon, color, activeBg, activeBorder, path }) => {
          const active = pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200"
              style={{
                background: active ? activeBg : 'transparent',
                border: active ? `1px solid ${activeBorder}` : '1px solid transparent',
                color: active ? color : '#94a3b8',
                fontSize: 12,
                fontWeight: active ? 700 : 500,
                boxShadow: active ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <Icon size={13} />
              <span className="hidden md:inline">{label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Right ── */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Progress (desktop) */}
        <div className="hidden lg:flex items-center gap-2 mr-1">
          <div className="rounded-full overflow-hidden" style={{ width: 72, height: 5, background: '#e2e8f0' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #2563eb, #22c55e)' }}
            />
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', fontFamily: "'IBM Plex Mono', monospace" }}>
            {completedCount.toLocaleString()}/{totalCount.toLocaleString()}
          </span>
        </div>

        <div className="w-px h-5 hidden lg:block" style={{ background: '#e2e8f0' }} />

        {/* Reports */}
        <button
          onClick={() => navigate('/reports')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all hover:bg-slate-50"
          style={{
            color: pathname === '/reports' ? '#db2777' : '#64748b',
            fontSize: 12, fontWeight: 600,
            border: `1px solid ${pathname === '/reports' ? '#fbcfe8' : 'transparent'}`,
            background: pathname === '/reports' ? '#fdf2f8' : 'transparent',
          }}
        >
          <FileBarChart2 size={13} />
          <span className="hidden xl:inline">Report</span>
        </button>

        {/* Excel export */}
        <button
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all hover:bg-slate-50"
          style={{ color: '#64748b', fontSize: 12, fontWeight: 600, border: '1px solid transparent' }}
          title="Export Excel"
        >
          <Download size={13} />
          <span className="hidden xl:inline">Excel</span>
        </button>

        {/* Admin */}
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all hover:bg-slate-50"
          style={{ color: '#64748b', fontSize: 12, fontWeight: 600, border: '1px solid transparent' }}
          title="Admin Panel"
        >
          <Settings size={13} />
          <span className="hidden xl:inline">Admin</span>
        </button>

        {/* Dashboard */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all hover:bg-slate-50"
          style={{ color: '#64748b', fontSize: 12, border: '1px solid transparent' }}
          title="Dashboard"
        >
          <LayoutDashboard size={13} />
        </button>

        {/* Bell */}
        <button
          className="relative flex items-center justify-center w-8 h-8 rounded-xl hover:bg-slate-50 transition-colors"
          style={{ border: '1px solid #e2e8f0' }}
        >
          <Bell size={13} style={{ color: '#64748b' }} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ background: '#ef4444' }} />
        </button>

        {rightSlot}
      </div>
    </header>
  );
}
