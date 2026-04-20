// ─── Domain Types ────────────────────────────────────────────

export type Role = 'super_admin' | 'admin' | 'petugas';
export type UserStatus = 'active' | 'inactive';
export type ActivityType = 'create' | 'sync' | 'update' | 'login' | 'export';
export type SyncStatus = 'synced' | 'pending';
export type BadgeType = 'gray' | 'green' | 'blue' | 'orange' | 'red' | 'purple' | 'teal';
export type AlertType = 'info' | 'success' | 'warning' | 'error';
export type StatCardColor = 'blue' | 'green' | 'orange' | 'purple';

export interface DusunData {
  name: string;
  kk: number;
  jiwa: number;
  lakiLaki?: number;
  perempuan?: number;
  target: number;
  progress: number;
}

export interface User {
  id: number;
  apiId?: string;       // MongoDB ObjectId from backend
  name: string;
  email: string;
  role: Role;
  dusun: string;
  status: UserStatus;
  kkCount: number;
  lastActive: string;
  initials: string;
  joinDate: string;
}

export interface Activity {
  id: number;
  user: string;
  action: string;
  dusun: string;
  time: string;
  type: ActivityType;
}

export interface Kuesioner {
  id: string;
  nama: string;
  noKk: string;
  dusun: string;
  anggota: number;
  petugas: string;
  status: SyncStatus;
  waktu: string;
}

export interface Feature {
  id: string;
  label: string;
  desc: string;
  icon: string;
  category: string;
}

export interface MockStats {
  totalKK: number;
  totalJiwa: number;
  lakiLaki: number;
  perempuan: number;
  totalPetugas: number;
  pendingSynced: number;
  completedToday: number;
  syncRate: number;
}

export type Permissions = Record<Role, string[]>;
export type RoleLabels = Record<Role, string>;
export type RoleColors = Record<Role, BadgeType>;

// ─── Component Prop Types ─────────────────────────────────────

export interface PageName {
  page: 'dashboard' | 'kuesioner' | 'laporan' | 'petugas' | 'fitur' | 'pengaturan';
}

export type PageId = PageName['page'];

export interface SidebarProps {
  page: PageId;
  setPage: (page: PageId) => void;
  pendingSync: number;
}

export interface HeaderProps {
  page: PageId;
  pendingSync: number;
}

export interface BadgeProps {
  type?: BadgeType;
  children: React.ReactNode;
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: string;
  footer?: React.ReactNode;
}

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export interface DonutChartProps {
  data: DonutSegment[];
  size?: number;
}

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: StatCardColor;
  changePct?: number;
}

export interface AlertProps {
  type?: AlertType;
  children: React.ReactNode;
}

// ─── Form State ───────────────────────────────────────────────

export interface UserFormData {
  name: string;
  email: string;
  role: Role;
  dusun: string;
  password: string;
  status: UserStatus;
}
