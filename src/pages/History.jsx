import React, { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, CheckCircle2, Circle, Dumbbell, Trophy, ChevronDown, Clock, Zap } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function History() {
  const [tab, setTab] = useState("treinos");
  const [expandedLogId, setExpandedLogId] = useState(null);

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
        .limit(500);
      return data || [];
    },
  });

  // PRs: melhor lift por exercício (1RM estimado Epley)
  const prs = (() => {
    const map = {};
    for (const log of exerciseLogs) {
      for (const s of log.sets_data || []) {
        if (!s.weight_kg || s.weight_kg <= 0) continue;
        const score = s.weight_kg * (1 + (s.reps_done || 0) / 30);
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

  // Agrupa treinos por mês
  const groupedLogs = logs.reduce((acc, log) => {
    const monthKey = log.date
      ? format(parseISO(log.date), "MMMM yyyy", { locale: ptBR })
      : "Sem data";
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(log);
    return acc;
  }, {});

  // Busca sets de um exercício numa data específica
  const getSetsForExercise = (exerciseName, date) =>
    exerciseLogs.find(el => el.exercise_name === exerciseName && el.date === date)?.sets_data || null;

  // Volume total de um treino (kg × reps somados)
  const calcVolume = (completedExercises, date) => {
    let total = 0;
    for (const ex of completedExercises || []) {
      const sets = getSetsForExercise(ex.exercise_name, date) || [];
      for (const s of sets) {
        total += (s.weight_kg || 0) * (s.reps_done || 0);
      }
    }
    return total;
  };

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

          {/* ── TREINOS TAB ── */}
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
                        const totalEx = log.completed_exercises?.length || 0;
                        const doneCount = log.completed_exercises?.filter(e => e.completed).length || 0;
                        const isComplete = doneCount === totalEx && totalEx > 0;
                        const isExpanded = expandedLogId === log.id;
                        const volume = calcVolume(log.completed_exercises, log.date);

                        return (
                          <motion.div
                            key={log.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="bg-card border border-border/50 rounded-2xl overflow-hidden hover:border-primary/20 transition-colors"
                          >
                            {/* Cabeçalho do treino — clicável para expandir */}
                            <button
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="w-full flex items-center gap-3 px-3.5 py-3 text-left"
                            >
                              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                                isComplete ? "bg-primary/15 border border-primary/20" : "bg-secondary"
                              }`}>
                                <Dumbbell className={`w-5 h-5 ${isComplete ? "text-primary" : "text-muted-foreground"}`} />
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-heading font-semibold text-foreground">{log.day}</p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <p className="text-xs text-muted-foreground">
                                    {format(parseISO(log.date), "dd 'de' MMMM", { locale: ptBR })}
                                  </p>
                                  {log.duration_minutes > 0 && (
                                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                      <Clock className="w-3 h-3" />
                                      {log.duration_minutes}min
                                    </span>
                                  )}
                                  {volume > 0 && (
                                    <span className="flex items-center gap-0.5 text-xs text-primary">
                                      <Zap className="w-3 h-3" />
                                      {volume.toLocaleString('pt-BR')}kg vol.
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {isComplete
                                  ? <CheckCircle2 className="w-4 h-4 text-primary" />
                                  : <Circle className="w-4 h-4 text-muted-foreground" />}
                                <span className={`text-xs font-semibold ${isComplete ? "text-primary" : "text-muted-foreground"}`}>
                                  {doneCount}/{totalEx}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                              </div>
                            </button>

                            {/* Detalhe expandido — exercícios com pesos e séries */}
                            <AnimatePresence initial={false}>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="border-t border-border/50 px-4 py-3 space-y-3">
                                    {log.completed_exercises?.length === 0 && (
                                      <p className="text-xs text-muted-foreground text-center py-2">Nenhum exercício registrado.</p>
                                    )}
                                    {log.completed_exercises?.map(ex => {
                                      const setsData = getSetsForExercise(ex.exercise_name, log.date);
                                      const exVolume = setsData
                                        ? setsData.reduce((sum, s) => sum + (s.weight_kg || 0) * (s.reps_done || 0), 0)
                                        : 0;

                                      return (
                                        <div key={ex.exercise_name}>
                                          <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-1.5">
                                              {ex.completed
                                                ? <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                                                : <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                                              <p className="text-xs font-heading font-semibold text-foreground">{ex.exercise_name}</p>
                                            </div>
                                            {exVolume > 0 && (
                                              <span className="text-xs text-muted-foreground">{exVolume}kg vol.</span>
                                            )}
                                          </div>

                                          {setsData?.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5 ml-5">
                                              {setsData.map(s => (
                                                <span
                                                  key={s.set_number}
                                                  className="text-xs bg-secondary text-foreground font-heading px-2 py-0.5 rounded-lg"
                                                >
                                                  S{s.set_number}:{" "}
                                                  <span className="font-semibold">
                                                    {s.weight_kg > 0 ? `${s.weight_kg}kg` : "—"} × {s.reps_done || "—"}
                                                  </span>
                                                </span>
                                              ))}
                                            </div>
                                          ) : ex.completed ? (
                                            <p className="text-xs text-muted-foreground ml-5 italic">Concluído sem dados de carga</p>
                                          ) : (
                                            <p className="text-xs text-muted-foreground ml-5 italic">Não realizado</p>
                                          )}
                                        </div>
                                      );
                                    })}

                                    {log.notes && (
                                      <p className="text-xs text-muted-foreground border-t border-border/40 pt-2 mt-2">
                                        {log.notes}
                                      </p>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* ── RECORDES TAB ── */}
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
