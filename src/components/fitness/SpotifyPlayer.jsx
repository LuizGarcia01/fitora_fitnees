import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, SkipBack, Music, ChevronDown, ExternalLink, Shuffle, Repeat, Repeat1, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/api/supabaseClient";

const isNative = window.Capacitor?.isNativePlatform?.() ?? false;
const REDIRECT_URI = isNative
  ? 'com.fitora.app://spotify-callback'
  : `${window.location.origin}/spotify-callback`;

async function getValidToken() {
  const accessToken = localStorage.getItem("spotify_access_token");
  const refreshToken = localStorage.getItem("spotify_refresh_token");
  const expiresAt = parseInt(localStorage.getItem("spotify_expires_at") || "0");

  if (!accessToken || !refreshToken) return null;

  if (Date.now() < expiresAt - 60000) return accessToken;

  const { data } = await supabase.functions.invoke("spotifyAuth", {
    body: { action: "refresh_token", refresh_token: refreshToken },
  });
  if (!data?.access_token) return null;

  const { access_token, expires_in } = data;
  localStorage.setItem("spotify_access_token", access_token);
  localStorage.setItem("spotify_expires_at", (Date.now() + expires_in * 1000).toString());
  return access_token;
}

function formatMs(ms) {
  if (!ms) return "0:00";
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function Equalizer() {
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="w-1 bg-primary rounded-full"
          animate={{ height: ["30%", "100%", "60%", "90%", "30%"] }}
          transition={{ duration: 0.8 + i * 0.15, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
        />
      ))}
    </div>
  );
}

