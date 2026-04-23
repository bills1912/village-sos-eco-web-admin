// src/pages/Laporan.tsx
import { useState, useEffect, useMemo } from 'react';
import { DUSUN_COLORS } from '../data/mockData';
import { getQuestionnaires, type ApiQuestionnaire } from '../services/api';
import {
  computeStats, computeDusunData, filterByWilayah,
  computePerProvinsi, computePerKabupaten, computePerKecamatan, computePerDesa,
  type WilayahFilter,
} from '../services/helpers';
// import { CustomSelect } from '../components/UI';
import { WilayahFilterBar } from '../components/WilayahFilter';

const AGE_ORDER = ['0–4','5–14','15–24','25–39','40–59','60+'];
const PENDIDIKAN_ORDER = ['Tidak/Belum Tamat SD','SD/Sederajat','SMP/Sederajat','SMA/Sederajat','D1/D2/D3','S1/S2/S3'];

// ── Mini chart components ─────────────────────────────────────────────────────

function MiniBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }): JSX.Element {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
        <span style={{ color: 'var(--text2)' }}>{label}</span>
        <span style={{ fontWeight: 700, color }}>{count.toLocaleString()} <span style={{ color: 'var(--text3)', fontWeight: 400 }}>({pct}%)</span></span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }): JSX.Element {
  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      <div style={{ fontSize: 26, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

// ── Grouped bar (side-by-side for gender) ─────────────────────────────────────
function GenderTable({ items }: { items: { nama: string; kk: number; jiwa: number; l: number; p: number }[] }): JSX.Element {
  const total = items.reduce((s, i) => s + i.kk, 0);
  // const maxKK = Math.max(1, ...items.map(i => i.kk));
  return (
    <div>
      {items.map((item) => (
        <div key={item.nama} style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
            <span style={{ fontWeight: 600, color: 'var(--text1)' }}>{item.nama}</span>
            <span style={{ color: 'var(--text3)' }}>{item.kk} KK · {item.jiwa} jiwa</span>
          </div>
          <div style={{ display: 'flex', gap: 2, height: 12, borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ flex: item.l, background: '#2196F3', minWidth: item.l > 0 ? 2 : 0 }} />
            <div style={{ flex: item.p, background: '#E91E63', minWidth: item.p > 0 ? 2 : 0 }} />
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 10, marginTop: 2, color: 'var(--text3)' }}>
            <span style={{ color: '#2196F3' }}>L: {item.l}</span>
            <span style={{ color: '#E91E63' }}>P: {item.p}</span>
            <span style={{ marginLeft: 'auto' }}>{total > 0 ? Math.round((item.kk / total) * 100) : 0}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Laporan(): JSX.Element {
  const [allQuestionnaires, setAllQuestionnaires] = useState<ApiQuestionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wilayahFilter, setWilayahFilter] = useState<WilayahFilter>({});

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

  // Determine regional breakdown level
  const hasProvinsi  = Object.keys(stats.perProvinsi).length > 0;
  const hasKabupaten = Object.keys(stats.perKabupaten).length > 0;
  const hasKecamatan = Object.keys(stats.perKecamatan).length > 0;
  const hasDesa      = Object.keys(stats.perDesa).length > 0;
  // const hasMultiDesa = Object.keys(stats.perDesa).length > 1;

  const perProvinsiItems  = computePerProvinsi(filtered);
  const perKabupatenItems = computePerKabupaten(filtered);
  const perKecamatanItems = computePerKecamatan(filtered);
  const perDesaItems      = computePerDesa(filtered);

  if (loading) return (
    <div style={{ padding: 48, textAlign: 'center', color: 'var(--text3)' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⟳</div>
      <div>Memuat laporan...</div>
    </div>
  );

  const pendidikanData = PENDIDIKAN_ORDER
    .filter(k => stats.perPendidikan[k])
    .map(k => ({ label: k, val: stats.perPendidikan[k] }));
  const otherPendidikan = Object.entries(stats.perPendidikan).filter(([k]) => !PENDIDIKAN_ORDER.includes(k));
  const allPendidikan = [...pendidikanData, ...otherPendidikan.map(([k, v]) => ({ label: k, val: v }))];

  const pekerjaanColors  = ['#4CAF50', '#2196F3', '#FF9800', '#9E9E9E'];
  const kawinColors      = ['#9C27B0', '#2196F3', '#FF9800', '#E91E63'];
  const keberadaanColors = ['#4CAF50', '#F44336', '#FF9800', '#9E9E9E'];
  const pendidikanColors = ['#E53935','#FB8C00','#F9A825','#43A047','#1E88E5','#8E24AA'];
  const disabilitasColors = ['#FF9800','#F44336','#9C27B0','#E91E63','#3F51B5','#00BCD4','#4CAF50','#FF5722'];

  return (
    <div>
      {error && (
        <div style={{ background: '#FEF3C7', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <span>⚠️</span>
          <span style={{ flex: 1, fontSize: 13, color: '#92400E' }}>{error}</span>
          <button onClick={fetchData} className="btn btn-secondary btn-sm">Coba Lagi</button>
        </div>
      )}

      {/* Filter bar */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text1)' }}>Filter Laporan</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {Object.keys(wilayahFilter).length > 0 && (
              <button className="btn btn-secondary btn-sm" style={{ fontSize: 11, color: 'var(--red)', borderColor: 'var(--red)' }}
                onClick={() => setWilayahFilter({})}>✕ Reset</button>
            )}
            <button className="btn btn-secondary btn-sm" onClick={fetchData}>↺ Refresh</button>
          </div>
        </div>
        <WilayahFilterBar questionnaires={allQuestionnaires} value={wilayahFilter} onChange={setWilayahFilter} />
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        <SummaryCard icon="🏠" label="Total KK Terdata"   value={stats.totalKK.toLocaleString()}   color="var(--blue)"   />
        <SummaryCard icon="👥" label="Total Jiwa"          value={stats.totalJiwa.toLocaleString()}  color="var(--green)"  />
        <SummaryCard icon="👨" label="Laki-laki"           value={stats.lakiLaki.toLocaleString()}   color="#2196F3"       />
        <SummaryCard icon="👩" label="Perempuan"           value={stats.perempuan.toLocaleString()}  color="#E91E63"       />
      </div>

      {/* ── Section 1: Regional breakdown ── */}
      {(hasProvinsi || hasKabupaten || hasKecamatan || hasDesa) && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)', marginBottom: 12, paddingLeft: 2 }}>
            📍 Distribusi Wilayah
          </div>
          <div className="two-col">
            {perProvinsiItems.length > 1 && (
              <div className="card">
                <div className="card-header"><div className="card-title">Per Provinsi</div></div>
                <GenderTable items={perProvinsiItems.map(i => ({ nama: i.nama, kk: i.kk, jiwa: i.jiwa, l: i.lakiLaki, p: i.perempuan }))} />
              </div>
            )}
            {perKabupatenItems.length > 1 && (
              <div className="card">
                <div className="card-header"><div className="card-title">Per Kabupaten/Kota</div></div>
                <GenderTable items={perKabupatenItems.map(i => ({ nama: i.nama, kk: i.kk, jiwa: i.jiwa, l: i.lakiLaki, p: i.perempuan }))} />
              </div>
            )}
            {perKecamatanItems.length > 1 && (
              <div className="card">
                <div className="card-header"><div className="card-title">Per Kecamatan</div></div>
                <GenderTable items={perKecamatanItems.map(i => ({ nama: i.nama, kk: i.kk, jiwa: i.jiwa, l: i.lakiLaki, p: i.perempuan }))} />
              </div>
            )}
            {perDesaItems.length > 1 && (
              <div className="card">
                <div className="card-header"><div className="card-title">Per Desa/Kelurahan</div></div>
                <GenderTable items={perDesaItems.map(i => ({ nama: i.nama, kk: i.kk, jiwa: i.jiwa, l: i.lakiLaki, p: i.perempuan }))} />
              </div>
            )}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Per Dusun / Lingkungan</div>
                <div className="card-sub">{dusunData.length} area tercatat</div>
              </div>
              {dusunData.length === 0
                ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Belum ada data</div>
                : <GenderTable items={dusunData.map(d => ({ nama: d.name, kk: d.kk, jiwa: d.jiwa, l: d.lakiLaki ?? 0, p: d.perempuan ?? 0 }))} />
              }
            </div>
          </div>
        </div>
      )}

      {/* ── Section 2: Demografi ── */}
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)', marginBottom: 12, paddingLeft: 2 }}>
        👤 Demografi Penduduk
      </div>
      <div className="two-col" style={{ marginBottom: 20 }}>
        {/* Piramida Usia */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Distribusi Kelompok Usia</div>
            <div className="card-sub">Piramida umur penduduk</div>
          </div>
          {Object.keys(stats.kelompokUsia).length === 0
            ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Belum ada data usia</div>
            : (
              <>
                {/* Bar chart */}
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, padding: '8px 0', marginBottom: 12 }}>
                  {AGE_ORDER.filter(k => k in stats.kelompokUsia).map((key, i) => {
                    const val = stats.kelompokUsia[key] ?? 0;
                    const max = Math.max(1, ...AGE_ORDER.map(k => stats.kelompokUsia[k] ?? 0));
                    const h = Math.max(4, Math.round((val / max) * 100));
                    const colors = ['#E91E63','#E91E63','#9C27B0','#9C27B0','#3F51B5','#3F51B5'];
                    return (
                      <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: colors[i % 6] }}>{val}</span>
                        <div style={{ width: '100%', height: h, background: colors[i % 6], borderRadius: '3px 3px 0 0' }} />
                        <span style={{ fontSize: 9, color: 'var(--text3)' }}>{key}</span>
                      </div>
                    );
                  })}
                </div>
                {/* Horizontal detail */}
                {[...AGE_ORDER].reverse().map((key, i) => {
                  const val = stats.kelompokUsia[key] ?? 0;
                  if (!val) return null;
                  const total = Object.values(stats.kelompokUsia).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                  const max = Math.max(1, ...AGE_ORDER.map(k => stats.kelompokUsia[k] ?? 0));
                  const colors = ['#3F51B5','#3F51B5','#9C27B0','#9C27B0','#E91E63','#E91E63'];
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontSize: 12 }}>
                      <div style={{ width: 36, textAlign: 'right', color: 'var(--text2)', fontWeight: 600, flexShrink: 0 }}>{key}</div>
                      <div style={{ flex: 1, background: 'var(--border)', borderRadius: 99, height: 16, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.round((val / max) * 100)}%`, background: colors[5 - i] ?? '#2196F3', borderRadius: 99 }} />
                      </div>
                      <div style={{ width: 40, textAlign: 'right', fontWeight: 700 }}>{val}</div>
                      <div style={{ width: 32, color: 'var(--text3)', fontSize: 11 }}>{pct}%</div>
                    </div>
                  );
                })}
              </>
            )}
        </div>

        {/* Jenis Kelamin */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Rasio Jenis Kelamin</div>
          </div>
          {stats.totalJiwa === 0
            ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Belum ada data</div>
            : <>
                <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                  <div style={{ flex: 1, padding: '14px 16px', background: 'var(--blue-light)', borderRadius: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 28 }}>👨</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#2196F3' }}>{stats.lakiLaki.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>Laki-laki</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#2196F3' }}>
                      {stats.totalJiwa > 0 ? Math.round((stats.lakiLaki / stats.totalJiwa) * 100) : 0}%
                    </div>
                  </div>
                  <div style={{ flex: 1, padding: '14px 16px', background: '#fce4ec', borderRadius: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: 28 }}>👩</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#E91E63' }}>{stats.perempuan.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>Perempuan</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#E91E63' }}>
                      {stats.totalJiwa > 0 ? Math.round((stats.perempuan / stats.totalJiwa) * 100) : 0}%
                    </div>
                  </div>
                </div>
                <div style={{ height: 20, borderRadius: 99, overflow: 'hidden', display: 'flex', marginBottom: 8 }}>
                  <div style={{ flex: stats.lakiLaki, background: '#2196F3' }} />
                  <div style={{ flex: stats.perempuan, background: '#E91E63' }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>
                  Rasio L/P: {stats.perempuan > 0 ? (stats.lakiLaki / stats.perempuan).toFixed(3) : '—'}
                </div>
              </>
          }
        </div>

        {/* Status Perkawinan */}
        <div className="card">
          <div className="card-header"><div className="card-title">Status Perkawinan</div></div>
          {Object.keys(stats.perStatusKawin).length === 0
            ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Belum ada data</div>
            : Object.entries(stats.perStatusKawin).sort((a, b) => b[1] - a[1]).map(([label, count], i) => (
                <MiniBar key={label} label={label} count={count} total={stats.totalJiwa} color={kawinColors[i % kawinColors.length]} />
              ))
          }
        </div>

        {/* Keberadaan */}
        <div className="card">
          <div className="card-header"><div className="card-title">Keberadaan Penduduk</div></div>
          {Object.keys(stats.perKeberadaan).length === 0
            ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Belum ada data</div>
            : Object.entries(stats.perKeberadaan).sort((a, b) => b[1] - a[1]).map(([label, count], i) => (
                <MiniBar key={label} label={label} count={count} total={stats.totalJiwa} color={keberadaanColors[i % keberadaanColors.length]} />
              ))
          }
        </div>
      </div>

      {/* ── Section 3: Sosial Ekonomi ── */}
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)', marginBottom: 12, paddingLeft: 2 }}>
        💼 Sosial Ekonomi
      </div>
      <div className="two-col" style={{ marginBottom: 20 }}>
        {/* Pendidikan */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Tingkat Pendidikan</div>
            <div className="card-sub">Distribusi pendidikan terakhir</div>
          </div>
          {allPendidikan.length === 0
            ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Belum ada data</div>
            : allPendidikan.map(({ label, val }, i) => (
                <MiniBar key={label} label={label} count={val} total={stats.totalJiwa} color={pendidikanColors[i % pendidikanColors.length]} />
              ))
          }
        </div>

        {/* Pekerjaan */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Status Pekerjaan</div>
            <div className="card-sub">Kondisi ketenagakerjaan warga</div>
          </div>
          {Object.keys(stats.perPekerjaan).length === 0
            ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Belum ada data</div>
            : <>
                {/* Visual stacked bar */}
                {(() => {
                  const entries = Object.entries(stats.perPekerjaan).sort((a,b) => b[1]-a[1]);
                  const total = entries.reduce((s,[,v]) => s+v, 0);
                  return (
                    <>
                      <div style={{ display: 'flex', height: 24, borderRadius: 99, overflow: 'hidden', marginBottom: 14, gap: 2 }}>
                        {entries.map(([label, val], i) => (
                          <div key={label} style={{ flex: val, background: pekerjaanColors[i % pekerjaanColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {val / total > 0.1 && <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>{Math.round((val/total)*100)}%</span>}
                          </div>
                        ))}
                      </div>
                      {entries.map(([label, count], i) => (
                        <MiniBar key={label} label={label} count={count} total={total} color={pekerjaanColors[i % pekerjaanColors.length]} />
                      ))}
                    </>
                  );
                })()}
              </>
          }
        </div>

        {/* Status KK */}
        <div className="card">
          <div className="card-header"><div className="card-title">Status Kartu Keluarga</div></div>
          {Object.keys(stats.perStatusKk).length === 0
            ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Belum ada data</div>
            : Object.entries(stats.perStatusKk).map(([label, count], i) => {
                const colors = ['var(--blue)','var(--orange)','var(--red)'];
                return <MiniBar key={label} label={label} count={count} total={stats.totalKK} color={colors[i % colors.length]} />;
              })
          }
        </div>

        {/* Kewarganegaraan */}
        {Object.keys(stats.perKewarganegaraan).length > 0 && (
          <div className="card">
            <div className="card-header"><div className="card-title">Kewarganegaraan</div></div>
            {Object.entries(stats.perKewarganegaraan).map(([label, count], i) => (
              <MiniBar key={label} label={label} count={count} total={stats.totalJiwa} color={DUSUN_COLORS[i % DUSUN_COLORS.length]} />
            ))}
          </div>
        )}
      </div>

      {/* ── Section 4: Disabilitas ── */}
      {Object.keys(stats.perDisabilitas).length > 0 && (
        <>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)', marginBottom: 12, paddingLeft: 2 }}>
            ♿ Data Disabilitas
          </div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="card-title">Distribusi Jenis Disabilitas</div>
              <div className="card-sub">
                Total {Object.values(stats.perDisabilitas).reduce((a, b) => a + b, 0)} jiwa dengan disabilitas
              </div>
            </div>
            <div className="two-col" style={{ marginTop: 4 }}>
              <div>
                {Object.entries(stats.perDisabilitas).sort((a, b) => b[1] - a[1]).map(([label, count], i) => {
                  const total = Object.values(stats.perDisabilitas).reduce((a, b) => a + b, 0);
                  return <MiniBar key={label} label={label} count={count} total={total} color={disabilitasColors[i % disabilitasColors.length]} />;
                })}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(stats.perDisabilitas).sort((a, b) => b[1] - a[1]).map(([label, count], i) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg3)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: disabilitasColors[i % disabilitasColors.length], flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12, color: 'var(--text2)' }}>{label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: disabilitasColors[i % disabilitasColors.length] }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Section 5: Detail rekap per dusun ── */}
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)', marginBottom: 12, paddingLeft: 2 }}>
        📊 Rekapitulasi Lengkap per Dusun
      </div>
      <div className="table-wrap" style={{ marginBottom: 20 }}>
        <table>
          <thead>
            <tr><th>Dusun / Lingkungan</th><th>KK</th><th>Jiwa</th><th>L</th><th>P</th><th>Rasio L/P</th><th>Proporsi KK</th></tr>
          </thead>
          <tbody>
            {dusunData.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text3)', padding: 24 }}>Belum ada data</td></tr>
            ) : dusunData.map((d, i) => {
              const rasio = (d.perempuan ?? 0) > 0 ? ((d.lakiLaki ?? 0) / (d.perempuan ?? 1)).toFixed(2) : '—';
              return (
                <tr key={d.name}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: DUSUN_COLORS[i % DUSUN_COLORS.length] }} />
                      {d.name}
                    </div>
                  </td>
                  <td style={{ fontWeight: 700 }}>{d.kk}</td>
                  <td>{d.jiwa}</td>
                  <td style={{ color: 'var(--blue-mid)' }}>{d.lakiLaki ?? '–'}</td>
                  <td style={{ color: '#E91E63' }}>{d.perempuan ?? '–'}</td>
                  <td style={{ fontSize: 12, color: 'var(--text2)' }}>{rasio}</td>
                  <td style={{ minWidth: 120 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className="progress-bar" style={{ flex: 1 }}>
                        <div className="progress-fill" style={{ width: `${d.progress}%`, background: DUSUN_COLORS[i % DUSUN_COLORS.length] }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: DUSUN_COLORS[i % DUSUN_COLORS.length] }}>{d.progress}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {dusunData.length > 0 && (
              <tr style={{ fontWeight: 700, background: 'var(--bg)' }}>
                <td>Total</td>
                <td>{dusunData.reduce((s, d) => s + d.kk, 0)}</td>
                <td>{dusunData.reduce((s, d) => s + d.jiwa, 0)}</td>
                <td style={{ color: 'var(--blue-mid)' }}>{dusunData.reduce((s, d) => s + (d.lakiLaki ?? 0), 0)}</td>
                <td style={{ color: '#E91E63' }}>{dusunData.reduce((s, d) => s + (d.perempuan ?? 0), 0)}</td>
                <td>—</td>
                <td>—</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}