import React from "react";
import { motion } from "framer-motion";
import { Check, RotateCcw, Repeat, Dumbbell } from "lucide-react";

export default function ExerciseCard({ exercise, index, animationUrl, completed, onToggle, onSubstitute }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-300 ${
        completed
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-card hover:border-primary/30"
      }`}
    >
      {/* Thumbnail GIF */}
      <div className={`w-14 h-14 rounded-xl overflow-hidden shrink-0 flex items-center justify-center ${completed ? "opacity-50" : ""} ${animationUrl ? "bg-white" : "bg-secondary"}`}>
        {animationUrl ? (
          <img src={animationUrl} alt={exercise.name} className="w-full h-full object-contain" />
        ) : (
          <Dumbbell className="w-5 h-5 text-muted-foreground opacity-40" />
        )}
      </div>

      {/* Indicador de conclusão */}
      <button
        onClick={onToggle}
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
          completed
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-muted-foreground hover:bg-primary/20"
        }`}
      >
        {completed ? <Check className="w-4 h-4" /> : <span className="font-heading font-bold text-xs">{index + 1}</span>}
      </button>

      <div className="flex-1 min-w-0">
        <h4 className={`font-heading font-semibold transition-all ${completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
          {exercise.name}
        </h4>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-muted-foreground">
            {exercise.sets} séries × {exercise.reps}
          </span>
          {exercise.rest_seconds && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <RotateCcw className="w-3 h-3" />
              {exercise.rest_seconds}s descanso
            </span>
          )}
        </div>
        {exercise.notes && (
          <p className="text-xs text-primary/70 mt-1">{exercise.notes}</p>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (onSubstitute) onSubstitute(e);
        }}
        className="w-8 h-8 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
        title="Substituir exercício"
      >
        <Repeat className="w-4 h-4" />
      </button>
    </motion.div>
  );
}