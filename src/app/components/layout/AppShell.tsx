import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import {
  Map, LayoutDashboard, Ruler, Hexagon, FileBarChart2,
  Settings, LogOut, ChevronLeft, ChevronRight,
  Radio, Bell, User, ExternalLink,
} from 'lucide-react';

const STANDALONE_TOOLS = [
  { to: '/map',      icon: Map,     label: 'GPS Mapper',   color: '#16a34a', bg: '#f0fdf4' },
  { to: '/measure',  icon: Ruler,   label: 'Measure Tool', color: '#d97706', bg: '#fffbeb' },
  { to: '/polygons', icon: Hexagon, label: 'Polygons',     color: '#7c3aed', bg: '#f5f3ff' },
];

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard',   color: '#2563eb', bg: '#eff6ff' },
  { to: '/reports',   icon: FileBarChart2,   label: 'Reports',     color: '#db2777', bg: '#fdf2f8' },
  { to: '/admin',     icon: Settings,        label: 'Admin Panel', color: '#475569', bg: '#f8fafc' },
];

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('gps_user');
    navigate('/');
  };

  const user = JSON.parse(localStorage.getItem('gps_user') || '{"fullName":"Admin User","role":"admin"}');

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{ background: '#f1f5f9', fontFamily: "'IBM Plex Sans', sans-serif", color: '#0f172a' }}
    >
      {/* ── Left Sidebar ── */}
      <aside
        className="flex flex-col h-full transition-all duration-300 relative z-20 shrink-0"
        style={{
          width: collapsed ? 64 : 220,
          background: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-4 py-4 shrink-0"
          style={{ borderBottom: '1px solid #e2e8f0', minHeight: 64 }}
        >
          <div
            className="flex items-center justify-center rounded-xl shrink-0"
            style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
          >
            <Radio size={18} color="#fff" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', letterSpacing: 0.3, whiteSpace: 'nowrap' }}>
                GPS MAPPER
              </div>
              <div style={{ fontSize: 9, color: '#94a3b8', letterSpacing: 1.5, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                Pondicherry
              </div>
            </div>
          )}
        </div>

        {/* Map Tools section */}
        <div className="px-2 pt-3 pb-2 shrink-0" style={{ borderBottom: '1px solid #f1f5f9' }}>
          {!collapsed && (
            <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, paddingLeft: 6, marginBottom: 6 }}>
              Map Tools
            </div>
          )}
          {STANDALONE_TOOLS.map(({ to, icon: Icon, label, color, bg }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group mb-0.5 hover:shadow-sm"
              style={{ border: '1px solid transparent' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = bg;
                (e.currentTarget as HTMLButtonElement).style.borderColor = `${color}30`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent';
              }}
              title={collapsed ? label : undefined}
            >
              <Icon size={16} style={{ color, flexShrink: 0 }} />
              {!collapsed && (
                <span style={{ fontSize: 13, fontWeight: 500, color: '#475569', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>
                  {label}
                </span>
              )}
              {!collapsed && (
                <ExternalLink size={11} style={{ color: '#cbd5e1', flexShrink: 0 }} />
              )}
            </button>
          ))}
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
          {!collapsed && (
            <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, paddingLeft: 6, marginBottom: 6 }}>
              Pages
            </div>
          )}
          {NAV_ITEMS.map(({ to, icon: Icon, label, color, bg }) => (
            <NavLink
              key={to}
              to={to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative"
              style={({ isActive }) => ({
                background: isActive ? bg : 'transparent',
                border: isActive ? `1px solid ${color}22` : '1px solid transparent',
              })}
              title={collapsed ? label : undefined}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={17}
                    style={{ color: isActive ? color : '#94a3b8', flexShrink: 0, transition: 'color 0.2s' }}
                  />
                  {!collapsed && (
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? color : '#475569',
                        whiteSpace: 'nowrap',
                        transition: 'color 0.2s',
                      }}
                    >
                      {label}
                    </span>
                  )}
                  {isActive && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
                      style={{ width: 3, height: 20, background: color }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: user + collapse */}
        <div style={{ borderTop: '1px solid #e2e8f0' }}>
          <div className="flex items-center gap-3 px-3 py-3">
            <div
              className="flex items-center justify-center rounded-full shrink-0"
              style={{ width: 32, height: 32, background: '#eff6ff', border: '1px solid #bfdbfe' }}
            >
              <User size={14} style={{ color: '#2563eb' }} />
            </div>
            {!collapsed && (
              <div className="overflow-hidden flex-1">
                <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.fullName || 'Admin User'}
                </div>
                <div style={{ fontSize: 9, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700 }}>
                  {user.role || 'Admin'}
                </div>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={handleLogout}
                className="flex items-center justify-center rounded-lg p-1.5 hover:bg-red-50 transition-colors"
                title="Logout"
              >
                <LogOut size={13} style={{ color: '#94a3b8' }} />
              </button>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center py-2 hover:bg-slate-50 transition-colors"
            style={{ borderTop: '1px solid #f1f5f9' }}
          >
            {collapsed
              ? <ChevronRight size={14} style={{ color: '#94a3b8' }} />
              : <ChevronLeft size={14} style={{ color: '#94a3b8' }} />
            }
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top header bar */}
        <header
          className="flex items-center justify-between px-6 shrink-0"
          style={{
            height: 64,
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
            >
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
              <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 700, letterSpacing: 0.5 }}>LIVE SYNC</span>
            </div>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Last sync: 2 min ago</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick stats */}
            <div className="flex items-center gap-4">
              {[
                { val: '2,341', label: 'DONE',    color: '#16a34a' },
                { val: '487',   label: 'PARTIAL', color: '#d97706' },
                { val: '1,224', label: 'PENDING', color: '#94a3b8' },
              ].map(({ val, label, color }) => (
                <div key={label} className="text-center hidden sm:block">
                  <div style={{ fontSize: 16, fontWeight: 700, color }}>{val}</div>
                  <div style={{ fontSize: 9, color: '#94a3b8', letterSpacing: 0.5 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2">
              <div className="rounded-full overflow-hidden" style={{ width: 90, height: 6, background: '#e2e8f0' }}>
                <div className="h-full rounded-full" style={{ width: '57.8%', background: 'linear-gradient(90deg, #2563eb, #22c55e)' }} />
              </div>
              <span style={{ fontSize: 12, color: '#2563eb', fontWeight: 700 }}>57.8%</span>
            </div>

            {/* Bell */}
            <button
              className="relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-slate-50 transition-colors"
              style={{ border: '1px solid #e2e8f0' }}
            >
              <Bell size={16} style={{ color: '#64748b' }} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: '#ef4444' }} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
