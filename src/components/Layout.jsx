import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Home, Dumbbell, BookOpen, CalendarDays, User, Menu, X, LogOut, ChevronRight, Scale } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import OnboardingTutorial from "@/components/OnboardingTutorial";
import AICoach from "@/components/fitness/AICoach";
import { VitaRobot } from "@/components/VitaRobot";


const bottomNavItems = [
  { path: "/",           icon: Home,         label: "Início"     },
  { path: "/plano",      icon: Dumbbell,     label: "Treino"     },
  { path: "/historico",  icon: CalendarDays, label: "Histórico"  },
  { path: "/biblioteca", icon: BookOpen,     label: "Biblioteca" },
  { path: "/perfil",     icon: User,         label: "Perfil"     },
];

export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [showVita, setShowVita] = useState(false);
  const [tutorialDone, setTutorialDone] = useState(
    () => !!localStorage.getItem('fitora_tutorial_done')
  );

  const handleTutorialFinish = () => {
    localStorage.setItem('fitora_tutorial_done', '1');
    setTutorialDone(true);
    setOpen(false);
  };

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Usuário";
  const userEmail = user?.email || "";
  const initials = userName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Barra de navegação superior fixa */}
      <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-background/95 backdrop-blur-sm border-b border-border/40 flex items-center px-4 gap-3 shrink-0">
        <motion.button
          data-tutorial="hamburger"
          onClick={() => setOpen(true)}
          whileTap={{ scale: 0.92 }}
          className="w-10 h-10 rounded-xl bg-primary shadow-lg shadow-primary/35 flex items-center justify-center shrink-0"
        >
          <Menu className="w-5 h-5 text-primary-foreground" />
        </motion.button>
        <div className="flex flex-col leading-none">
          <span className="text-[15px] font-heading font-bold tracking-wide text-foreground">FITORA</span>
          <span className="text-[10px] text-muted-foreground tracking-widest font-medium">Treine · Evolua · Conquiste</span>
        </div>
      </header>

      <main className="flex-1 pt-14 pb-20">
        <Outlet />
      </main>

      {/* Barra de navegação inferior fixa */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-background/95 backdrop-blur-sm border-t border-border/40 flex items-center justify-around px-2 shrink-0">
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 transition-colors"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                  : "text-muted-foreground"
              }`}>
                <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span className={`text-[10px] font-heading font-semibold leading-none ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <AnimatePresence>
        {open && (
          <>
            {/* Overlay escuro */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-background border-r border-border flex flex-col shadow-2xl"
            >
              {/* Cabeçalho — só perfil do usuário */}
              <div className="bg-primary px-5 pt-12 pb-6 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center shrink-0 overflow-hidden">
                    {user?.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt={userName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-heading font-bold text-white">{initials}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-heading font-bold text-white leading-tight truncate">{userName}</p>
                    <p className="text-xs text-white/60 mt-0.5 truncate">{userEmail}</p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Atalhos extras (o que não está na nav inferior) */}
              <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {[{ path: "/medidas", icon: Scale, label: "Medidas Corporais", tutorial: "nav-medidas" }].map((item, i) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        to={item.path}
                        onClick={() => setOpen(false)}
                        {...(item.tutorial ? { 'data-tutorial': item.tutorial } : {})}
                        className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${
                          isActive
                            ? "bg-primary/10 border border-primary/20"
                            : "hover:bg-secondary"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                            : "bg-secondary text-muted-foreground"
                        }`}>
                          <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 1.8} />
                        </div>
                        <span className={`flex-1 text-sm font-heading font-semibold ${
                          isActive ? "text-primary" : "text-foreground"
                        }`}>
                          {item.label}
                        </span>
                        {isActive && (
                          <ChevronRight className="w-4 h-4 text-primary shrink-0" />
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              {/* Rodapé — brand + logout */}
              <div className="px-3 pb-8 pt-2 border-t border-border/40 shrink-0">

                {/* Logout */}
                <button
                  onClick={() => { setOpen(false); logout(); }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl hover:bg-destructive/10 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <LogOut className="w-[18px] h-[18px] text-destructive" />
                  </div>
                  <span className="text-sm font-heading font-semibold text-destructive">Sair da Conta</span>
                </button>

                {/* FITORA branding — rodapé final */}
                <div className="flex items-center justify-center gap-2.5 pt-4 mt-1 border-t border-border/30">
                  <div className="w-8 h-8 rounded-xl overflow-hidden border border-border/60 shrink-0">
                    <img
                      src="/logo.png"
                      alt="Fitora"
                      className="w-full h-full object-cover"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  </div>
                  <div>
                    <p className="text-[11px] font-heading font-bold tracking-[0.18em] text-foreground/60 uppercase leading-none">FITORA</p>
                    <p className="text-[9px] text-muted-foreground/50 tracking-widest mt-0.5">Treine · Evolua · Conquiste</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Botão flutuante VITA — oculto em /plano (já tem AICoach no header) */}
      <AnimatePresence>
        {!showVita && location.pathname !== "/plano" && (
          <motion.button
            key="vita-fab"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowVita(true)}
            className="fixed bottom-20 right-4 z-40 flex items-center justify-center"
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <VitaRobot size={40} />
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* AICoach global (abre ao tocar na VITA) */}
      <AnimatePresence>
        {showVita && (
          <AICoach onClose={() => setShowVita(false)} />
        )}
      </AnimatePresence>

      {/* Tutorial interativo para novos usuários */}
      {!tutorialDone && user && (
        <OnboardingTutorial
          drawerOpen={open}
          setDrawerOpen={setOpen}
          onFinish={handleTutorialFinish}
        />
      )}
    </div>
  );
}
