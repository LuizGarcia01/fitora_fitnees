import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Plus, Trash2, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { syncExercisesToLibrary } from "@/lib/syncExercisesToLibrary";

const DAYS = ["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"];
const GOALS = [
  { value: "hipertrofia",    label: "Hipertrofia",    emoji: "💪" },
  { value: "emagrecimento",  label: "Emagrecimento",  emoji: "🔥" },
  { value: "forca",          label: "Força",          emoji: "🏋️" },
  { value: "condicionamento",label: "Condicionamento",emoji: "🏃" },
];
const LEVELS = ["Iniciante","Intermediário","Avançado"];

const stepVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

const emptyExercise = () => ({ name: "", sets: 3, reps: "10-12", rest_seconds: 60 });

export default function CreatePlanManual({ onBack }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [planName, setPlanName] = useState("");
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState("");
  const [selectedDays, setSelectedDays] = useState([]);
  // { day, muscleGroup, exercises: [{name,sets,reps,rest_seconds}] }
  const [trainingDays, setTrainingDays] = useState([]);

  const TOTAL_STEPS = 3;

  /* ── helpers ── */
  const toggleDay = (day) => {
    setSelectedDays(prev => {
      const next = prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day];
      // Sync trainingDays
      setTrainingDays(td => {
        const existing = td.filter(t => next.includes(t.day));
        const toAdd = next.filter(d => !td.find(t => t.day === d))
          .map(d => ({ day: d, muscleGroup: "", exercises: [emptyExercise()] }));
        return [...existing, ...toAdd].sort((a,b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day));
      });
      return next;
    });
  };

  const updateTrainingDay = (dayName, field, value) => {
    setTrainingDays(prev => prev.map(t => t.day === dayName ? { ...t, [field]: value } : t));
  };

  const addExercise = (dayName) => {
    setTrainingDays(prev => prev.map(t =>
      t.day === dayName ? { ...t, exercises: [...t.exercises, emptyExercise()] } : t
    ));
  };

  const removeExercise = (dayName, idx) => {
    setTrainingDays(prev => prev.map(t =>
      t.day === dayName ? { ...t, exercises: t.exercises.filter((_, i) => i !== idx) } : t
    ));
  };

  const updateExercise = (dayName, idx, field, value) => {
    setTrainingDays(prev => prev.map(t =>
      t.day === dayName
        ? { ...t, exercises: t.exercises.map((ex, i) => i === idx ? { ...ex, [field]: value } : ex) }
        : t
    ));
  };

  const canProceed = () => {
    if (step === 0) return planName.trim() && goal && level;
    if (step === 1) return selectedDays.length > 0 && trainingDays.every(t => t.muscleGroup.trim());
    if (step === 2) return trainingDays.every(t => t.exercises.some(e => e.name.trim()));
    return false;
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const weeklyPlan = trainingDays.map(t => ({
        day: t.day,
        muscle_group: t.muscleGroup,
        exercises: t.exercises.filter(e => e.name.trim()).map(e => ({
          name: e.name,
          sets: Number(e.sets) || 3,
          reps: e.reps || "10-12",
          rest_seconds: Number(e.rest_seconds) || 60,
        })),
      }));

      const { data: existing } = await supabase.from("workout_plans").select("id").eq("is_active", true);
      if (existing?.length) {
        await supabase.from("workout_plans").update({ is_active: false }).in("id", existing.map(p => p.id));
      }
      await supabase.from("workout_plans").insert({
        name: planName.trim(),
        goal,
        level: level.toLowerCase(),
        days_per_week: selectedDays.length,
        weekly_plan: weeklyPlan,
        is_active: true,
      });
      await syncExercisesToLibrary(weeklyPlan);
      navigate("/plano");
    } catch {
      setError("Erro ao salvar plano. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
    else onBack();
  };

  return (
    <div className="h-[calc(100dvh-3.5rem-4rem)] bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-background/95 backdrop-blur-sm border-b border-border/40 px-4 pt-5 pb-4 shrink-0">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <button onClick={handleBack} className="w-10 h-10 rounded-2xl bg-card border border-border/50 flex items-center justify-center hover:border-primary/30 transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5">Criar do Zero — passo {step + 1} de {TOTAL_STEPS}</p>
            <div className="flex gap-1.5">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i <= step ? "bg-primary" : "bg-secondary"}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">

            {/* Step 0: Nome + objetivo + nível */}
            {step === 0 && (
              <motion.div key="m0" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                <h2 className="text-2xl font-heading font-bold text-foreground mb-1">Dados do plano</h2>
                <p className="text-sm text-muted-foreground mb-6">Defina o nome, objetivo e nível</p>
                <div className="space-y-5">
                  <div>
                    <p className="text-sm font-heading font-semibold text-foreground mb-2">Nome do plano</p>
                    <input type="text" placeholder="Ex: Plano ABC, Treino Verão..."
                      value={planName} onChange={e => setPlanName(e.target.value)}
                      className="w-full h-12 bg-card border border-border rounded-xl px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-heading font-semibold text-foreground mb-2">Objetivo</p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {GOALS.map(g => (
                        <button key={g.value} onClick={() => setGoal(g.value)}
                          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 transition-all ${goal === g.value ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/30"}`}>
                          <span className="text-xl">{g.emoji}</span>
                          <span className={`text-sm font-heading font-semibold ${goal === g.value ? "text-primary" : "text-foreground"}`}>{g.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-heading font-semibold text-foreground mb-2">Nível</p>
                    <div className="flex gap-2">
                      {LEVELS.map(l => (
                        <button key={l} onClick={() => setLevel(l)}
                          className={`flex-1 py-3 rounded-xl border-2 text-sm font-heading font-semibold transition-all ${level === l ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 1: Dias + grupos musculares */}
            {step === 1 && (
              <motion.div key="m1" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                <h2 className="text-2xl font-heading font-bold text-foreground mb-1">Dias de treino</h2>
                <p className="text-sm text-muted-foreground mb-6">Selecione os dias e informe o grupo muscular de cada um</p>
                <div className="space-y-2.5">
                  {DAYS.map(day => {
                    const active = selectedDays.includes(day);
                    const td = trainingDays.find(t => t.day === day);
                    return (
                      <div key={day}>
                        <button onClick={() => toggleDay(day)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${active ? "border-primary bg-primary/8" : "border-border bg-card hover:border-primary/20"}`}>
                          <span className={`text-sm font-heading font-semibold ${active ? "text-primary" : "text-foreground"}`}>{day}</span>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${active ? "bg-primary border-primary" : "border-border"}`}>
                            {active && <Check className="w-3 h-3 text-primary-foreground" />}
                          </div>
                        </button>
                        {active && td && (
                          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mt-1.5 px-1">
                            <input
                              type="text"
                              placeholder={`Grupo muscular (ex: Peito, Costas, Pernas...)`}
                              value={td.muscleGroup}
                              onChange={e => updateTrainingDay(day, "muscleGroup", e.target.value)}
                              className="w-full h-10 bg-card border border-border rounded-xl px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                            />
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 2: Exercícios por dia */}
            {step === 2 && (
              <motion.div key="m2" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                <h2 className="text-2xl font-heading font-bold text-foreground mb-1">Exercícios</h2>
                <p className="text-sm text-muted-foreground mb-6">Adicione os exercícios de cada dia</p>
                <div className="space-y-5">
                  {trainingDays.map(td => (
                    <div key={td.day} className="bg-card border border-border rounded-2xl overflow-hidden">
                      <div className="flex items-center gap-2 px-4 py-3 bg-primary/5 border-b border-border/40">
                        <div className="px-2.5 py-1 bg-secondary rounded-lg text-xs font-heading font-bold text-muted-foreground">{td.day}</div>
                        <p className="text-sm font-heading font-bold text-foreground">{td.muscleGroup}</p>
                      </div>
                      <div className="p-3 space-y-2">
                        {td.exercises.map((ex, idx) => (
                          <div key={idx} className="bg-secondary/50 rounded-xl p-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <input type="text" placeholder="Nome do exercício"
                                value={ex.name} onChange={e => updateExercise(td.day, idx, "name", e.target.value)}
                                className="flex-1 h-9 bg-background border border-border rounded-lg px-3 text-xs text-foreground focus:outline-none focus:border-primary transition-colors" />
                              {td.exercises.length > 1 && (
                                <button onClick={() => removeExercise(td.day, idx)}
                                  className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors shrink-0">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <p className="text-[10px] text-muted-foreground mb-1">Séries</p>
                                <input type="number" min="1" max="10"
                                  value={ex.sets} onChange={e => updateExercise(td.day, idx, "sets", e.target.value)}
                                  className="w-full h-8 bg-background border border-border rounded-lg text-center text-xs font-heading font-bold text-foreground focus:outline-none focus:border-primary transition-colors" />
                              </div>
                              <div>
                                <p className="text-[10px] text-muted-foreground mb-1">Reps</p>
                                <input type="text" placeholder="10-12"
                                  value={ex.reps} onChange={e => updateExercise(td.day, idx, "reps", e.target.value)}
                                  className="w-full h-8 bg-background border border-border rounded-lg text-center text-xs font-heading font-bold text-foreground focus:outline-none focus:border-primary transition-colors" />
                              </div>
                              <div>
                                <p className="text-[10px] text-muted-foreground mb-1">Descanso</p>
                                <input type="number" min="15" step="15" placeholder="60"
                                  value={ex.rest_seconds} onChange={e => updateExercise(td.day, idx, "rest_seconds", e.target.value)}
                                  className="w-full h-8 bg-background border border-border rounded-lg text-center text-xs font-heading font-bold text-foreground focus:outline-none focus:border-primary transition-colors" />
                              </div>
                            </div>
                          </div>
                        ))}
                        <button onClick={() => addExercise(td.day)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-primary/40 text-primary text-xs font-heading font-semibold hover:bg-primary/5 transition-colors">
                          <Plus className="w-3.5 h-3.5" /> Adicionar exercício
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Botão */}
        <div className="pt-4 pb-6 shrink-0">
          {error && <p className="text-sm text-destructive text-center mb-4">{error}</p>}
          {step < TOTAL_STEPS - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}
              className="w-full bg-primary text-primary-foreground font-heading font-semibold rounded-xl h-14 text-base disabled:opacity-30">
              Continuar <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={!canProceed() || saving}
              className="w-full bg-primary text-primary-foreground font-heading font-semibold rounded-xl h-14 text-base disabled:opacity-30">
              {saving
                ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Salvando...</>
                : <><Check className="w-5 h-5 mr-2" />Salvar Plano</>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
