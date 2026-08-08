import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, ChevronRight, Dumbbell, Timer, RotateCcw, Zap, TrendingUp, Minus, Plus, Repeat, Target, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/api/supabaseClient";
import PRAlert from "./PRAlert";
import ExerciseSubstitution from "./ExerciseSubstitution";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function ExerciseDetail({ exercise, animationUrl, onClose, onComplete, onSubstitute }) {
  const totalSets = exercise.sets || 4;
  const [currentSet, setCurrentSet] = useState(1);
  const [completedSets, setCompletedSets] = useState(new Set());
  const [resting, setResting] = useState(false);
  const [restTimer, setRestTimer] = useState(0);
  const [lastLog, setLastLog] = useState(null);
  const [allLogs, setAllLogs] = useState([]);
  const [showPR, setShowPR] = useState(false);
  const [newPR, setNewPR] = useState(null);
  const [showSubstitution, setShowSubstitution] = useState(false);
  const intervalRef = useRef(null);
  const prTimeoutRef = useRef(null);
  const [saveError, setSaveError] = useState(false);
  const [setInputs, setSetInputs] = useState(
    Array.from({ length: totalSets }, () => ({ weight_kg: "", reps_done: "" }))
  );

  useEffect(() => {
    supabase
      .from("exercise_logs")
      .select("*")
      .eq("exercise_name", exercise.name)
      .order("date", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        const logs = data || [];
        setAllLogs(logs);
        if (logs[0]) setLastLog(logs[0]);
      });
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (prTimeoutRef.current) clearTimeout(prTimeoutRef.current);
    };
  }, [exercise.name]);

  // Pré-popula inputs com valores da última sessão ao carregar histórico
  useEffect(() => {
    if (!lastLog?.sets_data?.length) return;
    setSetInputs(prev =>
      prev.map((inp, i) => ({
        weight_kg: inp.weight_kg !== "" ? inp.weight_kg : (lastLog.sets_data[i]?.weight_kg || ""),
        reps_done: inp.reps_done !== "" ? inp.reps_done : (lastLog.sets_data[i]?.reps_done || ""),
      }))
    );
  }, [lastLog]);

  const bestPR = allLogs.reduce((best, log) => {
    log.sets_data?.forEach((s) => {
      if (s.weight_kg > best.weight) best = { weight: s.weight_kg, reps: s.reps_done, date: log.date };
    });
    return best;
  }, { weight: 0, reps: 0, date: null });

  const getNextGoal = () => {
    if (!lastLog?.sets_data?.[0]) return null;
    const lastWeight = lastLog.sets_data[0].weight_kg || 0;
    const lastReps = lastLog.sets_data[0].reps_done || parseInt(exercise.reps) || 0;
    const targetReps = parseInt(exercise.reps) || 0;
    if (lastReps >= targetReps) return { weight: lastWeight + 2.5, reps: targetReps, type: "weight" };
    return { weight: lastWeight, reps: lastReps + 1, type: "reps" };
  };

  const nextGoal = getNextGoal();

  const updateInput = (setIndex, field, value) => {
    setSetInputs((prev) => {
      const next = [...prev];
      next[setIndex] = { ...next[setIndex], [field]: value };
      if (setIndex === 0 && value !== "") {
        for (let i = 1; i < next.length; i++) {
          if (!next[i][field]) next[i] = { ...next[i], [field]: value };
        }
      }
      return next;
    });
  };

  const adjustValue = (setIndex, field, delta) => {
    setSetInputs((prev) => {
      const next = [...prev];
      const current = parseFloat(next[setIndex][field]) || 0;
      const step = field === "weight_kg" ? 2.5 : 1;
      const newVal = Math.max(0, current + delta * step);
      next[setIndex] = { ...next[setIndex], [field]: newVal === 0 ? "" : newVal };
      return next;
    });
  };

  const handleCompleteSet = async () => {
    const newCompleted = new Set(completedSets);
    newCompleted.add(currentSet);
    setCompletedSets(newCompleted);

    if (currentSet === totalSets) {
      const setsData = setInputs.map((inp, i) => ({
        set_number: i + 1,
        weight_kg: parseFloat(inp.weight_kg) || 0,
        reps_done: parseInt(inp.reps_done) || 0,
      }));

      const { data: newLog, error: logError } = await supabase
        .from("exercise_logs")
        .insert({
          exercise_name: exercise.name,
          date: new Date().toISOString().split("T")[0],
          sets_data: setsData,
        })
        .select()
        .single();

      if (logError) setSaveError(true);

      if (newLog) {
        const maxWeight = Math.max(...setsData.map(s => s.weight_kg));
        if (maxWeight > bestPR.weight) {
          const prReps = setsData.find(s => s.weight_kg === maxWeight)?.reps_done || 0;
          setNewPR({ weight: maxWeight, reps: prReps });
          setShowPR(true);
          prTimeoutRef.current = setTimeout(() => { setShowPR(false); setNewPR(null); }, 4000);
        }
      }

      setTimeout(() => { onComplete(); onClose(); }, 800);
      return;
    }

    setResting(true);
    const restSeconds = exercise.rest_seconds || 60;
    setRestTimer(restSeconds);

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setRestTimer((t) => {
        if (t <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setResting(false);
          setCurrentSet((s) => s + 1);
          try {
            const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
            audio.play().catch(() => {});
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          } catch {}
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const skipRest = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setResting(false);
    setCurrentSet((s) => s + 1);
  };

  const lastSetData = lastLog?.sets_data;

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-50 bg-background flex flex-col overflow-y-auto"
    >
      <div className="flex items-center justify-between px-5 pt-6 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/10">
              <Dumbbell className="w-6 h-6 text-primary" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs text-primary uppercase tracking-wider font-semibold">Executando</p>
              <Zap className="w-3 h-3 text-primary" />
            </div>
            <h2 className="text-lg font-heading font-bold text-foreground leading-tight">{exercise.name}</h2>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSubstitution(true)} className="w-10 h-10 rounded-xl bg-card border border-border hover:border-primary/30 transition-all flex items-center justify-center">
            <Repeat className="w-4 h-4 text-muted-foreground" />
          </button>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-card border border-border hover:border-destructive/30 transition-all flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="px-5 mb-4 shrink-0">
        <div className="flex gap-1.5 mb-1.5">
          {Array.from({ length: totalSets }, (_, i) => i + 1).map((set) => (
            <div key={set} className={`flex-1 h-1 rounded-full transition-all duration-500 ${
              completedSets.has(set) ? "bg-primary" : set === currentSet ? "bg-primary/40" : "bg-secondary"
            }`} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{completedSets.size} de {totalSets} séries concluídas</p>
      </div>

      <div className="px-5 mb-4 shrink-0">
        {/* Imagem do exercício — logo acima das stats */}
        {animationUrl && (
          <div className="w-full rounded-2xl overflow-hidden bg-secondary mb-3 flex items-center justify-center" style={{ height: 180 }}>
            <img
              src={animationUrl}
              alt={exercise.name}
              className="h-full w-full object-contain"
              onError={e => { e.currentTarget.parentElement.style.display = 'none'; }}
            />
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-2xl p-3 text-center">
            <Zap className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-heading font-bold text-foreground">{exercise.reps}</p>
            <p className="text-xs text-muted-foreground">Reps</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-3 text-center">
            <Timer className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-heading font-bold text-foreground">{exercise.rest_seconds || 60}s</p>
            <p className="text-xs text-muted-foreground">Descanso</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-3 text-center">
            <RotateCcw className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-lg font-heading font-bold text-foreground">{totalSets}</p>
            <p className="text-xs text-muted-foreground">Séries</p>
          </div>
        </div>
        {exercise.notes && (
          <p className="text-sm text-muted-foreground mt-3 bg-card border border-border rounded-2xl p-3">
            💡 {exercise.notes}
          </p>
        )}
      </div>

      <AnimatePresence>
        {showPR && newPR && (
          <PRAlert message={`${exercise.name}: ${newPR.weight}kg × ${newPR.reps} reps`} />
        )}
      </AnimatePresence>

      {lastSetData && lastSetData.length > 0 && (
        <div className="px-5 mb-4 shrink-0 space-y-2">
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3 flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-heading font-semibold text-primary mb-1">Última sessão ({lastLog.date})</p>
              <div className="flex flex-wrap gap-2">
                {lastSetData.map((s, i) => (
                  <span key={i} className="text-xs text-muted-foreground bg-secondary rounded-lg px-2 py-0.5">
                    S{s.set_number}: {s.weight_kg > 0 ? `${s.weight_kg}kg` : "—"} × {s.reps_done || "—"}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {nextGoal && (
            <div className="bg-accent/5 border border-accent/20 rounded-2xl p-3 flex items-start gap-2">
              <Target className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-heading font-semibold text-accent mb-1">Próxima meta sugerida</p>
                <p className="text-sm text-foreground font-heading font-semibold">{nextGoal.weight}kg × {nextGoal.reps} reps</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {nextGoal.type === "weight" ? "Aumente 2,5kg" : "Busque +1 repetição"}
                </p>
              </div>
            </div>
          )}

          {bestPR.weight > 0 && (
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                <span className="text-lg">🏆</span>
              </div>
              <div>
                <p className="text-xs font-heading font-semibold text-yellow-500">Recorde Pessoal</p>
                <p className="text-sm text-foreground font-heading font-bold">
                  {bestPR.weight}kg × {bestPR.reps} {bestPR.date && `(${bestPR.date})`}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gráfico de evolução */}
      {allLogs.length >= 2 && <ProgressChart logs={allLogs} />}

      <div className="px-5">
        <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-heading mb-2">Séries</p>
        <div className="space-y-1.5">
          {Array.from({ length: totalSets }, (_, i) => i + 1).map((set) => {
            const isDone = completedSets.has(set);
            const isCurrentSet = set === currentSet && !resting;
            const inp = setInputs[set - 1];
            const lastS = lastSetData?.[set - 1];

            return (
              <motion.div
                key={set}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: set * 0.04 }}
                className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                  isDone ? "bg-primary/8 border-primary/20" : isCurrentSet ? "bg-card border-primary/50" : "bg-card/40 border-border opacity-40"
                }`}
              >
                <div className="flex items-center justify-between px-2.5 py-1.5">
                  <div className="flex items-center gap-2">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    ) : isCurrentSet ? (
                      <div className="w-4 h-4 rounded-full border-2 border-primary animate-pulse shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-border shrink-0" />
                    )}
                    <p className={`text-sm font-heading font-semibold ${isDone ? "text-muted-foreground" : "text-foreground"}`}>
                      Série {set}
                    </p>
                  </div>
                  {isDone && inp.weight_kg && (
                    <span className="text-xs text-primary font-medium font-heading">
                      {inp.weight_kg}kg × {inp.reps_done || exercise.reps}
                    </span>
                  )}
                  {isDone && !inp.weight_kg && (
                    <span className="text-xs text-primary font-medium font-heading">Feito</span>
                  )}
                </div>

                {isCurrentSet && (
                  <div className="px-2.5 pb-1.5 flex gap-2">
                    <div className="flex-1">
                      <p className="text-[10px] text-muted-foreground mb-0.5">Peso (kg)</p>
                      <div className="flex items-center gap-1">
                        <button onClick={() => adjustValue(set - 1, "weight_kg", -1)} className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <input
                          type="number" min="0" step="2.5"
                          placeholder={lastS?.weight_kg ? `${lastS.weight_kg}` : "0"}
                          value={inp.weight_kg}
                          onChange={(e) => updateInput(set - 1, "weight_kg", e.target.value)}
                          className="flex-1 h-6 bg-secondary border border-border rounded-md text-center text-xs font-heading font-semibold text-foreground focus:outline-none focus:border-primary w-0"
                        />
                        <button onClick={() => adjustValue(set - 1, "weight_kg", 1)} className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-muted-foreground mb-0.5">Reps feitas</p>
                      <div className="flex items-center gap-1">
                        <button onClick={() => adjustValue(set - 1, "reps_done", -1)} className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <input
                          type="number" min="0"
                          placeholder={exercise.reps}
                          value={inp.reps_done}
                          onChange={(e) => updateInput(set - 1, "reps_done", e.target.value)}
                          className="flex-1 h-6 bg-secondary border border-border rounded-md text-center text-xs font-heading font-semibold text-foreground focus:outline-none focus:border-primary w-0"
                        />
                        <button onClick={() => adjustValue(set - 1, "reps_done", 1)} className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
        </div>
      </div>

      {saveError && (
        <p className="mx-5 mb-2 text-xs text-destructive text-center">
          Erro ao salvar exercício. Verifique sua conexão.
        </p>
      )}
      <div className="px-5 pb-24 pt-4">
        <AnimatePresence mode="wait">
          {resting ? (
            <motion.div key="rest" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className={`bg-card border rounded-2xl p-6 text-center transition-all ${restTimer <= 5 ? "border-destructive/50 bg-destructive/5" : "border-border"}`}>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-heading mb-2">Descansando</p>
                <p className={`text-6xl font-heading font-bold tabular-nums ${restTimer <= 5 ? "text-destructive animate-pulse" : "text-primary"}`}>{restTimer}</p>
                <p className="text-xs text-muted-foreground mt-1">segundos</p>
                {restTimer <= 5 && <p className="text-destructive text-sm font-semibold mt-2">⏰ Quase lá!</p>}
              </div>
              <Button variant="outline" onClick={skipRest} className="w-full h-12 rounded-xl border-border text-foreground font-heading">
                Pular Descanso <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          ) : completedSets.size === totalSets ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-5 text-center">
                <p className="text-2xl mb-1">🎉</p>
                <p className="text-primary font-heading font-bold">Exercício Concluído!</p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="action" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Button
                onClick={handleCompleteSet}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-heading font-bold text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all duration-300"
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                {currentSet === totalSets ? "Concluir Exercício" : `Série ${currentSet} concluída`}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showSubstitution && (
          <ExerciseSubstitution
            originalExercise={exercise}
            onSubstitute={(newName) => {
              if (onSubstitute) onSubstitute(newName);
              setShowSubstitution(false);
              setCurrentSet(1);
              setCompletedSets(new Set());
              setResting(false);
              if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
              setSetInputs(Array.from({ length: exercise.sets || 4 }, () => ({ weight_kg: "", reps_done: "" })));
            }}
            onClose={() => setShowSubstitution(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ProgressChart({ logs }) {
  const [open, setOpen] = useState(false);

  const chartData = [...logs]
    .reverse()
    .slice(-10)
    .map(log => {
      const maxWeight = Math.max(...(log.sets_data?.map(s => s.weight_kg || 0) ?? [0]));
      return { date: log.date?.slice(5), weight: maxWeight || null };
    })
    .filter(d => d.weight);

  if (chartData.length < 2) return null;

  return (
    <div className="mx-5 mb-3">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-heading font-semibold text-foreground">Evolução de Carga</span>
        </div>
        <span className="text-xs text-muted-foreground">{open ? "▲ fechar" : "▼ ver"}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card border border-t-0 border-border rounded-b-2xl px-3 pt-3 pb-4">
              <p className="text-xs text-muted-foreground mb-3">Peso máximo por sessão (últimas 10)</p>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={32}
                    tickFormatter={v => `${v}kg`} />
                  <Tooltip
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                    formatter={v => [`${v}kg`, "Carga"]}
                    labelStyle={{ color: "var(--muted-foreground)" }}
                  />
                  <Line type="monotone" dataKey="weight" stroke="var(--primary)" strokeWidth={2.5}
                    dot={{ fill: "var(--primary)", strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: "var(--primary)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
