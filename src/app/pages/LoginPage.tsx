import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Radio, Eye, EyeOff, MapPin, Shield, Users, Layers } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', fullName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const FEATURES = [
    { icon: MapPin, label: '4,052 Streets', sub: 'Pondicherry & Oulgaret', color: '#00d4ff' },
    { icon: Layers, label: 'Ward Filters', sub: '12 wards pre-loaded', color: '#8b5cf6' },
    { icon: Shield, label: 'Role-Based Access', sub: 'Admin & Field teams', color: '#10b981' },
    { icon: Users, label: 'Team Groups', sub: 'Collaborative mapping', color: '#f59e0b' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      if (!form.username || !form.password) {
        setError('Please fill in all fields.');
        setLoading(false);
        return;
      }
      if (mode === 'login' && form.password.length < 4) {
        setError('Invalid credentials. Try demo / demo1234');
        setLoading(false);
        return;
      }
      const role = form.username.toLowerCase() === 'admin' ? 'admin' : 'user';
      localStorage.setItem('gps_user', JSON.stringify({
        username: form.username,
        fullName: mode === 'register' ? form.fullName : (form.username === 'admin' ? 'Super Admin' : 'Field User'),
        role,
      }));
      navigate('/dashboard');
    }, 800);
  };

  return (
    <div
      className="min-h-screen w-full flex"
      style={{ background: '#060d1f', fontFamily: "'IBM Plex Sans', sans-serif" }}
    >
      {/* Left Panel — Branding */}
      <div
        className="hidden lg:flex flex-col justify-between flex-1 p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #060d1f 0%, #0a1628 50%, #071020 100%)' }}
      >
        {/* Background map grid */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,212,255,0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,212,255,0.4) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        {/* Radial glow */}
        <div
          className="absolute"
          style={{
            width: 500, height: 500,
            top: '30%', left: '40%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Animated street dots */}
        {[
          { top: '35%', left: '30%', color: '#10b981' },
          { top: '45%', left: '55%', color: '#10b981' },
          { top: '60%', left: '40%', color: '#f59e0b' },
          { top: '25%', left: '65%', color: '#10b981' },
          { top: '70%', left: '60%', color: '#ef4444' },
          { top: '50%', left: '25%', color: '#10b981' },
          { top: '40%', left: '70%', color: '#f59e0b' },
        ].map((dot, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              top: dot.top, left: dot.left,
              width: 10, height: 10,
              background: dot.color,
              boxShadow: `0 0 12px ${dot.color}`,
              opacity: 0.8,
            }}
          />
        ))}

        {/* SVG street lines mock */}
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 800 600" preserveAspectRatio="none">
          <line x1="0" y1="200" x2="800" y2="180" stroke="#00d4ff" strokeWidth="1.5" />
          <line x1="0" y1="320" x2="800" y2="340" stroke="#00d4ff" strokeWidth="1.5" />
          <line x1="0" y1="440" x2="800" y2="420" stroke="#00d4ff" strokeWidth="1" />
          <line x1="150" y1="0" x2="180" y2="600" stroke="#00d4ff" strokeWidth="1.5" />
          <line x1="350" y1="0" x2="340" y2="600" stroke="#00d4ff" strokeWidth="1.5" />
          <line x1="570" y1="0" x2="600" y2="600" stroke="#00d4ff" strokeWidth="1" />
          <line x1="720" y1="0" x2="700" y2="600" stroke="#00d4ff" strokeWidth="1" />
        </svg>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div
              className="flex items-center justify-center rounded-2xl"
              style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #00d4ff, #0066ff)' }}
            >
              <Radio size={28} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#00d4ff', letterSpacing: 1 }}>
                STREET GPS MAPPER
              </div>
              <div style={{ fontSize: 12, color: '#475569', letterSpacing: 3, textTransform: 'uppercase' }}>
                Pondicherry Municipality Survey
              </div>
            </div>
          </div>
        </div>

        {/* Center text */}
        <div className="relative z-10">
          <h1 style={{ fontSize: 48, fontWeight: 800, color: '#e2e8f0', lineHeight: 1.2, marginBottom: 16 }}>
            Map Every Street.
            <br />
            <span style={{ color: '#00d4ff' }}>Capture Every Point.</span>
          </h1>
          <p style={{ fontSize: 16, color: '#64748b', maxWidth: 480, lineHeight: 1.7 }}>
            A professional field data collection platform for GPS coordinate mapping of all streets across Pondicherry and Oulgaret municipalities.
          </p>
        </div>

        {/* Feature cards */}
        <div className="relative z-10 grid grid-cols-2 gap-3">
          {FEATURES.map(({ icon: Icon, label, sub, color }) => (
            <div
              key={label}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div
                className="flex items-center justify-center rounded-lg shrink-0"
                style={{ width: 36, height: 36, background: `${color}18` }}
              >
                <Icon size={16} style={{ color }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{label}</div>
                <div style={{ fontSize: 11, color: '#475569' }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div
        className="flex items-center justify-center w-full lg:w-[480px] p-8"
        style={{ background: 'rgba(255,255,255,0.02)', borderLeft: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div
              className="flex items-center justify-center rounded-xl"
              style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #00d4ff, #0066ff)' }}
            >
              <Radio size={22} color="#fff" />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#00d4ff' }}>GPS MAPPER</div>
          </div>

          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p style={{ fontSize: 14, color: '#475569', marginBottom: 32 }}>
            {mode === 'login' ? 'Sign in to your field survey account' : 'Set up your admin credentials'}
          </p>

          {/* Mode toggle */}
          <div
            className="flex p-1 rounded-xl mb-8"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className="flex-1 py-2 rounded-lg transition-all duration-200"
                style={{
                  fontSize: 13, fontWeight: 600,
                  background: mode === m ? 'rgba(0,212,255,0.15)' : 'transparent',
                  color: mode === m ? '#00d4ff' : '#475569',
                  border: mode === m ? '1px solid rgba(0,212,255,0.3)' : '1px solid transparent',
                }}
              >
                {m === 'login' ? 'Sign In' : 'Create Admin'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#e2e8f0',
                    fontSize: 14,
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'rgba(0,212,255,0.5)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Username
              </label>
              <input
                type="text"
                placeholder="e.g. admin"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#e2e8f0',
                  fontSize: 14,
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(0,212,255,0.5)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 pr-12 rounded-xl outline-none transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#e2e8f0',
                    fontSize: 14,
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = 'rgba(0,212,255,0.5)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff size={16} color="#475569" /> : <Eye size={16} color="#475569" />}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <span style={{ fontSize: 13, color: '#ef4444' }}>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl transition-all duration-200 mt-2"
              style={{
                background: loading ? 'rgba(0,212,255,0.3)' : 'linear-gradient(135deg, #00d4ff, #0066ff)',
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: 0.5,
                cursor: loading ? 'wait' : 'pointer',
                boxShadow: loading ? 'none' : '0 0 24px rgba(0,212,255,0.3)',
              }}
            >
              {loading ? 'Authenticating...' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>

          <p style={{ fontSize: 12, color: '#334155', textAlign: 'center', marginTop: 24 }}>
            Demo: username <span style={{ color: '#00d4ff', fontFamily: 'monospace' }}>admin</span> / any password 4+ chars
          </p>
        </div>
      </div>
    </div>
  );
}
