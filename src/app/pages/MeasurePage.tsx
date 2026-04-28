import { useState } from 'react';
import { Ruler, Undo2, Check, X, Info } from 'lucide-react';
import { MapToolNav } from '../components/map/MapToolNav';

const MAP_BG = 'https://images.unsplash.com/photo-1750353127860-c16cda47e489?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZXJpYWwlMjBzYXRlbGxpdGUlMjB2aWV3JTIwY2l0eSUyMHN0cmVldHMlMjBJbmRpYSUyMHVyYmFuJTIwbWFwfGVufDF8fHx8MTc3NzM3NzI1Mnww&ixlib=rb-4.1.0&q=80&w=1080';

type Unit = 'auto' | 'm' | 'km' | 'ft';

interface MeasurePoint {
  x: number;
  y: number;
  dist: number;
}

const UNIT_LABELS: Record<Unit, string> = {
  auto: 'Auto',
  m: 'Metres',
  km: 'Km',
  ft: 'Feet',
};

function formatDist(m: number, unit: Unit): string {
  if (unit === 'm') return `${m.toFixed(1)} m`;
  if (unit === 'km') return `${(m / 1000).toFixed(3)} km`;
  if (unit === 'ft') return `${(m * 3.28084).toFixed(1)} ft`;
  if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
  return `${m.toFixed(1)} m`;
}

