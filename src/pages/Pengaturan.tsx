import { useState } from 'react';
import { Badge, Toggle, Icons } from '../components/UI';

type PengaturanTab = 'profil' | 'keamanan' | 'notifikasi' | 'api';

interface NotifItem {
  label: string;
  desc: string;
}

const NOTIF_ITEMS: NotifItem[] = [
  { label: 'Data Baru',      desc: 'Notifikasi saat petugas menambahkan data'       },
  { label: 'Sinkronisasi',   desc: 'Notifikasi saat data berhasil/gagal sinkron'    },
  { label: 'Laporan',        desc: 'Pengingat laporan mingguan'                     },
  { label: 'Petugas Baru',   desc: 'Notifikasi saat pengguna baru bergabung'        },
  { label: 'Error Sistem',   desc: 'Peringatan error kritis sistem'                 },
];

interface ActiveSession {
  device: string;
  location: string;
  time: string;
}

const ACTIVE_SESSIONS: ActiveSession[] = [
  { device: 'Chrome / Windows',      location: 'Jakarta, Indonesia',        time: 'Sekarang'  },
  { device: 'Mobile App / Android',  location: 'Medan, Sumatera Utara',     time: '1 jam lalu' },
];

const TAB_LIST: [PengaturanTab, string][] = [
  ['profil',      'Profil'],
  ['keamanan',    'Keamanan'],
  ['notifikasi',  'Notifikasi'],
  ['api',         'API'],
];

export default function Pengaturan(): JSX.Element {
  const [tab, setTab] = useState<PengaturanTab>('profil');
  const [notifState, setNotifState] = useState<boolean[]>([true, true, false, true, true]);

  function toggleNotif(index: number, value: boolean): void {
    setNotifState(prev => prev.map((p, i) => (i === index ? value : p)));
  }

  return (
    <div>
      <div className="tabs" style={{ maxWidth: 400 }}>
        {TAB_LIST.map(([k, l]) => (
          <div key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</div>
        ))}
      </div>

      {tab === 'profil' && (
        <div className="card">
          <div className="card-header"><div className="card-title">Informasi Profil</div></div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div className="avatar" style={{ width: 72, height: 72, background: 'var(--purple)', fontSize: 26 }}>AF</div>
              <button className="btn btn-secondary btn-sm">Ganti Foto</button>
            </div>
            <div style={{ flex: 1 }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nama Lengkap</label>
                  <input className="form-input" defaultValue="Ahmad Fauzi" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" defaultValue="ahmad@desa.id" type="email" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Jabatan</label>
                <input className="form-input" defaultValue="Kepala Desa Suka Makmur" />
              </div>
              <div className="form-group">
                <label className="form-label">Tentang</label>
                <textarea className="form-input" rows={3} defaultValue="Super Admin sistem pendataan Desa Suka Makmur." />
              </div>
              <button className="btn btn-primary"><Icons.Check /> Simpan Perubahan</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'keamanan' && (
        <div className="card">
          <div className="card-header"><div className="card-title">Keamanan Akun</div></div>
          <div style={{ maxWidth: 420 }}>
            <div className="form-group">
              <label className="form-label">Password Saat Ini</label>
              <input className="form-input" type="password" />
            </div>
            <div className="form-group">
              <label className="form-label">Password Baru</label>
              <input className="form-input" type="password" />
            </div>
            <div className="form-group">
              <label className="form-label">Konfirmasi Password Baru</label>
              <input className="form-input" type="password" />
            </div>
            <button className="btn btn-primary">Ubah Password</button>

            <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <div className="card-title" style={{ marginBottom: 12 }}>Sesi Aktif</div>
              {ACTIVE_SESSIONS.map(s => (
                <div key={s.device} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{s.device}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{s.location} · {s.time}</div>
                  </div>
                  {s.time !== 'Sekarang'
                    ? <button className="btn btn-danger btn-sm">Akhiri Sesi</button>
                    : <Badge type="green">Sesi Ini</Badge>
                  }
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'notifikasi' && (
        <div className="card">
          <div className="card-header"><div className="card-title">Preferensi Notifikasi</div></div>
          <div style={{ maxWidth: 480 }}>
            {NOTIF_ITEMS.map((item, i) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{item.desc}</div>
                </div>
                <Toggle
                  checked={notifState[i] ?? false}
                  onChange={(v: boolean) => toggleNotif(i, v)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'api' && (
        <div className="card">
          <div className="card-header"><div className="card-title">API Integrasi</div></div>
          <div style={{ background: 'var(--blue-light)', color: 'var(--blue)', padding: '12px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Icons.Info /> API Key digunakan untuk menghubungkan aplikasi mobile ke server
          </div>
          <div className="form-group">
            <label className="form-label">API Base URL</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="form-input"
                defaultValue="https://village-survey.up.railway.app/api"
                readOnly
                style={{ flex: 1, background: 'var(--bg3)' }}
              />
              <button className="btn btn-secondary">Salin</button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">API Key</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="form-input"
                defaultValue="sk-•••••••••••••••••••••••••••••••"
                readOnly
                style={{ flex: 1, background: 'var(--bg3)', fontFamily: 'monospace' }}
              />
              <button className="btn btn-secondary">Tampilkan</button>
              <button className="btn btn-primary">Regenerate</button>
            </div>
            <div className="form-hint">Dibuat: 12 Jan 2024. Terakhir digunakan: 5 menit lalu</div>
          </div>
        </div>
      )}
    </div>
  );
}
