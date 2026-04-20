// src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
import { StatCard, DonutChart, Icons } from '../components/UI';
import { DUSUN_COLORS, getAvatarColor, DUSUN_OPTIONS } from '../data/mockData';
import { getQuestionnaires, type ApiQuestionnaire } from '../services/api';
import { computeStats, computeDusunData, type ComputedStats } from '../services/helpers';
import type { DusunData } from '../types';

type DashboardTab = 'overview' | 'per-dusun' | 'petugas';

const AGE_ORDER = ['0–4','5–14','15–24','25–39','40–59','60+'];

function ErrorBanner({ msg, onRetry }: { msg: string; onRetry: () => void }): JSX.Element {
  return (
    <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 18 }}>⚠️</span>
      <span style={{ flex: 1, fontSize: 13, color: '#92400E' }}>{msg}</span>
      <button onClick={onRetry} className="btn btn-secondary btn-sm">Coba Lagi</button>
    </div>
  );
}

function OverviewTab({ stats, dusunData, loading }: { stats: ComputedStats; dusunData: DusunData[]; loading: boolean }): JSX.Element {
  const pendidikanEntries = Object.entries(stats.perPendidikan).sort((a, b) => b[1] - a[1]);
  const maxPend = Math.max(1, ...pendidikanEntries.map(e => e[1]));
  const keberadaanEntries = Object.entries(stats.perKeberadaan);
  const maxKeb = Math.max(1, ...keberadaanEntries.map(e => e[1]));

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)' }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>⟳</div>
      <div>Memuat data dari server...</div>
    </div>
  );

  return (
    <div className="two-col">
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Distribusi Jenis Kelamin</div>
            <div className="card-sub">Total {stats.totalJiwa.toLocaleString()} jiwa terdaftar</div>
          </div>
        </div>
        {stats.totalJiwa > 0 ? (
          <DonutChart data={[
            { label: 'Laki-laki', value: stats.lakiLaki, color: '#2196F3' },
            { label: 'Perempuan', value: stats.perempuan, color: '#E91E63' },
          ]} />
        ) : (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text3)', fontSize: 13 }}>Belum ada data</div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">KK Terdata per Dusun</div>
            <div className="card-sub">Jumlah KK terdaftar</div>
          </div>
        </div>
        {dusunData.map((d, i) => (
          <div key={d.name} className="chart-bar-row">
            <div className="chart-bar-label" style={{ fontSize: 11 }}>{d.name}</div>
            <div className="chart-bar-track">
              <div className="chart-bar-fill" style={{ width: `${d.progress}%`, background: DUSUN_COLORS[i] }} />
            </div>
            <div className="chart-bar-val">{d.kk}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Distribusi Pendidikan</div>
            <div className="card-sub">Tingkat pendidikan warga</div>
          </div>
        </div>
        {pendidikanEntries.length === 0
          ? <div style={{ textAlign: 'center', padding: 24, color: 'var(--text3)', fontSize: 13 }}>Belum ada data</div>
          : pendidikanEntries.map(([label, count], i) => (
            <div key={label} className="chart-bar-row">
              <div className="chart-bar-label" style={{ fontSize: 10, lineHeight: 1.3 }}>{label}</div>
              <div className="chart-bar-track">
                <div className="chart-bar-fill" style={{ width: `${Math.round((count / maxPend) * 100)}%`, background: DUSUN_COLORS[i % DUSUN_COLORS.length] }} />
              </div>
              <div className="chart-bar-val">{count}</div>
            </div>
          ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Keberadaan Penduduk</div>
            <div className="card-sub">Status domisili warga</div>
          </div>
        </div>
        {keberadaanEntries.length === 0
          ? <div style={{ textAlign: 'center', padding: 24, color: 'var(--text3)', fontSize: 13 }}>Belum ada data</div>
          : keberadaanEntries.map(([label, count], i) => (
            <div key={label} className="chart-bar-row">
              <div className="chart-bar-label" style={{ fontSize: 11 }}>{label}</div>
              <div className="chart-bar-track">
                <div className="chart-bar-fill" style={{ width: `${Math.round((count / maxKeb) * 100)}%`, background: DUSUN_COLORS[i % DUSUN_COLORS.length] }} />
              </div>
              <div className="chart-bar-val">{count}</div>
            </div>
          ))}
      </div>

      {Object.keys(stats.kelompokUsia).length > 0 && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Distribusi Usia</div>
              <div className="card-sub">Kelompok umur penduduk</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, padding: '8px 0' }}>
            {AGE_ORDER.filter(k => k in stats.kelompokUsia).map((key, i) => {
              const val = stats.kelompokUsia[key] ?? 0;
              const max = Math.max(1, ...AGE_ORDER.map(k => stats.kelompokUsia[k] ?? 0));
              const h = Math.max(4, Math.round((val / max) * 100));
              return (
                <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: DUSUN_COLORS[i % DUSUN_COLORS.length] }}>{val}</span>
                  <div style={{ width: '100%', height: h, background: DUSUN_COLORS[i % DUSUN_COLORS.length], borderRadius: '3px 3px 0 0' }} />
                  <span style={{ fontSize: 9, color: 'var(--text3)' }}>{key}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {Object.keys(stats.perPekerjaan).length > 0 && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Status Pekerjaan</div>
              <div className="card-sub">Kondisi ketenagakerjaan warga</div>
            </div>
          </div>
          <DonutChart data={Object.entries(stats.perPekerjaan).map(([label, val], i) => ({
            label, value: val, color: DUSUN_COLORS[i % DUSUN_COLORS.length],
          }))} />
        </div>
      )}
    </div>
  );
}

function PerDusunTab({ dusunData, loading }: { dusunData: DusunData[]; loading: boolean }): JSX.Element {
  if (loading) return <div className="table-wrap"><div style={{ padding: 32, textAlign: 'center', color: 'var(--text3)' }}>Memuat data...</div></div>;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Dusun</th><th>KK Terdata</th><th>Total Jiwa</th><th>L / P</th><th>Progress</th></tr>
        </thead>
        <tbody>
          {dusunData.map((d, i) => (
            <tr key={d.name}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: DUSUN_COLORS[i], flexShrink: 0 }} />
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
              <td style={{ minWidth: 140 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="progress-bar" style={{ flex: 1 }}>
                    <div className="progress-fill" style={{ width: `${d.progress}%`, background: DUSUN_COLORS[i] }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: DUSUN_COLORS[i] }}>{d.progress}%</span>
                </div>
              </td>
            </tr>
          ))}
          {dusunData.every(d => d.kk === 0) && (
            <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text3)', padding: 32 }}>Belum ada data</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function PerPetugasTab({ stats, loading }: { stats: ComputedStats; loading: boolean }): JSX.Element {
  if (loading) return <div className="table-wrap"><div style={{ padding: 32, textAlign: 'center', color: 'var(--text3)' }}>Memuat data...</div></div>;
  const petugasEntries = Object.entries(stats.perPetugas).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...petugasEntries.map(e => e[1]));
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Petugas</th><th>KK Didata</th><th>Progress</th></tr>
        </thead>
        <tbody>
          {petugasEntries.length === 0 ? (
            <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text3)', padding: 32 }}>Belum ada data</td></tr>
          ) : petugasEntries.map(([name, count]) => (
            <tr key={name}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="avatar" style={{ background: getAvatarColor(name) }}>{name.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()}</div>
                  <span className="td-name">{name}</span>
                </div>
              </td>
              <td><span style={{ fontWeight: 700 }}>{count}</span> <span style={{ color: 'var(--text3)', fontSize: 12 }}>KK</span></td>
              <td style={{ minWidth: 140 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="progress-bar" style={{ flex: 1 }}>
                    <div className="progress-fill" style={{ width: `${Math.round((count / max) * 100)}%`, background: 'var(--blue)' }} />
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{Math.round((count / max) * 100)}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Dashboard(): JSX.Element {
  const [tab, setTab] = useState<DashboardTab>('overview');
  const [filterDusun, setFilterDusun] = useState('all');
  const [questionnaires, setQuestionnaires] = useState<ApiQuestionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tabs: [DashboardTab, string][] = [
    ['overview', 'Ringkasan'], ['per-dusun', 'Per Dusun'], ['petugas', 'Per Petugas'],
  ];

  async function fetchData(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const dusunParam = filterDusun !== 'all'
        ? String(DUSUN_OPTIONS.indexOf(filterDusun) + 1)
        : undefined;
      const data = await getQuestionnaires({ dusun: dusunParam, limit: 500 });
      setQuestionnaires(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void fetchData(); }, [filterDusun]); // eslint-disable-line

  const stats = computeStats(questionnaires);
  const dusunData = computeDusunData(questionnaires);

  return (
    <div>
      {error && <ErrorBanner msg={error} onRetry={fetchData} />}
      <div className="filter-bar">
        <div className="tabs" style={{ marginBottom: 0, flex: 'none' }}>
          {tabs.map(([t, l]) => (
            <div key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{l}</div>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <select className="filter-select" value={filterDusun} onChange={e => setFilterDusun(e.target.value)}>
            <option value="all">Semua Dusun</option>
            {DUSUN_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button className="btn btn-secondary btn-sm" onClick={fetchData} disabled={loading}>
            ↺ Refresh
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Total KK Terdata" value={loading ? '...' : stats.totalKK.toLocaleString()} icon={<Icons.Home />}   color="blue" />
        <StatCard label="Total Jiwa"        value={loading ? '...' : stats.totalJiwa.toLocaleString()} icon={<Icons.People />} color="green" />
        <StatCard label="Laki-laki"         value={loading ? '...' : stats.lakiLaki.toLocaleString()} icon={<Icons.Check />}  color="purple" />
        <StatCard label="Perempuan"         value={loading ? '...' : stats.perempuan.toLocaleString()} icon={<Icons.Sync />}   color="orange" />
      </div>

      {tab === 'overview'  && <OverviewTab stats={stats} dusunData={dusunData} loading={loading} />}
      {tab === 'per-dusun' && <PerDusunTab dusunData={dusunData} loading={loading} />}
      {tab === 'petugas'   && <PerPetugasTab stats={stats} loading={loading} />}
    </div>
  );
}
