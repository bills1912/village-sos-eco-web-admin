// src/services/helpers.ts
import type { ApiQuestionnaire, ApiAnggota, ApiUser } from './api';
import type { Kuesioner, DusunData, User } from '../types';
import { DUSUN_COLORS } from '../data/mockData';

export function getDusunLabel(dusun: string | null | undefined): string {
  if (!dusun || dusun.trim() === '') return 'Tidak Diketahui';
  return dusun.trim();
}

export function extractDusunOptions(qs: ApiQuestionnaire[]): string[] {
  const set = new Set<string>();
  for (const q of qs) {
    const label = getDusunLabel(q.dusun);
    if (label !== 'Tidak Diketahui') set.add(label);
  }
  return [...set].sort();
}

// ── Wilayah hierarchy extraction ─────────────────────────────────────────────

export interface WilayahOption { value: string; label: string; }

export function extractProvinsiOptions(qs: ApiQuestionnaire[]): WilayahOption[] {
  const map = new Map<string, string>();
  for (const q of qs) {
    if (q.kode_provinsi && q.nama_provinsi) map.set(q.kode_provinsi, q.nama_provinsi);
  }
  return [...map.entries()].map(([v, l]) => ({ value: v, label: l })).sort((a, b) => a.label.localeCompare(b.label));
}

export function extractKabupatenOptions(qs: ApiQuestionnaire[], kodeProvinsi?: string): WilayahOption[] {
  const map = new Map<string, string>();
  for (const q of qs) {
    if (kodeProvinsi && q.kode_provinsi !== kodeProvinsi) continue;
    if (q.kode_kabupaten && q.nama_kabupaten) map.set(q.kode_kabupaten, q.nama_kabupaten);
  }
  return [...map.entries()].map(([v, l]) => ({ value: v, label: l })).sort((a, b) => a.label.localeCompare(b.label));
}

export function extractKecamatanOptions(qs: ApiQuestionnaire[], kodeKabupaten?: string): WilayahOption[] {
  const map = new Map<string, string>();
  for (const q of qs) {
    if (kodeKabupaten && q.kode_kabupaten !== kodeKabupaten) continue;
    if (q.kode_kecamatan && q.nama_kecamatan) map.set(q.kode_kecamatan, q.nama_kecamatan);
  }
  return [...map.entries()].map(([v, l]) => ({ value: v, label: l })).sort((a, b) => a.label.localeCompare(b.label));
}

export function extractDesaOptions(qs: ApiQuestionnaire[], kodeKecamatan?: string): WilayahOption[] {
  const map = new Map<string, string>();
  for (const q of qs) {
    if (kodeKecamatan && q.kode_kecamatan !== kodeKecamatan) continue;
    if (q.kode_desa && q.nama_desa) map.set(q.kode_desa, q.nama_desa);
  }
  return [...map.entries()].map(([v, l]) => ({ value: v, label: l })).sort((a, b) => a.label.localeCompare(b.label));
}

// ── Filter by wilayah ─────────────────────────────────────────────────────────

export interface WilayahFilter {
  kodeProvinsi?: string;
  kodeKabupaten?: string;
  kodeKecamatan?: string;
  kodeDesa?: string;
  dusun?: string;
}

export function filterByWilayah(qs: ApiQuestionnaire[], f: WilayahFilter): ApiQuestionnaire[] {
  return qs.filter(q => {
    if (f.kodeProvinsi  && q.kode_provinsi  !== f.kodeProvinsi)  return false;
    if (f.kodeKabupaten && q.kode_kabupaten !== f.kodeKabupaten) return false;
    if (f.kodeKecamatan && q.kode_kecamatan !== f.kodeKecamatan) return false;
    if (f.kodeDesa      && q.kode_desa      !== f.kodeDesa)      return false;
    if (f.dusun         && getDusunLabel(q.dusun) !== f.dusun)   return false;
    return true;
  });
}

// ── Labels ────────────────────────────────────────────────────────────────────

const PENDIDIKAN_LABEL: Record<string, string> = {
  '1': 'Tidak/Belum Tamat SD', '2': 'SD/Sederajat', '3': 'SMP/Sederajat',
  '4': 'SMA/Sederajat', '5': 'D1/D2/D3', '6': 'S1/S2/S3',
};

const KEBERADAAN_LABEL: Record<string, string> = {
  '1': 'Berdomisili', '2': 'Sudah Pindah', '3': 'KK Baru', '4': 'Meninggal',
};

const KAWIN_LABEL: Record<string, string> = {
  '1': 'Kawin', '2': 'Belum Kawin', '3': 'Cerai Hidup', '4': 'Cerai Mati',
};

