// src/pages/ManajemenFitur.tsx
import { useState, useEffect, useCallback } from 'react';
import { Badge, Toggle, Icons, Alert } from '../components/UI';
import { mockUsers, FEATURES, DEFAULT_PERMISSIONS, ROLE_LABELS, ROLE_COLORS, getAvatarColor } from '../data/mockData';
import { getUsers, type ApiUser } from '../services/api';
import { toUserList } from '../services/helpers';
import type { Role, Permissions } from '../types';

type FiturMode = 'role' | 'user';

const BASE = 'https://village-survey.up.railway.app/api';

async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('admin_token');
  return fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
}

async function fetchRolePerms(): Promise<Permissions> {
  const res = await authFetch('/permissions/roles');
  if (!res.ok) throw new Error('Gagal memuat permissions');
  return res.json() as Promise<Permissions>;
}

async function saveRolePerms(role: string, features: string[]): Promise<void> {
  const res = await authFetch(`/permissions/roles/${role}`, {
    method: 'PUT',
    body: JSON.stringify({ features }),
  });
  if (!res.ok) throw new Error('Gagal menyimpan permissions role');
}

async function fetchUserPerm(userId: string): Promise<string[] | null> {
  const res = await authFetch(`/permissions/users/${userId}`);
  if (!res.ok) return null;
  const data = await res.json() as { features: string[] | null; customized: boolean };
  return data.customized ? data.features : null;
}

