import { useState } from 'react';
import {
  FileBarChart2, Download, Calendar, ChevronLeft, ChevronRight,
  CheckCircle2, AlertCircle, Clock, Filter, Search,
} from 'lucide-react';
import { MOCK_REPORT, ReportEntry } from '../data/mockData';

const DATES = [
  { date: '2024-01-15', label: 'Jan 15, 2024', count: 18 },
  { date: '2024-01-14', label: 'Jan 14, 2024', count: 12 },
  { date: '2024-01-13', label: 'Jan 13, 2024', count: 15 },
  { date: '2024-01-12', label: 'Jan 12, 2024', count: 20 },
  { date: '2024-01-11', label: 'Jan 11, 2024', count: 8 },
  { date: '2024-01-10', label: 'Jan 10, 2024', count: 11 },
  { date: '2024-01-09', label: 'Jan 09, 2024', count: 14 },
];

export function ReportPage() {
  const [selectedDate, setSelectedDate] = useState('2024-01-15');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'partial'>('all');

  const currentDate = DATES.find(d => d.date === selectedDate) || DATES[0];
  const currentIndex = DATES.findIndex(d => d.date === selectedDate);

  const filteredEntries = MOCK_REPORT.filter(e => {
    const matchSearch = e.streetName.toLowerCase().includes(search.toLowerCase()) ||
      e.wardName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const completeCount = filteredEntries.filter(e => e.status === 'complete').length;
  const partialCount = filteredEntries.filter(e => e.status === 'partial').length;
  const totalLength = filteredEntries.reduce((s, e) => s + (e.totalLength || 0), 0);

  const STATUS_COLOR: Record<string, string> = {
    complete: '#10b981',
    partial: '#f59e0b',
    pending: '#475569',
  };

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{ background: '#060d1f', fontFamily: "'IBM Plex Sans', sans-serif", color: '#e2e8f0' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-xl"
            style={{ width: 40, height: 40, background: 'rgba(244,114,182,0.15)', border: '1px solid rgba(244,114,182,0.3)' }}
          >
            <FileBarChart2 size={18} style={{ color: '#f472b6' }} />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>Daily Field Report</h2>
            <p style={{ fontSize: 12, color: '#475569' }}>GPS data recorded per day — exportable to Excel</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, rgba(244,114,182,0.7), rgba(236,72,153,0.7))',
              border: '1px solid rgba(244,114,182,0.4)',
              color: '#fff',
              fontSize: 13, fontWeight: 700,
              boxShadow: '0 0 16px rgba(244,114,182,0.2)',
            }}
          >
            <Download size={14} /> Export Daily Excel
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all"
            style={{
              background: 'rgba(0,212,255,0.08)',
              border: '1px solid rgba(0,212,255,0.2)',
              color: '#00d4ff',
              fontSize: 13, fontWeight: 700,
            }}
          >
            <Download size={14} /> Full Export
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Date Picker */}
        <div
          className="flex flex-col shrink-0 p-4"
          style={{
            width: 220,
            borderRight: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={13} style={{ color: '#f472b6' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Select Date
            </span>
          </div>

          <div className="space-y-1.5">
            {DATES.map(d => (
              <button
                key={d.date}
                onClick={() => setSelectedDate(d.date)}
                className="w-full text-left p-3 rounded-xl transition-all"
                style={{
                  background: selectedDate === d.date ? 'rgba(244,114,182,0.12)' : 'rgba(255,255,255,0.03)',
                  border: selectedDate === d.date ? '1px solid rgba(244,114,182,0.3)' : '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: selectedDate === d.date ? '#f472b6' : '#94a3b8' }}>
                  {d.label}
                </div>
                <div style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>
                  {d.count} streets mapped
                </div>
              </button>
            ))}
          </div>

          {/* Date nav */}
          <div className="flex items-center justify-between mt-3">
            <button
              disabled={currentIndex >= DATES.length - 1}
              onClick={() => setSelectedDate(DATES[currentIndex + 1].date)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-40"
            >
              <ChevronLeft size={14} style={{ color: '#475569' }} />
            </button>
            <span style={{ fontSize: 10, color: '#475569' }}>Navigate dates</span>
            <button
              disabled={currentIndex <= 0}
              onClick={() => setSelectedDate(DATES[currentIndex - 1].date)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-40"
            >
              <ChevronRight size={14} style={{ color: '#475569' }} />
            </button>
          </div>
        </div>

        {/* Right: Report Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Report Header */}
          <div
            className="px-5 py-3 flex items-center justify-between shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>
                {currentDate.label}
              </div>
              <div style={{ fontSize: 12, color: '#475569' }}>
                {currentDate.count} streets mapped by field teams
              </div>
            </div>

            {/* Summary stats */}
            <div className="flex items-center gap-4">
              {[
                { label: 'Complete', val: completeCount, color: '#10b981', icon: CheckCircle2 },
                { label: 'Partial', val: partialCount, color: '#f59e0b', icon: AlertCircle },
                { label: 'Total Length', val: `${totalLength}m`, color: '#00d4ff', icon: null },
              ].map(({ label, val, color, icon: Icon }) => (
                <div key={label} className="text-center">
                  <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: "'IBM Plex Mono', monospace" }}>{val}</div>
                  <div style={{ fontSize: 10, color: '#475569', letterSpacing: 0.5 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div
            className="flex items-center gap-3 px-5 py-3 shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="relative flex-1 max-w-xs">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
              <input
                type="text"
                placeholder="Search streets..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-lg outline-none"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#e2e8f0',
                  fontSize: 12,
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              {(['all', 'complete', 'partial'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className="px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    background: statusFilter === s ? `${s === 'complete' ? '#10b981' : s === 'partial' ? '#f59e0b' : '#475569'}18` : 'rgba(255,255,255,0.04)',
                    border: statusFilter === s ? `1px solid ${s === 'complete' ? '#10b981' : s === 'partial' ? '#f59e0b' : '#475569'}30` : '1px solid rgba(255,255,255,0.07)',
                    color: statusFilter === s ? (s === 'complete' ? '#10b981' : s === 'partial' ? '#f59e0b' : '#94a3b8') : '#475569',
                    fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
                  }}
                >
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {['Ward', 'Street Name', 'Municipality', 'Status', 'S·M·E', 'Total Length', 'Time', 'Saved By'].map(h => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left"
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#475569',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        borderBottom: '1px solid rgba(255,255,255,0.07)',
                        position: 'sticky',
                        top: 0,
                        background: 'rgba(6,13,31,0.95)',
                        backdropFilter: 'blur(8px)',
                        zIndex: 10,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry, i) => (
                  <tr
                    key={entry.id}
                    className="group transition-colors"
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full"
                        style={{
                          background: 'rgba(0,212,255,0.1)',
                          border: '1px solid rgba(0,212,255,0.2)',
                          color: '#00d4ff',
                          fontSize: 11, fontWeight: 700,
                        }}
                      >
                        W{entry.wardNo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 500 }}>{entry.streetName}</div>
                      <div style={{ fontSize: 10, color: '#475569' }}>{entry.wardName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ fontSize: 11, color: '#64748b' }}>{entry.municipality}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className="flex items-center gap-1.5 px-2 py-1 rounded-full w-fit"
                        style={{
                          background: `${STATUS_COLOR[entry.status]}15`,
                          border: `1px solid ${STATUS_COLOR[entry.status]}30`,
                          color: STATUS_COLOR[entry.status],
                        }}
                      >
                        {entry.status === 'complete' ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                          {entry.status === 'complete' ? 'FULL' : 'PART'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {[
                          { label: 'S', done: entry.hasStart, color: '#10b981' },
                          { label: 'M', done: entry.hasMid, color: '#00d4ff' },
                          { label: 'E', done: entry.hasEnd, color: '#ef4444' },
                        ].map(({ label, done, color }) => (
                          <div
                            key={label}
                            className="flex items-center justify-center rounded-full"
                            style={{
                              width: 20, height: 20,
                              background: done ? `${color}20` : 'rgba(255,255,255,0.04)',
                              border: `1px solid ${done ? color + '40' : 'rgba(255,255,255,0.08)'}`,
                              color: done ? color : '#334155',
                              fontSize: 9, fontWeight: 800,
                            }}
                          >
                            {label}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ fontSize: 12, color: entry.totalLength ? '#10b981' : '#334155', fontFamily: "'IBM Plex Mono', monospace", fontWeight: entry.totalLength ? 700 : 400 }}>
                        {entry.totalLength ? `${entry.totalLength}m` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ fontSize: 11, color: '#64748b', fontFamily: "'IBM Plex Mono', monospace" }}>
                        {entry.savedAt}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span style={{ fontSize: 11, color: '#475569' }}>{entry.savedBy}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredEntries.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16" style={{ color: '#334155' }}>
                <FileBarChart2 size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <div style={{ fontSize: 14 }}>No entries found</div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="px-5 py-3 flex items-center justify-between shrink-0"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            <span style={{ fontSize: 12, color: '#475569' }}>
              Showing {filteredEntries.length} of {MOCK_REPORT.length} entries
            </span>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 11, color: '#475569' }}>Export:</span>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                style={{
                  background: 'rgba(244,114,182,0.1)',
                  border: '1px solid rgba(244,114,182,0.25)',
                  color: '#f472b6',
                  fontSize: 11, fontWeight: 700,
                }}
              >
                <Download size={11} /> field_report_{selectedDate}.xlsx
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
