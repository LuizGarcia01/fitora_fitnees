import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const STEPS = [
  {
    target: 'hamburger',
    title: 'Menu Principal',
    desc: 'Bem-vindo ao Fitora! 👋 Toque no botão indicado para abrir o menu.',
    tapLabel: 'Toque no ☰ para abrir o menu',
    advance: 'drawer-open',
  },
  {
    target: 'nav-treino',
    title: 'Meu Treino 🏋️',
    desc: 'Acesse e execute seus treinos diários com séries, repetições e descanso.',
    tapLabel: 'Toque em "Meu Treino"',
    advance: 'path',
    advancePath: '/plano',
    requireDrawerOpen: true,
  },
  {
    target: null,
    title: 'Plano de Treino',
    desc: 'Execute exercícios passo a passo com cronômetro de descanso e histórico automático.',
    advance: 'next',
    onNext: 'open-drawer',
  },
  {
    target: 'nav-medidas',
    title: 'Medidas 📏',
    desc: 'Registre peso e medidas corporais para acompanhar sua evolução física.',
    tapLabel: 'Toque em "Medidas"',
    advance: 'path',
    advancePath: '/medidas',
    requireDrawerOpen: true,
  },
  {
    target: null,
    title: 'Evolução Física',
    desc: 'Gráficos de progresso e histórico de medidas para ver o quanto você evoluiu.',
    advance: 'next',
    onNext: 'open-drawer',
  },
  {
    target: 'nav-biblioteca',
    title: 'Biblioteca 📚',
    desc: 'Centenas de exercícios com instruções detalhadas e imagens animadas.',
    tapLabel: 'Toque em "Biblioteca"',
    advance: 'path',
    advancePath: '/biblioteca',
    requireDrawerOpen: true,
  },
  {
    target: null,
    title: 'Pronto para Treinar! 💪',
    desc: 'Você conheceu as principais funcionalidades do Fitora. Crie seu primeiro plano!',
    advance: 'finish',
  },
];

