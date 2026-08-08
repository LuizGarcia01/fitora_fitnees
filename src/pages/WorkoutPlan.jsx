import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Timer, CheckCircle2, Zap, Brain, ChevronRight, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import WeekDayTab from "@/components/fitness/WeekDayTab";
import ExerciseCard from "@/components/fitness/ExerciseCard";
import ExerciseDetail from "@/components/fitness/ExerciseDetail";
import SpotifyPlayer from "@/components/fitness/SpotifyPlayer";
import PreWorkoutCheckin from "@/components/fitness/PreWorkoutCheckin";
import ExerciseSubstitution from "@/components/fitness/ExerciseSubstitution";
import AICoach from "@/components/fitness/AICoach";
import EditPlanModal from "@/components/fitness/EditPlanModal";
import WorkoutSummary from "@/components/fitness/WorkoutSummary";

const allDays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const todayIndex = new Date().getDay();
const todayName = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][todayIndex];

export default function WorkoutPlan() {
  const queryClient = useQueryClient();
  const [selectedDay, setSelectedDay] = useState(todayName);
  const [completedExercises, setCompletedExercises] = useState(new Set());
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkInData, setCheckInData] = useState({ energy: "normal", sleep: "ok", pain: false });
  const [showSubstitution, setShowSubstitution] = useState(null);
  const [showAICoach, setShowAICoach] = useState(false);
  const [showEditPlan, setShowEditPlan] = useState(false);
  const [substitutions, setSubstitutions] = useState({});
  const [workoutStartTime, setWorkoutStartTime] = useState(null);
  const [workoutSummary, setWorkoutSummary] = useState(null);
  const pendingSummaryRef = useRef(null);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["workout-plans"],
    queryFn: async () => {
      const { data } = await supabase.from("workout_plans").select("*").eq("is_active", true);
      return data || [];
    },
  });

  const { data: exerciseLibrary = [] } = useQuery({
    queryKey: ["exercise-library-urls"],
    queryFn: async () => {
      const { data } = await supabase.from("exercise_library").select("name, animation_url");
      return data || [];
    },
  });
  // Mapa exato por nome (só guarda exercícios que têm animation_url)
  const gifMapExact = exerciseLibrary.reduce((acc, ex) => {
    if (ex.animation_url) acc[ex.name.toLowerCase().trim()] = ex.animation_url;
    return acc;
  }, {});

  // Normaliza removendo espaços e acentos para matching flexível
  const norm = (s) => s.toLowerCase().trim().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '');

  const gifMapNorm = Object.entries(gifMapExact).reduce((acc, [k, v]) => {
    acc[norm(k)] = v;
    return acc;
  }, {});

  // Busca o GIF pelo nome com fallback por similaridade
  const getGif = (name) => {
    if (!name) return null;
    const lower = name.toLowerCase().trim();
    const n = norm(name);
    const keys = Object.keys(gifMapExact);
    const normKeys = Object.keys(gifMapNorm);

    // 1. Exato
    if (gifMapExact[lower]) return gifMapExact[lower];
    // 2. Exato normalizado (ignora espaços e acentos)
    if (gifMapNorm[n]) return gifMapNorm[n];
    // 3. Normalizado: busca contém
    const normContains = normKeys.find(k => k.includes(n) || n.includes(k));
    if (normContains) return gifMapNorm[normContains];
    // 4. Original: busca contém
    const contains = keys.find(k => k.includes(lower) || lower.includes(k));
    if (contains) return gifMapExact[contains];
    // 5. Primeira palavra
    const firstWord = lower.split(' ')[0];
    const partial = keys.find(k => k.startsWith(firstWord));
    if (partial) return gifMapExact[partial];
    return null;
  };

  const updatePlanMutation = useMutation({
    mutationFn: async (newWeeklyPlan) => {
      const { data, error } = await supabase
        .from("workout_plans")
        .update({ weekly_plan: newWeeklyPlan })
        .eq("id", activePlan.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-plans"] });
      setShowEditPlan(false);
    },
  });

  const logMutation = useMutation({
    mutationFn: async (logData) => {
      const { data, error } = await supabase.from("workout_logs").insert(logData).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workout-logs"] });
      if (pendingSummaryRef.current) {
        setWorkoutSummary(pendingSummaryRef.current);
        pendingSummaryRef.current = null;
      }
    },
  });

  const activePlan = plans[0];
  const planDays = activePlan?.weekly_plan?.map((d) => d.day) || [];
  const currentDayPlan = activePlan?.weekly_plan?.find((d) => d.day === selectedDay);
  const isRestDay = !currentDayPlan;

  const applySubstitution = (originalName, newName) => {
    setSubstitutions((prev) => ({ ...prev, [originalName]: newName }));
    setSelectedExercise((prev) => prev ? { ...prev, name: newName } : null);
  };

  const effectiveName = (name) => substitutions[name] || name;
  const effectiveExercise = (ex) => ({ ...ex, name: effectiveName(ex.name) });

  const toggleExercise = (exerciseName) => {
    setCompletedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(exerciseName)) next.delete(exerciseName);
      else next.add(exerciseName);
      return next;
    });
  };

  const totalExercises = currentDayPlan?.exercises?.length || 0;
  const completedCount = completedExercises.size;
  const allCompleted = totalExercises > 0 && completedCount === totalExercises;

  const handleFinishWorkout = () => {
    const durationSeconds = workoutStartTime
      ? Math.round((Date.now() - workoutStartTime) / 1000)
      : 0;

    pendingSummaryRef.current = {
      completedCount,
      totalExercises,
      dayName: selectedDay,
      muscleGroup: currentDayPlan.muscle_group,
      durationSeconds,
      planName: activePlan.name,
    };

    logMutation.mutate({
      plan_id: activePlan.id,
      day: selectedDay,
      date: new Date().toISOString().split("T")[0],
      duration_minutes: durationSeconds > 0 ? Math.round(durationSeconds / 60) : null,
      completed_exercises: currentDayPlan.exercises.map((ex) => ({
        exercise_name: effectiveName(ex.name),
        completed: completedExercises.has(effectiveName(ex.name)),
      })),
      notes: checkInData ? `Check-in: energia=${checkInData.energy}, sono=${checkInData.sleep}` : undefined,
    });

    setCompletedExercises(new Set());
    setWorkoutStarted(false);
    setWorkoutStartTime(null);
    setCheckInData({ energy: "normal", sleep: "ok", pain: false });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!activePlan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
          <div className="text-6xl mb-4">🏋️</div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Nenhum plano ativo</h2>
          <p className="text-muted-foreground">Crie seu primeiro plano de treino personalizado.</p>
          <Link to="/novo-plano">
            <Button className="bg-primary text-primary-foreground font-heading font-semibold rounded-xl h-12 mt-4">
              <Plus className="w-5 h-5 mr-2" />
              Criar Plano
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-14 z-20 bg-background/95 backdrop-blur-sm border-b border-border/40 px-4 pt-5 pb-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{activePlan.name}</p>
              <h1 className="text-xl font-heading font-bold text-foreground mt-0.5">
                {currentDayPlan ? currentDayPlan.muscle_group : "Dia de Descanso"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {workoutStarted && (
                <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5">
                  <Timer className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary">{completedCount}/{totalExercises}</span>
                </div>
              )}
              <button
                onClick={() => setShowEditPlan(true)}
                className="w-10 h-10 rounded-2xl bg-card border border-border flex items-center justify-center hover:border-primary/30 transition-colors"
              >
                <Pencil className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => setShowAICoach(true)}
                className="w-10 h-10 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center hover:bg-primary/25 transition-colors"
              >
                <Brain className="w-5 h-5 text-primary" />
              </button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {allDays.map((day) => (
              <WeekDayTab
                key={day}
                day={day}
                isActive={selectedDay === day}
                isRest={!planDays.includes(day)}
                onClick={() => {
                  setSelectedDay(day);
                  setCompletedExercises(new Set());
                  setWorkoutStarted(false);
                  setWorkoutStartTime(null);
                  setSubstitutions({});
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4">
        <SpotifyPlayer />

        <AnimatePresence>
          {showCheckIn && (
            <PreWorkoutCheckin
              onConfirm={(mood) => {
                setCheckInData({ energy: mood, sleep: "ok", pain: mood === "pain" });
                setShowCheckIn(false);
                setWorkoutStarted(true);
                setWorkoutStartTime(Date.now());
              }}
              onClose={() => setShowCheckIn(false)}
            />
          )}
          {selectedExercise && (
            <ExerciseDetail
              exercise={selectedExercise}
              animationUrl={getGif(selectedExercise?.name)}
              onClose={() => setSelectedExercise(null)}
              onSubstitute={(newName) => applySubstitution(selectedExercise.name, newName)}
              onComplete={() => {
                if (!workoutStarted) { setWorkoutStarted(true); setWorkoutStartTime(Date.now()); }
                setCompletedExercises((prev) => {
                  const next = new Set(prev);
                  next.add(selectedExercise.name);
                  return next;
                });
                setSelectedExercise(null);
              }}
            />
          )}
          {showSubstitution && (
            <ExerciseSubstitution
              originalExercise={showSubstitution}
              onSubstitute={(newName) => {
                applySubstitution(showSubstitution.name, newName);
                setShowSubstitution(null);
              }}
              onClose={() => setShowSubstitution(null)}
            />
          )}
          {showAICoach && (
            <AICoach onClose={() => setShowAICoach(false)} />
          )}
          {showEditPlan && activePlan && (
            <EditPlanModal
              plan={activePlan}
              isSaving={updatePlanMutation.isPending}
              onSave={(newWeeklyPlan) => updatePlanMutation.mutate(newWeeklyPlan)}
              onClose={() => setShowEditPlan(false)}
            />
          )}
          {workoutSummary && (
            <WorkoutSummary
              summary={workoutSummary}
              onClose={() => setWorkoutSummary(null)}
            />
          )}
        </AnimatePresence>

        {workoutStarted && (
          <div className="w-full h-1.5 bg-secondary rounded-full mb-4 overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${(completedCount / totalExercises) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        <AnimatePresence mode="wait">
          {isRestDay ? (
            <motion.div key="rest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-16">
              <div className="text-5xl mb-4">😴</div>
              <h3 className="text-xl font-heading font-bold text-foreground mb-2">Dia de Descanso</h3>
              <p className="text-muted-foreground text-sm">Recupere-se para o próximo treino!</p>
            </motion.div>
          ) : (
            <motion.div key={selectedDay} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <p className="text-xs text-muted-foreground mb-4">{totalExercises} exercícios</p>

              <div className="space-y-2.5 mb-5">
                {currentDayPlan.exercises?.map((exercise, i) => {
                  const ex = effectiveExercise(exercise);
                  return (
                  <div key={exercise.name} onClick={() => setSelectedExercise(ex)} className="cursor-pointer">
                    <ExerciseCard
                      exercise={ex}
                      index={i}
                      animationUrl={getGif(ex.name)}
                      completed={completedExercises.has(ex.name)}
                      onToggle={(e) => {
                        e.stopPropagation();
                        if (!workoutStarted) setWorkoutStarted(true);
                        toggleExercise(ex.name);
                      }}
                      onSubstitute={(e) => {
                        e.stopPropagation();
                        setShowSubstitution(ex);
                      }}
                    />
                  </div>
                  );
                })}
              </div>

              {!workoutStarted ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Button
                    onClick={() => setShowCheckIn(true)}
                    className="group w-full relative overflow-hidden bg-primary text-primary-foreground font-heading font-bold rounded-2xl h-14 text-base mb-6 shadow-lg shadow-primary/25"
                  >
                    <Zap className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                    Iniciar Treino
                  </Button>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Button
                    onClick={handleFinishWorkout}
                    disabled={logMutation.isPending}
                    className={`w-full font-heading font-bold rounded-2xl h-14 text-base mb-6 transition-all ${
                      allCompleted
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                        : "bg-secondary text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    <CheckCircle2 className={`w-5 h-5 mr-2 ${allCompleted ? "animate-bounce" : ""}`} />
                    {allCompleted ? "Finalizar Treino! 🎉" : "Salvar Progresso"}
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
