// src/pages/Login.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps): JSX.Element {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('admin@desasukamakmur.id');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal');
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0B6BA8 0%, #1976D2 100%)',
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: '40px 36px', width: 380,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🏘️</div>
          <h2 style={{ margin: 0, color: '#0B6BA8', fontSize: 20, fontWeight: 700 }}>Admin Desa</h2>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: 13 }}>Desa Suka Makmur</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', border: '1px solid #ddd',
                borderRadius: 8, fontSize: 14, boxSizing: 'border-box',
                outline: 'none', transition: 'border 0.2s',
              }}
              placeholder="email@contoh.com"
              required
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', border: '1px solid #ddd',
                borderRadius: 8, fontSize: 14, boxSizing: 'border-box',
              }}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div style={{
              background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: 8,
              padding: '10px 14px', fontSize: 13, color: '#DC2626', marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%', padding: '12px', background: isLoading ? '#93C5FD' : '#0B6BA8',
              color: '#fff', border: 'none', borderRadius: 8, fontSize: 15,
              fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {isLoading ? 'Masuk...' : 'MASUK'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#999', marginTop: 20 }}>
          Hubungi administrator jika lupa password
        </p>
      </div>
    </div>
  );
}