async function saveUserPerms(userId: string, features: string[]): Promise<void> {
  const res = await authFetch(`/permissions/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ features }),
  });
  if (!res.ok) throw new Error('Gagal menyimpan permissions user');
}

async function deleteUserPerms(userId: string): Promise<void> {
  const res = await authFetch(`/permissions/users/${userId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Gagal menghapus override user');
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ManajemenFitur(): JSX.Element {
  const [perms, setPerms] = useState<Permissions>({ ...DEFAULT_PERMISSIONS });
  const [selectedRole, setSelectedRole] = useState<Role>('petugas');
  const [mode, setMode] = useState<FiturMode>('role');

  // User-mode state
  const [apiUsers, setApiUsers] = useState<ApiUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userPermsMap, setUserPermsMap] = useState<Record<string, string[] | null>>({});
  // null  = belum di-fetch, undefined = tidak ada override, string[] = ada override

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [...new Set(FEATURES.map(f => f.category))];

  // ── Load role permissions from API on mount ──────────────────────────────
  useEffect(() => {
    setLoading(true);
    fetchRolePerms()
      .then(data => setPerms(prev => ({ ...prev, ...data })))
      .catch(e => setError(e instanceof Error ? e.message : 'Gagal memuat data'))
      .finally(() => setLoading(false));
  }, []);

  // ── Load list of users for user-mode ────────────────────────────────────
  useEffect(() => {
    if (mode !== 'user') return;
    getUsers()
      .then(data => setApiUsers(data))
      .catch(() => { /* silently use empty */ });
  }, [mode]);

  // ── When a user is selected, fetch their override (if any) ──────────────
  const handleSelectUser = useCallback(async (userId: string) => {
    setSelectedUserId(userId);
    if (userId in userPermsMap) return; // already fetched
    try {
      const features = await fetchUserPerm(userId);
      setUserPermsMap(prev => ({ ...prev, [userId]: features }));
    } catch {
      setUserPermsMap(prev => ({ ...prev, [userId]: null }));
    }
  }, [userPermsMap]);

  // ── Current permissions to display ──────────────────────────────────────
  function getCurrentPerms(): string[] {
    if (mode === 'role') return perms[selectedRole] ?? [];
    if (!selectedUserId) return [];

    const override = userPermsMap[selectedUserId];
    if (Array.isArray(override)) return override;

    // Fallback: role default of that user
    const u = apiUsers.find(x => x.id === selectedUserId);
    const roles = u?.roles?.map(r => (typeof r === 'string' ? r : r.name)) ?? [];
    const primaryRole: Role = roles.includes('super_admin') ? 'super_admin'
      : roles.includes('admin') ? 'admin' : 'petugas';
    return perms[primaryRole] ?? DEFAULT_PERMISSIONS[primaryRole];
  }

  function isUserCustomized(): boolean {
    if (!selectedUserId) return false;
    return Array.isArray(userPermsMap[selectedUserId]);
  }

  // ── Toggle a single feature ──────────────────────────────────────────────
  function toggleFeature(featureId: string): void {
    const cur = getCurrentPerms();
    const updated = cur.includes(featureId)
      ? cur.filter(f => f !== featureId)
      : [...cur, featureId];

    if (mode === 'role') {
      setPerms(prev => ({ ...prev, [selectedRole]: updated }));
    } else if (selectedUserId) {
      setUserPermsMap(prev => ({ ...prev, [selectedUserId]: updated }));
    }
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave(): Promise<void> {
    setSaving(true);
    setError(null);
    try {
      if (mode === 'role') {
        await saveRolePerms(selectedRole, perms[selectedRole] ?? []);
      } else if (selectedUserId) {
        const features = userPermsMap[selectedUserId];
        if (Array.isArray(features)) {
          await saveUserPerms(selectedUserId, features);
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  }

  // ── Reset user override → back to role default ───────────────────────────
  async function handleResetToRole(): Promise<void> {
    if (!selectedUserId) return;
    setSaving(true);
    try {
      await deleteUserPerms(selectedUserId);
      setUserPermsMap(prev => ({ ...prev, [selectedUserId]: null }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mereset');
    } finally {
      setSaving(false);
    }
  }

  const cur = getCurrentPerms();
  const ROLES: Role[] = ['super_admin', 'admin', 'petugas'];

  // ── Derive display users: prefer API data, fallback mockUsers ────────────
  const displayUsers = apiUsers.length > 0
    ? toUserList(apiUsers)
    : mockUsers;

  return (
    <div>
      {saved && <Alert type="success"><Icons.Check /> Pengaturan hak akses berhasil disimpan!</Alert>}
      {error && <Alert type="warning"><Icons.Info /> {error}</Alert>}

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* ── Left Panel ─────────────────────────────────────────────────── */}
        <div style={{ width: 260, flexShrink: 0 }}>
          <div className="card" style={{ padding: '14px' }}>
            <div className="tabs" style={{ marginBottom: 12 }}>
              <div className={`tab ${mode === 'role' ? 'active' : ''}`} onClick={() => setMode('role')}>Per Role</div>
              <div className={`tab ${mode === 'user' ? 'active' : ''}`} onClick={() => setMode('user')}>Per Pengguna</div>
            </div>

            {mode === 'role' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {loading && <div style={{ fontSize: 12, color: 'var(--text3)', padding: 8 }}>Memuat permissions...</div>}
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
                {displayUsers.map(u => (
                  <div
                    key={u.apiId ?? u.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                      background: selectedUserId === (u.apiId ?? String(u.id)) ? 'var(--blue-light)' : 'transparent',
                      border: selectedUserId === (u.apiId ?? String(u.id))
                        ? '1px solid var(--blue-mid)' : '1px solid transparent',
                      transition: 'all .15s',
                    }}
                    onClick={() => handleSelectUser(u.apiId ?? String(u.id))}
                  >
                    <div className="avatar" style={{ background: getAvatarColor(u.name), width: 28, height: 28, fontSize: 10 }}>
                      {u.initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                      <Badge type={ROLE_COLORS[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                    </div>
                    {/* Dot indicator: user has a custom override saved in DB */}
                    {Array.isArray(userPermsMap[u.apiId ?? String(u.id)]) && (
                      <span style={{ width: 8, height: 8, background: 'var(--orange)', borderRadius: '50%', flexShrink: 0 }} title="Hak akses dikustomisasi" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Panel ────────────────────────────────────────────────── */}
        <div style={{ flex: 1 }}>
          <div className="card-header" style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
            <div>
              <div className="card-title">
                {mode === 'role'
                  ? `Hak Akses: ${ROLE_LABELS[selectedRole]}`
                  : selectedUserId
                    ? `Hak Akses: ${displayUsers.find(u => (u.apiId ?? String(u.id)) === selectedUserId)?.name ?? 'Pengguna'}`
                    : 'Pilih pengguna'
                }
              </div>
              <div className="card-sub">
                {cur.length} dari {FEATURES.length} fitur diaktifkan
                {mode === 'user' && isUserCustomized() && (
                  <span style={{ marginLeft: 8, color: 'var(--orange)', fontWeight: 600 }}>• Dikustomisasi</span>
                )}
                {mode === 'user' && !isUserCustomized() && selectedUserId && (
                  <span style={{ marginLeft: 8, color: 'var(--text3)' }}>• Menggunakan default role</span>
                )}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              {mode === 'user' && isUserCustomized() && (
                <button className="btn btn-secondary btn-sm" onClick={handleResetToRole} disabled={saving}>
                  Reset ke Default Role
                </button>
              )}
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving || (mode === 'user' && !selectedUserId)}>
                {saving ? '...' : <><Icons.Check /> Simpan</>}
              </button>
            </div>
          </div>

          {(mode === 'user' && !selectedUserId) ? (
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
                        <Toggle
                          checked={isOn}
                          onChange={() => { if (!isSuper) toggleFeature(f.id); }}
                        />
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