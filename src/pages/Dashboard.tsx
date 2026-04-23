// src/pages/Dashboard.tsx
import { useState, useEffect, useMemo } from 'react';
import { StatCard, DonutChart, Icons } from '../components/UI';
import { WilayahFilterBar } from '../components/WilayahFilter';
import { DUSUN_COLORS } from '../data/mockData';
import { getQuestionnaires, type ApiQuestionnaire } from '../services/api';
import {
  computeStats, computeDusunData, filterByWilayah,
  computePerProvinsi, computePerKabupaten, computePerKecamatan, computePerDesa,
  type ComputedStats, type WilayahFilter,
} from '../services/helpers';
import type { DusunData } from '../types';

type DashboardTab = 'overview' | 'wilayah' | 'per-dusun' | 'petugas';

const AGE_ORDER = ['0–4','5–14','15–24','25–39','40–59','60+'];

const PENDIDIKAN_ORDER = [
  'Tidak/Belum Tamat SD','SD/Sederajat','SMP/Sederajat',
  'SMA/Sederajat','D1/D2/D3','S1/S2/S3',
];

const PEKERJAAN_COLORS = ['#4CAF50', '#2196F3', '#FF9800'];
const STATUS_KAWIN_COLORS = ['#9C27B0', '#2196F3', '#FF9800', '#E91E63'];
const KEBERADAAN_COLORS = ['#4CAF50', '#F44336', '#FF9800', '#9E9E9E'];

function ErrorBanner({ msg, onRetry }: { msg: string; onRetry: () => void }): JSX.Element {
  return (
    <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 18 }}>⚠️</span>
      <span style={{ flex: 1, fontSize: 13, color: '#92400E' }}>{msg}</span>
      <button onClick={onRetry} className="btn btn-secondary btn-sm">Coba Lagi</button>
    </div>
  );
}

// ── Reusable Bar Chart ────────────────────────────────────────────────────────
function HBarChart({ data, colorFn }: {
  data: [string, number][];
  colorFn?: (i: number, label: string) => string;
}): JSX.Element {
  const max = Math.max(1, ...data.map(d => d[1]));
  return (
    <>
      {data.map(([label, count], i) => (
        <div key={label} className="chart-bar-row">
          <div className="chart-bar-label" style={{ fontSize: 10, lineHeight: 1.3 }} title={label}>
            {label.length > 16 ? label.slice(0, 14) + '…' : label}
          </div>
          <div className="chart-bar-track">
            <div className="chart-bar-fill" style={{
              width: `${Math.round((count / max) * 100)}%`,
              background: colorFn ? colorFn(i, label) : DUSUN_COLORS[i % DUSUN_COLORS.length],
            }} />
          </div>
          <div className="chart-bar-val">{count}</div>
        </div>
      ))}
    </>
  );
}

