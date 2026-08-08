import React, { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, CheckCircle2, Circle, Dumbbell, Trophy } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function History() {
  const [tab, setTab] = useState("treinos");

  const { data: logs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ["workout-logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("workout_logs")
        .select("*")
        .order("date", { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  const { data: exerciseLogs = [], isLoading: loadingPRs } = useQuery({
    queryKey: ["exercise-logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("exercise_logs")
        .select("exercise_name, date, sets_data")
        .order("date", { ascending: false })
        .limit(200);
      return data || [];
    },
  });

  // Compute PRs: best lift per exercise
  const prs = (() => {
    const map = {};
    for (const log of exerciseLogs) {
      for (const s of log.sets_data || []) {
        if (!s.weight_kg || s.weight_kg <= 0) continue;
        const score = s.weight_kg * (1 + (s.reps_done || 0) / 30); // Epley 1RM estimate
        if (!map[log.exercise_name] || score > map[log.exercise_name].score) {
          map[log.exercise_name] = {
            exercise: log.exercise_name,
            weight: s.weight_kg,
            reps: s.reps_done || 0,
            date: log.date,
            score,
          };
        }
      }
    }
    return Object.values(map).sort((a, b) => new Date(b.date) - new Date(a.date));
  })();

  const groupedLogs = logs.reduce((acc, log) => {
    const monthKey = log.date
      ? format(parseISO(log.date), "MMMM yyyy", { locale: ptBR })
      : "Sem data";
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(log);
    return acc;
  }, {});

  const isLoading = loadingLogs || loadingPRs;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-14 z-20 bg-background/95 backdrop-blur-sm border-b border-border/40 px-4 pt-5 pb-0">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Seus registros</p>
              <h1 className="text-2xl font-heading font-bold text-foreground mt-0.5">Histórico</h1>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 bg-secondary rounded-xl p-1 mb-0">
            {[
              { id: "treinos", label: "Treinos", count: logs.length },
              { id: "recordes", label: "Recordes", count: prs.length },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-heading font-semibold transition-all ${
                  tab === t.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  tab === t.id ? "bg-primary/15 text-primary" : "bg-border/60 text-muted-foreground"
                }`}>{t.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 pb-8">
        <AnimatePresence mode="wait">

          {/* TREINOS TAB */}
          {tab === "treinos" && (
            <motion.div key="treinos" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
              <p className="text-xs text-muted-foreground mb-4">
                {logs.length} treino{logs.length !== 1 ? "s" : ""} registrado{logs.length !== 1 ? "s" : ""}
              </p>

              {logs.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-5xl mb-3">📅</div>
                  <h3 className="text-lg font-heading font-bold text-foreground mb-2">Nenhum treino registrado</h3>
                  <p className="text-sm text-muted-foreground">Complete seu primeiro treino para ver aqui!</p>
                </div>
              ) : (
                Object.entries(groupedLogs).map(([month, monthLogs]) => (
                  <div key={month} className="mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-heading font-semibold text-primary uppercase tracking-wider px-3 py-1 rounded-full bg-primary/10 border border-primary/20 capitalize">
                        {month}
                      </span>
                      <span className="text-xs text-muted-foreground">{monthLogs.length} treino{monthLogs.length !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="space-y-2">
                      {monthLogs.map((log, i) => {
                        const totalExercises = log.completed_exercises?.length || 0;
                        const completedCount = log.completed_exercises?.filter(e => e.completed).length || 0;
                        const isComplete = completedCount === totalExercises && totalExercises > 0;
                        return (
                          <motion.div
                            key={log.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="flex items-center gap-3 bg-card border border-border/50 rounded-2xl p-3.5 hover:border-primary/20 transition-colors"
                          >
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                              isComplete ? "bg-primary/15 border border-primary/20" : "bg-secondary"
                            }`}>
                              <Dumbbell className={`w-5 h-5 ${isComplete ? "text-primary" : "text-muted-foreground"}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-heading font-semibold text-foreground truncate">{log.day}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {format(parseISO(log.date), "dd 'de' MMMM", { locale: ptBR })}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isComplete
                                ? <CheckCircle2 className="w-4 h-4 text-primary" />
                                : <Circle className="w-4 h-4 text-muted-foreground" />}
                              <span className={`text-xs font-semibold ${isComplete ? "text-primary" : "text-muted-foreground"}`}>
                                {completedCount}/{totalExercises}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* RECORDES TAB */}
          {tab === "recordes" && (
            <motion.div key="recordes" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
              {prs.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-5xl mb-3">🏆</div>
                  <h3 className="text-lg font-heading font-bold text-foreground mb-2">Sem recordes ainda</h3>
                  <p className="text-sm text-muted-foreground">Registre seus pesos nos exercícios para acompanhar seus PRs.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-4">{prs.length} exercício{prs.length !== 1 ? "s" : ""} com recorde registrado</p>
                  {prs.map((pr, i) => (
                    <motion.div
                      key={pr.exercise}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-3 bg-card border border-border/50 rounded-2xl p-3.5"
                    >
                      <div className="w-11 h-11 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-heading font-semibold text-foreground truncate">{pr.exercise}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(parseISO(pr.date), "dd 'de' MMM yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-heading font-bold text-foreground">{pr.weight}kg</p>
                        <p className="text-xs text-muted-foreground">× {pr.reps} reps</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
