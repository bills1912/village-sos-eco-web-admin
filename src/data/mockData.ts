import type {
  DusunData, User, Activity, Kuesioner, Feature,
  MockStats, Permissions, RoleLabels, RoleColors,
} from '../types';

export const DUSUN_OPTIONS: string[] = [
  'Dusun I-A', 'Dusun I-B', 'Dusun II Timur',
  'Dusun II Barat', 'Dusun III', 'Dusun IV',
];

export const DUSUN_COLORS: string[] = [
  '#2196F3', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4',
];

export const mockStats: MockStats = {
  totalKK: 1248, totalJiwa: 4312, lakiLaki: 2187, perempuan: 2125,
  totalPetugas: 12, pendingSynced: 23, completedToday: 47, syncRate: 94,
};

export const mockDusunData: DusunData[] = [
  { name: 'Dusun I-A',      kk: 312, jiwa: 1024, target: 350, progress: 89 },
  { name: 'Dusun I-B',      kk: 287, jiwa: 934,  target: 300, progress: 96 },
  { name: 'Dusun II Timur', kk: 198, jiwa: 712,  target: 250, progress: 79 },
  { name: 'Dusun II Barat', kk: 176, jiwa: 598,  target: 200, progress: 88 },
  { name: 'Dusun III',      kk: 154, jiwa: 621,  target: 180, progress: 86 },
  { name: 'Dusun IV',       kk: 121, jiwa: 423,  target: 150, progress: 81 },
];

export const mockUsers: User[] = [
  { id: 1, name: 'Ahmad Fauzi',       email: 'ahmad@desa.id', role: 'super_admin', dusun: 'Semua',         status: 'active',   kkCount: 0,   lastActive: 'Baru saja',  initials: 'AF', joinDate: '12 Jan 2024' },
  { id: 2, name: 'Siti Rahayu',       email: 'siti@desa.id',  role: 'admin',       dusun: 'Semua',         status: 'active',   kkCount: 0,   lastActive: '2 jam lalu', initials: 'SR', joinDate: '15 Jan 2024' },
  { id: 3, name: 'Budi Santoso',      email: 'budi@desa.id',  role: 'petugas',     dusun: 'Dusun I-A',     status: 'active',   kkCount: 312, lastActive: '30 mnt lalu',initials: 'BS', joinDate: '20 Jan 2024' },
  { id: 4, name: 'Dewi Lestari',      email: 'dewi@desa.id',  role: 'petugas',     dusun: 'Dusun I-B',     status: 'active',   kkCount: 287, lastActive: '1 jam lalu', initials: 'DL', joinDate: '22 Jan 2024' },
  { id: 5, name: 'Roni Kurniawan',    email: 'roni@desa.id',  role: 'petugas',     dusun: 'Dusun II Timur',status: 'active',   kkCount: 198, lastActive: '3 jam lalu', initials: 'RK', joinDate: '25 Jan 2024' },
  { id: 6, name: 'Sri Mulyani',       email: 'sri@desa.id',   role: 'petugas',     dusun: 'Dusun II Barat',status: 'active',   kkCount: 176, lastActive: 'Kemarin',    initials: 'SM', joinDate: '27 Jan 2024' },
  { id: 7, name: 'Joko Susilo',       email: 'joko@desa.id',  role: 'petugas',     dusun: 'Dusun III',     status: 'inactive', kkCount: 154, lastActive: '3 hari lalu',initials: 'JS', joinDate: '1 Feb 2024'  },
  { id: 8, name: 'Maya Sari',         email: 'maya@desa.id',  role: 'petugas',     dusun: 'Dusun IV',      status: 'active',   kkCount: 121, lastActive: '5 jam lalu', initials: 'MS', joinDate: '3 Feb 2024'  },
];

export const mockActivity: Activity[] = [
  { id: 1, user: 'Budi Santoso',   action: 'Menambahkan data KK baru',      dusun: 'Dusun I-A',      time: '5 menit lalu',  type: 'create' },
  { id: 2, user: 'Dewi Lestari',   action: 'Sinkronisasi 12 data berhasil', dusun: 'Dusun I-B',      time: '18 menit lalu', type: 'sync'   },
  { id: 3, user: 'Roni Kurniawan', action: 'Memperbarui data KK #0034',     dusun: 'Dusun II Timur', time: '34 menit lalu', type: 'update' },
  { id: 4, user: 'Maya Sari',      action: 'Login ke sistem',               dusun: 'Dusun IV',       time: '1 jam lalu',    type: 'login'  },
  { id: 5, user: 'Sri Mulyani',    action: 'Menambahkan 3 data baru',       dusun: 'Dusun II Barat', time: '2 jam lalu',    type: 'create' },
  { id: 6, user: 'Budi Santoso',   action: 'Ekspor laporan PDF',            dusun: 'Dusun I-A',      time: '3 jam lalu',    type: 'export' },
];

