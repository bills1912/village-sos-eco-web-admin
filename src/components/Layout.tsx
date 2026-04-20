// src/components/Layout.tsx
import { useState } from 'react';
import { Icons } from './UI';
import { useAuth } from '../context/AuthContext';
import type { SidebarProps, HeaderProps, PageId } from '../types';

interface NavPage {
  id: PageId;
  label: string;
  Icon: () => JSX.Element;
  section: string;
}

const PAGES: NavPage[] = [
  { id: 'dashboard',  label: 'Dashboard',          Icon: Icons.Dashboard, section: 'Main'        },
  { id: 'kuesioner',  label: 'Data Kuesioner',      Icon: Icons.Kuesioner, section: 'Data'        },
  { id: 'laporan',    label: 'Laporan',             Icon: Icons.Laporan,   section: 'Data'        },
  { id: 'petugas',    label: 'Manajemen Petugas',   Icon: Icons.Users,     section: 'Pengelolaan' },
  { id: 'fitur',      label: 'Manajemen Fitur',     Icon: Icons.Shield,    section: 'Pengelolaan' },
  { id: 'pengaturan', label: 'Pengaturan',          Icon: Icons.Settings,  section: 'Sistem'      },
];

const SECTIONS = ['Main', 'Data', 'Pengelolaan', 'Sistem'] as const;

export function Sidebar({ page, setPage, pendingSync }: SidebarProps): JSX.Element {
  const { user, logout } = useAuth();

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🏘️</div>
        <h1>Admin Panel</h1>
        <p>Desa Suka Makmur</p>
      </div>

      {SECTIONS.map(sec => {
        const items = PAGES.filter(p => p.section === sec);
        if (items.length === 0) return null;
        return (
          <div key={sec}>
            <div className="sidebar-section">{sec}</div>
            {items.map(({ id, label, Icon }) => (
              <div
                key={id}
                className={`nav-item ${page === id ? 'active' : ''}`}
                onClick={() => setPage(id)}
              >
                <Icon />
                <span>{label}</span>
                {id === 'kuesioner' && pendingSync > 0 && (
                  <span className="nav-badge">{pendingSync}</span>
                )}
              </div>
            ))}
          </div>
        );
      })}

      <div className="sidebar-footer">
        {user && (
          <div style={{
            padding: '8px 12px', marginBottom: 6,
            background: 'rgba(255,255,255,0.07)', borderRadius: 10,
          }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.85)', fontWeight: 600, marginBottom: 2 }}>
              {user.name}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.45)' }}>{user.email}</div>
          </div>
        )}
        <div
          className="nav-item"
          style={{ color: 'rgba(255,255,255,.5)', fontSize: 12, cursor: 'pointer' }}
          onClick={() => {
            if (confirm('Keluar dari sistem?')) void logout();
          }}
        >
          <Icons.Logout />
          <span>Keluar</span>
        </div>
      </div>
    </div>
  );
}

interface PageInfo {
  title: string;
  sub: string;
}

const PAGE_INFO: Record<PageId, PageInfo> = {
  dashboard:  { title: 'Dashboard',           sub: 'Monitoring pendataan Desa Suka Makmur' },
  kuesioner:  { title: 'Data Kuesioner',       sub: 'Kelola semua data pendataan'           },
  laporan:    { title: 'Laporan & Statistik',  sub: 'Analisis data demografi desa'          },
  petugas:    { title: 'Manajemen Petugas',    sub: 'Kelola akun pengguna sistem'           },
  fitur:      { title: 'Manajemen Fitur',      sub: 'Atur hak akses per role'              },
  pengaturan: { title: 'Pengaturan Sistem',    sub: 'Konfigurasi aplikasi'                  },
};

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export function Header({ page, pendingSync }: HeaderProps): JSX.Element {
  const { user } = useAuth();
  const info = PAGE_INFO[page];
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { logout } = useAuth();

  return (
    <div className="header">
      <div>
        <div className="header-title">{info.title}</div>
        <div className="header-sub">{info.sub}</div>
      </div>
      <div className="header-spacer" />
      {pendingSync > 0 && (
        <div className="header-badge">
          <Icons.Sync /> {pendingSync} pending sync
        </div>
      )}

      {/* Live indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text3)' }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', animation: 'none' }} />
        Live
      </div>

      {/* User avatar + menu */}
      <div style={{ position: 'relative' }}>
        <div
          className="header-avatar"
          title={user?.name ?? 'User'}
          style={{ cursor: 'pointer' }}
          onClick={() => setShowUserMenu(v => !v)}
        >
          {user ? getInitials(user.name) : 'U'}
        </div>
        {showUserMenu && (
          <div style={{
            position: 'absolute', right: 0, top: '110%', background: '#fff',
            border: '1px solid var(--border)', borderRadius: 10, padding: 8,
            minWidth: 180, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 100,
          }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{user?.email}</div>
            </div>
            <div
              style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', color: 'var(--red)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8 }}
              onClick={() => { setShowUserMenu(false); if (confirm('Keluar?')) void logout(); }}
            >
              <Icons.Logout /> Keluar
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
