// src/services/api.ts
const BASE_URL = 'https://village-survey.up.railway.app/api';

// ─── Token management ──────────────────────────────────────────
let _token: string | null = localStorage.getItem('admin_token');

export function setToken(token: string): void {
  _token = token;
  localStorage.setItem('admin_token', token);
}

export function clearToken(): void {
  _token = null;
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
}

export function getToken(): string | null {
  return _token;
}

// ─── Fetch helper ───────────────────────────────────────────────
async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error('Tidak dapat terhubung ke server. Periksa koneksi internet.');
  }

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json() as Record<string, unknown>;
      msg = (body.message as string) || (body.detail as string) || msg;
    } catch { /* ignore */ }
    throw new Error(msg);
  }

  return res.json() as Promise<T>;
}

// ─── Auth ──────────────────────────────────────────────────────
export interface LoginResponse {
  token?: string;
  access_token?: string;
  user?: ApiUser;
  [key: string]: unknown;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return req<LoginResponse>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function logout(): Promise<void> {
  try { await req('/logout', { method: 'POST' }); } catch { /* ignore */ }
  clearToken();
}

// ─── Types ────────────────────────────────────────────────────
export interface ApiUser {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  roles?: Array<string | { name: string }>;
  created_at?: string;
}

export interface ApiAnggota {
  r_201?: string;
  r_202?: string;
  r_203?: string;
  r_204?: string;
  r_205?: string;
  r_207_usia?: number;
  r_210?: string;
  r_211?: string[];
  r_212?: string;
  r_300_pekerjaan?: string;
  [key: string]: unknown;
}

export interface ApiQuestionnaire {
  id?: string;
  survey_id?: string;
  nama_petugas: string;
  // Wilayah administratif (dari WilayahSnapshot)
  kode_provinsi?: string;
  nama_provinsi?: string;
  kode_kabupaten?: string;
  nama_kabupaten?: string;
  kode_kecamatan?: string;
  nama_kecamatan?: string;
  kode_desa?: string;
  nama_desa?: string;
  // Dusun sebagai teks bebas
  dusun?: string | null;
  r_102: string;
  r_103?: string;
  r_200: ApiAnggota[];
  r_401?: string;
  lokasi_rumah?: { lat: number; lng: number } | null;
  waktu_pendataan?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
  items?: T[];
}

// ─── Questionnaires ─────────────────────────────────────────────
export async function getQuestionnaires(params?: {
  // Wilayah filters
  kode_provinsi?: string;
  kode_kabupaten?: string;
  kode_kecamatan?: string;
  kode_desa?: string;
  nama_desa?: string;
  // Dusun sebagai teks bebas (partial match di backend)
  dusun?: string;
  survey_id?: string;
  page?: number;
  limit?: number;
}): Promise<ApiQuestionnaire[]> {
  const qs = new URLSearchParams();
  if (params?.kode_provinsi)  qs.set('kode_provinsi',  params.kode_provinsi);
  if (params?.kode_kabupaten) qs.set('kode_kabupaten', params.kode_kabupaten);
  if (params?.kode_kecamatan) qs.set('kode_kecamatan', params.kode_kecamatan);
  if (params?.kode_desa)      qs.set('kode_desa',      params.kode_desa);
  else if (params?.nama_desa) qs.set('nama_desa',      params.nama_desa);
  if (params?.dusun)          qs.set('dusun',          params.dusun);
  if (params?.survey_id)      qs.set('survey_id',      params.survey_id);
  if (params?.page)           qs.set('page',           String(params.page));
  qs.set('limit', String(Math.min(params?.limit ?? 200, 200)));

  const path = `/questionnaires?${qs}`;
  const body = await req<ApiQuestionnaire[] | PaginatedResponse<ApiQuestionnaire>>(path);

  if (Array.isArray(body)) return body;
  return body.data ?? body.items ?? [];
}

export async function deleteQuestionnaire(id: string): Promise<void> {
  await req(`/questionnaires/${id}`, { method: 'DELETE' });
}

// ─── Statistics ──────────────────────────────────────────────────
export interface ApiStats {
  total_kk?: number;
  total_jiwa?: number;
  total_laki_laki?: number;
  total_perempuan?: number;
  per_dusun?: Record<string, number>;
  per_petugas?: Record<string, number>;
  per_pendidikan?: Record<string, number>;
  per_pekerjaan?: Record<string, number>;
  per_status_kk?: Record<string, number>;
  per_status_kawin?: Record<string, number>;
  per_kewarganegaraan?: Record<string, number>;
  per_keberadaan?: Record<string, number>;
  per_disabilitas?: Record<string, number>;
  kelompok_usia?: Record<string, number>;
  [key: string]: unknown;
}

export async function getStatistics(params?: {
  kode_desa?: string;
  dusun?: string;
  survey_id?: string;
}): Promise<ApiStats> {
  const qs = new URLSearchParams();
  if (params?.kode_desa)  qs.set('kode_desa',  params.kode_desa);
  if (params?.dusun)      qs.set('dusun',      params.dusun);
  if (params?.survey_id)  qs.set('survey_id',  params.survey_id);
  return req<ApiStats>(`/statistics?${qs}`);
}

// ─── Users ─────────────────────────────────────────────────────
export async function getUsers(): Promise<ApiUser[]> {
  const body = await req<ApiUser[] | { data: ApiUser[] }>('/users');
  if (Array.isArray(body)) return body;
  return (body as { data: ApiUser[] }).data ?? [];
}

export async function createUser(data: {
  name: string; email: string; password: string; roles?: string[];
}): Promise<ApiUser> {
  return req<ApiUser>('/users', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateUser(id: string, data: Partial<{
  name: string; email: string; password: string; roles: string[];
}>): Promise<ApiUser> {
  return req<ApiUser>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteUser(id: string): Promise<void> {
  await req(`/users/${id}`, { method: 'DELETE' });
}

export async function checkHealth(): Promise<boolean> {
  try {
    await fetch('https://village-survey.up.railway.app/health', { signal: AbortSignal.timeout(5000) });
    return true;
  } catch { return false; }
}