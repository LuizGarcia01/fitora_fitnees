import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import ScrollToTop from '@/components/ScrollToTop';
import ErrorBoundary from '@/components/ErrorBoundary';
import { supabase } from '@/api/supabaseClient';

import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import CreatePlan from '@/pages/CreatePlan';
import WorkoutPlan from '@/pages/WorkoutPlan';
import History from '@/pages/History';
import Profile from '@/pages/Profile';
import SpotifyCallback from '@/pages/SpotifyCallback';
import ExerciseLibrary from '@/pages/ExerciseLibrary';
import Measurements from '@/pages/Measurements';

const AuthenticatedApp = () => {
  const { isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/novo-plano" element={<CreatePlan />} />
          <Route path="/plano" element={<WorkoutPlan />} />
          <Route path="/historico" element={<History />} />
          <Route path="/biblioteca" element={<ExerciseLibrary />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/medidas" element={<Measurements />} />
        </Route>
      </Route>

      <Route path="/spotify-callback" element={<SpotifyCallback />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

function DeepLinkHandler() {
  useEffect(() => {
    if (!window.Capacitor?.isNativePlatform?.()) return;

    const processUrl = async (url) => {
      if (!url?.startsWith('com.fitora.app://')) return;
      try {
        const { Browser } = await import('@capacitor/browser');
        await Browser.close().catch(() => {});

        // --- Google OAuth callback ---
        if (url.startsWith('com.fitora.app://login-callback')) {
          const hashIndex = url.indexOf('#');
          if (hashIndex === -1) return;
          const params = new URLSearchParams(url.substring(hashIndex + 1));
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');
          if (access_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (!error) window.location.href = '/';
          }
          return;
        }

        // --- Spotify OAuth callback ---
        if (url.startsWith('com.fitora.app://spotify-callback')) {
          const queryIndex = url.indexOf('?');
          if (queryIndex === -1) return;
          const params = new URLSearchParams(url.substring(queryIndex + 1));
          const code = params.get('code');
          if (!code) return;

          const authToken = (await supabase.auth.getSession()).data?.session?.access_token
            || localStorage.getItem('fitora_spotify_pending_token');
          if (!authToken) return;

          const res = await fetch(`${SUPABASE_URL}/functions/v1/spotifyAuth`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
              'apikey': SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
              action: 'exchange_code',
              code,
              redirect_uri: 'com.fitora.app://spotify-callback',
            }),
          });
          const data = await res.json();
          if (data?.access_token) {
            localStorage.setItem('spotify_access_token', data.access_token);
            localStorage.setItem('spotify_refresh_token', data.refresh_token);
            localStorage.setItem('spotify_expires_at', (Date.now() + data.expires_in * 1000).toString());
            localStorage.removeItem('fitora_spotify_pending_token');
            // Notifica SpotifyPlayer que a conexão foi concluída
            window.dispatchEvent(new CustomEvent('spotify-connected'));
          }
        }
      } catch (e) {
        console.error('deep link error', e);
      }
    };

    let appListener;
    (async () => {
      const { App: CapApp } = await import('@capacitor/app');
      // Registra listener ANTES de checar launch URL para evitar race condition
      appListener = await CapApp.addListener('appUrlOpen', ({ url }) => processUrl(url));
      const launch = await CapApp.getLaunchUrl().catch(() => null);
      if (launch?.url) await processUrl(launch.url);
    })();

    return () => { appListener?.remove(); };
  }, []);

  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <DeepLinkHandler />
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
