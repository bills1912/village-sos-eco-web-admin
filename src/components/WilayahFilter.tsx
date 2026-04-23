// src/components/WilayahFilter.tsx
import React, { useState, useMemo } from 'react';
import { CustomSelect } from './UI';
import type { ApiQuestionnaire } from '../services/api';
import {
  extractProvinsiOptions, extractKabupatenOptions,
  extractKecamatanOptions, extractDesaOptions, extractDusunOptions,
  type WilayahFilter as WilayahFilterState,
} from '../services/helpers';

interface WilayahFilterProps {
  questionnaires: ApiQuestionnaire[];
  value: WilayahFilterState;
  onChange: (f: WilayahFilterState) => void;
}

export function WilayahFilterBar({ questionnaires, value, onChange }: WilayahFilterProps): JSX.Element {
  const provinsiOpts = useMemo(() => extractProvinsiOptions(questionnaires), [questionnaires]);
  const kabupatenOpts = useMemo(
    () => extractKabupatenOptions(questionnaires, value.kodeProvinsi),
    [questionnaires, value.kodeProvinsi]
  );
  const kecamatanOpts = useMemo(
    () => extractKecamatanOptions(questionnaires, value.kodeKabupaten),
    [questionnaires, value.kodeKabupaten]
  );
  const desaOpts = useMemo(
    () => extractDesaOptions(questionnaires, value.kodeKecamatan),
    [questionnaires, value.kodeKecamatan]
  );
  const dusunOpts = useMemo(
    () => extractDusunOptions(questionnaires.filter(q => {
      if (value.kodeProvinsi  && q.kode_provinsi  !== value.kodeProvinsi)  return false;
      if (value.kodeKabupaten && q.kode_kabupaten !== value.kodeKabupaten) return false;
      if (value.kodeKecamatan && q.kode_kecamatan !== value.kodeKecamatan) return false;
      if (value.kodeDesa      && q.kode_desa      !== value.kodeDesa)      return false;
      return true;
    })),
    [questionnaires, value.kodeProvinsi, value.kodeKabupaten, value.kodeKecamatan, value.kodeDesa]
  );

  // Determine active filter level label
  const activeLevel = value.dusun ? 'Dusun'
    : value.kodeDesa ? 'Desa'
    : value.kodeKecamatan ? 'Kecamatan'
    : value.kodeKabupaten ? 'Kabupaten'
    : value.kodeProvinsi ? 'Provinsi'
    : null;

  const activeLabel = value.dusun ? value.dusun
    : value.kodeDesa ? (desaOpts.find(d => d.value === value.kodeDesa)?.label ?? value.kodeDesa)
    : value.kodeKecamatan ? (kecamatanOpts.find(d => d.value === value.kodeKecamatan)?.label ?? value.kodeKecamatan)
    : value.kodeKabupaten ? (kabupatenOpts.find(d => d.value === value.kodeKabupaten)?.label ?? value.kodeKabupaten)
    : value.kodeProvinsi ? (provinsiOpts.find(d => d.value === value.kodeProvinsi)?.label ?? value.kodeProvinsi)
    : null;

  function setProvinsi(v: string): void {
    onChange(v ? { kodeProvinsi: v } : {});
  }
  function setKabupaten(v: string): void {
    onChange(v ? { kodeProvinsi: value.kodeProvinsi, kodeKabupaten: v } : { kodeProvinsi: value.kodeProvinsi });
  }
  function setKecamatan(v: string): void {
    onChange(v ? { kodeProvinsi: value.kodeProvinsi, kodeKabupaten: value.kodeKabupaten, kodeKecamatan: v } : { kodeProvinsi: value.kodeProvinsi, kodeKabupaten: value.kodeKabupaten });
  }
  function setDesa(v: string): void {
    onChange(v ? { kodeProvinsi: value.kodeProvinsi, kodeKabupaten: value.kodeKabupaten, kodeKecamatan: value.kodeKecamatan, kodeDesa: v } : { kodeProvinsi: value.kodeProvinsi, kodeKabupaten: value.kodeKabupaten, kodeKecamatan: value.kodeKecamatan });
  }
  function setDusun(v: string): void {
    onChange(v ? { ...value, dusun: v } : { kodeProvinsi: value.kodeProvinsi, kodeKabupaten: value.kodeKabupaten, kodeKecamatan: value.kodeKecamatan, kodeDesa: value.kodeDesa });
  }

  const showKabupaten  = provinsiOpts.length > 0  && !!value.kodeProvinsi;
  const showKecamatan  = kabupatenOpts.length > 0  && !!value.kodeKabupaten;
  const showDesa       = kecamatanOpts.length > 0  && !!value.kodeKecamatan;
  const showDusun      = desaOpts.length > 0       && !!value.kodeDesa;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      {/* Breadcrumb hierarchy indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text3)', marginRight: 4 }}>
        <span style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>
          Wilayah
        </span>
        {value.kodeProvinsi && <><span>›</span><span style={{ color: 'var(--blue)', fontWeight: 600 }}>{provinsiOpts.find(o => o.value === value.kodeProvinsi)?.label}</span></>}
        {value.kodeKabupaten && <><span>›</span><span style={{ color: 'var(--blue)', fontWeight: 600 }}>{kabupatenOpts.find(o => o.value === value.kodeKabupaten)?.label}</span></>}
        {value.kodeKecamatan && <><span>›</span><span style={{ color: 'var(--blue)', fontWeight: 600 }}>{kecamatanOpts.find(o => o.value === value.kodeKecamatan)?.label}</span></>}
        {value.kodeDesa && <><span>›</span><span style={{ color: 'var(--blue)', fontWeight: 600 }}>{desaOpts.find(o => o.value === value.kodeDesa)?.label}</span></>}
        {value.dusun && <><span>›</span><span style={{ color: 'var(--blue)', fontWeight: 600 }}>{value.dusun}</span></>}
      </div>

      {provinsiOpts.length > 0 && (
        <CustomSelect
          value={value.kodeProvinsi ?? ''}
          onChange={setProvinsi}
          options={[{ value: '', label: 'Semua Provinsi' }, ...provinsiOpts]}
        />
      )}
      {showKabupaten && (
        <CustomSelect
          value={value.kodeKabupaten ?? ''}
          onChange={setKabupaten}
          options={[{ value: '', label: 'Semua Kab/Kota' }, ...kabupatenOpts]}
        />
      )}
      {showKecamatan && (
        <CustomSelect
          value={value.kodeKecamatan ?? ''}
          onChange={setKecamatan}
          options={[{ value: '', label: 'Semua Kecamatan' }, ...kecamatanOpts]}
        />
      )}
      {showDesa && (
        <CustomSelect
          value={value.kodeDesa ?? ''}
          onChange={setDesa}
          options={[{ value: '', label: 'Semua Desa' }, ...desaOpts]}
        />
      )}
      {showDusun && (
        <CustomSelect
          value={value.dusun ?? ''}
          onChange={setDusun}
          options={[{ value: '', label: 'Semua Dusun' }, ...dusunOpts.map(d => ({ value: d, label: d }))]}
        />
      )}
      {!value.kodeProvinsi && provinsiOpts.length === 0 && (
        <CustomSelect
          value={value.dusun ?? ''}
          onChange={setDusun}
          options={[{ value: '', label: 'Semua Dusun' }, ...dusunOpts.map(d => ({ value: d, label: d }))]}
        />
      )}
      {activeLevel && (
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onChange({})}
          style={{ fontSize: 11, color: 'var(--red)', borderColor: 'var(--red)' }}
        >
          ✕ Reset Filter
        </button>
      )}
    </div>
  );
}