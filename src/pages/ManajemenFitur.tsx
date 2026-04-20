import { useState } from 'react';
import { Badge, Toggle, Icons, Alert } from '../components/UI';
import { mockUsers, FEATURES, DEFAULT_PERMISSIONS, ROLE_LABELS, ROLE_COLORS, getAvatarColor } from '../data/mockData';
import type { Role, Permissions } from '../types';

type FiturMode = 'role' | 'user';

export default function ManajemenFitur(): JSX.Element {
  const [perms, setPerms] = useState<Permissions>({ ...DEFAULT_PERMISSIONS });
  const [selectedRole, setSelectedRole] = useState<Role>('petugas');
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [userPerms, setUserPerms] = useState<Record<string, string[]>>({});
  const [mode, setMode] = useState<FiturMode>('role');
  const [saved, setSaved] = useState(false);

  const categories = [...new Set(FEATURES.map(f => f.category))];

  function togglePerm(featureId: string): void {
    if (mode === 'role') {
      setPerms(prev => {
        const cur = prev[selectedRole] ?? [];
        const updated = cur.includes(featureId)
          ? cur.filter(f => f !== featureId)
          : [...cur, featureId];
        return { ...prev, [selectedRole]: updated };
      });
    } else if (selectedUser !== null) {
      const key = `user_${selectedUser}`;
      setUserPerms(prev => {
        const base = prev[key] ?? (perms[mockUsers.find(u => u.id === selectedUser)?.role ?? 'petugas'] ?? []);
        const updated = base.includes(featureId)
          ? base.filter(f => f !== featureId)
          : [...base, featureId];
        return { ...prev, [key]: updated };
      });
    }
  }

  function getCurrentPerms(): string[] {
    if (mode === 'role') return perms[selectedRole] ?? [];
    if (selectedUser !== null) {
      const key = `user_${selectedUser}`;
      if (userPerms[key]) return userPerms[key];
      const u = mockUsers.find(u => u.id === selectedUser);
      return perms[u?.role ?? 'petugas'] ?? [];
    }
    return [];
  }

  function isCustomized(): boolean {
    if (mode !== 'user' || selectedUser === null) return false;
    return !!userPerms[`user_${selectedUser}`];
  }

  function resetToRole(): void {
    if (selectedUser !== null) {
      const key = `user_${selectedUser}`;
      setUserPerms(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function handleSave(): void {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const cur = getCurrentPerms();
  const ROLES: Role[] = ['super_admin', 'admin', 'petugas'];

  return (
    <div>
      {saved && <Alert type="success"><Icons.Check /> Pengaturan hak akses berhasil disimpan!</Alert>}

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Left Panel */}
        <div style={{ width: 260, flexShrink: 0 }}>
          <div className="card" style={{ padding: '14px' }}>
            <div className="tabs" style={{ marginBottom: 12 }}>
              <div className={`tab ${mode === 'role' ? 'active' : ''}`} onClick={() => setMode('role')}>Per Role</div>
              <div className={`tab ${mode === 'user' ? 'active' : ''}`} onClick={() => setMode('user')}>Per Pengguna</div>
            </div>

            {mode === 'role' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ROLES.map(r => (
                  <div key={r} className={`role-card ${selectedRole === r ? 'selected' : ''}`} onClick={() => setSelectedRole(r)}>
                    <div className="role-card-name"><Badge type={ROLE_COLORS[r]}>{ROLE_LABELS[r]}</Badge></div>
                    <div className="role-card-desc" style={{ marginTop: 8 }}>
                      {(perms[r] ?? []).length} fitur diaktifkan
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 8, padding: '10px 12px', background: 'var(--orange-light)', borderRadius: 10, fontSize: 12, color: 'var(--orange)' }}>
                  ⚠️ Perubahan role berlaku untuk semua pengguna dengan role tersebut
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {mockUsers.map(u => (
                  <div
                    key={u.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                      background: selectedUser === u.id ? 'var(--blue-light)' : 'transparent',
                      border: selectedUser === u.id ? '1px solid var(--blue-mid)' : '1px solid transparent',
                      transition: 'all .15s',
                    }}
                    onClick={() => setSelectedUser(u.id)}
                  >
                    <div className="avatar" style={{ background: getAvatarColor(u.name), width: 28, height: 28, fontSize: 10 }}>
                      {u.initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                      <Badge type={ROLE_COLORS[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                    </div>
                    {userPerms[`user_${u.id}`] && (
                      <span style={{ width: 8, height: 8, background: 'var(--orange)', borderRadius: '50%', flexShrink: 0 }} title="Hak akses dikustomisasi" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ flex: 1 }}>
          <div className="card-header" style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
            <div>
              <div className="card-title">
                {mode === 'role'
                  ? `Hak Akses: ${ROLE_LABELS[selectedRole]}`
                  : `Hak Akses: ${mockUsers.find(u => u.id === selectedUser)?.name ?? 'Pilih pengguna'}`
                }
              </div>
              <div className="card-sub">{cur.length} dari {FEATURES.length} fitur diaktifkan</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              {isCustomized() && (
                <button className="btn btn-secondary btn-sm" onClick={resetToRole}>Reset ke Default Role</button>
              )}
              <button className="btn btn-primary btn-sm" onClick={handleSave}><Icons.Check /> Simpan</button>
            </div>
          </div>

          {(mode === 'user' && selectedUser === null) ? (
            <div className="card">
              <div className="empty">
                <Icons.Users />
                <p>Pilih pengguna</p>
                <span>Pilih pengguna di panel kiri untuk mengatur hak aksesnya</span>
              </div>
            </div>
          ) : categories.map(cat => {
            const catFeatures = FEATURES.filter(f => f.category === cat);
            const isSuper = selectedRole === 'super_admin' && mode === 'role';
            return (
              <div key={cat} className="card" style={{ marginBottom: 16 }}>
                <div className="card-header">
                  <div className="card-title" style={{ fontSize: 14 }}>{cat}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text3)' }}>
                    {catFeatures.filter(f => cur.includes(f.id)).length}/{catFeatures.length} aktif
                  </div>
                </div>
                <div className="perm-grid">
                  {catFeatures.map(f => {
                    const isOn = cur.includes(f.id);
                    return (
                      <div key={f.id} className="perm-item" style={{ opacity: isSuper ? 0.6 : 1 }}>
                        <div>
                          <div className="perm-label">{f.icon} {f.label}</div>
                          <div className="perm-sub">{f.desc}</div>
                        </div>
                        <Toggle checked={isOn} onChange={() => { if (!isSuper) togglePerm(f.id); }} />
                      </div>
                    );
                  })}
                </div>
                {isSuper && (
                  <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>
                    Super Admin memiliki semua akses dan tidak dapat dibatasi
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
