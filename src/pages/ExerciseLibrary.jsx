import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Dumbbell, Zap, Target, X } from "lucide-react";
import ExerciseDetailModal from "@/components/fitness/ExerciseDetailModal";
import ExerciseGif from "@/components/fitness/ExerciseGif";

const categories = [
  { value: "all", label: "Todos" },
  { value: "peito", label: "Peito" },
  { value: "costas", label: "Costas" },
  { value: "pernas", label: "Pernas" },
  { value: "ombros", label: "Ombros" },
  { value: "biceps", label: "Bíceps" },
  { value: "triceps", label: "Tríceps" },
  { value: "abdomen", label: "Abdômen" },
  { value: "gluteos", label: "Glúteos" },
  { value: "cardio", label: "Cardio" },
];

const difficultyColors = {
  iniciante: "text-green-400 bg-green-500/10 border-green-500/20",
  intermediario: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  avancado: "text-red-400 bg-red-500/10 border-red-500/20",
};

const difficultyLabels = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

const categoryIcons = {
  cardio: Zap,
};

export default function ExerciseLibrary() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExercise, setSelectedExercise] = useState(null);

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ["exercise-library"],
    queryFn: async () => {
      const { data } = await supabase.from("exercise_library").select("*");
      return data || [];
    },
  });

  const filteredExercises = exercises.filter((ex) => {
    const matchesCategory = selectedCategory === "all" || ex.category === selectedCategory;
    const matchesSearch =
      ex.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.primary_muscle?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-14 z-20 bg-background/95 backdrop-blur-sm border-b border-border/40 px-4 pt-4 pb-3 space-y-3">
        {/* Search Bar */}
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-5 h-5 text-primary/70" />
          <input
            type="text"
            placeholder="Buscar exercício ou músculo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-primary/30 rounded-2xl pl-11 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                selectedCategory === cat.value
                  ? "bg-primary/20 text-primary border-primary/50"
                  : "bg-card text-muted-foreground border-border/50 hover:border-primary/30"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="px-4 py-2.5">
        <p className="text-xs text-muted-foreground">
          {isLoading ? "Carregando..." : `${filteredExercises.length} exercícios`}
        </p>
      </div>

      {/* List */}
      <div className="flex-1 px-4 pb-24 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredExercises.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-sm text-muted-foreground">Nenhum exercício encontrado</p>
          </div>
        ) : (
          filteredExercises.map((exercise, index) => (
            <motion.div
              key={exercise.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              onClick={() => setSelectedExercise(exercise)}
              className="flex items-center gap-3 bg-card border border-border/50 rounded-2xl p-3 cursor-pointer hover:border-primary/30 active:scale-[0.98] transition-all"
            >
              {/* Thumbnail */}
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-secondary flex-shrink-0 flex items-center justify-center">
                <ExerciseThumbnail name={exercise.name} animationUrl={exercise.animation_url} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight truncate">
                  {exercise.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {exercise.primary_muscle}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${difficultyColors[exercise.difficulty] || difficultyColors.iniciante}`}>
                    {difficultyLabels[exercise.difficulty] || exercise.difficulty}
                  </span>
                  <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                    {categories.find(c => c.value === exercise.category)?.label || exercise.category}
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedExercise && (
          <ExerciseDetailModal
            exercise={selectedExercise}
            onClose={() => setSelectedExercise(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Componente leve que mostra o GIF em tamanho thumbnail
function ExerciseThumbnail({ name, animationUrl }) {
  const [failed, setFailed] = React.useState(false);

  if (!animationUrl || failed) {
    return <Dumbbell className="w-6 h-6 text-muted-foreground opacity-40" />;
  }

  return (
    <img
      src={animationUrl}
      alt={name}
      className="w-full h-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}