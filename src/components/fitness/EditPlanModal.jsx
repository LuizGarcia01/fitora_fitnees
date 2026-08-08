import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { X, Check, GripVertical, ChevronUp, ChevronDown, Calendar, Dumbbell, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Tela de seleção ─────────────────────────────────────────────────────────
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
            <p className="text-base font-heading font-bold text-foreground">Exercícios</p>
            <p className="text-sm text-muted-foreground mt-0.5">Reordene os exercícios de cada dia</p>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>
      </div>
    </motion.div>
  );
}

// ── Editor de dias (drag-and-drop) ──────────────────────────────────────────
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
                          <p className="text-xs text-muted-foreground mt-0.5">{block.exercises.length} exercícios</p>
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
            : <><Check className="w-5 h-5 mr-2" />Salvar Alterações</>}
        </Button>
      </div>
    </motion.div>
  );
}

// ── Editor de exercícios ─────────────────────────────────────────────────────
function EditExercises({ plan, localPlan, setLocalPlan, onSave, onBack, isSaving }) {
  const moveExercise = (blockIndex, exIndex, direction) => {
    setLocalPlan((prev) => {
      const next = prev.map((b) => ({ ...b, exercises: [...b.exercises] }));
      const list = next[blockIndex].exercises;
      const target = exIndex + direction;
      if (target < 0 || target >= list.length) return prev;
      [list[exIndex], list[target]] = [list[target], list[exIndex]];
      return next;
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
          <p className="text-xs text-primary uppercase tracking-wider font-semibold">Exercícios</p>
          <h2 className="text-base font-heading font-bold text-foreground leading-tight">{plan.name}</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-4 space-y-4">
        {localPlan.map((block, blockIndex) => (
          <div key={blockIndex} className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-primary/5 border-b border-border/40">
              <div className="px-3 py-1 rounded-lg bg-secondary text-xs font-heading font-bold text-muted-foreground">{block.day}</div>
              <p className="text-sm font-heading font-bold text-foreground">{block.muscle_group}</p>
            </div>
            <div className="divide-y divide-border/30">
              {block.exercises.map((ex, exIndex) => (
                <div key={exIndex} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{ex.name}</p>
                    <p className="text-[10px] text-muted-foreground">{ex.sets} × {ex.reps}</p>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    <button onClick={() => moveExercise(blockIndex, exIndex, -1)} disabled={exIndex === 0}
                      className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-20 transition-colors">
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => moveExercise(blockIndex, exIndex, 1)} disabled={exIndex === block.exercises.length - 1}
                      className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-20 transition-colors">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 pb-24 pt-3 shrink-0 border-t border-border/40 bg-background">
        <Button onClick={() => onSave(localPlan)} disabled={isSaving}
          className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-heading font-bold text-base shadow-lg shadow-primary/25">
          {isSaving
            ? <><div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />Salvando...</>
            : <><Check className="w-5 h-5 mr-2" />Salvar Alterações</>}
        </Button>
      </div>
    </motion.div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function EditPlanModal({ plan, onSave, onClose, isSaving }) {
  const [mode, setMode] = useState(null); // null | "dias" | "exercicios"
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
