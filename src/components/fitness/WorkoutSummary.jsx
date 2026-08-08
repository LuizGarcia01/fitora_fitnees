import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Flame, Dumbbell, Clock, X, Star } from "lucide-react";

const MOTIVATIONS = [
  "Cada treino é um passo a mais para a melhor versão de você!",
  "Consistência é o segredo. Mais um dia vencido!",
  "Você não vai se arrepender de ter treinado. Continue assim!",
  "Mente forte, corpo forte. Você está no caminho certo!",
  "Treino concluído! Isso é o que te separa da média.",
];

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}min ${s}s` : `${m}min`;
}

function ConfettiDot({ delay, color }) {
  const x = (Math.random() - 0.5) * 300;
  const y = -(120 + Math.random() * 160);
  const rotate = Math.random() * 720 - 360;
  return (
    <motion.div
      className="absolute w-2.5 h-2.5 rounded-sm"
      style={{ background: color, left: "50%", top: "30%" }}
      initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
      animate={{ opacity: 0, x, y, rotate, scale: 0.3 }}
      transition={{ delay, duration: 1.4, ease: "easeOut" }}
    />
  );
}

const CONFETTI_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];

export default function WorkoutSummary({ summary, onClose }) {
  const { completedCount, totalExercises, dayName, muscleGroup, durationSeconds, planName } = summary;
  const [dots] = useState(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: i * 0.04,
    }))
  );
  const motivation = useMemo(() => MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)], []);
  const completionRate = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;

  return (
    <motion.div
      className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex flex-col items-center justify-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Confetti */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {dots.map(d => <ConfettiDot key={d.id} delay={d.delay} color={d.color} />)}
      </div>

      {/* Close */}
      <button onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center">
        <X className="w-5 h-5 text-foreground" />
      </button>

      <div className="w-full max-w-sm space-y-6 relative">
        {/* Icon */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.2 }}
        >
          <div className="w-24 h-24 rounded-3xl bg-primary/15 border-2 border-primary/30 flex items-center justify-center mb-4 shadow-xl shadow-primary/20">
            <CheckCircle2 className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground text-center leading-tight">
            Treino<br />Concluído!
          </h1>
          <p className="text-muted-foreground text-sm text-center mt-1">{dayName} · {muscleGroup}</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-3 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Dumbbell className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">{completedCount}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">exercícios</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center mx-auto mb-2">
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-2xl font-heading font-bold text-foreground">{completionRate}%</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">concluído</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-heading font-bold text-foreground leading-none mt-1">{formatDuration(durationSeconds)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">duração</p>
          </div>
        </motion.div>

        {/* Motivation */}
        <motion.div
          className="bg-primary/8 border border-primary/20 rounded-2xl p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <div className="flex items-start gap-3">
            <Star className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground leading-relaxed font-medium">{motivation}</p>
          </div>
        </motion.div>

        {/* Button */}
        <motion.button
          onClick={onClose}
          className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-heading font-bold text-base shadow-lg shadow-primary/25"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          whileTap={{ scale: 0.98 }}
        >
          Continuar
        </motion.button>
      </div>
    </motion.div>
  );
}
