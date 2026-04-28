import { useState } from 'react';
import {
  Hexagon, Plus, Upload, Edit2, Trash2, Filter,
  X, Check, Info,
} from 'lucide-react';
import { MOCK_GEOFENCES, Geofence } from '../data/mockData';
import { MapToolNav } from '../components/map/MapToolNav';

const MAP_BG = 'https://images.unsplash.com/photo-1777218505107-aa043b7ab544?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJlZXQlMjBtYXAlMjByb2FkcyUyMHVyYmFuJTIwY2l0eSUyMGdyaWQlMjBvdmVyaGVhZHxlbnwxfHx8fDE3NzczNzcyNTJ8MA&ixlib=rb-4.1.0&q=80&w=1080';

// Mock polygon coordinates (% of map area)
const MOCK_POLYS: Array<{ id: string; color: string; points: [number, number][] }> = [
  {
    id: 'z1', color: '#00d4ff',
    points: [[15, 10], [50, 8], [55, 45], [20, 50], [10, 30]],
  },
  {
    id: 'z2', color: '#8b5cf6',
    points: [[55, 10], [85, 15], [90, 50], [60, 55], [50, 30]],
  },
  {
    id: 'z3', color: '#10b981',
    points: [[20, 55], [50, 52], [55, 80], [25, 85], [15, 70]],
  },
  {
    id: 'z4', color: '#f59e0b',
    points: [[55, 55], [85, 52], [88, 82], [60, 88], [52, 72]],
  },
];

