import React from "react";
import { motion } from "framer-motion";
import { X, CheckCircle, AlertCircle, TrendingUp, Dumbbell, Target, Award, ChevronRight, RotateCcw } from "lucide-react";

const difficultyMap = {
  iniciante: { label: "Iniciante", color: "text-green-400", bg: "bg-green-500/15 border-green-500/30" },
  intermediario: { label: "Intermediário", color: "text-yellow-400", bg: "bg-yellow-500/15 border-yellow-500/30" },
  avancado: { label: "Avançado", color: "text-red-400", bg: "bg-red-500/15 border-red-500/30" },
};

export default function ExerciseDetailModal({ exercise, onClose }) {
  const diff = difficultyMap[exercise.difficulty] || difficultyMap.iniciante;

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-50 bg-background flex flex-col overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4 shrink-0 sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-lg">
            <Dumbbell className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-xs text-primary uppercase tracking-wider font-semibold">Exercício</p>
            <h2 className="text-lg font-heading font-bold text-foreground leading-tight">{exercise.name}</h2>
          </div>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-xl bg-card border border-border hover:border-destructive/30 transition-all flex items-center justify-center">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="px-5 pb-24 space-y-4 pt-4">

        {/* Quick Info */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-2xl p-3 text-center">
            <Target className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground font-heading">Principal</p>
            <p className="text-xs font-heading font-bold text-foreground mt-0.5 leading-tight">{exercise.primary_muscle}</p>
          </div>
          <div className={`border rounded-2xl p-3 text-center ${diff.bg}`}>
            <Award className="w-4 h-4 mx-auto mb-1 opacity-70" />
            <p className="text-xs text-muted-foreground font-heading">Nível</p>
            <p className={`text-xs font-heading font-bold mt-0.5 ${diff.color}`}>{diff.label}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-3 text-center">
            <Dumbbell className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs text-muted-foreground font-heading">Equipamento</p>
            <p className="text-xs font-heading font-bold text-foreground mt-0.5 leading-tight">{exercise.equipment || "—"}</p>
          </div>
        </div>

        {/* Secondary Muscles */}
        {exercise.secondary_muscles?.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-orange-400" />
              <p className="text-sm font-heading font-semibold text-foreground">Músculos Secundários</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {exercise.secondary_muscles.map((m, i) => (
                <span key={i} className="text-xs text-muted-foreground bg-secondary rounded-lg px-2.5 py-1.5">{m}</span>
              ))}
            </div>
          </div>
        )}

        {/* Steps + GIF lado a lado */}
        {exercise.steps?.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-primary" />
              <p className="text-sm font-heading font-semibold text-foreground">Passo a Passo</p>
            </div>
            <div className="flex gap-4 items-stretch">
              {/* Lista de passos */}
              <div className="space-y-2.5 flex-1 min-w-0">
                {exercise.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-heading font-bold text-primary">{i + 1}</span>
                    </div>
                    <p className="text-sm text-muted-foreground flex-1 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
              {/* GIF lateral direito */}
              {exercise.animation_url && (
                <div className="w-44 shrink-0 rounded-xl overflow-hidden bg-white flex flex-col items-center justify-center">
                  <img
                    src={exercise.animation_url}
                    alt={exercise.name}
                    className="w-full object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form Tips */}
        {exercise.form_tips?.length > 0 && (
          <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <p className="text-sm font-heading font-semibold text-green-400">Dicas de Postura</p>
            </div>
            <ul className="space-y-2">
              {exercise.form_tips.map((tip, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-green-500 mt-1 shrink-0">✓</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Common Mistakes */}
        {exercise.common_mistakes?.length > 0 && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-sm font-heading font-semibold text-red-400">Erros Comuns</p>
            </div>
            <ul className="space-y-2">
              {exercise.common_mistakes.map((mistake, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-red-500 mt-1 shrink-0">✗</span>
                  <span>{mistake}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Variations + Substitutes */}
        {exercise.variations?.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-accent" />
              <p className="text-sm font-heading font-semibold text-foreground">Variações</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {exercise.variations.map((v, i) => (
                <span key={i} className="text-xs text-muted-foreground bg-secondary rounded-lg px-2.5 py-1.5">{v}</span>
              ))}
            </div>
          </div>
        )}

        {exercise.substitutes?.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <RotateCcw className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm font-heading font-semibold text-foreground">Exercícios Substitutos</p>
            </div>
            <div className="space-y-2">
              {exercise.substitutes.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}