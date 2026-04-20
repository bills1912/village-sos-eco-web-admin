// src/App.tsx
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar, Header } from './components/Layout';
import Dashboard from './pages/Dashboard';
import DataKuesioner from './pages/DataKuesioner';
import Laporan from './pages/Laporan';
import ManajemenPetugas from './pages/ManajemenPetugas';
import ManajemenFitur from './pages/ManajemenFitur';
import Pengaturan from './pages/Pengaturan';
import Login from './pages/Login';
import type { PageId } from './types';

function AppInner(): JSX.Element {
  const { token } = useAuth();
  const [page, setPage] = useState<PageId>('dashboard');
  const [loggedIn, setLoggedIn] = useState<boolean>(!!token);

  useEffect(() => {
    setLoggedIn(!!token);
  }, [token]);

  // Check if user has a stored session
  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  const renderPage = (): JSX.Element => {
    switch (page) {
      case 'dashboard':  return <Dashboard />;
      case 'kuesioner':  return <DataKuesioner />;
      case 'laporan':    return <Laporan />;
      case 'petugas':    return <ManajemenPetugas />;
      case 'fitur':      return <ManajemenFitur />;
      case 'pengaturan': return <Pengaturan />;
    }
  };

  // Derive pending count from local storage (real sync done in API layer)
  const pendingSync = 0;

  return (
    <div className="app">
      <Sidebar page={page} setPage={setPage} pendingSync={pendingSync} />
      <div className="main">
        <Header page={page} pendingSync={pendingSync} />
        <div className="content">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

export default function App(): JSX.Element {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