export default function OnboardingTutorial({ drawerOpen, setDrawerOpen, onFinish }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [stepIdx, setStepIdx] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const prevDrawerOpen = useRef(drawerOpen);
  const step = STEPS[stepIdx];

  const refreshRect = useCallback(() => {
    if (!step?.target) { setTargetRect(null); return; }
    const el = document.querySelector(`[data-tutorial="${step.target}"]`);
    setTargetRect(el ? el.getBoundingClientRect() : null);
  }, [step?.target]);

  useEffect(() => {
    const t = setTimeout(refreshRect, 280);
    return () => clearTimeout(t);
  }, [stepIdx, drawerOpen, refreshRect]);

  useEffect(() => {
    window.addEventListener('resize', refreshRect);
    return () => window.removeEventListener('resize', refreshRect);
  }, [refreshRect]);

  useEffect(() => {
    if (!step?.requireDrawerOpen || drawerOpen) return;
    const t = setTimeout(() => setDrawerOpen(true), 500);
    return () => clearTimeout(t);
  }, [step, drawerOpen, setDrawerOpen]);

  useEffect(() => {
    const wasOpen = prevDrawerOpen.current;
    prevDrawerOpen.current = drawerOpen;
    if (step?.advance === 'drawer-open' && drawerOpen && !wasOpen) {
      const t = setTimeout(() => setStepIdx(i => i + 1), 320);
      return () => clearTimeout(t);
    }
  }, [drawerOpen, step]);

  useEffect(() => {
    if (step?.advance !== 'path') return;
    if (location.pathname === step.advancePath) {
      const t = setTimeout(() => setStepIdx(i => i + 1), 400);
      return () => clearTimeout(t);
    }
  }, [location.pathname, step]);

  const handleNext = () => {
    if (step?.onNext === 'open-drawer') {
      setDrawerOpen(true);
      setTimeout(() => setStepIdx(i => i + 1), 380);
    } else if (step?.advance === 'finish') {
      onFinish();
      navigate('/novo-plano');
    } else {
      setStepIdx(i => i + 1);
    }
  };

  if (!step) return null;

  const PAD = 10;
  const sw = window.innerWidth;

  let spot = null;
  if (targetRect) {
    spot = {
      t: Math.max(0, targetRect.top - PAD),
      l: Math.max(0, targetRect.left - PAD),
      w: targetRect.width + PAD * 2,
      h: targetRect.height + PAD * 2,
    };
  }

  const targetCenterX = spot ? spot.l + spot.w / 2 : sw / 2;
  const arrowLeftInCard = Math.max(12, Math.min(sw - 32 - 16 - 20, targetCenterX - 16 - 8));

  // Proxy de clique: executa a ação do passo diretamente (não depende de pointer-events no WebView)
  const handleProxyClick = () => {
    if (step.target === 'hamburger') {
      setDrawerOpen(true);
    } else if (step.target === 'nav-treino') {
      setDrawerOpen(false);
      navigate('/plano');
    } else if (step.target === 'nav-medidas') {
      setDrawerOpen(false);
      navigate('/medidas');
    } else if (step.target === 'nav-biblioteca') {
      setDrawerOpen(false);
      navigate('/biblioteca');
    }
  };

  return (
    <>
      {/* Escuridão via box-shadow — apenas visual, não bloqueia */}
      {spot ? (
        <>
          <div
            style={{
              position: 'fixed',
              top: spot.t, left: spot.l, width: spot.w, height: spot.h,
              borderRadius: 16,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.80)',
              pointerEvents: 'none',
              zIndex: 100,
            }}
          />
          <div
            className="border-[2.5px] border-primary rounded-2xl"
            style={{ position: 'fixed', top: spot.t, left: spot.l, width: spot.w, height: spot.h, pointerEvents: 'none', zIndex: 101 }}
          />
          <div
            className="border-2 border-primary rounded-2xl animate-ping opacity-60"
            style={{ position: 'fixed', top: spot.t, left: spot.l, width: spot.w, height: spot.h, pointerEvents: 'none', zIndex: 101 }}
          />
          {/* Proxy transparente clicável sobre o elemento — garante toque no Android WebView */}
          <div
            onClick={handleProxyClick}
            style={{
              position: 'fixed',
              top: spot.t, left: spot.l, width: spot.w, height: spot.h,
              zIndex: 200,
              WebkitTapHighlightColor: 'transparent',
              cursor: 'pointer',
            }}
          />
        </>
      ) : (
        <div
          className="bg-black/80"
          style={{ position: 'fixed', inset: 0, zIndex: 100, pointerEvents: 'auto' }}
        />
      )}

      {/* Botão Pular — canto superior direito */}
      <button
        onClick={onFinish}
        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/15 text-white/90 text-xs font-semibold backdrop-blur-sm"
        style={{ position: 'fixed', top: 12, right: 16, zIndex: 102 }}
      >
        <X className="w-3 h-3" />
        Pular
      </button>

      {/* Card rodapé com seta apontando para o elemento */}
      <motion.div
        key={stepIdx}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        style={{ position: 'fixed', bottom: 24, left: 16, right: 16, zIndex: 102 }}
      >
        {/* Seta triangular apontando para cima */}
        {spot && (
          <div
            className="absolute -top-[9px] w-4 h-4 bg-card border-l border-t border-border/60 rotate-45 rounded-sm"
            style={{ left: arrowLeftInCard }}
          />
        )}

        <div className="bg-card border border-border/60 rounded-3xl shadow-2xl px-5 pt-4 pb-5">
          {/* Progresso dentro do card */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex gap-1">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === stepIdx ? 'w-5 bg-primary' : i < stepIdx ? 'w-1.5 bg-primary/50' : 'w-1.5 bg-muted'
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground font-medium ml-1">
              {stepIdx + 1}/{STEPS.length}
            </span>
          </div>

          <h3 className="text-[15px] font-heading font-bold text-foreground mb-1 leading-snug">
            {step.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {step.desc}
          </p>

          {/* Instrução pulsante dentro do card */}
          {step.tapLabel && (
            <motion.div
              className="mt-3 flex items-center gap-2"
              animate={{ opacity: [1, 0.45, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              <span className="text-base">👆</span>
              <span className="text-sm font-semibold text-primary">{step.tapLabel}</span>
            </motion.div>
          )}

          {(step.advance === 'next' || step.advance === 'finish') && (
            <button
              onClick={handleNext}
              className="mt-4 w-full py-3 rounded-2xl bg-primary text-primary-foreground font-heading font-bold text-sm shadow-lg shadow-primary/25 active:scale-[0.97] transition-transform"
            >
              {step.advance === 'finish' ? '🚀 Criar meu plano' : 'Próximo →'}
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
}
