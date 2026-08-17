import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { supabase } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import {
  X, Check, GripVertical, Calendar, Dumbbell, ArrowRight,
  ChevronRight, ChevronLeft, Trash2, Plus, Search, RefreshCw, Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const MUSCLE_GROUPS = [
  { label: "Peito",   category: "peito" },
  { label: "Costas",  category: "costas" },
  { label: "Pernas",  category: "pernas" },
  { label: "Ombros",  category: "ombros" },
  { label: "Biceps",  category: "biceps" },
  { label: "Triceps", category: "triceps" },
  { label: "Abdomen", category: "abdomen" },
  { label: "Gluteos", category: "gluteos" },
  { label: "Cardio",  category: "cardio" },
];

const stripAccents = (s) =>
  s.replace(/[áàãâä]/g, "a")
   .replace(/[éèêë]/g, "e")
   .replace(/[íìîï]/g, "i")
   .replace(/[óòõôö]/g, "o")
   .replace(/[úùûü]/g, "u")
   .replace(/[ç]/g, "c");

// Retorna array de categorias — suporta grupos compostos como "Peito e Triceps"
const toCategories = (muscleGroup) => {
  const parts = muscleGroup.split(/\s+e\s+/i);
  return parts.map((part) => {
    const lower = part.trim().toLowerCase();
    const found = MUSCLE_GROUPS.find((g) => g.label.toLowerCase() === lower);
    return found ? found.category : stripAccents(lower);
  });
};

// ── Tela de seleção de modo ──────────────────────────────────────────────────
function ModeSelect({ onSelect, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-border/40">
        <h2 className="text-lg font-heading font-bold text-foreground">O que deseja editar?</h2>
        <button onClick={onClose} className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-4 px-5 pt-8">
        <button
          onClick={() => onSelect("dias")}
          className="flex items-center gap-4 p-5 rounded-2xl border-2 border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-base font-heading font-bold text-foreground">Dias da Semana</p>
            <p className="text-sm text-muted-foreground mt-0.5">Arraste os treinos para mudar o dia</p>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>

        <button
          onClick={() => onSelect("exercicios")}
          className="flex items-center gap-4 p-5 rounded-2xl border-2 border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <Dumbbell className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-base font-heading font-bold text-foreground">Exercicios</p>
            <p className="text-sm text-muted-foreground mt-0.5">Trocar, remover ou adicionar exercicios</p>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>
      </div>
    </motion.div>
  );
}

// ── Editor de dias (drag-and-drop) ───────────────────────────────────────────
function EditDays({ plan, localPlan, setLocalPlan, onSave, onBack, isSaving }) {
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const from = result.source.index;
    const to = result.destination.index;
    if (from === to) return;

    setLocalPlan((prev) => {
      const days = prev.map((b) => b.day);
      const reordered = [...prev];
      const [moved] = reordered.splice(from, 1);
      reordered.splice(to, 0, moved);
      return reordered.map((block, i) => ({ ...block, day: days[i] }));
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      <div className="flex items-center gap-3 px-5 pt-6 pb-4 border-b border-border/40 shrink-0">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
        <div>
          <p className="text-xs text-primary uppercase tracking-wider font-semibold">Dias da Semana</p>
          <h2 className="text-base font-heading font-bold text-foreground leading-tight">{plan.name}</h2>
        </div>
      </div>

      <div className="mx-5 mt-4 flex items-center gap-2.5 bg-secondary rounded-2xl px-4 py-2.5 shrink-0">
        <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
        <p className="text-xs text-muted-foreground">Segure o <span className="font-bold text-foreground">≡</span> e arraste o treino para o dia desejado</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-3 pb-4">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="days">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2.5">
                {localPlan.map((block, i) => (
                  <Draggable key={`${block.muscle_group}-${i}`} draggableId={`${block.muscle_group}-${i}`} index={i}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 ${
                          snapshot.isDragging
                            ? "border-primary bg-primary/8 shadow-xl shadow-primary/20"
                            : "border-border bg-card"
                        }`}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="w-9 h-9 rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-secondary transition-colors shrink-0"
                        >
                          <GripVertical className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-heading font-bold min-w-[60px] text-center ${
                          snapshot.isDragging ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                        }`}>
                          {block.day}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-heading font-bold text-foreground">{block.muscle_group}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{block.exercises.length} exercicios</p>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <div className="px-5 pb-24 pt-3 shrink-0 border-t border-border/40 bg-background">
        <Button onClick={() => onSave(localPlan)} disabled={isSaving}
          className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-heading font-bold text-base shadow-lg shadow-primary/25">
          {isSaving
            ? <><div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />Salvando...</>
            : <><Check className="w-5 h-5 mr-2" />Salvar Alteracoes</>}
        </Button>
      </div>
    </motion.div>
  );
}

// ── Picker de exercicios (filtrado por array de categorias) ─────────────────
function ExercisePicker({ categories, muscleGroupLabel, onSelect, onClose }) {
  const [search, setSearch] = useState("");

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ["exercise-library"],
    queryFn: async () => {
      const { data } = await supabase.from("exercise_library").select("*");
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const filtered = exercises.filter((ex) => {
    const matchesCategory = categories.includes(ex.category);
    const matchesSearch =
      !search ||
      ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.primary_muscle?.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-[60] bg-background flex flex-col"
    >
      <div className="flex items-center gap-3 px-5 pt-6 pb-4 border-b border-border/40 shrink-0">
        <button onClick={onClose} className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
        <div>
          <p className="text-xs text-primary uppercase tracking-wider font-semibold">Selecionar Exercicio</p>
          <h2 className="text-base font-heading font-bold text-foreground">{muscleGroupLabel}</h2>
        </div>
      </div>

      <div className="px-5 pt-3 pb-2 shrink-0">
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar exercicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            className="w-full bg-card border border-border rounded-2xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-6">
        {isLoading ? (
          <div className="space-y-2 mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-secondary animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm mt-10">Nenhum exercicio encontrado</p>
        ) : (
          <div className="space-y-2 mt-2">
            {filtered.map((ex) => (
              <button
                key={ex.id}
                onClick={() => onSelect(ex)}
                className="w-full flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{ex.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{ex.primary_muscle} · {ex.equipment}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Form de series/reps ao adicionar novo exercicio ──────────────────────────
function SetsRepsForm({ exercise, onConfirm, onClose }) {
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("12");

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-[70] bg-background flex flex-col"
    >
      <div className="flex items-center gap-3 px-5 pt-6 pb-4 border-b border-border/40 shrink-0">
        <button onClick={onClose} className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
        <div>
          <p className="text-xs text-primary uppercase tracking-wider font-semibold">Series e Repeticoes</p>
          <h2 className="text-base font-heading font-bold text-foreground leading-tight">{exercise.name}</h2>
        </div>
      </div>

      <div className="flex-1 px-5 pt-8 space-y-6">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Series</label>
          <input
            type="number"
            min="1"
            max="10"
            value={sets}
            onChange={(e) => setSets(e.target.value)}
            className="w-full bg-card border border-border rounded-2xl px-4 py-4 text-foreground text-center text-2xl font-bold focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Repeticoes</label>
          <input
            type="text"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder="ex: 12, 10-12, ate falha"
            className="w-full bg-card border border-border rounded-2xl px-4 py-4 text-foreground text-center text-2xl font-bold focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="px-5 pb-24 pt-3 border-t border-border/40 bg-background">
        <Button
          onClick={() => onConfirm({ name: exercise.name, sets: parseInt(sets) || 3, reps: reps || "12" })}
          className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-heading font-bold text-base shadow-lg shadow-primary/25"
        >
          <Check className="w-5 h-5 mr-2" />
          Adicionar Exercicio
        </Button>
      </div>
    </motion.div>
  );
}

// ── Picker de grupo muscular ─────────────────────────────────────────────────
function MuscleGroupPicker({ onSelect, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-[60] bg-background flex flex-col"
    >
      <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-border/40 shrink-0">
        <div>
          <p className="text-xs text-primary uppercase tracking-wider font-semibold">Trocar Modalidade</p>
          <h2 className="text-lg font-heading font-bold text-foreground">Grupo Muscular</h2>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="mx-5 mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl px-4 py-3 shrink-0">
        <p className="text-xs text-yellow-600 dark:text-yellow-400">Trocar a modalidade vai limpar os exercicios do dia. Voce podera adicionar novos em seguida.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6 space-y-2.5">
        {MUSCLE_GROUPS.map((g) => (
          <button
            key={g.category}
            onClick={() => onSelect(g)}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <Dumbbell className="w-5 h-5 text-primary" />
            </div>
            <p className="text-base font-heading font-bold text-foreground">{g.label}</p>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors ml-auto" />
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ── Editor de um dia especifico ──────────────────────────────────────────────
function EditDayView({ block, onSave, onBack }) {
  const [localBlock, setLocalBlock] = useState({
    ...block,
    exercises: [...block.exercises],
  });
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [picker, setPicker] = useState(null);
  const [setsRepsFor, setSetsRepsFor] = useState(null);

  const categories = toCategories(localBlock.muscle_group);

  const handleGroupSelect = (group) => {
    setLocalBlock((prev) => ({ ...prev, muscle_group: group.label, exercises: [] }));
    setShowGroupPicker(false);
  };

  const handleExerciseSelect = (libraryEx) => {
    if (picker.mode === "trocar") {
      setLocalBlock((prev) => {
        const exercises = [...prev.exercises];
        const original = exercises[picker.exIndex];
        exercises[picker.exIndex] = { name: libraryEx.name, sets: original.sets, reps: original.reps };
        return { ...prev, exercises };
      });
      setPicker(null);
    } else {
      setSetsRepsFor(libraryEx);
      setPicker(null);
    }
  };

  const handleSetsRepsConfirm = (newEx) => {
    setLocalBlock((prev) => ({ ...prev, exercises: [...prev.exercises, newEx] }));
    setSetsRepsFor(null);
  };

  const removeExercise = (exIndex) => {
    setLocalBlock((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== exIndex),
    }));
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 40 }}
        className="fixed inset-0 z-50 bg-background flex flex-col"
      >
        <div className="flex items-center gap-3 px-5 pt-6 pb-4 border-b border-border/40 shrink-0">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{localBlock.day}</p>
            <button
              onClick={() => setShowGroupPicker(true)}
              className="flex items-center gap-1.5 group mt-0.5"
            >
              <h2 className="text-base font-heading font-bold text-foreground">{localBlock.muscle_group}</h2>
              <Pencil className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-4">
          {localBlock.exercises.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Dumbbell className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Nenhum exercicio. Adicione abaixo.</p>
            </div>
          ) : (
            <div className="space-y-2.5 mb-4">
              {localBlock.exercises.map((ex, exIndex) => (
                <div
                  key={exIndex}
                  className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{ex.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ex.sets} series x {ex.reps} reps
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setPicker({ mode: "trocar", exIndex })}
                      className="h-8 px-3 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Trocar
                    </button>
                    <button
                      onClick={() => removeExercise(exIndex)}
                      className="w-8 h-8 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:border-red-500/50 hover:text-red-500 hover:bg-red-500/5 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setPicker({ mode: "adicionar" })}
            className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Adicionar exercicio</span>
          </button>
        </div>

        <div className="px-5 pb-24 pt-3 shrink-0 border-t border-border/40 bg-background">
          <Button
            onClick={() => onSave(localBlock)}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-heading font-bold text-base shadow-lg shadow-primary/25"
          >
            <Check className="w-5 h-5 mr-2" />
            Confirmar Alteracoes
          </Button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showGroupPicker && (
          <MuscleGroupPicker
            onSelect={handleGroupSelect}
            onClose={() => setShowGroupPicker(false)}
          />
        )}
        {picker && (
          <ExercisePicker
            categories={categories}
            muscleGroupLabel={localBlock.muscle_group}
            onSelect={handleExerciseSelect}
            onClose={() => setPicker(null)}
          />
        )}
        {setsRepsFor && (
          <SetsRepsForm
            exercise={setsRepsFor}
            onConfirm={handleSetsRepsConfirm}
            onClose={() => setSetsRepsFor(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Editor de exercicios — lista de dias ─────────────────────────────────────
function EditExercises({ plan, localPlan, setLocalPlan, onSave, onBack, isSaving }) {
  const [editingDayIndex, setEditingDayIndex] = useState(null);

  const handleDaySave = (updatedBlock) => {
    setLocalPlan((prev) => {
      const next = [...prev];
      next[editingDayIndex] = updatedBlock;
      return next;
    });
    setEditingDayIndex(null);
  };

  return (
    <AnimatePresence mode="wait">
      {editingDayIndex !== null ? (
        <EditDayView
          key="day-view"
          block={localPlan[editingDayIndex]}
          onSave={handleDaySave}
          onBack={() => setEditingDayIndex(null)}
        />
      ) : (
        <motion.div
          key="list"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          className="fixed inset-0 z-50 bg-background flex flex-col"
        >
          <div className="flex items-center gap-3 px-5 pt-6 pb-4 border-b border-border/40 shrink-0">
            <button onClick={onBack} className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
            <div>
              <p className="text-xs text-primary uppercase tracking-wider font-semibold">Exercicios</p>
              <h2 className="text-base font-heading font-bold text-foreground leading-tight">{plan.name}</h2>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pt-4 pb-4 space-y-2.5">
            {localPlan.map((block, i) => (
              <button
                key={i}
                onClick={() => setEditingDayIndex(i)}
                className="w-full flex items-center gap-4 p-5 rounded-2xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
              >
                <div className="shrink-0 px-3 py-1.5 rounded-xl bg-secondary text-xs font-heading font-bold text-muted-foreground min-w-[62px] text-center">
                  {block.day}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-heading font-bold text-foreground">{block.muscle_group}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{block.exercises.length} exercicios</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </button>
            ))}
          </div>

          <div className="px-5 pb-24 pt-3 shrink-0 border-t border-border/40 bg-background">
            <Button
              onClick={() => onSave(localPlan)}
              disabled={isSaving}
              className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-heading font-bold text-base shadow-lg shadow-primary/25"
            >
              {isSaving
                ? <><div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />Salvando...</>
                : <><Check className="w-5 h-5 mr-2" />Salvar Alteracoes</>}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function EditPlanModal({ plan, onSave, onClose, isSaving }) {
  const [mode, setMode] = useState(null);
  const [localPlan, setLocalPlan] = useState(
    plan.weekly_plan.map((block) => ({ ...block, exercises: [...block.exercises] }))
  );

  return (
    <AnimatePresence mode="wait">
      {mode === null && (
        <ModeSelect key="select" onSelect={setMode} onClose={onClose} />
      )}
      {mode === "dias" && (
        <EditDays key="dias" plan={plan} localPlan={localPlan} setLocalPlan={setLocalPlan}
          onSave={onSave} onBack={() => setMode(null)} isSaving={isSaving} />
      )}
      {mode === "exercicios" && (
        <EditExercises key="exercicios" plan={plan} localPlan={localPlan} setLocalPlan={setLocalPlan}
          onSave={onSave} onBack={() => setMode(null)} isSaving={isSaving} />
      )}
    </AnimatePresence>
  );
}
