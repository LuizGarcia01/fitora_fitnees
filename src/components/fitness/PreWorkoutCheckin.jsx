import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Smile, Meh, Frown, Battery, BatteryCharging, BatteryWarning } from "lucide-react";
import { Button } from "@/components/ui/button";

const moodOptions = [
  { value: "great", label: "Muito bem", icon: Smile, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
  { value: "normal", label: "Normal", icon: Meh, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { value: "tired", label: "Cansado", icon: Frown, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  { value: "pain", label: "Com dor/desconforto", icon: BatteryWarning, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" }
];

export default function PreWorkoutCheckin({ onConfirm, onClose }) {
  const [mood, setMood] = useState(null);

  const getRecommendation = () => {
    if (!mood) return null;
    switch (mood) {
      case "great":
        return { title: "🔥 Hora de buscar PR!", desc: "Você está com energia total. Que tal tentar bater um recorde hoje?" };
      case "normal":
        return { title: "💪 Treino normal", desc: "Mantenha o foco e siga o plano. Constância é tudo!" };
      case "tired":
        return { title: "😴 Ouça seu corpo", desc: "Reduza a carga ou faça um treino mais leve. O importante é aparecer!" };
      case "pain":
        return { title: "⚠️ Cuidado", desc: "Evite exercícios que causem dor. Foque em mobilidade ou descanse." };
      default:
        return null;
    }
  };

  const recommendation = getRecommendation();

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-heading">Check-in</p>
          <h2 className="text-lg font-heading font-bold text-foreground leading-tight">Como está se sentindo?</h2>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="px-5 flex-1">
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-heading mb-3">
          Energia hoje
        </p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {moodOptions.map((option, i) => {
            const Icon = option.icon;
            const isSelected = mood === option.value;
            return (
              <motion.button
                key={option.value}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setMood(option.value)}
                className={`p-4 rounded-xl border transition-all text-left ${
                  isSelected
                    ? `${option.bg} ${option.border}`
                    : "bg-card border-border hover:border-primary/30"
                }`}
              >
                <Icon className={`w-6 h-6 mb-2 ${isSelected ? option.color : "text-muted-foreground"}`} />
                <p className={`text-sm font-heading font-semibold ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                  {option.label}
                </p>
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          {recommendation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-primary/5 border border-primary/20 rounded-xl p-4"
            >
              <p className="text-sm font-heading font-bold text-primary mb-1">{recommendation.title}</p>
              <p className="text-xs text-muted-foreground">{recommendation.desc}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action */}
      {mood && (
        <div className="px-5 pb-8 pt-4">
          <Button
            onClick={() => onConfirm(mood)}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-heading font-bold text-base"
          >
            Começar Treino
          </Button>
        </div>
      )}
    </motion.div>
  );
}