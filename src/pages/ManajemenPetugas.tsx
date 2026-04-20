// src/pages/ManajemenPetugas.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { Badge, Modal, Icons, Alert } from '../components/UI';
import { DUSUN_OPTIONS, ROLE_LABELS, ROLE_COLORS, getAvatarColor } from '../data/mockData';
import { getUsers, createUser, updateUser, deleteUser, type ApiUser } from '../services/api';
import { toUserList, formatDate } from '../services/helpers';
import type { User, Role, UserStatus, UserFormData } from '../types';

type RoleFilter = 'all' | Role;

function roleFromApiUser(u: ApiUser): Role {
  const roles = u.roles?.map(r => (typeof r === 'string' ? r : r.name)) ?? [];
  if (roles.includes('super_admin')) return 'super_admin';
  if (roles.includes('admin')) return 'admin';
  return 'petugas';
}

function initialsOf(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function ManajemenPetugas(): JSX.Element {
  const [, setApiUsers] = useState<ApiUser[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<RoleFilter>('all');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: '', email: '', role: 'petugas', dusun: 'Dusun I-A', password: '', status: 'active',
  });
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  async function fetchUsers(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsers();
      setApiUsers(data);
      setUsers(toUserList(data));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data pengguna');
      // fallback: keep current list
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void fetchUsers(); }, []);

  const filtered = useMemo(() =>
    users.filter(u => {
      const q = search.toLowerCase();
      const matchQ = u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchR = filterRole === 'all' || u.role === filterRole;
      return matchQ && matchR;
    }),
    [users, search, filterRole]
  );

  function openAdd(): void {
    setEditUser(null);
    setFormData({ name: '', email: '', role: 'petugas', dusun: 'Dusun I-A', password: '', status: 'active' });
    setShowModal(true);
  }

  function openEdit(u: User): void {
    setEditUser(u);
    setFormData({ name: u.name, email: u.email, role: u.role, dusun: u.dusun, password: '', status: u.status });
    setShowModal(true);
  }

  async function handleSave(): Promise<void> {
    if (!formData.name || !formData.email) {
      alert('Nama dan email wajib diisi');
      return;
    }
    if (!editUser && !formData.password) {
      alert('Password wajib diisi untuk pengguna baru');
      return;
    }

    setSaving(true);
    try {
      if (editUser && editUser.apiId) {
        // Update existing via API
        const payload: Parameters<typeof updateUser>[1] = {
          name: formData.name,
          email: formData.email,
          roles: [formData.role],
        };
        if (formData.password) payload.password = formData.password;
        const updated = await updateUser(editUser.apiId, payload);
        setApiUsers(prev => prev.map(u => u.id === editUser.apiId ? updated : u));
        setUsers(prev => prev.map(u => u.id === editUser.id
          ? { ...u, name: updated.name, email: updated.email, role: roleFromApiUser(updated), dusun: formData.dusun, status: formData.status }
          : u
        ));
      } else {
        // Create new via API
        const created = await createUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          roles: [formData.role],
        });
        setApiUsers(prev => [...prev, created]);
        const newUser: User = {
          id: Date.now(),
          apiId: created.id,
          name: created.name,
          email: created.email,
          role: roleFromApiUser(created),
          dusun: formData.role === 'petugas' ? formData.dusun : 'Semua',
          status: 'active',
          kkCount: 0,
          lastActive: 'Baru saja',
          initials: initialsOf(created.name),
          joinDate: created.created_at ? formatDate(created.created_at) : new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        };
        setUsers(prev => [...prev, newUser]);
      }
      setSuccessMsg(editUser ? 'Pengguna berhasil diperbarui!' : 'Pengguna baru berhasil ditambahkan!');
      setTimeout(() => setSuccessMsg(''), 3000);
      setShowModal(false);
    } catch (e) {
      alert('Gagal menyimpan: ' + (e instanceof Error ? e.message : 'Error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(u: User): Promise<void> {
    if (!u.apiId) {
      // local-only, just remove from state
      setUsers(prev => prev.filter(x => x.id !== u.id));
      setConfirmDelete(null);
      return;
    }
    setSaving(true);
    try {
      await deleteUser(u.apiId);
      setUsers(prev => prev.filter(x => x.id !== u.id));
      setApiUsers(prev => prev.filter(x => x.id !== u.apiId));
      setConfirmDelete(null);
      setSuccessMsg('Pengguna berhasil dihapus!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) {
      alert('Gagal menghapus: ' + (e instanceof Error ? e.message : 'Error'));
    } finally {
      setSaving(false);
    }
  }

  function setForm<K extends keyof UserFormData>(key: K, val: UserFormData[K]): void {
    setFormData(prev => ({ ...prev, [key]: val }));
  }

  return (
    <div>
      {successMsg && <Alert type="success"><Icons.Check /> {successMsg}</Alert>}
      {error && (
        <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>⚠️</span>
          <span style={{ flex: 1, fontSize: 13, color: '#92400E' }}>{error} — Menampilkan data yang tersedia.</span>
          <button onClick={fetchUsers} className="btn btn-secondary btn-sm">Coba Lagi</button>
        </div>
      )}

      <div className="filter-bar">
        <div className="search-wrap">
          <Icons.Search />
          <input
            className="search-input"
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={filterRole}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterRole(e.target.value as RoleFilter)}
        >
          <option value="all">Semua Role</option>
          <option value="super_admin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="petugas">Petugas</option>
        </select>
        <button className="btn btn-secondary btn-sm" onClick={fetchUsers} disabled={loading}>↺ Refresh</button>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-primary" onClick={openAdd}><Icons.Plus /> Tambah Pengguna</button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="three-col" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total Pengguna', val: users.length,                                  color: 'var(--blue)'  },
          { label: 'Aktif',          val: users.filter(u => u.status === 'active').length, color: 'var(--green)' },
          { label: 'Tidak Aktif',    val: users.filter(u => u.status !== 'active').length, color: 'var(--text3)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{loading ? '…' : s.val}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Pengguna</th><th>Role</th><th>Wilayah</th><th>Bergabung</th><th>Status</th><th>Aksi</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Memuat data pengguna...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6}>
                <div className="empty"><Icons.Users /><p>Tidak ada pengguna ditemukan</p></div>
              </td></tr>
            ) : filtered.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar" style={{ background: getAvatarColor(u.name) }}>{u.initials}</div>
                    <div>
                      <div className="td-name">{u.name}</div>
                      <div className="td-sub">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td><Badge type={ROLE_COLORS[u.role]}>{ROLE_LABELS[u.role]}</Badge></td>
                <td style={{ fontSize: 12, color: 'var(--text2)' }}>{u.dusun}</td>
                <td style={{ fontSize: 12, color: 'var(--text3)' }}>{u.joinDate}</td>
                <td>
                  <Badge type={u.status === 'active' ? 'green' : 'gray'}>
                    {u.status === 'active' ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setShowDetailModal(u)} title="Detail"><Icons.Eye /></button>
                    <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(u)} title="Edit"><Icons.Edit /></button>
                    {u.role !== 'super_admin' && (
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => setConfirmDelete(u)} title="Hapus"><Icons.Trash /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
        size="modal-lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <Icons.Check /> {saving ? 'Menyimpan...' : editUser ? 'Simpan Perubahan' : 'Tambahkan'}
            </button>
          </>
        }
      >
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Nama Lengkap *</label>
            <input
              className="form-input"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm('name', e.target.value)}
              placeholder="Nama lengkap pengguna"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email *</label>
            <input
              className="form-input"
              type="email"
              value={formData.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm('email', e.target.value)}
              placeholder="email@desa.id"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Role *</label>
            <select
              className="form-select"
              value={formData.role}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm('role', e.target.value as Role)}
            >
              <option value="petugas">Petugas</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Wilayah Tugas</label>
            <select
              className="form-select"
              value={formData.dusun}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm('dusun', e.target.value)}
              disabled={formData.role !== 'petugas'}
            >
              {formData.role !== 'petugas'
                ? <option>Semua Dusun</option>
                : DUSUN_OPTIONS.map(d => <option key={d}>{d}</option>)
              }
            </select>
            {formData.role !== 'petugas' && (
              <div className="form-hint">Admin memiliki akses ke semua dusun</div>
            )}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              {editUser ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password *'}
            </label>
            <input
              className="form-input"
              type="password"
              value={formData.password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm('password', e.target.value)}
              placeholder="Minimal 8 karakter"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Status Akun</label>
            <select
              className="form-select"
              value={formData.status}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm('status', e.target.value as UserStatus)}
            >
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
        </div>
        <Alert type="info">
          Hak akses fitur dapat diatur di menu <strong>Manajemen Fitur</strong>
        </Alert>
      </Modal>

      {/* Detail Modal */}
      {showDetailModal && (
        <Modal
          open={!!showDetailModal}
          onClose={() => setShowDetailModal(null)}
          title="Detail Pengguna"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(null)}>Tutup</button>
              <button className="btn btn-primary" onClick={() => { setShowDetailModal(null); openEdit(showDetailModal); }}>
                <Icons.Edit /> Edit
              </button>
            </>
          }
        >
          <div style={{ textAlign: 'center', paddingBottom: 20 }}>
            <div className="avatar" style={{ width: 64, height: 64, background: getAvatarColor(showDetailModal.name), fontSize: 24, margin: '0 auto 12px' }}>
              {showDetailModal.initials}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{showDetailModal.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>{showDetailModal.email}</div>
            <div style={{ marginTop: 8 }}>
              <Badge type={ROLE_COLORS[showDetailModal.role]}>{ROLE_LABELS[showDetailModal.role]}</Badge>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {([
              ['Wilayah',   showDetailModal.dusun],
              ['Status',    showDetailModal.status === 'active' ? 'Aktif' : 'Nonaktif'],
              ['KK Didata', `${showDetailModal.kkCount} KK`],
              ['Bergabung', showDetailModal.joinDate],
            ] as [string, string][]).map(([l, v]) => (
              <div key={l} style={{ padding: '12px 14px', background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{l}</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
          {showDetailModal.apiId && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--bg3)', borderRadius: 8, fontSize: 11, color: 'var(--text3)' }}>
              ID Server: <span style={{ fontFamily: 'monospace' }}>{showDetailModal.apiId}</span>
            </div>
          )}
        </Modal>
      )}

      {/* Confirm Delete */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Konfirmasi Hapus"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)}>Batal</button>
            <button className="btn btn-danger" disabled={saving} onClick={() => confirmDelete && handleDelete(confirmDelete)}>
              <Icons.Trash /> {saving ? 'Menghapus...' : 'Hapus'}
            </button>
          </>
        }
      >
        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <p style={{ fontSize: 14, color: 'var(--text2)' }}>
            Apakah Anda yakin ingin menghapus akun <strong>{confirmDelete?.name}</strong>?<br />
            Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>
      </Modal>
    </div>
  );
}
