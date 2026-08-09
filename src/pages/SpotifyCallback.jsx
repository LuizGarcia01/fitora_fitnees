import React, { useEffect, useState } from "react";
import { supabase } from "@/api/supabaseClient";

const isNative = window.Capacitor?.isNativePlatform?.() ?? false;
const REDIRECT_URI = isNative
  ? 'com.fitora.app://spotify-callback'
  : `${window.location.origin}/spotify-callback`;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function SpotifyCallback() {
  const [status, setStatus] = useState("Conectando ao Spotify...");
  const [detail, setDetail] = useState("");
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const run = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const spotifyError = params.get("error");

      if (spotifyError) {
        setStatus("Conexão recusada pelo Spotify.");
        setDetail(`Motivo: ${spotifyError}`);
        return;
      }

      if (!code) {
        setStatus("Código de autorização não encontrado.");
        setDetail("Tente conectar novamente.");
        return;
      }

      // Tenta pegar o token da sessão do popup primeiro,
      // senão usa o token salvo pelo app principal antes de abrir o popup
      const { data: sessionData } = await supabase.auth.getSession();
      const authToken = sessionData?.session?.access_token
        || localStorage.getItem('fitora_spotify_pending_token');

      if (!authToken) {
        setStatus("Sessão não encontrada.");
        setDetail("Feche esta janela, certifique-se de estar logado no app e tente novamente.");
        return;
      }

      try {
        // Usa fetch direto para garantir o envio do token correto
        const res = await fetch(`${SUPABASE_URL}/functions/v1/spotifyAuth`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ action: 'exchange_code', code, redirect_uri: REDIRECT_URI }),
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          const hint = res.status === 401
            ? "Sessão inválida — faça logout e login novamente no app."
            : "Verifique as secrets SPOTIFY_CLIENT_ID e SPOTIFY_CLIENT_SECRET em Supabase → Settings → Edge Functions.";
          setStatus("Erro ao conectar ao Spotify.");
          setDetail(`${data?.error || `HTTP ${res.status}`} — ${hint}`);
          return;
        }

        const { access_token, refresh_token, expires_in } = data;
        if (!access_token) {
          setStatus("Token não recebido.");
          setDetail(`Resposta inesperada: ${JSON.stringify(data)}`);
          return;
        }

        const expiresAt = Date.now() + expires_in * 1000;
        localStorage.setItem("spotify_access_token", access_token);
        localStorage.setItem("spotify_refresh_token", refresh_token);
        localStorage.setItem("spotify_expires_at", expiresAt.toString());
        localStorage.removeItem('fitora_spotify_pending_token');

        setOk(true);
        setStatus("Spotify conectado com sucesso!");
        setTimeout(() => window.close(), 1500);

      } catch (err) {
        setStatus("Erro inesperado.");
        setDetail(err?.message || String(err));
      }
    };

    run();
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background px-6">
      <div className="text-center space-y-3 max-w-sm w-full">
        <svg viewBox="0 0 24 24" fill="currentColor"
          className={`w-12 h-12 mx-auto transition-colors ${ok ? "text-primary" : "text-muted-foreground"}`}>
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>

        <p className={`font-heading font-semibold text-base ${ok ? "text-primary" : "text-foreground"}`}>
          {status}
        </p>

        {detail && (
          <p className="text-xs text-muted-foreground bg-muted rounded-xl px-4 py-3 text-left leading-relaxed">
            {detail}
          </p>
        )}

        {!ok && (
          <div className="flex flex-col items-center gap-2">
            <button onClick={() => window.close()} className="text-xs text-primary underline">
              Fechar esta janela
            </button>
            <button onClick={() => { try { window.close(); } catch {} window.history.back(); }} className="text-xs text-muted-foreground underline">
              Voltar ao app
            </button>
          </div>
        )}
        {ok && (
          <button onClick={() => { try { window.close(); } catch {} window.history.back(); }} className="text-xs text-muted-foreground underline">
            Voltar ao app
          </button>
        )}
      </div>
    </div>
  );
}
