import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Search, ChevronDown,
  Satellite, Map as MapIcon,
  Trash2, Undo2, Save, Navigation, Crosshair,
  CheckCircle2, Clock, AlertCircle, X, Check,
  ZoomIn, ZoomOut, Layers,
  Menu, ChevronLeft, MapPin, Filter,
  LocateFixed,
  Info, Edit3, Eye,
} from 'lucide-react';
import { MOCK_STREETS, WARDS, Street, STATS } from '../data/mockData';
import { MapToolNav } from '../components/map/MapToolNav';

const MAP_SAT = 'https://images.unsplash.com/photo-1750353127860-c16cda47e489?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZXJpYWwlMjBzYXRlbGxpdGUlMjB2aWV3JTIwY2l0eSUyMHN0cmVldHMlMjBJbmRpYSUyMHVyYmFuJTIwbWFwfGVufDF8fHx8MTc3NzM3NzI1Mnww&ixlib=rb-4.1.0&q=80&w=1080';
const MAP_STREET = 'https://images.unsplash.com/photo-1777218505107-aa043b7ab544?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJlZXQlMjBtYXAlMjByb2FkcyUyMHVyYmFuJTIwY2l0eSUyMGdyaWQlMjBvdmVyaGVhZHxlbnwxfHx8fDE3NzczNzcyNTJ8MA&ixlib=rb-4.1.0&q=80&w=1080';

const STATUS_COLOR: Record<string, string> = {
  complete: '#22c55e',
  partial: '#f59e0b',
  pending: '#64748b',
};
const STATUS_BG: Record<string, string> = {
  complete: 'rgba(34,197,94,0.12)',
  partial: 'rgba(245,158,11,0.12)',
  pending: 'rgba(100,116,139,0.12)',
};

const POINT_COLORS: Record<string, string> = {
  start: '#22c55e',
  mid: '#f59e0b',
  end: '#ef4444',
};

type Mode = 'view' | 'edit';
type MapType = 'street' | 'satellite';
type PointStep = 'start' | 'mid' | 'end' | 'done';

// Mock pin positions (% of map canvas)
const MOCK_PINS = [
  { id: 1, x: 22, y: 28, status: 'complete' },
  { id: 2, x: 38, y: 22, status: 'complete' },
  { id: 4, x: 52, y: 38, status: 'complete' },
  { id: 5, x: 60, y: 50, status: 'complete' },
  { id: 7, x: 30, y: 58, status: 'complete' },
  { id: 10, x: 72, y: 32, status: 'complete' },
  { id: 11, x: 78, y: 46, status: 'complete' },
  { id: 14, x: 44, y: 68, status: 'complete' },
  { id: 16, x: 64, y: 72, status: 'complete' },
  { id: 19, x: 84, y: 58, status: 'complete' },
  { id: 3, x: 46, y: 40, status: 'partial' },
  { id: 9, x: 26, y: 68, status: 'partial' },
  { id: 13, x: 56, y: 62, status: 'partial' },
  { id: 17, x: 68, y: 26, status: 'partial' },
  { id: 8, x: 36, y: 46, status: 'pending' },
  { id: 12, x: 62, y: 20, status: 'pending' },
  { id: 15, x: 82, y: 38, status: 'pending' },
  { id: 18, x: 48, y: 76, status: 'pending' },
];

// Generate more streets for the sidebar (padded list to simulate 4052)
function generateExtraStreets(): Street[] {
  const extras: Street[] = [];
  const streetTypes = ['Main Road', 'Cross Street', 'Lane', 'Avenue', 'Nagar', 'Colony Road', 'Street', 'Path', 'Ring Road'];
  const names = ['Ambal', 'Pillayar Koil', 'Vinayagam', 'Ratha Veedhi', 'Kalaignar', 'Bharathidasan', 'Periyar',
    'Ambedkar', 'MGR', 'Kamraj', 'Nehru', 'Gandhi', 'Subramani', 'Selvam', 'Murugan', 'Lakshmi', 'Saraswathi',
    'Durga', 'Kannagi', 'Vivekananda', 'Thiruvalluvar', 'Pondy Bazaar', 'Cuddalore Main', 'ECR', 'NH66'];
  let id = 100;
  for (let w = 1; w <= 12; w++) {
    for (let i = 0; i < 15; i++) {
      const name = names[Math.floor(Math.random() * names.length)];
      const type = streetTypes[Math.floor(Math.random() * streetTypes.length)];
      const statuses: Array<'complete' | 'partial' | 'pending'> = ['complete', 'complete', 'complete', 'partial', 'pending'];
      extras.push({
        id: id++,
        wardNo: String(w),
        wardName: WARDS[String(w)] || `Ward ${w}`,
        streetName: `${name} ${type}`,
        municipality: w <= 8 ? 'Pondicherry' : 'Oulgaret',
        constituency: `Constituency ${w}`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
      });
    }
  }
  return extras;
}

