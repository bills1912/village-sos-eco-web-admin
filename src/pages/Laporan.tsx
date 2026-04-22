// src/pages/Laporan.tsx
import { useState, useEffect, useMemo } from 'react';
import { DUSUN_COLORS } from '../data/mockData';
import { getQuestionnaires, type ApiQuestionnaire } from '../services/api';
import { computeStats, computeDusunData, extractDusunOptions } from '../services/helpers';
import { CustomSelect } from '../components/UI';

const AGE_ORDER = ['0–4','5–14','15–24','25–39','40–59','60+'];

export default function Laporan(): JSX.Element {
  const [allQuestionnaires, setAllQuestionnaires] = useState<ApiQuestionnaire[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [filterDusun, setFilterDusun] = useState('all');

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

  // Daftar dusun unik dari data aktual
  const dusunOptions = useMemo(() => extractDusunOptions(allQuestionnaires), [allQuestionnaires]);

  // Filter berdasarkan dusun dipilih
  const filtered = useMemo(() => {
    if (filterDusun === 'all') return allQuestionnaires;
    return allQuestionnaires.filter(q => (q.dusun?.trim() ?? '') === filterDusun);
  }, [allQuestionnaires, filterDusun]);

  const stats    = computeStats(filtered);
  const dusunData = computeDusunData(allQuestionnaires); // selalu semua dusun untuk tabel rekapitulasi

  if (loading) return (
    <div style={{ padding: 48, textAlign: 'center', color: 'var(--text3)' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⟳</div>
      <div>Memuat laporan...</div>
    </div>
  );

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
      <div className="filter-bar" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text1)' }}>Filter Laporan</div>
        <CustomSelect
          value={filterDusun}
          onChange={setFilterDusun}
          options={[
            { value: 'all', label: 'Semua Dusun / Lingkungan' },
            ...dusunOptions.map(d => ({ value: d, label: d })),
          ]}
        />
        <button className="btn btn-secondary btn-sm" onClick={fetchData}>↺ Refresh</button>
        {filterDusun !== 'all' && (
          <div style={{ marginLeft: 4, padding: '4px 10px', background: 'var(--blue-light)', color: 'var(--blue)', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
            Filter aktif: {filterDusun}
            <span style={{ marginLeft: 8, cursor: 'pointer' }} onClick={() => setFilterDusun('all')}>✕</span>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="three-col" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total KK Terdata',   val: stats.totalKK.toLocaleString(),   icon: '🏠', color: 'var(--blue)'   },
          { label: 'Total Jiwa',         val: stats.totalJiwa.toLocaleString(), icon: '👥', color: 'var(--green)'  },
          { label: 'Dusun / Lingkungan', val: dusunOptions.length === 0 ? '-' : `${dusunOptions.length} area`, icon: '🗺️', color: 'var(--purple)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '18px' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="two-col">
        {/* Per dusun table */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Rekapitulasi per Dusun / Lingkungan</div>
            <div className="card-sub">{dusunData.length} area tercatat</div>
          </div>
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr><th>Dusun / Lingkungan</th><th>KK</th><th>Jiwa</th><th>L</th><th>P</th></tr>
              </thead>
              <tbody>
                {dusunData.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text3)', padding: 24 }}>Belum ada data</td></tr>
                ) : dusunData.map((d, i) => (
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
                  </tr>
                ))}
                {dusunData.length > 0 && (
                  <tr style={{ fontWeight: 700, background: 'var(--bg)' }}>
                    <td>Total</td>
                    <td>{dusunData.reduce((s, d) => s + d.kk, 0)}</td>
                    <td>{dusunData.reduce((s, d) => s + d.jiwa, 0)}</td>
                    <td style={{ color: 'var(--blue-mid)' }}>{dusunData.reduce((s, d) => s + (d.lakiLaki ?? 0), 0)}</td>
                    <td style={{ color: '#E91E63' }}>{dusunData.reduce((s, d) => s + (d.perempuan ?? 0), 0)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status KK */}
        <div className="card">
          <div className="card-header"><div className="card-title">Status Kartu Keluarga</div></div>
          {Object.keys(stats.perStatusKk).length === 0
            ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Belum ada data</div>
            : Object.entries(stats.perStatusKk).map(([label, count], i) => {
                const pct = stats.totalKK > 0 ? Math.round((count / stats.totalKK) * 100) : 0;
                const colors = ['var(--blue)','var(--orange)','var(--red)'];
                return (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span>{label}</span>
                      <span style={{ fontWeight: 700, color: colors[i % colors.length] }}>{count} ({pct}%)</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: colors[i % colors.length] }} />
                    </div>
                  </div>
                );
              })}
        </div>

        {/* Wilayah administratif */}
        {(() => {
          const desaMap: Record<string, number> = {};
          for (const q of filtered) {
            const key = q.nama_desa ?? q.kode_desa ?? 'Tidak Diketahui';
            desaMap[key] = (desaMap[key] ?? 0) + 1;
          }
          const desaEntries = Object.entries(desaMap).sort((a, b) => b[1] - a[1]);
          if (desaEntries.length <= 1) return null;
          return (
            <div className="card">
              <div className="card-header"><div className="card-title">Distribusi per Desa / Kelurahan</div></div>
              {desaEntries.map(([label, count], i) => {
                const pct = filtered.length > 0 ? Math.round((count / filtered.length) * 100) : 0;
                return (
                  <div key={label} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                      <span>{label}</span>
                      <span style={{ fontWeight: 700, color: DUSUN_COLORS[i % DUSUN_COLORS.length] }}>{count} KK ({pct}%)</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: DUSUN_COLORS[i % DUSUN_COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Distribusi Usia */}
        <div className="card">
          <div className="card-header"><div className="card-title">Distribusi Kelompok Usia</div></div>
          {Object.keys(stats.kelompokUsia).length === 0
            ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Belum ada data usia</div>
            : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 140, padding: '8px 0' }}>
                {AGE_ORDER.filter(k => k in stats.kelompokUsia).map((key, i) => {
                  const val = stats.kelompokUsia[key] ?? 0;
                  const max = Math.max(1, ...AGE_ORDER.map(k => stats.kelompokUsia[k] ?? 0));
                  const h = Math.max(4, Math.round((val / max) * 120));
                  return (
                    <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: DUSUN_COLORS[i % DUSUN_COLORS.length] }}>{val}</span>
                      <div style={{ width: '100%', height: h, background: DUSUN_COLORS[i % DUSUN_COLORS.length], borderRadius: '3px 3px 0 0' }} />
                      <span style={{ fontSize: 9, color: 'var(--text3)' }}>{key}</span>
                    </div>
                  );
                })}
              </div>
            )}
        </div>

        {/* Pendidikan */}
        <div className="card">
          <div className="card-header"><div className="card-title">Tingkat Pendidikan</div></div>
          {Object.keys(stats.perPendidikan).length === 0
            ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Belum ada data</div>
            : Object.entries(stats.perPendidikan).sort((a, b) => b[1] - a[1]).map(([label, count], i) => {
                const pct = stats.totalJiwa > 0 ? Math.round((count / stats.totalJiwa) * 100) : 0;
                return (
                  <div key={label} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                      <span>{label}</span>
                      <span style={{ fontWeight: 700, color: DUSUN_COLORS[i % DUSUN_COLORS.length] }}>{count} ({pct}%)</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: DUSUN_COLORS[i % DUSUN_COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
        </div>

        {/* Pekerjaan */}
        {Object.keys(stats.perPekerjaan).length > 0 && (
          <div className="card">
            <div className="card-header"><div className="card-title">Status Pekerjaan</div></div>
            {Object.entries(stats.perPekerjaan).map(([label, count], i) => {
              const pct = stats.totalJiwa > 0 ? Math.round((count / stats.totalJiwa) * 100) : 0;
              return (
                <div key={label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                    <span>{label}</span>
                    <span style={{ fontWeight: 700, color: DUSUN_COLORS[i % DUSUN_COLORS.length] }}>{count} ({pct}%)</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: DUSUN_COLORS[i % DUSUN_COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Disabilitas */}
        {Object.keys(stats.perDisabilitas).length > 0 && (
          <div className="card">
            <div className="card-header"><div className="card-title">Data Disabilitas</div></div>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 600 }}>Jenis</th>
                  <th style={{ textAlign: 'center', padding: '6px 10px', fontWeight: 600 }}>Jiwa</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.perDisabilitas).map(([label, count]) => (
                  <tr key={label}>
                    <td style={{ padding: '6px 10px', color: 'var(--text2)' }}>{label}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700, color: 'var(--orange)' }}>{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}