export function MeasurePage() {
  const [active, setActive] = useState(false);
  const [done, setDone] = useState(false);
  const [points, setPoints] = useState<MeasurePoint[]>([]);
  const [unit, setUnit] = useState<Unit>('auto');
  const [isOnline, setIsOnline] = useState(true);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!active || done) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    let segDist = 0;
    if (points.length > 0) {
      const prev = points[points.length - 1];
      const dx = (x - prev.x) * 8.5;
      const dy = (y - prev.y) * 6.2;
      segDist = Math.sqrt(dx * dx + dy * dy);
    }
    setPoints([...points, { x, y, dist: segDist }]);
  };

  const totalDist = points.reduce((sum, p) => sum + p.dist, 0);
  const segments = points.length > 1 ? points.length - 1 : 0;
  const lastSeg = points.length > 1 ? points[points.length - 1].dist : 0;

  const handleUndo = () => {
    if (done) { setDone(false); return; }
    setPoints(points.slice(0, -1));
  };

  const handleClear = () => {
    setPoints([]);
    setActive(false);
    setDone(false);
  };

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{ background: '#060d1f', fontFamily: "'IBM Plex Sans', sans-serif", color: '#e2e8f0' }}
    >
      {/* Shared top nav */}
      <MapToolNav
        isOnline={isOnline}
        onToggleOnline={() => setIsOnline(!isOnline)}
      />

      {/* Content (pushed below 52px nav) */}
      <div className="flex w-full h-full" style={{ paddingTop: 52 }}>

        {/* Map Area */}
        <div
          className="flex-1 relative overflow-hidden"
          onClick={handleMapClick}
          style={{
            backgroundImage: `url(${MAP_BG})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            cursor: active && !done ? 'crosshair' : 'default',
          }}
        >
          {/* Overlay */}
          <div className="absolute inset-0" style={{ background: 'rgba(6,13,31,0.5)' }} />

          {/* Activate button */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
            <button
              onClick={e => { e.stopPropagation(); if (!active) { setActive(true); setDone(false); } }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all"
              style={{
                background: active ? 'rgba(245,158,11,0.2)' : 'rgba(6,13,31,0.9)',
                border: active ? '1px solid rgba(245,158,11,0.5)' : '1px solid rgba(255,255,255,0.15)',
                backdropFilter: 'blur(12px)',
                color: active ? '#f59e0b' : '#94a3b8',
                fontSize: 13, fontWeight: 700,
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              }}
            >
              <Ruler size={15} />
              {active ? 'Measuring…' : '⬌ Start Measuring'}
            </button>
          </div>

          {/* SVG Lines */}
          {points.length > 1 && (
            <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none', zIndex: 10 }}>
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              {points.slice(1).map((pt, i) => {
                const prev = points[i];
                const midX = (prev.x + pt.x) / 2;
                const midY = (prev.y + pt.y) / 2;
                return (
                  <g key={i}>
                    <line
                      x1={`${prev.x}%`} y1={`${prev.y}%`}
                      x2={`${pt.x}%`} y2={`${pt.y}%`}
                      stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="8,5"
                      filter="url(#glow)"
                    />
                    {/* Segment badge */}
                    <foreignObject
                      x={`${midX - 4}%`} y={`${midY - 1.8}%`}
                      width="8%" height="3.6%"
                      style={{ overflow: 'visible' }}
                    >
                      <div
                        style={{
                          background: 'rgba(245,158,11,0.9)',
                          borderRadius: 6,
                          padding: '2px 6px',
                          fontSize: 10,
                          fontWeight: 800,
                          color: '#000',
                          fontFamily: "'IBM Plex Mono', monospace",
                          whiteSpace: 'nowrap',
                          textAlign: 'center',
                          backdropFilter: 'blur(4px)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                        }}
                      >
                        {formatDist(pt.dist, unit)}
                      </div>
                    </foreignObject>
                  </g>
                );
              })}
            </svg>
          )}

          {/* Points */}
          {points.map((pt, i) => (
            <div
              key={i}
              className="absolute rounded-full border-2 border-white z-20"
              style={{
                left: `${pt.x}%`, top: `${pt.y}%`,
                transform: 'translate(-50%, -50%)',
                width: i === 0 || i === points.length - 1 ? 14 : 10,
                height: i === 0 || i === points.length - 1 ? 14 : 10,
                background: i === 0 ? '#22c55e' : i === points.length - 1 ? '#ef4444' : '#f59e0b',
                boxShadow: `0 0 12px ${i === 0 ? '#22c55e' : i === points.length - 1 ? '#ef4444' : '#f59e0b'}`,
                pointerEvents: 'none',
              }}
            />
          ))}

          {/* Total label at last point */}
          {points.length > 1 && (
            <div
              className="absolute z-20 px-3 py-1.5 rounded-xl"
              style={{
                left: `${points[points.length - 1].x}%`,
                top: `${points[points.length - 1].y}%`,
                transform: 'translate(-50%, calc(-100% - 14px))',
                background: 'rgba(6,13,31,0.96)',
                border: '1px solid rgba(245,158,11,0.5)',
                backdropFilter: 'blur(8px)',
                pointerEvents: 'none',
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 800, color: '#f59e0b', fontFamily: "'IBM Plex Mono', monospace" }}>
                ∑ {formatDist(totalDist, unit)}
              </span>
            </div>
          )}

          {/* Info hint */}
          {!active && points.length === 0 && (
            <div
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 rounded-2xl"
              style={{
                background: 'rgba(6,13,31,0.88)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Info size={13} style={{ color: '#475569' }} />
              <span style={{ fontSize: 12, color: '#475569' }}>
                Click <span style={{ color: '#f59e0b', fontWeight: 700 }}>Start Measuring</span> then tap the map to drop points
              </span>
            </div>
          )}
        </div>

        {/* Right Control Panel */}
        <aside
          className="flex flex-col h-full shrink-0"
          style={{
            width: 264,
            background: '#ffffff',
            borderLeft: '1px solid #e2e8f0',
            boxShadow: '-2px 0 8px rgba(0,0,0,0.04)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-4 shrink-0"
            style={{ borderBottom: '1px solid #f1f5f9' }}
          >
            <div
              className="flex items-center justify-center rounded-xl shrink-0"
              style={{ width: 36, height: 36, background: '#fffbeb', border: '1px solid #fde68a' }}
            >
              <Ruler size={16} style={{ color: '#d97706' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Measure Tool</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Google Earth–style ruler</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Stats */}
            <div className="space-y-2">
              {[
                { label: 'Total Length', val: points.length > 1 ? formatDist(totalDist, unit) : '—', color: '#d97706', big: true },
                { label: 'Segments', val: segments > 0 ? `${segments}` : '—', color: '#2563eb' },
                { label: 'Last Segment', val: lastSeg > 0 ? formatDist(lastSeg, unit) : '—', color: '#7c3aed' },
                { label: 'Points Placed', val: `${points.length}`, color: '#16a34a' },
              ].map(({ label, val, color, big }) => (
                <div
                  key={label}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}
                >
                  <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
                  <span style={{ fontSize: big ? 16 : 13, fontWeight: 800, color, fontFamily: "'IBM Plex Mono', monospace" }}>
                    {val}
                  </span>
                </div>
              ))}
            </div>

            {/* Unit Selector */}
            <div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Display Unit
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(UNIT_LABELS) as Unit[]).map(u => (
                  <button
                    key={u}
                    onClick={() => setUnit(u)}
                    className="py-2 px-3 rounded-xl transition-all"
                    style={{
                      background: unit === u ? '#fffbeb' : '#f8fafc',
                      border: unit === u ? '1px solid #fde68a' : '1px solid #e2e8f0',
                      color: unit === u ? '#d97706' : '#64748b',
                      fontSize: 12, fontWeight: unit === u ? 700 : 500,
                      boxShadow: unit === u ? '0 1px 4px rgba(217,119,6,0.1)' : 'none',
                    }}
                  >
                    {UNIT_LABELS[u]}
                  </button>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-2">
              <button
                onClick={() => { if (!active) { setActive(true); setDone(false); } }}
                disabled={active}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all"
                style={{
                  background: active ? '#fffbeb' : '#d97706',
                  border: active ? '1px solid #fde68a' : 'none',
                  color: active ? '#d97706' : '#ffffff',
                  fontSize: 13, fontWeight: 700,
                  opacity: active ? 0.7 : 1,
                  cursor: active ? 'not-allowed' : 'pointer',
                  boxShadow: active ? 'none' : '0 2px 8px rgba(217,119,6,0.3)',
                }}
              >
                <Ruler size={14} />
                {active ? 'Click map to add points' : 'Start Measuring'}
              </button>

              <div className="flex gap-2">
                <button
                  onClick={handleUndo}
                  disabled={points.length === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all"
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#475569',
                    fontSize: 12, fontWeight: 600,
                    opacity: points.length === 0 ? 0.4 : 1,
                    cursor: points.length === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Undo2 size={13} /> Undo
                </button>
                <button
                  onClick={() => { setDone(true); setActive(false); }}
                  disabled={points.length < 2}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all"
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#16a34a',
                    fontSize: 12, fontWeight: 600,
                    opacity: points.length < 2 ? 0.4 : 1,
                    cursor: points.length < 2 ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Check size={13} /> Done
                </button>
              </div>

              <button
                onClick={handleClear}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all"
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  fontSize: 12, fontWeight: 600,
                }}
              >
                <X size={13} /> Clear All
              </button>
            </div>

            {/* How-to */}
            <div
              className="p-3 rounded-xl"
              style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                How to Use
              </div>
              {[
                'Click "Start Measuring"',
                'Tap points on the map',
                'Amber labels show each segment',
                'Undo removes last point',
                'Done locks the line',
                'Clear resets everything',
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2 mb-1.5">
                  <span style={{ fontSize: 10, color: '#d97706', fontWeight: 800, minWidth: 14 }}>{i + 1}.</span>
                  <span style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}