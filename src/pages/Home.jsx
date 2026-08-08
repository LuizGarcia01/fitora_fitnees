import React from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Dumbbell, TrendingUp, Flame, ChevronRight, Plus, Zap, Trophy, Clock, Sparkles, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

const goalLabels = {
  hipertrofia: "Hipertrofia",
  emagrecimento: "Emagrecimento",
  forca: "Força",
  condicionamento: "Condicionamento",
  saude: "Saúde Geral",
  massa_muscular: "Massa Muscular",
  resistencia: "Resistência",
};

const statConfig = [
  { icon: Dumbbell,   label: "Treinos",  color: "text-primary",      bg: "bg-primary/8",   border: "border-primary/15"  },
  { icon: Flame,      label: "Semana",   color: "text-orange-500",   bg: "bg-orange-50",   border: "border-orange-100"  },
  { icon: Trophy,     label: "PRs",      color: "text-amber-500",    bg: "bg-amber-50",    border: "border-amber-100"   },
  { icon: Clock,      label: "Média",    color: "text-blue-500",     bg: "bg-blue-50",     border: "border-blue-100"    },
];

function StatCard({ icon: Icon, label, value, color, bg, border }) {
  return (
    <div className={`card-elevated rounded-2xl p-4 flex flex-col gap-2 border ${border}`}>
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${color}`} strokeWidth={2} />
      </div>
      <div>
        <p className="text-xl font-heading font-bold text-foreground leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1 font-medium">{label}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();

  const { data: plans = [], isLoading: loadingPlans } = useQuery({
    queryKey: ["workout-plans"],
    queryFn: async () => {
      const { data } = await supabase.from("workout_plans").select("*").eq("is_active", true);
      return data || [];
    },
  });

  const { data: logs = [], isLoading: loadingLogs } = useQuery({
    queryKey: ["workout-logs"],
    queryFn: async () => {
      const { data } = await supabase.from("workout_logs").select("*").order("date", { ascending: false }).limit(50);
      return data || [];
    },
  });

  const { data: exerciseLogs = [] } = useQuery({
    queryKey: ["exercise-logs"],
    queryFn: async () => {
      const { data } = await supabase.from("exercise_logs").select("*").order("date", { ascending: false }).limit(100);
      return data || [];
    },
  });

  const totalVolume = exerciseLogs.reduce((acc, log) => {
    return acc + (log.sets_data?.reduce((sum, s) => sum + (s.weight_kg * s.reps_done), 0) || 0);
  }, 0);

  const avgDuration = logs.length > 0
    ? Math.round(logs.reduce((acc, log) => acc + (log.duration_minutes || 45), 0) / logs.length)
    : 0;

  const thisWeekLogs = logs.filter((log) => {
    const d = new Date(log.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  });

  const recentPRCount = (() => {
    const byExercise = {};
    for (const log of exerciseLogs) {
      if (!byExercise[log.exercise_name]) byExercise[log.exercise_name] = [];
      byExercise[log.exercise_name].push(log);
    }
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    let count = 0;
    for (const exLogs of Object.values(byExercise)) {
      const allTimeMax = Math.max(...exLogs.flatMap(l => l.sets_data?.map(s => s.weight_kg || 0) ?? [0]));
      if (allTimeMax <= 0) continue;
      const recentMax = Math.max(
        ...exLogs
          .filter(l => new Date(l.date) >= monthAgo)
          .flatMap(l => l.sets_data?.map(s => s.weight_kg || 0) ?? [0])
      );
      if (recentMax >= allTimeMax) count++;
    }
    return count;
  })();

  // Streak calculation
  const streakDays = (() => {
    if (!logs.length) return 0;
    const dates = [...new Set(logs.map(l => l.date))].sort().reverse();
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (dates[0] !== today && dates[0] !== yesterday) return 0;
    let streak = 0;
    let cursor = new Date(dates[0] + "T00:00:00");
    for (const d of dates) {
      const diff = Math.round((cursor - new Date(d + "T00:00:00")) / 86400000);
      if (diff > 1) break;
      if (diff === 0 || diff === 1) { streak++; cursor = new Date(d + "T00:00:00"); }
    }
    return streak;
  })();

  // Current week days trained (Mon–Sun of this week)
  const weekDates = (() => {
    const now = new Date();
    const dow = now.getDay(); // 0=Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dow + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().split("T")[0];
    });
  })();
  const activePlan = plans[0];
  const trainedDates = new Set(logs.map(l => l.date));
  const weekTrainedCount = weekDates.filter(d => trainedDates.has(d)).length;
  const weekGoal = activePlan?.days_per_week || 3;
  const WEEK_LABELS = ["S", "T", "Q", "Q", "S", "S", "D"];
  const todayDayName = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][new Date().getDay()];
  const todayWorkout = activePlan?.weekly_plan?.find((d) => d.day === todayDayName);

  const displayName = user?.user_metadata?.full_name?.split(" ")[0]
    || user?.user_metadata?.name?.split(" ")[0]
    || "Atleta";

  const volumeLabel = totalVolume >= 1000000
    ? `${(totalVolume / 1000000).toFixed(2)}t`
    : totalVolume >= 1000
    ? `${(totalVolume / 1000).toFixed(1)}t`
    : `${totalVolume}kg`;

  const volumeBadge = totalVolume >= 1000000
    ? { label: "Lendário", cls: "bg-amber-100 text-amber-700 border-amber-200" }
    : totalVolume >= 500000
    ? { label: "Elite",    cls: "bg-purple-100 text-purple-700 border-purple-200" }
    : totalVolume >= 100000
    ? { label: "Avançado", cls: "bg-primary/10 text-primary border-primary/20" }
    : { label: "Evoluindo",cls: "bg-slate-100 text-slate-600 border-slate-200" };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-14 z-20 bg-background/95 backdrop-blur-sm border-b border-border px-4 pt-5 pb-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
              {!loadingLogs && logs.length === 0 ? "Seja bem-vindo!" : "Bem-vindo de volta!"}
            </p>
            <h1 className="text-2xl font-heading font-bold text-foreground mt-0.5">
              {displayName} 👋
            </h1>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-primary" strokeWidth={2} />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 pb-8 space-y-6">

        {loadingPlans && (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-[3px] border-muted border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {/* CTA sem plano */}
        {!loadingPlans && !activePlan && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-orange-50 to-white p-6"
          >
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/8 rounded-full blur-2xl" />
            <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-primary" strokeWidth={2} />
            </div>
            <h2 className="text-xl font-heading font-bold text-foreground mb-1">Comece sua jornada</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Crie seu plano de treino personalizado com inteligência artificial.
            </p>
            <Link to="/novo-plano">
              <Button className="w-full h-11 font-heading font-semibold rounded-xl bg-primary text-white shadow-sm shadow-primary/25">
                <Plus className="w-4 h-4 mr-2" />
                Criar Meu Plano
              </Button>
            </Link>
          </motion.div>
        )}

        {activePlan && (
          <>
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 gap-3"
            >
              <StatCard {...statConfig[0]} value={logs.length} />
              <StatCard {...statConfig[1]} value={thisWeekLogs.length} />
              <StatCard {...statConfig[2]} value={recentPRCount} />
              <StatCard {...statConfig[3]} value={`${avgDuration || 45}m`} />
            </motion.div>

            {/* Streak + Weekly Progress */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 }}
              className="card-elevated rounded-2xl border border-border p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Sequência Atual</p>
                    <p className="text-2xl font-heading font-bold text-foreground">
                      {streakDays} <span className="text-sm font-normal text-muted-foreground">dia{streakDays !== 1 ? "s" : ""}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-0.5">Semana</p>
                  <p className="text-base font-heading font-bold text-foreground">
                    {weekTrainedCount}<span className="text-muted-foreground font-normal text-sm">/{weekGoal}</span>
                  </p>
                </div>
              </div>
              <div>
                <div className="flex gap-1.5 mb-2">
                  {weekDates.map((date, i) => {
                    const trained = trainedDates.has(date);
                    const isToday = date === new Date().toISOString().split("T")[0];
                    return (
                      <div key={date} className="flex-1 flex flex-col items-center gap-1">
                        <div className={`w-full aspect-square rounded-lg transition-all ${
                          trained ? "bg-primary" : isToday ? "bg-primary/20 border border-primary/40" : "bg-secondary"
                        }`} />
                        <span className={`text-[10px] font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                          {WEEK_LABELS[i]}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((weekTrainedCount / weekGoal) * 100, 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Volume */}
            {totalVolume > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="card-elevated rounded-2xl border border-border p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-primary" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Volume Total</p>
                      <p className="text-2xl font-heading font-bold text-foreground">{volumeLabel}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${volumeBadge.cls}`}>
                    {volumeBadge.label}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Treino de Hoje */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-heading font-bold text-foreground uppercase tracking-wide">Treino de Hoje</h2>
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                  {todayDayName}
                </span>
              </div>

              {todayWorkout ? (
                <Link to="/plano">
                  <div className="card-elevated surface-hover rounded-2xl p-4 border border-border cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                        <Dumbbell className="w-6 h-6 text-primary" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                          {todayDayName}
                        </span>
                        <h3 className="text-base font-heading font-bold text-foreground truncate">
                          {todayWorkout.muscle_group}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {todayWorkout.exercises?.length || 0} exercícios
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                        <ChevronRight className="w-4 h-4 text-primary" strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="card-elevated rounded-2xl border border-border p-8 text-center">
                  <p className="text-3xl mb-2">😴</p>
                  <p className="text-sm font-medium text-muted-foreground">Dia de descanso • Recupere-se bem!</p>
                </div>
              )}
            </motion.div>

            {/* Ações Rápidas */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <h2 className="text-sm font-heading font-bold text-foreground uppercase tracking-wide mb-3">Ações Rápidas</h2>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/plano">
                  <div className="card-elevated surface-hover rounded-2xl border border-border p-4 flex items-center gap-3 cursor-pointer">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                      <Dumbbell className="w-4 h-4 text-primary" strokeWidth={2} />
                    </div>
                    <span className="text-sm font-heading font-semibold text-foreground">Ver Plano</span>
                  </div>
                </Link>
                <Link to="/novo-plano">
                  <div className="card-elevated surface-hover rounded-2xl border border-border p-4 flex items-center gap-3 cursor-pointer">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                      <Plus className="w-4 h-4 text-primary" strokeWidth={2} />
                    </div>
                    <span className="text-sm font-heading font-semibold text-foreground">Novo Plano</span>
                  </div>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
