import React from "react";
import { motion } from "framer-motion";
import { Moon } from "lucide-react";

const dayAbbrev = {
  "Segunda": "SEG",
  "Terça": "TER",
  "Quarta": "QUA",
  "Quinta": "QUI",
  "Sexta": "SEX",
  "Sábado": "SÁB",
  "Domingo": "DOM"
};

export default function WeekDayTab({ day, isActive, isRest, onClick }) {
  const abbrev = dayAbbrev[day] || day.substring(0, 3).toUpperCase();

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-2xl min-w-[60px] transition-all duration-300 overflow-hidden ${
        isActive
          ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 scale-105"
          : isRest
          ? "bg-card/50 text-muted-foreground border border-border/50"
          : "bg-card text-foreground border border-border/50 hover:border-primary/30 hover:bg-card/80"
      }`}
    >
      {isActive && (
        <motion.div
          layoutId="active-day-glow"
          className="absolute inset-0 bg-primary/20"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <div className="relative z-10 flex flex-col items-center">
        {isRest && !isActive ? (
          <Moon className="w-3.5 h-3.5 mb-0.5 opacity-60" />
        ) : null}
        <span className={`text-[10px] font-bold uppercase tracking-wider ${isRest && !isActive ? "opacity-60" : ""}`}>
          {abbrev}
        </span>
        {isRest && !isActive && (
          <span className="text-[8px] opacity-40 font-medium">REST</span>
        )}
      </div>
    </motion.button>
  );
}