const DISABILITAS_LABEL: Record<string, string> = {
  '1': 'Penglihatan', '2': 'Pendengaran', '3': 'Berjalan/Naik Tangga',
  '4': 'Tangan/Jari', '5': 'Mengingat/Konsentrasi', '6': 'Merawat Diri',
  '7': 'Komunikasi', '8': 'Perilaku/Emosi',
};

const STATUS_KK_LABEL: Record<string, string> = {
  '1': 'KK Desa', '2': 'Bukan KK Desa', '3': 'Belum Punya KK',
};

const PEKERJAAN_LABEL: Record<string, string> = {
  '1': 'Masih Bersekolah', '2': 'Sudah Bekerja', '3': 'Tidak Bekerja',
};

// ── Core conversion ───────────────────────────────────────────────────────────

export function getKepalaKeluarga(anggota: ApiAnggota[]): ApiAnggota | undefined {
  return anggota.find(a => a.r_203 === '1') ?? anggota[0];
}

export function toKuesionerList(qs: ApiQuestionnaire[]): Kuesioner[] {
  return qs.map((q, idx) => {
    const kk = getKepalaKeluarga(q.r_200);
    const dusunLabel = getDusunLabel(q.dusun);
    return {
      id: q.id ?? `local-${idx}`,
      nama: kk?.r_201 ?? '(tanpa nama)',
      noKk: q.r_102,
      dusun: dusunLabel,
      anggota: q.r_200.length,
      petugas: q.nama_petugas,
      status: 'synced' as const,
      waktu: q.created_at ? formatDate(q.created_at) : (q.waktu_pendataan ?? '-'),
    };
  });
}

export function computeDusunData(qs: ApiQuestionnaire[]): DusunData[] {
  const dusunMap: Record<string, { kk: number; jiwa: number; l: number; p: number }> = {};
  for (const q of qs) {
    const label = getDusunLabel(q.dusun);
    if (!dusunMap[label]) dusunMap[label] = { kk: 0, jiwa: 0, l: 0, p: 0 };
    dusunMap[label].kk++;
    for (const a of q.r_200) {
      dusunMap[label].jiwa++;
      if (a.r_205 === '1') dusunMap[label].l++;
      if (a.r_205 === '2') dusunMap[label].p++;
    }
  }
  const sortedKeys = Object.keys(dusunMap).sort();
  const maxKK = Math.max(1, ...Object.values(dusunMap).map(d => d.kk));
  return sortedKeys.map((name, i) => {
    const d = dusunMap[name];
    return {
      name, kk: d.kk, jiwa: d.jiwa, lakiLaki: d.l, perempuan: d.p,
      target: Math.max(d.kk, Math.round(maxKK * 1.1)),
      progress: maxKK > 0 ? Math.min(100, Math.round((d.kk / maxKK) * 100)) : 0,
      color: DUSUN_COLORS[i % DUSUN_COLORS.length],
    };
  });
}

// ── Wilayah-level aggregation (for regional drill-down) ───────────────────────

export interface WilayahAggItem {
  kode: string;
  nama: string;
  kk: number;
  jiwa: number;
  lakiLaki: number;
  perempuan: number;
}

export function computePerProvinsi(qs: ApiQuestionnaire[]): WilayahAggItem[] {
  return _aggregateBy(qs, q => q.kode_provinsi ?? '', q => q.nama_provinsi ?? q.kode_provinsi ?? '?');
}

export function computePerKabupaten(qs: ApiQuestionnaire[]): WilayahAggItem[] {
  return _aggregateBy(qs, q => q.kode_kabupaten ?? '', q => q.nama_kabupaten ?? q.kode_kabupaten ?? '?');
}

export function computePerKecamatan(qs: ApiQuestionnaire[]): WilayahAggItem[] {
  return _aggregateBy(qs, q => q.kode_kecamatan ?? '', q => q.nama_kecamatan ?? q.kode_kecamatan ?? '?');
}

export function computePerDesa(qs: ApiQuestionnaire[]): WilayahAggItem[] {
  return _aggregateBy(qs, q => q.kode_desa ?? '', q => q.nama_desa ?? q.kode_desa ?? '?');
}

function _aggregateBy(
  qs: ApiQuestionnaire[],
  keyFn: (q: ApiQuestionnaire) => string,
  nameFn: (q: ApiQuestionnaire) => string,
): WilayahAggItem[] {
  const map = new Map<string, WilayahAggItem>();
  for (const q of qs) {
    const key = keyFn(q);
    if (!key) continue;
    if (!map.has(key)) map.set(key, { kode: key, nama: nameFn(q), kk: 0, jiwa: 0, lakiLaki: 0, perempuan: 0 });
    const item = map.get(key)!;
    item.kk++;
    for (const a of q.r_200) {
      item.jiwa++;
      if (a.r_205 === '1') item.lakiLaki++;
      if (a.r_205 === '2') item.perempuan++;
    }
  }
  return [...map.values()].sort((a, b) => b.kk - a.kk);
}

