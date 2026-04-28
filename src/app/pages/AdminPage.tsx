import { useState } from 'react';
import {
  Users, Shield, Map, Plus, Trash2, Edit2,
  Check, X, Search, RefreshCw, UserCheck,
  Settings, ChevronDown, AlertCircle,
} from 'lucide-react';
import { MOCK_USERS, MOCK_GROUPS, WARDS, User, Group } from '../data/mockData';

type Tab = 'users' | 'groups' | 'ward-access';

const ROLE_COLOR: Record<string, string> = {
  admin: '#f59e0b',
  user: '#00d4ff',
};

const ROLE_BG: Record<string, string> = {
  admin: 'rgba(245,158,11,0.12)',
  user: 'rgba(0,212,255,0.1)',
};

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [groups, setGroups] = useState<Group[]>(MOCK_GROUPS);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newGroup, setNewGroup] = useState('');
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>('g1');
  const [wardAccess, setWardAccess] = useState<Record<string, string[]>>({
    g1: ['1', '2', '3', '4'],
    g2: ['5', '6', '7', '8'],
    g3: ['9', '10', '11', '12'],
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', fullName: '', role: 'user', groupId: 'g1' });

  const filteredUsers = users.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
    setDeleteConfirm(null);
  };

  const handleAddGroup = () => {
    if (!newGroup.trim()) return;
    const id = `g${Date.now()}`;
    setGroups([...groups, {
      id,
      name: newGroup.trim(),
      memberCount: 0,
      wardCount: 0,
      createdAt: new Date().toISOString(),
    }]);
    setWardAccess({ ...wardAccess, [id]: [] });
    setNewGroup('');
    setShowNewGroup(false);
  };

  const toggleWard = (wardNo: string) => {
    const current = wardAccess[selectedGroup] || [];
    if (current.includes(wardNo)) {
      setWardAccess({ ...wardAccess, [selectedGroup]: current.filter(w => w !== wardNo) });
    } else {
      setWardAccess({ ...wardAccess, [selectedGroup]: [...current, wardNo] });
    }
  };

  const handleAddUser = () => {
    if (!newUser.username || !newUser.fullName) return;
    const group = groups.find(g => g.id === newUser.groupId);
    setUsers([...users, {
      id: `u${Date.now()}`,
      username: newUser.username,
      fullName: newUser.fullName,
      role: newUser.role as 'admin' | 'user',
      groupId: newUser.groupId,
      groupName: group?.name,
      createdAt: new Date().toISOString(),
    }]);
    setNewUser({ username: '', fullName: '', role: 'user', groupId: 'g1' });
    setShowAddUser(false);
  };

  const TABS: { id: Tab; label: string; icon: typeof Users; color: string }[] = [
    { id: 'users', label: 'Users', icon: Users, color: '#00d4ff' },
    { id: 'groups', label: 'Groups', icon: Shield, color: '#8b5cf6' },
    { id: 'ward-access', label: 'Ward Access', icon: Map, color: '#10b981' },
  ];

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
            style={{ width: 40, height: 40, background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.2)' }}
          >
            <Settings size={18} style={{ color: '#94a3b8' }} />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>Admin Panel</h2>
            <p style={{ fontSize: 12, color: '#475569' }}>Manage users, groups, and ward access permissions</p>
          </div>
        </div>

        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}
        >
          <Shield size={12} style={{ color: '#f59e0b' }} />
          <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700 }}>ADMIN ACCESS</span>
        </div>
      </div>

      {/* Tab Bar */}
      <div
        className="flex items-center gap-1 px-6 py-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        {TABS.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200"
            style={{
              background: tab === id ? `${color}15` : 'transparent',
              border: tab === id ? `1px solid ${color}35` : '1px solid transparent',
              color: tab === id ? color : '#475569',
              fontSize: 13, fontWeight: 600,
            }}
          >
            <Icon size={14} />
            {label}
            {id === 'users' && (
              <span
                className="px-1.5 py-0.5 rounded-full"
                style={{
                  background: tab === id ? `${color}20` : 'rgba(255,255,255,0.06)',
                  color: tab === id ? color : '#475569',
                  fontSize: 10, fontWeight: 700,
                }}
              >
                {users.length}
              </span>
            )}
            {id === 'groups' && (
              <span
                className="px-1.5 py-0.5 rounded-full"
                style={{
                  background: tab === id ? `${color}20` : 'rgba(255,255,255,0.06)',
                  color: tab === id ? color : '#475569',
                  fontSize: 10, fontWeight: 700,
                }}
              >
                {groups.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">

        {/* ─── USERS TAB ─── */}
        {tab === 'users' && (
          <div className="h-full flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div
              className="flex items-center justify-between px-6 py-3 shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-xl outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#e2e8f0',
                    fontSize: 13,
                    width: 260,
                  }}
                />
              </div>

              <button
                onClick={() => setShowAddUser(!showAddUser)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,212,255,0.6), rgba(0,100,255,0.6))',
                  border: '1px solid rgba(0,212,255,0.4)',
                  color: '#fff',
                  fontSize: 13, fontWeight: 700,
                  boxShadow: '0 0 16px rgba(0,212,255,0.15)',
                }}
              >
                <Plus size={14} /> Add User
              </button>
            </div>

            {/* Add User Form */}
            {showAddUser && (
              <div
                className="mx-6 mt-4 p-4 rounded-2xl shrink-0"
                style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.2)' }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: '#00d4ff', marginBottom: 12 }}>New User</div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {[
                    { label: 'Full Name', key: 'fullName', placeholder: 'e.g. Rajan Kumar' },
                    { label: 'Username', key: 'username', placeholder: 'e.g. rajan_k', mono: true },
                  ].map(({ label, key, placeholder, mono }) => (
                    <div key={key}>
                      <label style={{ display: 'block', fontSize: 11, color: '#475569', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {label}
                      </label>
                      <input
                        type="text"
                        placeholder={placeholder}
                        value={newUser[key as keyof typeof newUser]}
                        onChange={e => setNewUser({ ...newUser, [key]: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg outline-none"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#e2e8f0',
                          fontSize: 13,
                          fontFamily: mono ? "'IBM Plex Mono', monospace" : undefined,
                        }}
                      />
                    </div>
                  ))}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#475569', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Role
                    </label>
                    <select
                      value={newUser.role}
                      onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 13 }}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#475569', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Group
                    </label>
                    <select
                      value={newUser.groupId}
                      onChange={e => setNewUser({ ...newUser, groupId: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 13 }}
                    >
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddUser}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg"
                    style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', fontSize: 12, fontWeight: 700 }}
                  >
                    <Check size={13} /> Create User
                  </button>
                  <button
                    onClick={() => setShowAddUser(false)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#475569', fontSize: 12 }}
                  >
                    <X size={13} /> Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Users Table */}
            <div className="flex-1 overflow-y-auto px-6 pb-4" style={{ marginTop: showAddUser ? 0 : 4 }}>
              <table className="w-full mt-3" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr>
                    {['User', 'Username', 'Role', 'Group', 'Created', 'Actions'].map(h => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-left"
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#475569',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          borderBottom: '1px solid rgba(255,255,255,0.07)',
                          position: 'sticky',
                          top: 0,
                          background: 'rgba(6,13,31,0.98)',
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
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="group transition-colors"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex items-center justify-center rounded-full shrink-0"
                            style={{
                              width: 32, height: 32,
                              background: ROLE_BG[user.role],
                              border: `1px solid ${ROLE_COLOR[user.role]}30`,
                            }}
                          >
                            <span style={{ fontSize: 12, fontWeight: 700, color: ROLE_COLOR[user.role] }}>
                              {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{user.fullName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span style={{ fontSize: 12, color: '#64748b', fontFamily: "'IBM Plex Mono', monospace" }}>
                          {user.username}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit"
                          style={{
                            background: ROLE_BG[user.role],
                            border: `1px solid ${ROLE_COLOR[user.role]}30`,
                          }}
                        >
                          {user.role === 'admin' ? <Shield size={10} style={{ color: ROLE_COLOR[user.role] }} /> : <UserCheck size={10} style={{ color: ROLE_COLOR[user.role] }} />}
                          <span style={{ fontSize: 10, fontWeight: 700, color: ROLE_COLOR[user.role], textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {user.role}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {user.groupName ? (
                          <span style={{ fontSize: 12, color: '#8b5cf6' }}>{user.groupName}</span>
                        ) : (
                          <span style={{ fontSize: 12, color: '#334155' }}>—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span style={{ fontSize: 11, color: '#475569', fontFamily: "'IBM Plex Mono', monospace" }}>
                          {new Date(user.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {deleteConfirm === user.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
                              style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 11, fontWeight: 700 }}
                            >
                              <Check size={11} /> Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2.5 py-1 rounded-lg"
                              style={{ background: 'rgba(255,255,255,0.06)', color: '#475569', fontSize: 11 }}
                            >
                              <X size={11} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={13} style={{ color: '#64748b' }} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(user.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={13} style={{ color: '#64748b' }} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16" style={{ color: '#334155' }}>
                  <AlertCircle size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <div style={{ fontSize: 14 }}>No users found</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── GROUPS TAB ─── */}
        {tab === 'groups' && (
          <div className="h-full flex flex-col overflow-hidden p-6">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>Field Groups</div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Organise field teams and assign ward responsibilities</div>
              </div>
              <button
                onClick={() => setShowNewGroup(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all"
                style={{
                  background: 'rgba(139,92,246,0.15)',
                  border: '1px solid rgba(139,92,246,0.3)',
                  color: '#8b5cf6',
                  fontSize: 13, fontWeight: 700,
                }}
              >
                <Plus size={14} /> New Group
              </button>
            </div>

            {showNewGroup && (
              <div
                className="flex items-center gap-3 p-4 rounded-2xl mb-4 shrink-0"
                style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}
              >
                <input
                  type="text"
                  placeholder="Group name e.g. Field Team Delta"
                  value={newGroup}
                  onChange={e => setNewGroup(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#e2e8f0',
                    fontSize: 13,
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleAddGroup()}
                />
                <button
                  onClick={handleAddGroup}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl"
                  style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.35)', color: '#8b5cf6', fontSize: 13, fontWeight: 700 }}
                >
                  <Check size={14} /> Create
                </button>
                <button
                  onClick={() => setShowNewGroup(false)}
                  className="p-2 rounded-xl hover:bg-white/10"
                >
                  <X size={14} style={{ color: '#475569' }} />
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {groups.map((group) => {
                  const groupUsers = users.filter(u => u.groupId === group.id);
                  const wardCount = (wardAccess[group.id] || []).length;
                  return (
                    <div
                      key={group.id}
                      className="p-5 rounded-2xl"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex items-center justify-center rounded-xl"
                            style={{ width: 40, height: 40, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}
                          >
                            <Shield size={18} style={{ color: '#8b5cf6' }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>{group.name}</div>
                            <div style={{ fontSize: 11, color: '#475569' }}>
                              Created {new Date(group.createdAt).toLocaleDateString('en-IN')}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                            <Edit2 size={12} style={{ color: '#64748b' }} />
                          </button>
                          <button className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors">
                            <Trash2 size={12} style={{ color: '#64748b' }} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {[
                          { label: 'Members', val: groupUsers.length, color: '#00d4ff' },
                          { label: 'Wards', val: wardCount, color: '#10b981' },
                        ].map(({ label, val, color }) => (
                          <div
                            key={label}
                            className="p-3 rounded-xl text-center"
                            style={{ background: `${color}10`, border: `1px solid ${color}20` }}
                          >
                            <div style={{ fontSize: 22, fontWeight: 800, color }}>{val}</div>
                            <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Member list */}
                      {groupUsers.length > 0 ? (
                        <div className="space-y-2">
                          {groupUsers.map(u => (
                            <div
                              key={u.id}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg"
                              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                            >
                              <div
                                className="flex items-center justify-center rounded-full shrink-0"
                                style={{ width: 24, height: 24, background: ROLE_BG[u.role], border: `1px solid ${ROLE_COLOR[u.role]}30` }}
                              >
                                <span style={{ fontSize: 9, fontWeight: 800, color: ROLE_COLOR[u.role] }}>
                                  {u.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 500 }}>{u.fullName}</div>
                              </div>
                              <span
                                className="px-1.5 py-0.5 rounded-full"
                                style={{
                                  background: ROLE_BG[u.role],
                                  color: ROLE_COLOR[u.role],
                                  fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                                }}
                              >
                                {u.role}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-4 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.06)' }}>
                          <span style={{ fontSize: 12, color: '#334155' }}>No members yet</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── WARD ACCESS TAB ─── */}
        {tab === 'ward-access' && (
          <div className="h-full flex overflow-hidden">
            {/* Left: Groups */}
            <div
              className="flex flex-col shrink-0 p-4"
              style={{ width: 260, borderRight: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                Select Group
              </div>
              <div className="space-y-2">
                {groups.map(group => {
                  const wardCount = (wardAccess[group.id] || []).length;
                  return (
                    <button
                      key={group.id}
                      onClick={() => setSelectedGroup(group.id)}
                      className="w-full text-left p-3 rounded-xl transition-all"
                      style={{
                        background: selectedGroup === group.id ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                        border: selectedGroup === group.id ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, color: selectedGroup === group.id ? '#10b981' : '#94a3b8', marginBottom: 3 }}>
                        {group.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#475569' }}>
                        {wardCount} of {Object.keys(WARDS).length} wards assigned
                      </div>
                      {/* Mini progress */}
                      <div className="mt-2 rounded-full overflow-hidden" style={{ height: 3, background: 'rgba(255,255,255,0.07)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(wardCount / Object.keys(WARDS).length) * 100}%`,
                            background: selectedGroup === group.id ? '#10b981' : '#334155',
                          }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Ward checkboxes */}
            <div className="flex-1 flex flex-col overflow-hidden p-5">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>
                    Ward Access — {groups.find(g => g.id === selectedGroup)?.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                    {(wardAccess[selectedGroup] || []).length} wards assigned
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setWardAccess({ ...wardAccess, [selectedGroup]: Object.keys(WARDS) })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', fontWeight: 600 }}
                  >
                    <Check size={12} /> Select All
                  </button>
                  <button
                    onClick={() => setWardAccess({ ...wardAccess, [selectedGroup]: [] })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontWeight: 600 }}
                  >
                    <X size={12} /> Clear All
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                  {Object.entries(WARDS).map(([wardNo, wardName]) => {
                    const assigned = (wardAccess[selectedGroup] || []).includes(wardNo);
                    return (
                      <button
                        key={wardNo}
                        onClick={() => toggleWard(wardNo)}
                        className="flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-150"
                        style={{
                          background: assigned ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                          border: assigned ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.07)',
                        }}
                      >
                        <div
                          className="flex items-center justify-center rounded-lg shrink-0"
                          style={{
                            width: 32, height: 32,
                            background: assigned ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                            border: assigned ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.08)',
                          }}
                        >
                          {assigned ? (
                            <Check size={14} style={{ color: '#10b981' }} />
                          ) : (
                            <span style={{ fontSize: 10, color: '#475569', fontWeight: 700 }}>W{wardNo}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div style={{ fontSize: 13, fontWeight: 600, color: assigned ? '#10b981' : '#94a3b8' }}>
                            {wardName}
                          </div>
                          <div style={{ fontSize: 10, color: '#475569' }}>Ward {wardNo}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Save button */}
              <div className="mt-4 flex justify-end shrink-0">
                <button
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all"
                  style={{
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.7), rgba(5,150,105,0.7))',
                    border: '1px solid rgba(16,185,129,0.4)',
                    color: '#fff',
                    fontSize: 13, fontWeight: 700,
                    boxShadow: '0 0 20px rgba(16,185,129,0.15)',
                  }}
                >
                  <Check size={14} /> Save Ward Access
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
