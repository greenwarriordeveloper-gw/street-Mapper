import { useState } from 'react';
import {
  MapPin, CheckCircle2, Clock, AlertCircle,
  TrendingUp, CalendarDays, Users, Download,
  ArrowRight, Activity,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie,
  Legend,
} from 'recharts';
import { MOCK_STREETS, STATS } from '../data/mockData';
import { useNavigate } from 'react-router';

const WARD_DATA = [
  { ward: 'W1', total: 340, done: 210, color: '#00d4ff' },
  { ward: 'W2', total: 280, done: 198, color: '#10b981' },
  { ward: 'W3', total: 320, done: 145, color: '#8b5cf6' },
  { ward: 'W4', total: 410, done: 280, color: '#f59e0b' },
  { ward: 'W5', total: 290, done: 167, color: '#f472b6' },
  { ward: 'W6', total: 380, done: 310, color: '#00d4ff' },
  { ward: 'W7', total: 350, done: 290, color: '#10b981' },
  { ward: 'W8', total: 260, done: 120, color: '#8b5cf6' },
];

const MUNI_DATA = [
  { name: 'Pondicherry', value: 2418, color: '#00d4ff' },
  { name: 'Oulgaret', value: 1634, color: '#8b5cf6' },
];

const ACTIVITY = [
  { time: '09:30 AM', user: 'field_team_a', action: 'Mapped Beach Road Main', ward: 'W1', status: 'complete' },
  { time: '10:15 AM', user: 'field_team_a', action: 'Mapped Raja Street', ward: 'W1', status: 'complete' },
  { time: '11:00 AM', user: 'field_team_b', action: 'Partial — Nehru Street', ward: 'W1', status: 'partial' },
  { time: '11:45 AM', user: 'field_team_a', action: 'Mapped Gandhi Road', ward: 'W2', status: 'complete' },
  { time: '02:00 PM', user: 'field_team_c', action: 'Mapped Market Street', ward: 'W3', status: 'complete' },
  { time: '03:15 PM', user: 'field_team_b', action: 'Mapped Anna Salai Main', ward: 'W4', status: 'complete' },
  { time: '04:00 PM', user: 'field_team_a', action: 'Partial — New Colony Rd', ward: 'W5', status: 'partial' },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const [activeWard, setActiveWard] = useState<string | null>(null);

  const statusColor: Record<string, string> = {
    complete: '#10b981',
    partial: '#f59e0b',
    pending: '#475569',
  };

  const STAT_CARDS = [
    { label: 'Total Streets', value: STATS.total.toLocaleString(), icon: MapPin, color: '#00d4ff', sub: 'Pondicherry + Oulgaret' },
    { label: 'Completed', value: STATS.completed.toLocaleString(), icon: CheckCircle2, color: '#10b981', sub: `${STATS.completionRate}% complete` },
    { label: 'In Progress', value: STATS.partial.toLocaleString(), icon: Activity, color: '#f59e0b', sub: 'Partially mapped' },
    { label: 'Pending', value: STATS.pending.toLocaleString(), icon: Clock, color: '#64748b', sub: 'Not started yet' },
  ];

  return (
    <div
      className="h-full overflow-y-auto p-6"
      style={{ background: '#f8fafc', fontFamily: "'IBM Plex Sans', sans-serif", color: '#0f172a' }}
    >
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>Survey Dashboard</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
            Real-time progress overview — Pondicherry & Oulgaret Municipality
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
          >
            <CalendarDays size={14} style={{ color: '#64748b' }} />
            <span style={{ fontSize: 12, color: '#475569' }}>Today: Jan 15, 2024</span>
          </div>
          <button
            onClick={() => navigate('/reports')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:opacity-90"
            style={{ background: '#2563eb', color: '#ffffff', fontSize: 13, fontWeight: 600, boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}
          >
            <Download size={14} />
            Export Report
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, sub }) => (
          <div
            key={label}
            className="p-5 rounded-2xl"
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="flex items-center justify-center rounded-xl"
                style={{ width: 40, height: 40, background: `${color}15` }}
              >
                <Icon size={18} style={{ color }} />
              </div>
              <TrendingUp size={14} style={{ color: '#22c55e', marginTop: 2 }} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginTop: 4 }}>{label}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        {/* Ward Progress Chart */}
        <div
          className="xl:col-span-2 p-5 rounded-2xl"
          style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Ward-wise Progress</h3>
              <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>Streets completed per ward</p>
            </div>
            <button
              onClick={() => navigate('/map')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all hover:opacity-90"
              style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', fontWeight: 600 }}
            >
              Open Map <ArrowRight size={12} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={WARD_DATA} barSize={28}>
              <XAxis
                dataKey="ward"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  color: '#0f172a',
                  fontSize: 12,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                }}
                cursor={{ fill: 'rgba(0,0,0,0.03)' }}
              />
              <Bar dataKey="total" fill="#f1f5f9" radius={[4, 4, 0, 0]} name="Total" />
              <Bar dataKey="done" radius={[4, 4, 0, 0]} name="Completed">
                {WARD_DATA.map((entry, i) => (
                  <Cell key={`ward-bar-${entry.ward}-${i}`} fill={entry.color} fillOpacity={activeWard === entry.ward ? 1 : 0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Municipality Pie */}
        <div
          className="p-5 rounded-2xl"
          style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>By Municipality</h3>
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>Street distribution</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={MUNI_DATA}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
              >
                {MUNI_DATA.map((entry, i) => (
                  <Cell key={`muni-pie-${entry.name}-${i}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(v) => <span style={{ fontSize: 12, color: '#64748b' }}>{v}</span>}
              />
              <Tooltip
                contentStyle={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  color: '#0f172a',
                  fontSize: 12,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-3 space-y-2">
            {[
              { label: 'Completed', val: '57.8%', color: '#22c55e', bg: '#f0fdf4' },
              { label: 'Partial',   val: '12.0%', color: '#f59e0b', bg: '#fffbeb' },
              { label: 'Pending',   val: '30.2%', color: '#94a3b8', bg: '#f8fafc' },
            ].map(({ label, val, color, bg }) => (
              <div key={label} className="flex items-center justify-between px-2 py-1.5 rounded-lg" style={{ background: bg }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span style={{ fontSize: 12, color: '#475569' }}>{label}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <div
          className="p-5 rounded-2xl"
          style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Today's Activity</h3>
              <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>Jan 15, 2024 · 18 streets mapped</p>
            </div>
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
            >
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
              <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 600 }}>LIVE</span>
            </div>
          </div>
          <div className="space-y-2">
            {ACTIVITY.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2.5 rounded-xl"
                style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: statusColor[item.status] }}
                />
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 12, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.action}
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>
                    {item.user} · Ward {item.ward}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Access */}
        <div
          className="p-5 rounded-2xl"
          style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Quick Access</h3>
          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>Jump to any module</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'GPS Mapper',    desc: 'Map street coordinates', color: '#16a34a', bg: '#f0fdf4', icon: '🗺', path: '/map' },
              { label: 'Measure Tool',  desc: 'Calculate distances',    color: '#d97706', bg: '#fffbeb', icon: '📏', path: '/measure' },
              { label: 'Polygon Mgr',   desc: 'Manage geofences',       color: '#7c3aed', bg: '#f5f3ff', icon: '⬡', path: '/polygons' },
              { label: 'Daily Report',  desc: 'Export field data',      color: '#db2777', bg: '#fdf2f8', icon: '📊', path: '/reports' },
              { label: 'Admin Panel',   desc: 'Users & groups',         color: '#475569', bg: '#f8fafc', icon: '⚙', path: '/admin' },
              { label: 'Today Stats',   desc: `${STATS.todayMapped} mapped today`, color: '#2563eb', bg: '#eff6ff', icon: '✓', path: '/reports' },
            ].map(({ label, desc, color, bg, icon, path }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:shadow-md hover:scale-[1.02]"
                style={{
                  background: bg,
                  border: `1px solid ${color}20`,
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 22 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{label}</div>
                  <div style={{ fontSize: 10, color: '#64748b' }}>{desc}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Overall progress */}
          <div
            className="mt-4 p-4 rounded-xl"
            style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Overall Progress</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#2563eb' }}>57.8%</span>
            </div>
            <div className="rounded-full overflow-hidden" style={{ height: 8, background: '#dbeafe' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: '57.8%', background: 'linear-gradient(90deg, #2563eb, #22c55e)' }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span style={{ fontSize: 10, color: '#64748b' }}>2,341 / 4,052 streets</span>
              <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 600 }}>+94 this week</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}