// src/pages/DataKuesioner.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { Badge, Icons, CustomSelect } from '../components/UI';
import { DUSUN_OPTIONS } from '../data/mockData';
import { getQuestionnaires, deleteQuestionnaire, type ApiQuestionnaire } from '../services/api';
import { toKuesionerList } from '../services/helpers';
import type { Kuesioner } from '../types';

export default function DataKuesioner(): JSX.Element {
  const [search, setSearch] = useState('');
  const [dusunFilter, setDusunFilter] = useState('all');
  const [questionnaires, setQuestionnaires] = useState<ApiQuestionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  async function fetchData(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const dusunParam = dusunFilter !== 'all'
        ? String(DUSUN_OPTIONS.indexOf(dusunFilter) + 1)
        : undefined;
      const data = await getQuestionnaires({ dusun: dusunParam, limit: 200 });
      setQuestionnaires(data);
      setPage(1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void fetchData(); }, [dusunFilter]); // eslint-disable-line

  const kuesionerList: Kuesioner[] = useMemo(() => toKuesionerList(questionnaires), [questionnaires]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return kuesionerList.filter(d => {
      const matchQ = d.nama.toLowerCase().includes(q) || d.noKk.includes(q) || d.petugas.toLowerCase().includes(q);
      const matchD = dusunFilter === 'all' || d.dusun === dusunFilter;
      return matchQ && matchD;
    });
  }, [kuesionerList, search, dusunFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleDelete(id: string): Promise<void> {
    if (!confirm('Hapus data kuesioner ini?')) return;
    setDeleting(id);
    try {
      await deleteQuestionnaire(id);
      setQuestionnaires(prev => prev.filter(q => q.id !== id));
    } catch (e) {
      alert('Gagal menghapus: ' + (e instanceof Error ? e.message : 'Error'));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      {error && (
        <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>⚠️</span>
          <span style={{ flex: 1, fontSize: 13, color: '#92400E' }}>{error}</span>
          <button onClick={fetchData} className="btn btn-secondary btn-sm">Coba Lagi</button>
        </div>
      )}

      <div className="filter-bar">
        <div className="search-wrap">
          <Icons.Search />
          <input
            className="search-input"
            placeholder="Cari nama / no.KK / petugas..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <CustomSelect
          value={dusunFilter}
          onChange={(v) => { setDusunFilter(v); setPage(1); }}
          options={[
            { value: 'all', label: 'Semua Dusun' },
            ...DUSUN_OPTIONS.map(d => ({ value: d, label: d })),
          ]}
        />
        <button className="btn btn-secondary btn-sm" onClick={fetchData} disabled={loading}>
          ↺ Refresh
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th><th>Kepala Keluarga</th><th>No. KK</th>
              <th>Dusun</th><th>Anggota</th><th>Petugas</th><th>Waktu</th><th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Memuat data...</td></tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty">
                    <Icons.Kuesioner />
                    <p>Tidak ada data ditemukan</p>
                    <span>Coba ubah filter atau kata kunci pencarian</span>
                  </div>
                </td>
              </tr>
            ) : paginated.map((d, idx) => (
              <tr key={d.id}>
                <td style={{ color: 'var(--text3)', fontSize: 12 }}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                <td><span className="td-name">{d.nama}</span></td>
                <td><span className="mono">{d.noKk}</span></td>
                <td><Badge type="teal">{d.dusun}</Badge></td>
                <td style={{ textAlign: 'center' }}><span style={{ fontWeight: 600 }}>{d.anggota}</span></td>
                <td style={{ fontSize: 12, color: 'var(--text2)' }}>{d.petugas}</td>
                <td style={{ fontSize: 12, color: 'var(--text3)' }}>{d.waktu}</td>
                <td>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--red)', borderColor: 'var(--red)', opacity: deleting === d.id ? 0.5 : 1 }}
                    onClick={() => handleDelete(d.id)}
                    disabled={deleting === d.id}
                  >
                    {deleting === d.id ? '...' : 'Hapus'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, fontSize: 12, color: 'var(--text3)' }}>
        <span>Menampilkan {paginated.length} dari {filtered.length} data ({kuesionerList.length} total)</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Sebelumnya</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => Math.abs(p - page) <= 2)
            .map(p => (
              <button key={p} className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPage(p)}>{p}</button>
            ))
          }
          <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Berikutnya →</button>
        </div>
      </div>
    </div>
  );
}