export default function SpotifyPlayer() {
  const [connected, setConnected] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [playback, setPlayback] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [error, setError] = useState(null);
  const [volume, setVolume] = useState(50);
  const [showVolume, setShowVolume] = useState(false);
  const [progressMs, setProgressMs] = useState(0);
  const [devices, setDevices] = useState([]);
  const [showDevices, setShowDevices] = useState(false);
  const [waitingSpotify, setWaitingSpotify] = useState(false);
  const progressInterval = useRef(null);
  const spotifyPollRef = useRef(null);
  const errorRef = useRef(null);

  const checkConnection = useCallback(async () => {
    // Garante que a sessão Supabase está atualizada
    await supabase.auth.getSession();
    const token = await getValidToken();
    setConnected(!!token);
    return token;
  }, []);

  const fetchPlayback = useCallback(async () => {
    const token = await getValidToken();
    if (!token) return;
    const { data, error } = await supabase.functions.invoke("spotifyPlayer", {
      body: { action: "get_playback_state", access_token: token },
    });
    if (error || !data) return; // sessão Supabase expirada — silencia até reconectar
    const pb = data?.playback;
    setPlayback(pb);
    if (pb) {
      setProgressMs(pb.progress_ms || 0);
      setVolume(pb.device?.volume_percent ?? 50);
    }
  }, []);

  useEffect(() => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    if (playback?.is_playing) {
      progressInterval.current = setInterval(() => {
        setProgressMs((p) => p + 1000);
      }, 1000);
    }
    return () => clearInterval(progressInterval.current);
  }, [playback?.is_playing, playback?.item?.id]);

  useEffect(() => {
    checkConnection().then((token) => { if (token) fetchPlayback(); });
    // Renova a sessão Supabase a cada ciclo para evitar 401
    const interval = setInterval(async () => {
      await supabase.auth.getSession();
      fetchPlayback();
    }, 8000);
    // Ouve evento de conexão Spotify via deep link (APK)
    const onSpotifyConnected = () => {
      checkConnection().then(token => { if (token) fetchPlayback(); });
    };
    window.addEventListener('spotify-connected', onSpotifyConnected);
    return () => {
      clearInterval(interval);
      window.removeEventListener('spotify-connected', onSpotifyConnected);
    };
  }, [checkConnection, fetchPlayback]);

  // Ao voltar ao primeiro plano: atualiza playback E verifica dispositivos se havia erro
  useEffect(() => {
    if (!isNative) return;
    let cleanup = () => {};
    import('@capacitor/app').then(({ App }) => {
      const listener = App.addListener('appStateChange', async ({ isActive }) => {
        if (!isActive) return;
        const token = await getValidToken();
        if (!token) return;
        setTimeout(async () => {
          // Sempre atualiza playback
          fetchPlayback();
          // Se havia erro de dispositivo, verifica se agora há um disponível
          const { data: devData } = await supabase.functions.invoke("spotifyPlayer", {
            body: { action: "get_devices", access_token: token },
          });
          const devs = devData?.devices || [];
          setDevices(devs);
          if (devs.length > 0) {
            setShowDevices(true);
            setError(null);
            setWaitingSpotify(false);
            clearInterval(spotifyPollRef.current);
            // Auto-transfere se só há 1 dispositivo
            if (devs.length === 1) {
              await supabase.functions.invoke("spotifyPlayer", {
                body: { action: "transfer_playback", access_token: token, target_device_id: devs[0].id },
              });
              setShowDevices(false);
              setTimeout(fetchPlayback, 1500);
            }
          }
        }, 1500);
      });
      cleanup = () => listener.then(h => h.remove()).catch(() => {});
    });
    return () => cleanup();
  }, [fetchPlayback]);

  const handleConnect = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      localStorage.setItem('fitora_spotify_pending_token', session.access_token);
    }

    const { data } = await supabase.functions.invoke("spotifyAuth", {
      body: { action: "get_auth_url", redirect_uri: REDIRECT_URI },
    });
    if (!data?.auth_url) return;

    if (isNative) {
      // APK: abre no Chrome Custom Tab e retorna via deep link
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url: data.auth_url });
      // O retorno é tratado pelo DeepLinkHandler em App.jsx
    } else {
      // Web: popup normal
      const popup = window.open(data.auth_url, "_blank", "width=500,height=700");
      const timer = setInterval(() => {
        let isClosed = false;
        try { isClosed = !popup || popup.closed; } catch { isClosed = true; }
        if (isClosed) {
          clearInterval(timer);
          checkConnection().then((token) => { if (token) fetchPlayback(); });
        }
      }, 500);
      setTimeout(() => clearInterval(timer), 5 * 60 * 1000);
    }
  };

  const fetchDevices = async (retries = 3) => {
    const token = await getValidToken();
    if (!token) return;
    const { data, error } = await supabase.functions.invoke("spotifyPlayer", {
      body: { action: "get_devices", access_token: token },
    });
    if (error || !data) {
      setConnected(false);
      localStorage.removeItem("spotify_access_token");
      localStorage.removeItem("spotify_refresh_token");
      localStorage.removeItem("spotify_expires_at");
      return;
    }
    const devs = data?.devices || [];
    // Se vazio e ainda há tentativas, aguarda 2s e tenta de novo
    if (devs.length === 0 && retries > 0) {
      setShowDevices(true);
      setDevices([]);
      setTimeout(() => fetchDevices(retries - 1), 2000);
      return;
    }
    setDevices(devs);
    setShowDevices(true);
  };

  const playWithoutDevice = async () => {
    const token = await getValidToken();
    if (!token) return;
    setShowDevices(false);
    await supabase.functions.invoke("spotifyPlayer", {
      body: { action: "play", access_token: token },
    });
    setTimeout(fetchPlayback, 1500);
  };

  const transferToDevice = async (deviceId) => {
    const token = await getValidToken();
    if (!token) return;
    await supabase.functions.invoke("spotifyPlayer", {
      body: { action: "transfer_playback", access_token: token, target_device_id: deviceId },
    });
    setShowDevices(false);
    setTimeout(fetchPlayback, 1500);
  };

  const fetchPlaylists = async () => {
    const token = await getValidToken();
    if (!token) return;
    const { data } = await supabase.functions.invoke("spotifyPlayer", {
      body: { action: "get_playlists", access_token: token },
    });
    setPlaylists(data?.playlists || []);
    setShowPlaylists(true);
  };

  const playerAction = async (action, extra = {}) => {
    setLoading(true);
    setError(null);
    // Garante sessão Supabase atualizada antes de chamar a Edge Function
    await supabase.auth.getSession();
    const token = await getValidToken();
    if (!token) { setLoading(false); return; }
    const { data, error: invokeError } = await supabase.functions.invoke("spotifyPlayer", {
      body: { action, access_token: token, ...extra },
    });
    if (invokeError || !data) {
      setLoading(false);
      setError('Sessão expirada. Reconecte o Spotify.');
      return;
    }
    if (data?.success === false) {
      // Se falhou por falta de dispositivo ativo, mostra lista automática
      if (['play', 'pause', 'next', 'previous'].includes(action)) {
        const { data: devData } = await supabase.functions.invoke("spotifyPlayer", {
          body: { action: "get_devices", access_token: token },
        });
        const devs = devData?.devices || [];
        setDevices(devs);
        setShowDevices(true);
        setError('no_device');
      } else {
        setError(data.error || "Erro ao controlar playback");
      }
    }
    setTimeout(fetchPlayback, 800);
    setLoading(false);
  };

  const playPlaylist = async (contextUri) => {
    await playerAction("play", { context_uri: contextUri });
    setShowPlaylists(false);
  };

  const handleVolumeChange = async (val) => {
    setVolume(val);
    await playerAction("set_volume", { volume_percent: val });
  };

  const toggleShuffle = () => playerAction("set_shuffle", { state: !playback?.shuffle_state });
  const cycleRepeat = () => {
    const next = playback?.repeat_state === "off" ? "context" : playback?.repeat_state === "context" ? "track" : "off";
    playerAction("set_repeat", { state: next });
  };

  useEffect(() => { errorRef.current = error; }, [error]);

  const isPlaying = playback?.is_playing;
  const track = playback?.item;
  const duration = track?.duration_ms || 1;
  const progress = Math.min((progressMs / duration) * 100, 100);
  const albumArt = track?.album?.images?.[0]?.url;
  const repeatState = playback?.repeat_state || "off";
  const shuffleOn = playback?.shuffle_state;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="fixed bottom-[72px] right-4 z-40">
      <AnimatePresence>
        {expanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden w-72"
          >
            <div className="relative">
              {albumArt ? (
                <div className="relative">
                  <img src={albumArt} alt="album" className="w-full h-36 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card/95" />
                  {isPlaying && <div className="absolute bottom-3 left-3"><Equalizer /></div>}
                </div>
              ) : (
                <div className="w-full h-24 bg-secondary flex items-center justify-center">
                  {isPlaying ? <Equalizer /> : <Music className="w-8 h-8 text-muted-foreground" />}
                </div>
              )}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="text-primary w-3.5 h-3.5">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                  <span className="text-xs font-heading font-semibold text-white">Spotify</span>
                </div>
                <button onClick={() => setExpanded(false)} className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white">
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4">
              {!connected ? (
                <div>
                  <p className="text-xs text-muted-foreground text-center mb-2">
                    Você será redirecionado para fazer login com sua <strong>conta do Spotify</strong> (não a conta do Fitora)
                  </p>
                  <button
                    onClick={handleConnect}
                    className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-heading font-semibold flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Conectar com Spotify
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <p className="text-sm font-heading font-bold text-foreground truncate">{track?.name || "Nenhuma música tocando"}</p>
                    <p className="text-xs text-muted-foreground truncate">{track?.artists?.map(a => a.name).join(", ") || "—"}</p>
                  </div>

                  <div className="mb-3">
                    <div
                      className="w-full h-1 bg-secondary rounded-full cursor-pointer"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pct = (e.clientX - rect.left) / rect.width;
                        const newMs = Math.floor(pct * duration);
                        setProgressMs(newMs);
                        playerAction("play", { position_ms: newMs });
                      }}
                    >
                      <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-muted-foreground">{formatMs(progressMs)}</span>
                      <span className="text-xs text-muted-foreground">{formatMs(duration)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <button onClick={toggleShuffle} className={`transition-colors ${shuffleOn ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                      <Shuffle className="w-4 h-4" />
                    </button>
                    <button onClick={() => playerAction("previous")} disabled={loading} className="text-muted-foreground hover:text-foreground transition-colors">
                      <SkipBack className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => playerAction(isPlaying ? "pause" : "play")}
                      disabled={loading}
                      className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-lg"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>
                    <button onClick={() => playerAction("next")} disabled={loading} className="text-muted-foreground hover:text-foreground transition-colors">
                      <SkipForward className="w-5 h-5" />
                    </button>
                    <button onClick={cycleRepeat} className={`transition-colors ${repeatState !== "off" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                      {repeatState === "track" ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <button onClick={() => setShowVolume(v => !v)} className="text-muted-foreground hover:text-foreground transition-colors">
                      {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <AnimatePresence>
                      {showVolume && (
                        <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} className="flex-1 overflow-hidden">
                          <input type="range" min={0} max={100} value={volume} onChange={(e) => handleVolumeChange(Number(e.target.value))} className="w-full h-1 accent-primary cursor-pointer" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {showVolume && <span className="text-xs text-muted-foreground w-6 text-right">{volume}</span>}
                  </div>

                  {error && error !== 'no_device' && (
                    <div className="mb-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                      <p className="text-xs font-bold text-red-700 mb-1">⚠️ {error}</p>
                      <button onClick={() => { setConnected(false); setError(null); }} className="text-xs font-semibold text-red-600 underline">
                        Reconectar Spotify
                      </button>
                    </div>
                  )}

                  {error === 'no_device' && (
                    <div className="mb-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                      <p className="text-xs font-bold text-amber-700 mb-1.5">📱 Ative um dispositivo Spotify</p>
                      <div className="text-xs text-amber-800 space-y-0.5 mb-2.5">
                        <p>1. Abra o Spotify no seu celular</p>
                        <p>2. Toque em qualquer música (pode pausar)</p>
                        <p>3. Volte aqui e selecione o dispositivo abaixo</p>
                      </div>
                      <div className="flex gap-2">
                        {isNative && (
                          <button
                            onClick={async () => {
                              window.open('spotify://', '_system');
                              setWaitingSpotify(true);
                              // Após retornar do Spotify, tenta auto-detectar dispositivo
                              let attempts = 0;
                              clearInterval(spotifyPollRef.current);
                              spotifyPollRef.current = setInterval(async () => {
                                attempts++;
                                const token = await getValidToken();
                                if (!token) { clearInterval(spotifyPollRef.current); setWaitingSpotify(false); return; }
                                const { data } = await supabase.functions.invoke("spotifyPlayer", {
                                  body: { action: "get_devices", access_token: token },
                                });
                                const devs = data?.devices || [];
                                if (devs.length > 0) {
                                  clearInterval(spotifyPollRef.current);
                                  setWaitingSpotify(false);
                                  setDevices(devs);
                                  setShowDevices(true);
                                  setError(null);
                                  // Se só há 1 dispositivo, transfere automaticamente
                                  if (devs.length === 1) {
                                    await supabase.functions.invoke("spotifyPlayer", {
                                      body: { action: "transfer_playback", access_token: token, target_device_id: devs[0].id },
                                    });
                                    setTimeout(fetchPlayback, 1500);
                                    setShowDevices(false);
                                  }
                                }
                                if (attempts >= 15) { clearInterval(spotifyPollRef.current); setWaitingSpotify(false); }
                              }, 2000);
                            }}
                            className="flex-1 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
                          >
                            {waitingSpotify ? '⏳ Aguardando...' : 'Abrir Spotify →'}
                          </button>
                        )}
                        <button
                          onClick={fetchDevices}
                          className="flex-1 py-1.5 rounded-lg bg-amber-200 text-amber-900 text-xs font-semibold"
                        >
                          Atualizar dispositivos
                        </button>
                      </div>
                    </div>
                  )}

                  {!error && !track && (
                    <div className="mb-2 bg-secondary rounded-xl px-3 py-2.5 text-xs text-muted-foreground text-center space-y-0.5">
                      <p className="font-semibold text-foreground">Como usar:</p>
                      <p>1. Abra o Spotify no celular</p>
                      <p>2. Toque em qualquer música (pode pausar)</p>
                      <p>3. Volte aqui — o app detecta sozinho</p>
                      <p>ou clique em <strong>Dispositivos</strong> abaixo</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={showPlaylists ? () => setShowPlaylists(false) : fetchPlaylists}
                      className="flex-1 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1 py-1.5 rounded-lg bg-secondary"
                    >
                      <Music className="w-3 h-3" />
                      Playlists
                    </button>
                    <button
                      onClick={showDevices ? () => setShowDevices(false) : fetchDevices}
                      className="flex-1 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1 py-1.5 rounded-lg bg-secondary"
                    >
                      📱 Dispositivos
                    </button>
                  </div>

                  {showDevices && (
                    <div className="mt-2 space-y-1 max-h-36 overflow-y-auto">
                      {devices.length === 0 ? (
                        <div className="text-center py-2 space-y-2">
                          <div className="flex items-center justify-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-primary/60 animate-pulse" />
                            <p className="text-xs text-muted-foreground">Procurando dispositivos...</p>
                          </div>
                          <button onClick={playWithoutDevice} className="w-full text-xs font-semibold text-primary bg-primary/10 rounded-lg py-2 px-3">
                            ▶ Tocar no dispositivo ativo
                          </button>
                          <button onClick={() => fetchDevices()} className="text-xs text-muted-foreground underline">
                            Atualizar lista
                          </button>
                        </div>
                      ) : devices.map((d) => (
                        <button key={d.id} onClick={() => transferToDevice(d.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2 ${d.is_active ? "bg-primary/10 text-primary" : "hover:bg-secondary text-foreground"}`}>
                          <span>{d.type === "Smartphone" ? "📱" : d.type === "Computer" ? "💻" : "🔊"}</span>
                          <span className="flex-1 truncate">{d.name}</span>
                          {d.is_active && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">ativo</span>}
                        </button>
                      ))}
                    </div>
                  )}

                  {showPlaylists && (
                    <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                      {playlists.map((pl) => (
                        <button
                          key={pl.id}
                          onClick={() => playPlaylist(pl.uri)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary text-xs text-foreground transition-colors flex items-center gap-2"
                        >
                          {pl.images?.[0]?.url ? (
                            <img src={pl.images[0].url} alt="" className="w-6 h-6 rounded object-cover shrink-0" />
                          ) : (
                            <div className="w-6 h-6 rounded bg-secondary shrink-0" />
                          )}
                          <span className="truncate">{pl.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setExpanded(true)}
            className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center border-2 transition-all overflow-hidden ${isPlaying ? "border-primary" : "bg-card border-border"}`}
          >
            {albumArt ? (
              <div className="relative w-full h-full">
                <img src={albumArt} alt="album" className="w-full h-full object-cover" />
                {isPlaying && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Equalizer /></div>}
              </div>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className={`w-6 h-6 ${isPlaying ? "text-primary" : "text-muted-foreground"}`}>
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