export const mockKuesioner: Kuesioner[] = [
  { id: 'KK-0001', nama: 'Budi Hartono',       noKk: '3210123456789012', dusun: 'Dusun I-A',      anggota: 4, petugas: 'Budi Santoso',   status: 'synced',  waktu: '20 Jun 2025' },
  { id: 'KK-0002', nama: 'Slamet Riyadi',      noKk: '3210234567890123', dusun: 'Dusun I-A',      anggota: 3, petugas: 'Budi Santoso',   status: 'synced',  waktu: '20 Jun 2025' },
  { id: 'KK-0003', nama: 'Ratna Dewi',         noKk: '3210345678901234', dusun: 'Dusun I-B',      anggota: 5, petugas: 'Dewi Lestari',   status: 'synced',  waktu: '19 Jun 2025' },
  { id: 'KK-0004', nama: 'Agus Prasetyo',      noKk: '3210456789012345', dusun: 'Dusun II Timur', anggota: 4, petugas: 'Roni Kurniawan', status: 'pending', waktu: '19 Jun 2025' },
  { id: 'KK-0005', nama: 'Wati Sulistyowati',  noKk: '3210567890123456', dusun: 'Dusun II Barat', anggota: 6, petugas: 'Sri Mulyani',    status: 'synced',  waktu: '18 Jun 2025' },
  { id: 'KK-0006', nama: 'Supri Haryono',      noKk: '3210678901234567', dusun: 'Dusun III',      anggota: 3, petugas: 'Joko Susilo',    status: 'pending', waktu: '17 Jun 2025' },
  { id: 'KK-0007', nama: 'Endah Ratnasari',    noKk: '3210789012345678', dusun: 'Dusun IV',       anggota: 4, petugas: 'Maya Sari',      status: 'synced',  waktu: '17 Jun 2025' },
  { id: 'KK-0008', nama: 'Darmanto',           noKk: '3210890123456789', dusun: 'Dusun I-A',      anggota: 2, petugas: 'Budi Santoso',   status: 'synced',  waktu: '16 Jun 2025' },
];

export const FEATURES: Feature[] = [
  { id: 'dashboard',            label: 'Dashboard',          desc: 'Lihat ringkasan statistik',    icon: '📊', category: 'Monitoring' },
  { id: 'questionnaire_view',   label: 'Lihat Kuesioner',    desc: 'Baca data pendataan',          icon: '👁️', category: 'Kuesioner'  },
  { id: 'questionnaire_create', label: 'Tambah Kuesioner',   desc: 'Input data baru',              icon: '➕', category: 'Kuesioner'  },
  { id: 'questionnaire_edit',   label: 'Edit Kuesioner',     desc: 'Ubah data yang ada',           icon: '✏️', category: 'Kuesioner'  },
  { id: 'questionnaire_delete', label: 'Hapus Kuesioner',    desc: 'Hapus data pendataan',         icon: '🗑️', category: 'Kuesioner'  },
  { id: 'reports',              label: 'Laporan',            desc: 'Akses laporan & statistik',    icon: '📈', category: 'Laporan'    },
  { id: 'reports_export',       label: 'Ekspor Laporan',     desc: 'Unduh PDF/Excel',              icon: '📤', category: 'Laporan'    },
  { id: 'user_view',            label: 'Lihat Petugas',      desc: 'Daftar pengguna',              icon: '👥', category: 'Pengguna'   },
  { id: 'user_create',          label: 'Tambah Petugas',     desc: 'Buat akun baru',               icon: '👤', category: 'Pengguna'   },
  { id: 'user_edit',            label: 'Edit Petugas',       desc: 'Ubah data pengguna',           icon: '🔧', category: 'Pengguna'   },
  { id: 'feature_management',   label: 'Kelola Fitur',       desc: 'Atur hak akses',               icon: '🔐', category: 'Admin'      },
  { id: 'sync_manage',          label: 'Kelola Sinkronisasi',desc: 'Monitor & sync data',          icon: '🔄', category: 'Admin'      },
  { id: 'offline_mode',         label: 'Mode Offline',       desc: 'Penggunaan tanpa internet',    icon: '📶', category: 'Lainnya'    },
  { id: 'gps_location',         label: 'Lokasi GPS',         desc: 'Tandai lokasi rumah',          icon: '📍', category: 'Lainnya'    },
];

export const DEFAULT_PERMISSIONS: Permissions = {
  super_admin: FEATURES.map(f => f.id),
  admin: [
    'dashboard', 'questionnaire_view', 'questionnaire_create', 'questionnaire_edit',
    'reports', 'reports_export', 'user_view', 'user_create', 'user_edit',
    'sync_manage', 'offline_mode', 'gps_location',
  ],
  petugas: [
    'dashboard', 'questionnaire_view', 'questionnaire_create', 'questionnaire_edit',
    'reports', 'offline_mode', 'gps_location',
  ],
};

export const ROLE_LABELS: RoleLabels = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  petugas: 'Petugas',
};

export const ROLE_COLORS: RoleColors = {
  super_admin: 'purple',
  admin: 'blue',
  petugas: 'teal',
};

const avatarColors: string[] = [
  '#2196F3', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4', '#F44336',
];

export const getAvatarColor = (name: string): string =>
  avatarColors[name.charCodeAt(0) % avatarColors.length];