// ── Full stats ────────────────────────────────────────────────────────────────

export interface ComputedStats {
  totalKK: number;
  totalJiwa: number;
  lakiLaki: number;
  perempuan: number;
  perDusun: Record<string, number>;
  perPetugas: Record<string, number>;
  perPendidikan: Record<string, number>;
  perPekerjaan: Record<string, number>;
  perStatusKawin: Record<string, number>;
  perKeberadaan: Record<string, number>;
  perDisabilitas: Record<string, number>;
  perKewarganegaraan: Record<string, number>;
  perStatusKk: Record<string, number>;
  kelompokUsia: Record<string, number>;
  // Wilayah summaries
  perProvinsi: Record<string, number>;
  perKabupaten: Record<string, number>;
  perKecamatan: Record<string, number>;
  perDesa: Record<string, number>;
}

export function computeStats(qs: ApiQuestionnaire[]): ComputedStats {
  const s: ComputedStats = {
    totalKK: qs.length, totalJiwa: 0, lakiLaki: 0, perempuan: 0,
    perDusun: {}, perPetugas: {}, perPendidikan: {}, perPekerjaan: {},
    perStatusKawin: {}, perKeberadaan: {}, perDisabilitas: {}, perKewarganegaraan: {},
    perStatusKk: {}, kelompokUsia: {},
    perProvinsi: {}, perKabupaten: {}, perKecamatan: {}, perDesa: {},
  };

  for (const q of qs) {
    inc(s.perDusun, getDusunLabel(q.dusun));
    inc(s.perPetugas, q.nama_petugas);
    if (q.r_103) inc(s.perStatusKk, STATUS_KK_LABEL[q.r_103] ?? q.r_103);
    if (q.nama_provinsi)  inc(s.perProvinsi,  q.nama_provinsi);
    if (q.nama_kabupaten) inc(s.perKabupaten, q.nama_kabupaten);
    if (q.nama_kecamatan) inc(s.perKecamatan, q.nama_kecamatan);
    if (q.nama_desa)      inc(s.perDesa,      q.nama_desa);

    for (const a of q.r_200) {
      s.totalJiwa++;
      if (a.r_205 === '1') s.lakiLaki++;
      if (a.r_205 === '2') s.perempuan++;
      if (a.r_212) inc(s.perPendidikan, PENDIDIKAN_LABEL[a.r_212] ?? a.r_212);
      if (a.r_300_pekerjaan) inc(s.perPekerjaan, PEKERJAAN_LABEL[a.r_300_pekerjaan] ?? a.r_300_pekerjaan);
      if (a.r_204) inc(s.perStatusKawin, KAWIN_LABEL[a.r_204] ?? a.r_204);
      if (a.r_210) inc(s.perKeberadaan, KEBERADAAN_LABEL[a.r_210] ?? a.r_210);
      if (a.r_209) inc(s.perKewarganegaraan, a.r_209 === '1' ? 'WNI' : 'WNA');
      if (a.r_211) for (const code of a.r_211) inc(s.perDisabilitas, DISABILITAS_LABEL[code] ?? code);
      if (a.r_207_usia != null) {
        const u = a.r_207_usia;
        const bucket = u < 5 ? '0–4' : u < 15 ? '5–14' : u < 25 ? '15–24'
          : u < 40 ? '25–39' : u < 60 ? '40–59' : '60+';
        inc(s.kelompokUsia, bucket);
      }
    }
  }
  return s;
}

function inc(obj: Record<string, number>, key: string): void {
  obj[key] = (obj[key] ?? 0) + 1;
}

export function toUserList(users: ApiUser[]): User[] {
  return users.map((u, idx) => {
    const roles = u.roles?.map(r => (typeof r === 'string' ? r : r.name)) ?? [];
    const role = roles.includes('super_admin') ? 'super_admin' as const
      : roles.includes('admin') ? 'admin' as const : 'petugas' as const;
    return {
      id: idx + 1, apiId: u.id, name: u.name, email: u.email, role,
      dusun: 'Semua', status: 'active' as const, kkCount: 0, lastActive: '-',
      initials: initials(u.name),
      joinDate: u.created_at ? formatDate(u.created_at) : '-',
    };
  });
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch { return iso; }
}