export function PolygonPage() {
  const [zones, setZones] = useState<Geofence[]>(MOCK_GEOFENCES);
  const [drawing, setDrawing] = useState(false);
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [editingZone, setEditingZone] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#00d4ff');
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [filterZone, setFilterZone] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const handleDelete = (id: string) => {
    setZones(zones.filter(z => z.id !== id));
    setShowDelete(null);
    if (filterZone === id) setFilterZone(null);
  };

  const handleSaveEdit = (id: string) => {
    setZones(zones.map(z => z.id === id ? { ...z, name: editName, color: editColor } : z));
    setEditingZone(null);
  };

  const COLOR_OPTIONS = ['#00d4ff', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#f472b6', '#22c55e', '#2563eb'];

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

      {/* Content pushed below 52px nav */}
      <div className="flex w-full h-full" style={{ paddingTop: 52 }}>

        {/* Map Area */}
        <div
          className="flex-1 relative overflow-hidden"
          style={{
            backgroundImage: `url(${MAP_BG})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            cursor: drawing ? 'crosshair' : 'default',
          }}
        >
          {/* Overlay */}
          <div className="absolute inset-0" style={{ background: 'rgba(6,13,31,0.52)' }} />

          {/* Title badge */}
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-2xl"
            style={{
              background: 'rgba(6,13,31,0.9)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
            }}
          >
            <Hexagon size={14} style={{ color: '#8b5cf6' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>
              Polygon & Geofence Manager
            </span>
            <div
              className="px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}
            >
              <span style={{ fontSize: 10, color: '#8b5cf6', fontWeight: 700 }}>{zones.length} ZONES</span>
            </div>
          </div>

          {/* Polygon SVG Overlay */}
          <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none', zIndex: 10 }}>
            <defs>
              {zones.map(z => (
                <filter key={`glow-${z.id}`} id={`glow-${z.id}`}>
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              ))}
            </defs>
            {MOCK_POLYS.map(poly => {
              const zone = zones.find(z => z.id === poly.id);
              if (!zone) return null;
              const isActive = activeZone === poly.id;
              const isFiltered = filterZone === poly.id;
              const color = zone.color;
              const pointsStr = poly.points.map(([x, y]) => `${x}%,${y}%`).join(' ');
              const cx = poly.points.reduce((s, [x]) => s + x, 0) / poly.points.length;
              const cy = poly.points.reduce((s, [, y]) => s + y, 0) / poly.points.length;

              return (
                <g key={poly.id}>
                  <polygon
                    points={pointsStr}
                    fill={`${color}20`}
                    stroke={color}
                    strokeWidth={isActive || isFiltered ? 2.5 : 1.5}
                    strokeDasharray={isFiltered ? 'none' : '8,4'}
                    opacity={isActive ? 1 : 0.75}
                    filter={isActive ? `url(#glow-${poly.id})` : undefined}
                  />
                  {/* Zone label */}
                  <rect
                    x={`${cx - 6}%`} y={`${cy - 1.6}%`}
                    width="12%" height="3.2%"
                    rx="4"
                    fill={`${color}25`}
                    stroke={`${color}60`}
                    strokeWidth="1"
                  />
                  <text
                    x={`${cx}%`} y={`${cy + 0.6}%`}
                    textAnchor="middle"
                    fill={color}
                    fontSize="11"
                    fontWeight="700"
                    fontFamily="IBM Plex Sans, sans-serif"
                  >
                    {zone.name}
                  </text>
                </g>
              );
            })}

            {/* Drawing ghost */}
            {drawing && (
              <polygon
                points="22%,22% 42%,20% 47%,42% 24%,46%"
                fill="rgba(255,255,255,0.05)"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="1.5"
                strokeDasharray="5,3"
              />
            )}
          </svg>

          {/* Drawing mode indicator */}
          {drawing && (
            <div
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-2xl z-30"
              style={{
                background: 'rgba(6,13,31,0.92)',
                border: '1px solid rgba(139,92,246,0.45)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 0 24px rgba(139,92,246,0.2)',
              }}
            >
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#8b5cf6' }} />
              <span style={{ fontSize: 12, color: '#8b5cf6', fontWeight: 600 }}>
                Drawing mode — click to add vertices, double-click to finish
              </span>
              <button
                onClick={() => setDrawing(false)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-red-500/20 transition-colors"
                style={{ color: '#ef4444', fontSize: 11, fontWeight: 600 }}
              >
                <X size={11} /> Cancel
              </button>
            </div>
          )}

          {/* Filter active badge */}
          {filterZone && (
            <div
              className="absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-xl z-30"
              style={{
                background: 'rgba(6,13,31,0.92)',
                border: `1px solid ${zones.find(z => z.id === filterZone)?.color || '#00d4ff'}40`,
                backdropFilter: 'blur(8px)',
              }}
            >
              <Filter size={12} style={{ color: zones.find(z => z.id === filterZone)?.color }} />
              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                Filtering to:&nbsp;
                <span style={{ color: zones.find(z => z.id === filterZone)?.color, fontWeight: 700 }}>
                  {zones.find(z => z.id === filterZone)?.name}
                </span>
              </span>
              <button onClick={() => setFilterZone(null)}>
                <X size={11} style={{ color: '#475569' }} />
              </button>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <aside
          className="flex flex-col h-full shrink-0"
          style={{
            width: 280,
            background: '#ffffff',
            borderLeft: '1px solid #e2e8f0',
            boxShadow: '-2px 0 8px rgba(0,0,0,0.04)',
          }}
        >
          {/* Header */}
          <div className="p-4 shrink-0" style={{ borderBottom: '1px solid #f1f5f9' }}>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="flex items-center justify-center rounded-xl shrink-0"
                style={{ width: 34, height: 34, background: '#f5f3ff', border: '1px solid #ddd6fe' }}
              >
                <Hexagon size={15} style={{ color: '#7c3aed' }} />
              </div>
              <div className="flex-1">
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Saved Zones</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>{zones.length} geofences</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setDrawing(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all hover:opacity-90"
                style={{
                  background: drawing ? '#f5f3ff' : '#7c3aed',
                  border: drawing ? '1px solid #ddd6fe' : 'none',
                  color: drawing ? '#7c3aed' : '#ffffff',
                  fontSize: 12, fontWeight: 700,
                  boxShadow: drawing ? 'none' : '0 2px 8px rgba(124,58,237,0.3)',
                }}
              >
                <Plus size={13} /> Draw Zone
              </button>
              <button
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all hover:bg-slate-50"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#475569',
                  fontSize: 12, fontWeight: 600,
                }}
              >
                <Upload size={13} /> KML
              </button>
            </div>
          </div>

          {/* Zone List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {zones.map(zone => (
              <div key={zone.id}>
                {editingZone === zone.id ? (
                  <div
                    className="p-3 rounded-xl space-y-3"
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                  >
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Zone name"
                      className="w-full px-3 py-2 rounded-lg outline-none"
                      style={{
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        color: '#0f172a', fontSize: 13,
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Zone Colour
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {COLOR_OPTIONS.map(c => (
                          <button
                            key={c}
                            onClick={() => setEditColor(c)}
                            className="rounded-full transition-all"
                            style={{
                              width: 20, height: 20,
                              background: c,
                              border: editColor === c ? '2px solid #0f172a' : '2px solid transparent',
                              boxShadow: editColor === c ? `0 0 0 1px ${c}` : 'none',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(zone.id)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg"
                        style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', fontSize: 11, fontWeight: 700 }}
                      >
                        <Check size={11} /> Save
                      </button>
                      <button
                        onClick={() => setEditingZone(null)}
                        className="flex items-center justify-center px-3 py-1.5 rounded-lg"
                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b' }}
                      >
                        <X size={11} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="p-3 rounded-xl transition-all cursor-pointer hover:shadow-sm"
                    style={{
                      background: activeZone === zone.id ? `${zone.color}08` : '#f8fafc',
                      border: activeZone === zone.id
                        ? `1px solid ${zone.color}30`
                        : '1px solid #f1f5f9',
                    }}
                    onMouseEnter={() => setActiveZone(zone.id)}
                    onMouseLeave={() => setActiveZone(null)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{ background: zone.color, boxShadow: `0 0 4px ${zone.color}60` }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', flex: 1 }}>{zone.name}</span>
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => { setEditingZone(zone.id); setEditName(zone.name); setEditColor(zone.color); }}
                          className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <Edit2 size={11} style={{ color: '#94a3b8' }} />
                        </button>
                        <button
                          onClick={() => setShowDelete(showDelete === zone.id ? null : zone.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={11} style={{ color: '#94a3b8' }} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>
                        {zone.streetsCount.toLocaleString()} streets
                      </div>
                      <button
                        onClick={() => setFilterZone(filterZone === zone.id ? null : zone.id)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full transition-all"
                        style={{
                          background: filterZone === zone.id ? `${zone.color}12` : '#f1f5f9',
                          border: filterZone === zone.id ? `1px solid ${zone.color}35` : '1px solid #e2e8f0',
                          color: filterZone === zone.id ? zone.color : '#64748b',
                          fontSize: 10, fontWeight: 600,
                        }}
                      >
                        <Filter size={9} />
                        {filterZone === zone.id ? 'Filtering' : 'Filter'}
                      </button>
                    </div>

                    {showDelete === zone.id && (
                      <div
                        className="mt-2 p-2.5 rounded-lg"
                        style={{ background: '#fef2f2', border: '1px solid #fecaca' }}
                      >
                        <div style={{ fontSize: 11, color: '#dc2626', marginBottom: 6 }}>
                          Delete "{zone.name}"?
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(zone.id)}
                            className="flex-1 py-1 rounded-lg"
                            style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 11, fontWeight: 700 }}
                          >
                            Yes, Delete
                          </button>
                          <button
                            onClick={() => setShowDelete(null)}
                            className="px-3 py-1 rounded-lg"
                            style={{ background: '#f8fafc', color: '#64748b', fontSize: 11, border: '1px solid #e2e8f0' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Info footer */}
          <div
            className="m-3 p-3 rounded-xl shrink-0"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Info size={12} style={{ color: '#94a3b8' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Features
              </span>
            </div>
            {[
              'Draw polygon vertices on map',
              'Upload KML files for import',
              'Filter streets by zone',
              'Edit name & colour anytime',
            ].map((tip, i) => (
              <div key={i} className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#7c3aed' }} />
                <span style={{ fontSize: 11, color: '#64748b' }}>{tip}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}