// ── Age Pyramid (visual) ───────────────────────────────────────────────────────
function AgePyramid({ kelompokUsia }: { kelompokUsia: Record<string, number> }): JSX.Element {
  const total = Object.values(kelompokUsia).reduce((a, b) => a + b, 0);
  if (total === 0) return <div style={{ textAlign: 'center', padding: 24, color: 'var(--text3)', fontSize: 13 }}>Belum ada data usia</div>;
  const max = Math.max(1, ...AGE_ORDER.map(k => kelompokUsia[k] ?? 0));
  const colors = ['#E91E63','#E91E63','#9C27B0','#9C27B0','#3F51B5','#3F51B5'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {[...AGE_ORDER].reverse().map((key, i) => {
        const val = kelompokUsia[key] ?? 0;
        const pct = Math.round((val / total) * 100);
        const barW = Math.round((val / max) * 100);
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <div style={{ width: 44, textAlign: 'right', color: 'var(--text2)', fontWeight: 600, flexShrink: 0 }}>{key}</div>
            <div style={{ flex: 1, background: 'var(--border)', borderRadius: 99, height: 18, overflow: 'hidden', position: 'relative' }}>
              <div style={{ height: '100%', width: `${barW}%`, background: colors[5 - i], borderRadius: 99, transition: 'width .6s ease', display: 'flex', alignItems: 'center', paddingLeft: 6 }}>
                {barW > 20 && <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>{val}</span>}
              </div>
            </div>
            <div style={{ width: 36, color: 'var(--text3)', fontSize: 11 }}>{pct}%</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Stacked donut-like pill bar ────────────────────────────────────────────────
function PillBar({ data, colors }: { data: [string, number][]; colors: string[] }): JSX.Element {
  const total = data.reduce((a, b) => a + b[1], 0);
  if (total === 0) return <div style={{ fontSize: 13, color: 'var(--text3)', padding: '8px 0' }}>Belum ada data</div>;
  return (
    <div>
      <div style={{ display: 'flex', height: 18, borderRadius: 99, overflow: 'hidden', gap: 2, marginBottom: 10 }}>
        {data.map(([label, val], i) => (
          <div key={label} style={{ flex: val, background: colors[i % colors.length], minWidth: val > 0 ? 4 : 0 }} title={`${label}: ${val}`} />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
        {data.map(([label, val], i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
            <div style={{ width: 9, height: 9, borderRadius: 2, background: colors[i % colors.length], flexShrink: 0 }} />
            <span style={{ color: 'var(--text2)' }}>{label}</span>
            <span style={{ fontWeight: 700, color: 'var(--text1)' }}>{val}</span>
            <span style={{ color: 'var(--text3)' }}>({Math.round((val / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ stats, dusunData, loading }: { stats: ComputedStats; dusunData: DusunData[]; loading: boolean }): JSX.Element {
  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)' }}>Memuat data...</div>;

  const pekerjaanEntries = Object.entries(stats.perPekerjaan).sort((a, b) => b[1] - a[1]);
  const kawinEntries = Object.entries(stats.perStatusKawin).sort((a, b) => b[1] - a[1]);
  const keberadaanEntries = Object.entries(stats.perKeberadaan).sort((a, b) => b[1] - a[1]);
  const pendidikanEntries = PENDIDIKAN_ORDER
    .filter(k => stats.perPendidikan[k])
    .map(k => [k, stats.perPendidikan[k]] as [string, number]);
  const otherPendidikan = Object.entries(stats.perPendidikan).filter(([k]) => !PENDIDIKAN_ORDER.includes(k));
  const allPendidikan = [...pendidikanEntries, ...otherPendidikan];

  return (
    <div className="two-col">
      {/* Distribusi Jenis Kelamin */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Distribusi Jenis Kelamin</div>
            <div className="card-sub">Total {stats.totalJiwa.toLocaleString()} jiwa</div>
          </div>
        </div>
        {stats.totalJiwa > 0
          ? <DonutChart data={[
              { label: 'Laki-laki', value: stats.lakiLaki,  color: '#2196F3' },
              { label: 'Perempuan', value: stats.perempuan, color: '#E91E63' },
            ]} />
          : <div style={{ textAlign: 'center', padding: 32, color: 'var(--text3)', fontSize: 13 }}>Belum ada data</div>
        }
      </div>

      {/* KK per Dusun */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">KK Terdata per Dusun</div>
            <div className="card-sub">{dusunData.length} dusun tercatat</div>
          </div>
        </div>
        {dusunData.length === 0
          ? <div style={{ textAlign: 'center', padding: 24, color: 'var(--text3)', fontSize: 13 }}>Belum ada data</div>
          : dusunData.map((d, i) => (
            <div key={d.name} className="chart-bar-row">
              <div className="chart-bar-label" style={{ fontSize: 11 }} title={d.name}>
                {d.name.length > 14 ? d.name.slice(0, 12) + '…' : d.name}
              </div>
              <div className="chart-bar-track">
                <div className="chart-bar-fill" style={{ width: `${d.progress}%`, background: DUSUN_COLORS[i % DUSUN_COLORS.length] }} />
              </div>
              <div className="chart-bar-val">{d.kk}</div>
            </div>
          ))}
      </div>

      {/* Distribusi Pendidikan */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Tingkat Pendidikan</div>
            <div className="card-sub">Distribusi pendidikan terakhir warga</div>
          </div>
        </div>
        {allPendidikan.length === 0
          ? <div style={{ textAlign: 'center', padding: 24, color: 'var(--text3)', fontSize: 13 }}>Belum ada data</div>
          : <HBarChart data={allPendidikan} />
        }
      </div>

      {/* Distribusi Usia Pyramid */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Piramida Usia</div>
            <div className="card-sub">Distribusi kelompok umur penduduk</div>
          </div>
        </div>
        <AgePyramid kelompokUsia={stats.kelompokUsia} />
      </div>

      {/* Status Pekerjaan */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Status Pekerjaan</div>
            <div className="card-sub">Kondisi ketenagakerjaan warga</div>
          </div>
        </div>
        {pekerjaanEntries.length === 0
          ? <div style={{ textAlign: 'center', padding: 24, color: 'var(--text3)', fontSize: 13 }}>Belum ada data</div>
          : <>
              <PillBar data={pekerjaanEntries} colors={PEKERJAAN_COLORS} />
              <div style={{ marginTop: 16 }}>
                <HBarChart data={pekerjaanEntries} colorFn={(i) => PEKERJAAN_COLORS[i % PEKERJAAN_COLORS.length]} />
              </div>
            </>
        }
      </div>

      {/* Status Perkawinan */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Status Perkawinan</div>
            <div className="card-sub">Komposisi status kawin warga</div>
          </div>
        </div>
        {kawinEntries.length === 0
          ? <div style={{ textAlign: 'center', padding: 24, color: 'var(--text3)', fontSize: 13 }}>Belum ada data</div>
          : <>
              <PillBar data={kawinEntries} colors={STATUS_KAWIN_COLORS} />
              <div style={{ marginTop: 16 }}>
                <HBarChart data={kawinEntries} colorFn={(i) => STATUS_KAWIN_COLORS[i % STATUS_KAWIN_COLORS.length]} />
              </div>
            </>
        }
      </div>

      {/* Keberadaan Penduduk */}
      {keberadaanEntries.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Keberadaan Penduduk</div>
              <div className="card-sub">Status domisili warga</div>
            </div>
          </div>
          <PillBar data={keberadaanEntries} colors={KEBERADAAN_COLORS} />
          <div style={{ marginTop: 16 }}>
            <HBarChart data={keberadaanEntries} colorFn={(i) => KEBERADAAN_COLORS[i % KEBERADAAN_COLORS.length]} />
          </div>
        </div>
      )}

      {/* Disabilitas */}
      {Object.keys(stats.perDisabilitas).length > 0 && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Data Disabilitas</div>
              <div className="card-sub">Warga dengan disabilitas</div>
            </div>
          </div>
          <HBarChart
            data={Object.entries(stats.perDisabilitas).sort((a,b) => b[1]-a[1])}
            colorFn={(i) => ['#FF9800','#F44336','#9C27B0','#E91E63','#3F51B5','#00BCD4','#4CAF50','#FF5722'][i % 8]}
          />
        </div>
      )}
    </div>
  );
}

// ── Wilayah Tab ───────────────────────────────────────────────────────────────
function WilayahTab({ questionnaires, currentFilter, loading }: {
  questionnaires: ApiQuestionnaire[];
  currentFilter: WilayahFilter;
  loading: boolean;
}): JSX.Element {
  if (loading) return <div className="table-wrap"><div style={{ padding: 32, textAlign: 'center', color: 'var(--text3)' }}>Memuat data...</div></div>;

  // Determine which level to show based on active filter
  const level = currentFilter.kodeDesa ? 'dusun'
    : currentFilter.kodeKecamatan ? 'desa'
    : currentFilter.kodeKabupaten ? 'kecamatan'
    : currentFilter.kodeProvinsi ? 'kabupaten'
    : 'provinsi';

  const levelLabel = level === 'dusun' ? 'Dusun' : level === 'desa' ? 'Desa' : level === 'kecamatan' ? 'Kecamatan' : level === 'kabupaten' ? 'Kabupaten/Kota' : 'Provinsi';

  const dusunItems = useMemo(() =>
    computeDusunData(questionnaires).map(d => ({ kode: d.name, nama: d.name, kk: d.kk, jiwa: d.jiwa, lakiLaki: d.lakiLaki ?? 0, perempuan: d.perempuan ?? 0 })),
    [questionnaires]
  );

  const items = level === 'dusun'
    ? dusunItems
    : level === 'desa'    ? computePerDesa(questionnaires)
    : level === 'kecamatan' ? computePerKecamatan(questionnaires)
    : level === 'kabupaten' ? computePerKabupaten(questionnaires)
    : computePerProvinsi(questionnaires);

  const maxKK = Math.max(1, ...items.map(i => i.kk));

  return (
    <div>
      <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text2)', fontWeight: 600 }}>
        Rekapitulasi per {levelLabel}
        <span style={{ marginLeft: 8, fontWeight: 400, color: 'var(--text3)' }}>({items.length} area)</span>
      </div>
      {items.length === 0 ? (
        <div className="empty"><Icons.Home /><p>Tidak ada data wilayah</p><span>Pilih filter wilayah di atas</span></div>
      ) : (
        <>
          {/* Visual bar chart */}
          <div className="card" style={{ marginBottom: 16 }}>
            {items.slice(0, 15).map((item, i) => (
              <div key={item.kode} className="chart-bar-row">
                <div className="chart-bar-label" style={{ fontSize: 11 }} title={item.nama}>
                  {item.nama.length > 18 ? item.nama.slice(0, 16) + '…' : item.nama}
                </div>
                <div className="chart-bar-track">
                  <div className="chart-bar-fill" style={{ width: `${Math.round((item.kk / maxKK) * 100)}%`, background: DUSUN_COLORS[i % DUSUN_COLORS.length] }} />
                </div>
                <div className="chart-bar-val">{item.kk} KK</div>
              </div>
            ))}
          </div>
          {/* Table */}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{levelLabel}</th>
                  <th>KK Terdata</th>
                  <th>Total Jiwa</th>
                  <th>Laki-laki</th>
                  <th>Perempuan</th>
                  <th>Rasio L/P</th>
                  <th>Proporsi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const rasio = item.perempuan > 0 ? (item.lakiLaki / item.perempuan).toFixed(2) : '—';
                  return (
                    <tr key={item.kode}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: DUSUN_COLORS[i % DUSUN_COLORS.length], flexShrink: 0 }} />
                          <span style={{ fontWeight: 600 }}>{item.nama}</span>
                        </div>
                      </td>
                      <td><span style={{ fontWeight: 700, color: 'var(--blue)' }}>{item.kk}</span></td>
                      <td>{item.jiwa}</td>
                      <td><span style={{ color: 'var(--blue-mid)' }}>{item.lakiLaki}</span></td>
                      <td><span style={{ color: '#E91E63' }}>{item.perempuan}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text2)' }}>{rasio}</td>
                      <td style={{ minWidth: 140 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-bar" style={{ flex: 1 }}>
                            <div className="progress-fill" style={{ width: `${Math.round((item.kk / maxKK) * 100)}%`, background: DUSUN_COLORS[i % DUSUN_COLORS.length] }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: DUSUN_COLORS[i % DUSUN_COLORS.length] }}>
                            {Math.round((item.kk / maxKK) * 100)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                <tr style={{ fontWeight: 700, background: 'var(--bg)' }}>
                  <td>Total</td>
                  <td style={{ color: 'var(--blue)' }}>{items.reduce((s, i) => s + i.kk, 0)}</td>
                  <td>{items.reduce((s, i) => s + i.jiwa, 0)}</td>
                  <td style={{ color: 'var(--blue-mid)' }}>{items.reduce((s, i) => s + i.lakiLaki, 0)}</td>
                  <td style={{ color: '#E91E63' }}>{items.reduce((s, i) => s + i.perempuan, 0)}</td>
                  <td>—</td>
                  <td>—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ── Per Dusun Tab ─────────────────────────────────────────────────────────────
function PerDusunTab({ dusunData, loading }: { dusunData: DusunData[]; loading: boolean }): JSX.Element {
  if (loading) return <div className="table-wrap"><div style={{ padding: 32, textAlign: 'center', color: 'var(--text3)' }}>Memuat data...</div></div>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Dusun / Lingkungan</th><th>KK Terdata</th><th>Total Jiwa</th><th>L / P</th><th>Rasio L/P</th><th>Proporsi</th></tr>
        </thead>
        <tbody>
          {dusunData.length === 0 ? (
            <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text3)', padding: 32 }}>Belum ada data</td></tr>
          ) : dusunData.map((d, i) => {
            const rasio = (d.perempuan ?? 0) > 0 ? ((d.lakiLaki ?? 0) / (d.perempuan ?? 1)).toFixed(2) : '—';
            return (
              <tr key={d.name}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: DUSUN_COLORS[i % DUSUN_COLORS.length], flexShrink: 0 }} />
                    <span style={{ fontWeight: 600 }}>{d.name}</span>
                  </div>
                </td>
                <td><span style={{ fontWeight: 700, color: 'var(--blue)' }}>{d.kk}</span></td>
                <td>{d.jiwa}</td>
                <td>
                  <span style={{ color: 'var(--blue-mid)' }}>{d.lakiLaki ?? '–'}</span>
                  {' / '}
                  <span style={{ color: '#E91E63' }}>{d.perempuan ?? '–'}</span>
                </td>
                <td style={{ fontSize: 12, color: 'var(--text2)' }}>{rasio}</td>
                <td style={{ minWidth: 140 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="progress-bar" style={{ flex: 1 }}>
                      <div className="progress-fill" style={{ width: `${d.progress}%`, background: DUSUN_COLORS[i % DUSUN_COLORS.length] }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: DUSUN_COLORS[i % DUSUN_COLORS.length] }}>{d.progress}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Per Petugas Tab ───────────────────────────────────────────────────────────
function PerPetugasTab({ stats, loading }: { stats: ComputedStats; loading: boolean }): JSX.Element {
  if (loading) return <div className="table-wrap"><div style={{ padding: 32, textAlign: 'center', color: 'var(--text3)' }}>Memuat data...</div></div>;
  const petugasEntries = Object.entries(stats.perPetugas).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...petugasEntries.map(e => e[1]));
  const total = petugasEntries.reduce((s, e) => s + e[1], 0);
  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">Distribusi Pendataan per Petugas</div>
          <div className="card-sub">{petugasEntries.length} petugas aktif</div>
        </div>
        {petugasEntries.map(([name, count], i) => {
          const color = DUSUN_COLORS[i % DUSUN_COLORS.length];
          return (
            <div key={name} className="chart-bar-row">
              <div className="chart-bar-label" style={{ fontSize: 11 }} title={name}>
                {name.split(' ')[0]}
              </div>
              <div className="chart-bar-track">
                <div className="chart-bar-fill" style={{ width: `${Math.round((count / max) * 100)}%`, background: color }} />
              </div>
              <div className="chart-bar-val">{count}</div>
            </div>
          );
        })}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Petugas</th><th>KK Didata</th><th>Kontribusi</th><th>Proporsi</th></tr>
          </thead>
          <tbody>
            {petugasEntries.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text3)', padding: 32 }}>Belum ada data</td></tr>
            ) : petugasEntries.map(([name, count], i) => {
              const color = DUSUN_COLORS[i % DUSUN_COLORS.length];
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <tr key={name}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar" style={{ background: color }}>
                        {name.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <span className="td-name">{name}</span>
                    </div>
                  </td>
                  <td><span style={{ fontWeight: 700 }}>{count}</span> <span style={{ color: 'var(--text3)', fontSize: 12 }}>KK</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text3)' }}>{pct}% dari total</td>
                  <td style={{ minWidth: 140 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className="progress-bar" style={{ flex: 1 }}>
                        <div className="progress-fill" style={{ width: `${Math.round((count / max) * 100)}%`, background: color }} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>{Math.round((count / max) * 100)}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard(): JSX.Element {
  const [tab, setTab] = useState<DashboardTab>('overview');
  const [wilayahFilter, setWilayahFilter] = useState<WilayahFilter>({});
  const [allQuestionnaires, setAllQuestionnaires] = useState<ApiQuestionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tabs: [DashboardTab, string][] = [
    ['overview', 'Ringkasan'],
    ['wilayah', 'Per Wilayah'],
    ['per-dusun', 'Per Dusun'],
    ['petugas', 'Per Petugas'],
  ];

  async function fetchData(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const data = await getQuestionnaires({ limit: 500 });
      setAllQuestionnaires(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void fetchData(); }, []);

  const filtered = useMemo(() => filterByWilayah(allQuestionnaires, wilayahFilter), [allQuestionnaires, wilayahFilter]);
  const stats = useMemo(() => computeStats(filtered), [filtered]);
  const dusunData = useMemo(() => computeDusunData(filtered), [filtered]);

  // Determine level label for header
  const filterSummary = wilayahFilter.dusun ? `Dusun: ${wilayahFilter.dusun}`
    : wilayahFilter.kodeDesa ? 'Level Desa'
    : wilayahFilter.kodeKecamatan ? 'Level Kecamatan'
    : wilayahFilter.kodeKabupaten ? 'Level Kabupaten'
    : wilayahFilter.kodeProvinsi ? 'Level Provinsi'
    : 'Semua Wilayah';

  return (
    <div>
      {error && <ErrorBanner msg={error} onRetry={fetchData} />}

      {/* Filter + Tabs bar */}
      <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div className="tabs" style={{ marginBottom: 0, flex: 'none' }}>
            {tabs.map(([t, l]) => (
              <div key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{l}</div>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            {Object.keys(wilayahFilter).length > 0 && (
              <div style={{ fontSize: 11, color: 'var(--blue)', background: 'var(--blue-light)', padding: '4px 10px', borderRadius: 20, fontWeight: 600 }}>
                {filterSummary}
              </div>
            )}
            <button className="btn btn-secondary btn-sm" onClick={fetchData} disabled={loading}>
              ↺ Refresh
            </button>
          </div>
        </div>
        {/* Wilayah filter bar */}
        <div className="card" style={{ padding: '12px 16px' }}>
          <WilayahFilterBar
            questionnaires={allQuestionnaires}
            value={wilayahFilter}
            onChange={setWilayahFilter}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard label="Total KK Terdata"  value={loading ? '...' : stats.totalKK.toLocaleString()}   icon={<Icons.Home />}   color="blue"   />
        <StatCard label="Total Jiwa"         value={loading ? '...' : stats.totalJiwa.toLocaleString()} icon={<Icons.People />} color="green"  />
        <StatCard label="Laki-laki"          value={loading ? '...' : stats.lakiLaki.toLocaleString()}  icon={<Icons.Check />}  color="purple" />
        <StatCard label="Perempuan"          value={loading ? '...' : stats.perempuan.toLocaleString()} icon={<Icons.Sync />}   color="orange" />
      </div>

      {tab === 'overview'  && <OverviewTab stats={stats} dusunData={dusunData} loading={loading} />}
      {tab === 'wilayah'   && <WilayahTab questionnaires={filtered} currentFilter={wilayahFilter} loading={loading} />}
      {tab === 'per-dusun' && <PerDusunTab dusunData={dusunData} loading={loading} />}
      {tab === 'petugas'   && <PerPetugasTab stats={stats} loading={loading} />}
    </div>
  );
}