const ALL_STREETS = [...MOCK_STREETS, ...generateExtraStreets()];

function ProgressRing({ progress, size = 56, stroke = 4 }: { progress: number; size?: number; stroke?: number }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="url(#prog)" strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
      <defs>
        <linearGradient id="prog" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function MapPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [wardFilter, setWardFilter] = useState('all');
  const [selectedStreet, setSelectedStreet] = useState<Street | null>(null);
  const [mode, setMode] = useState<Mode>('view');
  const [mapType, setMapType] = useState<MapType>('satellite');
  const [pointStep, setPointStep] = useState<PointStep>('start');
  const [showInfo, setShowInfo] = useState(false);
  const [showWardDropdown, setShowWardDropdown] = useState(false);
  const [hoveredPin, setHoveredPin] = useState<number | null>(null);
  const [coordSearch, setCoordSearch] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [savedFlash, setSavedFlash] = useState(false);
  const [clickEffect, setClickEffect] = useState<{ x: number; y: number } | null>(null);

  // Street points state (simulated GPS capture)
  const [capturedPoints, setCapturedPoints] = useState<{
    start?: { x: number; y: number };
    mid?: { x: number; y: number };
    end?: { x: number; y: number };
  }>({});

  const filteredStreets = useMemo(() => {
    return ALL_STREETS.filter(s => {
      const matchesSearch = s.streetName.toLowerCase().includes(search.toLowerCase()) ||
        s.wardName.toLowerCase().includes(search.toLowerCase());
      const matchesWard = wardFilter === 'all' || s.wardNo === wardFilter;
      return matchesSearch && matchesWard;
    });
  }, [search, wardFilter]);

  const completedCount = STATS.completed;
  const totalCount = STATS.total;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  const handleSelectStreet = (street: Street) => {
    if (selectedStreet?.id === street.id) {
      setSelectedStreet(null);
      setMode('view');
      setShowInfo(false);
      setCapturedPoints({});
    } else {
      setSelectedStreet(street);
      setMode('edit');
      setShowInfo(true);
      setPointStep(street.status === 'complete' ? 'done' : street.status === 'partial' ? 'end' : 'start');
      setCapturedPoints({});
    }
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== 'edit' || !selectedStreet) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Visual click feedback
    setClickEffect({ x, y });
    setTimeout(() => setClickEffect(null), 600);

    if (pointStep === 'start') {
      setCapturedPoints({ start: { x, y } });
      setPointStep('mid');
    } else if (pointStep === 'mid') {
      setCapturedPoints(p => ({ ...p, mid: { x, y } }));
      setPointStep('end');
    } else if (pointStep === 'end') {
      setCapturedPoints(p => ({ ...p, end: { x, y } }));
      setPointStep('done');
    }
  };

  const handleSave = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
    setShowConfirm(false);
  };

  const handleUndo = () => {
    if (pointStep === 'done') {
      setCapturedPoints(p => { const n = { ...p }; delete n.end; return n; });
      setPointStep('end');
    } else if (pointStep === 'end') {
      setCapturedPoints(p => { const n = { ...p }; delete n.mid; return n; });
      setPointStep('mid');
    } else if (pointStep === 'mid') {
      setCapturedPoints({});
      setPointStep('start');
    }
  };

  // Compute mock distances
  const dist = (a?: { x: number; y: number }, b?: { x: number; y: number }) => {
    if (!a || !b) return null;
    const dx = (b.x - a.x) * 8.5;
    const dy = (b.y - a.y) * 6.2;
    return Math.sqrt(dx * dx + dy * dy);
  };
  const distSM = dist(capturedPoints.start, capturedPoints.mid) ??
    (selectedStreet?.startLat && selectedStreet?.midLat ? 143 : null);
  const distME = dist(capturedPoints.mid, capturedPoints.end) ??
    (selectedStreet?.midLat && selectedStreet?.endLat ? 189 : null);
  const totalDist = selectedStreet?.totalLength ?? (distSM && distME ? distSM + distME : null);

  const mockCoord = (base: number, offset: number) => (base + offset * 0.001).toFixed(6);

  return (
    <div
      className="flex h-screen w-screen overflow-hidden"
      style={{ background: '#f1f5f9', fontFamily: "'IBM Plex Sans', sans-serif", color: '#0f172a' }}
    >
      {/* Shared top nav (replaces inline header) */}
      <MapToolNav
        isOnline={isOnline}
        completedCount={completedCount}
        totalCount={totalCount}
        progressPct={progressPct}
        onToggleOnline={() => setIsOnline(!isOnline)}
      />

      {/* ─── Collapsible Left Sidebar ─── */}
      <aside
        className="flex flex-col h-full shrink-0 transition-all duration-300 relative z-10"
        style={{
          width: sidebarCollapsed ? 52 : 296,
          background: '#ffffff',
          borderRight: '1px solid #e2e8f0',
          boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
        }}
      >
        {/* Sidebar Header */}
        <div
          className="flex items-center justify-between px-3 py-3 shrink-0"
          style={{ borderBottom: '1px solid #f1f5f9', minHeight: 52 }}
        >
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <MapPin size={14} style={{ color: '#2563eb' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', letterSpacing: 0.3 }}>Streets</span>
              <span
                className="px-1.5 py-0.5 rounded-full ml-1"
                style={{ background: '#eff6ff', color: '#2563eb', fontSize: 9, fontWeight: 700, border: '1px solid #bfdbfe' }}
              >
                {totalCount.toLocaleString()}
              </span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center justify-center rounded-lg hover:bg-slate-50 transition-colors"
            style={{ width: 28, height: 28, color: '#94a3b8' }}
          >
            {sidebarCollapsed ? <ChevronLeft size={14} style={{ transform: 'rotate(180deg)' }} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {!sidebarCollapsed && (
          <>
            {/* Progress ring + stats */}
            <div
              className="px-3 pt-3 pb-2 shrink-0"
              style={{ borderBottom: '1px solid #f1f5f9' }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="relative shrink-0">
                  <ProgressRing progress={progressPct} size={48} stroke={4} />
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ fontSize: 10, fontWeight: 800, color: '#22c55e' }}
                  >
                    {progressPct}%
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                    {completedCount.toLocaleString()} / {totalCount.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>streets completed</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#f59e0b' }} />
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>{STATS.partial} partial</span>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#cbd5e1' }} />
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>{STATS.pending} pending</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="px-3 pt-2 pb-1 shrink-0">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search streets or wards..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl outline-none"
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#0f172a', fontSize: 12,
                  }}
                />
                {search && (
                  <button className="absolute right-2.5 top-1/2 -translate-y-1/2" onClick={() => setSearch('')}>
                    <X size={11} style={{ color: '#94a3b8' }} />
                  </button>
                )}
              </div>
            </div>

            {/* Ward Filter */}
            <div className="px-3 pb-2 shrink-0 relative">
              <button
                onClick={() => setShowWardDropdown(!showWardDropdown)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl"
                style={{
                  background: '#f8fafc',
                  border: `1px solid ${wardFilter !== 'all' ? '#bfdbfe' : '#e2e8f0'}`,
                  color: wardFilter !== 'all' ? '#2563eb' : '#64748b',
                  fontSize: 12,
                }}
              >
                <div className="flex items-center gap-2">
                  <Filter size={11} />
                  <span>{wardFilter === 'all' ? 'All Wards' : `W${wardFilter} — ${WARDS[wardFilter]}`}</span>
                </div>
                <ChevronDown size={11} style={{ transform: showWardDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {showWardDropdown && (
                <div
                  className="absolute left-3 right-3 top-full mt-1 rounded-xl overflow-hidden z-50"
                  style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                >
                  <div className="max-h-52 overflow-y-auto">
                    {['all', ...Object.keys(WARDS)].map(no => (
                      <button
                        key={no}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors"
                        style={{
                          fontSize: 12,
                          color: wardFilter === no ? '#2563eb' : '#475569',
                          background: wardFilter === no ? '#eff6ff' : 'transparent',
                        }}
                        onClick={() => { setWardFilter(no); setShowWardDropdown(false); }}
                      >
                        {no === 'all' ? 'All Wards' : `W${no} — ${WARDS[no]}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Street List */}
            <div className="flex-1 overflow-y-auto" style={{ borderTop: '1px solid #f1f5f9' }}>
              {filteredStreets.length === 0 ? (
                <div className="p-6 text-center" style={{ color: '#94a3b8', fontSize: 12 }}>
                  No streets found
                </div>
              ) : (
                filteredStreets.slice(0, 120).map(street => (
                  <button
                    key={street.id}
                    onClick={() => handleSelectStreet(street)}
                    className="w-full text-left px-3 py-2.5 transition-all border-b"
                    style={{
                      background: selectedStreet?.id === street.id ? '#eff6ff' : 'transparent',
                      borderBottomColor: '#f8fafc',
                      borderLeft: `3px solid ${selectedStreet?.id === street.id ? '#2563eb' : 'transparent'}`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="truncate flex-1"
                        style={{
                          fontSize: 12,
                          fontWeight: selectedStreet?.id === street.id ? 700 : 400,
                          color: selectedStreet?.id === street.id ? '#0f172a' : '#475569',
                        }}
                      >
                        {street.streetName}
                      </span>
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: STATUS_COLOR[street.status] }}
                      />
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>
                      W{street.wardNo} · {street.wardName}
                      {street.totalLength && ` · ${street.totalLength}m`}
                    </div>
                  </button>
                ))
              )}
              {filteredStreets.length > 120 && (
                <div
                  className="text-center py-3"
                  style={{ fontSize: 11, color: '#94a3b8', borderTop: '1px solid #f1f5f9' }}
                >
                  +{(filteredStreets.length - 120).toLocaleString()} more — refine search
                </div>
              )}
            </div>
          </>
        )}

        {/* Collapsed icon nav */}
        {sidebarCollapsed && (
          <div className="flex-1 flex flex-col items-center py-3 gap-3">
            <button className="p-2 rounded-lg hover:bg-slate-50" title="Search">
              <Search size={15} style={{ color: '#94a3b8' }} />
            </button>
            <button className="p-2 rounded-lg hover:bg-slate-50" title="Filter">
              <Filter size={15} style={{ color: '#94a3b8' }} />
            </button>
            <button className="p-2 rounded-lg hover:bg-slate-50" title="Street List">
              <Menu size={15} style={{ color: '#94a3b8' }} />
            </button>
          </div>
        )}
      </aside>

      {/* ─── Main Map Area ─── */}
      <div className="flex-1 flex flex-col relative overflow-hidden">

        {/* Map Canvas */}
        <div
          className="flex-1 relative overflow-hidden"
          style={{ marginTop: 52, cursor: mode === 'edit' && pointStep !== 'done' ? 'crosshair' : 'default' }}
          onClick={handleMapClick}
        >
          {/* Map Background */}
          <div
            className="absolute inset-0 transition-all duration-700"
            style={{
              backgroundImage: `url(${mapType === 'satellite' ? MAP_SAT : MAP_STREET})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />

          {/* Tint overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: mapType === 'satellite'
                ? 'rgba(0,0,0,0.3)'
                : 'rgba(6,13,31,0.72)',
            }}
          />

          {/* Street-mode grid */}
          {mapType === 'street' && (
            <div
              className="absolute inset-0 opacity-15"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(37,99,235,0.6) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(37,99,235,0.6) 1px, transparent 1px)
                `,
                backgroundSize: '70px 70px',
              }}
            />
          )}

          {/* Street connector lines (decorative) */}
          <svg className="absolute inset-0 w-full h-full opacity-25" style={{ pointerEvents: 'none' }}>
            {MOCK_PINS.filter(p => p.status === 'complete').map((pin, i, arr) => {
              if (i === 0) return null;
              const prev = arr[i - 1];
              return (
                <line key={i}
                  x1={`${prev.x}%`} y1={`${prev.y}%`}
                  x2={`${pin.x}%`} y2={`${pin.y}%`}
                  stroke="#22c55e" strokeWidth="1" strokeDasharray="4,6"
                />
              );
            })}
          </svg>

          {/* GPS Pins */}
          {MOCK_PINS.map(pin => {
            const isSelected = selectedStreet?.id === pin.id;
            const isHovered = hoveredPin === pin.id;
            const street = MOCK_STREETS.find(s => s.id === pin.id);
            return (
              <div
                key={pin.id}
                className="absolute transition-all duration-150"
                style={{
                  left: `${pin.x}%`, top: `${pin.y}%`,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer',
                  zIndex: isSelected || isHovered ? 25 : 12,
                }}
                onMouseEnter={() => setHoveredPin(pin.id)}
                onMouseLeave={() => setHoveredPin(null)}
                onClick={e => {
                  e.stopPropagation();
                  if (street) handleSelectStreet(street);
                }}
              >
                {/* Outer ring on hover/select */}
                {(isSelected || isHovered) && (
                  <div
                    className="absolute rounded-full"
                    style={{
                      width: 28, height: 28,
                      top: '50%', left: '50%',
                      transform: 'translate(-50%, -50%)',
                      background: `${STATUS_COLOR[pin.status]}18`,
                      border: `1.5px solid ${STATUS_COLOR[pin.status]}50`,
                    }}
                  />
                )}
                {/* Main dot */}
                <div
                  className="rounded-full border-2 border-white"
                  style={{
                    width: isSelected ? 14 : isHovered ? 12 : 9,
                    height: isSelected ? 14 : isHovered ? 12 : 9,
                    background: STATUS_COLOR[pin.status],
                    boxShadow: `0 0 ${isSelected ? 16 : isHovered ? 12 : 6}px ${STATUS_COLOR[pin.status]}`,
                    transition: 'all 0.15s ease',
                  }}
                />
                {/* Label tooltip */}
                {(isHovered || isSelected) && street && (
                  <div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg whitespace-nowrap"
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      fontSize: 11,
                      color: '#0f172a',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                      pointerEvents: 'none',
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 2, color: '#0f172a' }}>{street.streetName}</div>
                    <div style={{ color: '#64748b', fontSize: 10 }}>W{street.wardNo} · {STATUS_COLOR[pin.status] === '#22c55e' ? '✓ Mapped' : pin.status}</div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Captured edit points */}
          {selectedStreet && mode === 'edit' && (['start', 'mid', 'end'] as const).map(step => {
            const pt = capturedPoints[step];
            if (!pt) return null;
            return (
              <div
                key={step}
                className="absolute flex items-center justify-center rounded-full border-2 border-white"
                style={{
                  left: `${pt.x}%`, top: `${pt.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 20, height: 20,
                  background: POINT_COLORS[step],
                  boxShadow: `0 0 20px ${POINT_COLORS[step]}, 0 0 6px rgba(255,255,255,0.4)`,
                  zIndex: 35,
                }}
              >
                <span style={{ fontSize: 9, fontWeight: 800, color: '#fff' }}>{step[0].toUpperCase()}</span>
              </div>
            );
          })}

          {/* Line between captured points */}
          {selectedStreet && mode === 'edit' && capturedPoints.start && capturedPoints.mid && (
            <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none', zIndex: 30 }}>
              <line
                x1={`${capturedPoints.start.x}%`} y1={`${capturedPoints.start.y}%`}
                x2={`${capturedPoints.mid.x}%`} y2={`${capturedPoints.mid.y}%`}
                stroke="#22c55e" strokeWidth="2" strokeDasharray="6,4"
              />
              {capturedPoints.end && (
                <line
                  x1={`${capturedPoints.mid.x}%`} y1={`${capturedPoints.mid.y}%`}
                  x2={`${capturedPoints.end.x}%`} y2={`${capturedPoints.end.y}%`}
                  stroke="#ef4444" strokeWidth="2" strokeDasharray="6,4"
                />
              )}
            </svg>
          )}

          {/* Click ripple effect */}
          {clickEffect && (
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                left: `${clickEffect.x}%`, top: `${clickEffect.y}%`,
                transform: 'translate(-50%, -50%)',
                width: 40, height: 40,
                border: `2px solid ${POINT_COLORS[pointStep === 'done' ? 'end' : pointStep]}`,
                animation: 'ripple 0.6s ease-out forwards',
                zIndex: 40,
              }}
            />
          )}
          <style>{`
            @keyframes ripple {
              0% { transform: translate(-50%, -50%) scale(0.3); opacity: 1; }
              100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
            }
          `}</style>

          {/* Instruction hint */}
          {mode === 'edit' && selectedStreet && pointStep !== 'done' && (
            <div
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2.5 rounded-2xl z-30"
              style={{
                background: 'rgba(6,13,31,0.94)',
                border: `1px solid ${POINT_COLORS[pointStep]}50`,
                backdropFilter: 'blur(12px)',
                boxShadow: `0 0 20px ${POINT_COLORS[pointStep]}20`,
              }}
            >
              <Crosshair size={13} style={{ color: POINT_COLORS[pointStep] }} />
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                Tap map to place&nbsp;
                <span style={{ color: POINT_COLORS[pointStep], fontWeight: 700 }}>
                  {pointStep.toUpperCase()}
                </span>
                &nbsp;point
              </span>
            </div>
          )}

          {/* Saved flash notification */}
          {savedFlash && (
            <div
              className="absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-xl z-50"
              style={{
                background: 'rgba(34,197,94,0.15)',
                border: '1px solid rgba(34,197,94,0.4)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <CheckCircle2 size={14} style={{ color: '#22c55e' }} />
              <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 700 }}>GPS Points Saved!</span>
            </div>
          )}

          {/* ─── Floating Map Controls (right) ─── */}
          <div className="absolute right-4 z-20" style={{ top: '50%', transform: 'translateY(-50%)' }}>
            <div className="flex flex-col gap-2">
              {/* Map type toggle */}
              <button
                onClick={() => setMapType(mapType === 'satellite' ? 'street' : 'satellite')}
                className="flex items-center justify-center rounded-xl hover:scale-110 transition-all"
                title={mapType === 'satellite' ? 'Switch to Street Map' : 'Switch to Satellite'}
                style={{
                  width: 38, height: 38,
                  background: mapType === 'satellite' ? '#f5f3ff' : '#eff6ff',
                  border: `1px solid ${mapType === 'satellite' ? '#ddd6fe' : '#bfdbfe'}`,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  color: mapType === 'satellite' ? '#7c3aed' : '#2563eb',
                }}
              >
                {mapType === 'satellite' ? <Satellite size={16} /> : <MapIcon size={16} />}
              </button>

              {/* Locate me */}
              <button
                className="flex items-center justify-center rounded-xl hover:scale-110 transition-all"
                title="Locate Me"
                style={{
                  width: 38, height: 38,
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  color: '#2563eb',
                }}
              >
                <LocateFixed size={16} />
              </button>

              <div className="w-full h-px" style={{ background: '#e2e8f0' }} />

              {/* Zoom */}
              {[ZoomIn, ZoomOut].map((Icon, i) => (
                <button
                  key={i}
                  className="flex items-center justify-center rounded-xl hover:bg-slate-100 transition-all"
                  style={{
                    width: 38, height: 38,
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    color: '#64748b',
                  }}
                >
                  <Icon size={16} />
                </button>
              ))}

              {/* Layers */}
              <button
                className="flex items-center justify-center rounded-xl hover:bg-slate-100 transition-all"
                style={{
                  width: 38, height: 38,
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  color: '#64748b',
                }}
              >
                <Layers size={15} />
              </button>
            </div>
          </div>

          {/* Coord search */}
          <div className="absolute bottom-5 right-16 z-20">
            <div className="relative flex items-center">
              <Navigation size={12} className="absolute left-2.5" style={{ color: '#475569' }} />
              <input
                type="text"
                placeholder="11.9416, 79.8083"
                value={coordSearch}
                onChange={e => setCoordSearch(e.target.value)}
                className="pl-7 pr-3 py-1.5 rounded-xl outline-none"
                style={{
                  background: 'rgba(6,13,31,0.88)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(8px)',
                  color: '#e2e8f0',
                  fontSize: 11,
                  width: 168,
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Right Info Panel ─── */}
      {showInfo && selectedStreet && (
        <aside
          className="flex flex-col h-full shrink-0 overflow-hidden"
          style={{
            width: 296,
            background: '#ffffff',
            borderLeft: '1px solid #e2e8f0',
            boxShadow: '-2px 0 8px rgba(0,0,0,0.04)',
          }}
        >
          {/* Panel Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ borderBottom: '1px solid #f1f5f9', minHeight: 52 }}
          >
            <div className="flex items-center gap-2">
              <div
                className="flex items-center justify-center rounded-lg"
                style={{ width: 28, height: 28, background: '#eff6ff', border: '1px solid #bfdbfe' }}
              >
                <Info size={13} style={{ color: '#2563eb' }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>GPS Info</span>
              {mode === 'edit' && (
                <div
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}
                >
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
                  <span style={{ fontSize: 9, color: '#22c55e', fontWeight: 700 }}>EDITING</span>
                </div>
              )}
            </div>
            <button
              onClick={() => { setShowInfo(false); setSelectedStreet(null); setMode('view'); setCapturedPoints({}); }}
              className="p-1.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <X size={14} style={{ color: '#94a3b8' }} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Street Details Card */}
            <div
              className="p-3 rounded-xl"
              style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                {selectedStreet.streetName}
              </div>
              {[
                ['Ward', `${selectedStreet.wardNo} — ${selectedStreet.wardName}`],
                ['Municipality', selectedStreet.municipality],
                ['Constituency', selectedStreet.constituency],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-0.5">
                  <span style={{ fontSize: 11, color: '#475569' }}>{k}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Status Badge */}
            <div
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl"
              style={{
                background: STATUS_BG[selectedStreet.status],
                border: `1px solid ${STATUS_COLOR[selectedStreet.status]}30`,
              }}
            >
              {selectedStreet.status === 'complete'
                ? <CheckCircle2 size={14} style={{ color: STATUS_COLOR[selectedStreet.status] }} />
                : selectedStreet.status === 'partial'
                  ? <AlertCircle size={14} style={{ color: STATUS_COLOR[selectedStreet.status] }} />
                  : <Clock size={14} style={{ color: STATUS_COLOR[selectedStreet.status] }} />
              }
              <span style={{
                fontSize: 12, fontWeight: 700,
                color: STATUS_COLOR[selectedStreet.status],
                textTransform: 'uppercase', letterSpacing: 1,
              }}>
                {selectedStreet.status === 'complete' ? 'Fully Mapped' : selectedStreet.status === 'partial' ? 'Partially Mapped' : 'Not Started'}
              </span>
            </div>

            {/* Step Indicator */}
            {mode === 'edit' && (
              <div>
                <div style={{ fontSize: 10, color: '#475569', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Capture Progress
                </div>
                <div className="flex items-center gap-1">
                  {(['start', 'mid', 'end'] as const).map((step, i) => {
                    const isDone = (pointStep === 'mid' && i === 0) ||
                      (pointStep === 'end' && i <= 1) ||
                      pointStep === 'done' ||
                      (step in capturedPoints);
                    const isCurrent = step === pointStep && pointStep !== 'done';
                    return (
                      <>
                        <div key={step} className="flex-1 flex flex-col items-center gap-1.5">
                          <div
                            className="flex items-center justify-center rounded-full border-2 transition-all"
                            style={{
                              width: 32, height: 32,
                              background: isDone || isCurrent ? `${POINT_COLORS[step]}15` : '#f8fafc',
                              borderColor: isDone ? POINT_COLORS[step] : isCurrent ? POINT_COLORS[step] : '#e2e8f0',
                              boxShadow: isCurrent ? `0 0 12px ${POINT_COLORS[step]}40` : 'none',
                            }}
                          >
                            {isDone
                              ? <Check size={14} style={{ color: POINT_COLORS[step] }} />
                              : <span style={{ fontSize: 10, fontWeight: 800, color: isCurrent ? POINT_COLORS[step] : '#94a3b8' }}>
                                {step[0].toUpperCase()}
                              </span>
                            }
                          </div>
                          <span style={{ fontSize: 9, color: isCurrent ? POINT_COLORS[step] : isDone ? POINT_COLORS[step] : '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {step}
                          </span>
                        </div>
                        {i < 2 && (
                          <div
                            className="h-px flex-1 mb-4"
                            style={{ background: i === 0 && (isDone) ? POINT_COLORS.start : 'rgba(255,255,255,0.1)' }}
                          />
                        )}
                      </>
                    );
                  })}
                </div>
              </div>
            )}

            {/* GPS Coordinates */}
            <div>
              <div style={{ fontSize: 10, color: '#475569', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Coordinates
              </div>
              {[
                { label: 'START', lat: selectedStreet.startLat, lon: selectedStreet.startLon, color: POINT_COLORS.start, captured: !!capturedPoints.start },
                { label: 'MID', lat: selectedStreet.midLat, lon: selectedStreet.midLon, color: POINT_COLORS.mid, captured: !!capturedPoints.mid },
                { label: 'END', lat: selectedStreet.endLat, lon: selectedStreet.endLon, color: POINT_COLORS.end, captured: !!capturedPoints.end },
              ].map(({ label, lat, lon, color, captured }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 p-2.5 rounded-lg mb-2 transition-all"
                  style={{
                    background: captured ? `${color}10` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${captured ? color + '30' : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <div
                    className="flex items-center justify-center rounded-full shrink-0"
                    style={{ width: 22, height: 22, background: `${color}20`, border: `1px solid ${color}40` }}
                  >
                    <span style={{ fontSize: 8, fontWeight: 800, color }}>{label[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 9, color: '#475569', marginBottom: 1 }}>{label}</div>
                    {captured ? (
                      <div style={{ fontSize: 10, color, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>
                        {mockCoord(11.9416, Math.random())}, {mockCoord(79.8083, Math.random())}
                      </div>
                    ) : lat && lon ? (
                      <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: "'IBM Plex Mono', monospace" }}>
                        {lat.toFixed(6)}, {lon.toFixed(6)}
                      </div>
                    ) : (
                      <div style={{ fontSize: 10, color: '#334155' }}>Not captured</div>
                    )}
                  </div>
                  {(captured || (lat && lon)) && (
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                  )}
                </div>
              ))}
            </div>

            {/* Distances */}
            <div>
              <div style={{ fontSize: 10, color: '#475569', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Distances
              </div>
              {[
                { label: 'S → M', val: distSM, color: '#22c55e' },
                { label: 'M → E', val: distME, color: '#f59e0b' },
                { label: 'Total', val: totalDist, color: '#60a5fa', bold: true },
              ].map(({ label, val, color, bold }) => (
                <div
                  key={label}
                  className="flex items-center justify-between p-2.5 rounded-lg mb-1.5"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <span style={{ fontSize: 11, color: '#475569' }}>{label}</span>
                  <span style={{
                    fontSize: bold ? 14 : 12,
                    fontWeight: bold ? 800 : 600,
                    color: val ? color : '#334155',
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}>
                    {val ? `${val.toFixed(1)} m` : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div
            className="p-4 space-y-2 shrink-0"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            {/* Save button */}
            {pointStep === 'done' && (
              <button
                onClick={() => setShowConfirm(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all hover:scale-[1.02]"
                style={{
                  background: 'linear-gradient(135deg, rgba(34,197,94,0.7), rgba(22,163,74,0.7))',
                  border: '1px solid rgba(34,197,94,0.4)',
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  boxShadow: '0 0 24px rgba(34,197,94,0.2)',
                }}
              >
                <Save size={15} /> Save GPS Points
              </button>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleUndo}
                disabled={pointStep === 'start' && !capturedPoints.start}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#94a3b8', fontSize: 13, fontWeight: 600,
                  opacity: (pointStep === 'start' && !capturedPoints.start) ? 0.35 : 1,
                }}
              >
                <Undo2 size={14} /> Undo
              </button>
              <button
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl transition-all hover:bg-red-500/20"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#ef4444', fontSize: 13, fontWeight: 600,
                }}
                onClick={() => { setCapturedPoints({}); setPointStep('start'); }}
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Toggle edit/view */}
            <button
              onClick={() => setMode(mode === 'edit' ? 'view' : 'edit')}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl transition-all"
              style={{
                background: mode === 'edit' ? 'rgba(37,99,235,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${mode === 'edit' ? 'rgba(37,99,235,0.3)' : 'rgba(255,255,255,0.08)'}`,
                color: mode === 'edit' ? '#60a5fa' : '#475569',
                fontSize: 12, fontWeight: 600,
              }}
            >
              {mode === 'edit' ? <><Eye size={13} /> View Mode</> : <><Edit3 size={13} /> Edit Mode</>}
            </button>
          </div>
        </aside>
      )}

      {/* Confirm Save Modal */}
      {showConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div
            className="rounded-2xl p-6 w-80"
            style={{
              background: 'rgba(10,22,45,0.98)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center rounded-xl" style={{ width: 40, height: 40, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                <Save size={18} style={{ color: '#22c55e' }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>Save GPS Points?</div>
                <div style={{ fontSize: 12, color: '#475569' }}>This will overwrite existing data</div>
              </div>
            </div>
            <div
              className="p-3 rounded-xl mb-4"
              style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)' }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>
                {selectedStreet?.streetName}
              </div>
              <div style={{ fontSize: 11, color: '#475569' }}>3 GPS points captured · {totalDist?.toFixed(0) ?? 'N/A'}m total</div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 rounded-xl"
                style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)', color: '#22c55e', fontSize: 13, fontWeight: 700 }}
              >
                <Check size={14} className="inline mr-1" /> Confirm Save
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#475569', fontSize: 13 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}