import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { syncExercisesToLibrary } from "@/lib/syncExercisesToLibrary";
import { VitaRobot } from "@/components/VitaRobot";

const loadingSteps = [
  { icon: "🧠", text: "Analisando seu perfil físico..." },
  { icon: "🎯", text: "Definindo objetivos e volume..." },
  { icon: "📅", text: "Montando a divisão semanal..." },
  { icon: "🏋️", text: "Selecionando os melhores exercícios..." },
  { icon: "⚡", text: "Ajustando séries e repetições..." },
  { icon: "✅", text: "Finalizando seu plano personalizado..." },
];

function GeneratingScreen() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(s => (s < loadingSteps.length - 1 ? s + 1 : s));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center px-8"
    >
      {/* VITA animada */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/15 rounded-full blur-2xl scale-150" />
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          <VitaRobot size={120} />
        </motion.div>
      </div>

      <h2 className="text-2xl font-heading font-bold text-foreground text-center mb-1">
        VITA está criando seu plano
      </h2>
      <p className="text-sm text-muted-foreground text-center mb-10">
        Analisando sua avaliação e montando um plano 100% personalizado
      </p>

      {/* Steps animados */}
      <div className="w-full max-w-xs space-y-3">
        {loadingSteps.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            animate={{
              opacity: i <= currentStep ? 1 : 0.25,
              x: 0,
            }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="flex items-center gap-3"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
              i < currentStep ? "bg-primary" : i === currentStep ? "bg-primary/20 border-2 border-primary" : "bg-secondary"
            }`}>
              {i < currentStep
                ? <Check className="w-4 h-4 text-primary-foreground" />
                : <span className="text-sm">{s.icon}</span>
              }
            </div>
            <p className={`text-sm font-medium transition-colors duration-300 ${
              i === currentStep ? "text-foreground" : i < currentStep ? "text-muted-foreground line-through" : "text-muted-foreground/40"
            }`}>{s.text}</p>
          </motion.div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-10 text-center">
        Isso pode levar até 30 segundos
      </p>
    </motion.div>
  );
}

const TOTAL_STEPS = 5;

const goals = [
  { value: "hipertrofia",    label: "Hipertrofia",    desc: "Ganhar massa muscular",     emoji: "💪" },
  { value: "emagrecimento",  label: "Emagrecimento",  desc: "Perder gordura corporal",   emoji: "🔥" },
  { value: "forca",          label: "Força",          desc: "Aumentar força máxima",     emoji: "🏋️" },
  { value: "condicionamento",label: "Condicionamento",desc: "Melhorar resistência",      emoji: "🏃" },
  { value: "saude",          label: "Saúde Geral",    desc: "Bem-estar e qualidade de vida", emoji: "❤️" },
];

const levels = [
  { value: "iniciante",     label: "Iniciante",     desc: "Menos de 6 meses de treino" },
  { value: "intermediario", label: "Intermediário", desc: "6 meses a 2 anos" },
  { value: "avancado",      label: "Avançado",      desc: "Mais de 2 anos" },
];

const equipment = [
  { value: "academia_completa",   label: "Academia Completa",       desc: "Acesso a todos os equipamentos" },
  { value: "academia_basica",     label: "Academia Básica",         desc: "Pesos livres e máquinas simples" },
  { value: "casa_equipamentos",   label: "Em Casa c/ Equipamentos", desc: "Halteres, barra, elásticos" },
  { value: "casa_sem",            label: "Em Casa sem Equipamentos", desc: "Apenas peso corporal" },
];

const histories = [
  { value: "nunca",         label: "Nunca treinei" },
  { value: "parei_recente", label: "Parei há menos de 6 meses" },
  { value: "parei_antigo",  label: "Parei há mais de 6 anos" },
  { value: "regular",       label: "Treino regularmente" },
];

const muscles = ["Peito","Costas","Pernas","Ombros","Bíceps","Tríceps","Abdômen","Glúteos"];

const stepVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

export default function CreatePlanAI({ onBack }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const [data, setData] = useState({
    age: "", gender: "", weight: "", height: "",
    goal: "",
    level: "", daysPerWeek: 0, sessionDuration: "", selectedDays: [],
    equipment: "", hasInjury: false, injuryDetail: "",
    trainingHistory: "",
    priorityMuscles: [],
  });

  const set = (field, value) => setData(prev => ({ ...prev, [field]: value }));

  const toggleMuscle = (m) => setData(prev => ({
    ...prev,
    priorityMuscles: prev.priorityMuscles.includes(m)
      ? prev.priorityMuscles.filter(x => x !== m)
      : [...prev.priorityMuscles, m],
  }));

  const ALL_DAYS = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];

  const toggleDay = (day) => {
    const already = data.selectedDays.includes(day);
    if (already) {
      set('selectedDays', data.selectedDays.filter(d => d !== day));
    } else if (data.selectedDays.length < data.daysPerWeek) {
      set('selectedDays', [...data.selectedDays, day]);
    }
  };

  const canProceed = () => {
    if (step === 0) return data.age && data.gender && data.weight && data.height;
    if (step === 1) return !!data.goal;
    if (step === 2) return data.level && data.daysPerWeek > 0 && data.sessionDuration && data.selectedDays.length === data.daysPerWeek;
    if (step === 3) return !!data.equipment;
    if (step === 4) return true;
    return false;
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    try {
      const { data: planData, error: fnError } = await supabase.functions.invoke("generatePlan", {
        body: { assessmentData: data },
      });
      if (fnError) {
        // Tenta extrair mensagem real do corpo da resposta
        let detail = fnError.message;
        try {
          const body = await fnError.context?.json?.();
          if (body?.error) detail = body.error;
        } catch {}
        throw new Error(detail);
      }
      if (planData?.error) throw new Error(planData.error);

      const { data: existing } = await supabase.from("workout_plans").select("id").eq("is_active", true);
      if (existing?.length) {
        await supabase.from("workout_plans").update({ is_active: false }).in("id", existing.map(p => p.id));
      }
      await supabase.from("workout_plans").insert({
        name: planData.name || `Plano ${data.goal}`,
        goal: data.goal,
        level: data.level,
        days_per_week: data.daysPerWeek,
        weekly_plan: planData.weekly_plan,
        is_active: true,
      });
      try { await syncExercisesToLibrary(planData.weekly_plan); } catch {}
      navigate("/plano");
    } catch (err) {
      setError("Erro ao gerar plano: " + (err?.message || "Tente novamente."));
    } finally {
      setGenerating(false);
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
    else onBack();
  };

  if (generating) return <GeneratingScreen />;

  return (
    <div className="h-[calc(100dvh-3.5rem-4rem)] bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-background/95 backdrop-blur-sm border-b border-border/40 px-4 pt-5 pb-4 shrink-0">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <button onClick={handleBack} className="w-10 h-10 rounded-2xl bg-card border border-border/50 flex items-center justify-center hover:border-primary/30 transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <p className="text-xs text-primary uppercase tracking-wider font-semibold mb-1.5">Avaliação — passo {step + 1} de {TOTAL_STEPS}</p>
            <div className="flex gap-1.5">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i <= step ? "bg-primary" : "bg-secondary"}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">

            {/* Step 0: Dados pessoais */}
            {step === 0 && (
              <motion.div key="s0" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                <h2 className="text-2xl font-heading font-bold text-foreground mb-1">Sobre você</h2>
                <p className="text-sm text-muted-foreground mb-6">Esses dados ajudam a IA a calibrar o volume e intensidade</p>
                <div className="space-y-4">
                  {/* Sexo */}
                  <div>
                    <p className="text-sm font-heading font-semibold text-foreground mb-2">Sexo</p>
                    <div className="flex gap-3">
                      {[{ v: "masculino", l: "Masculino" }, { v: "feminino", l: "Feminino" }].map(({ v, l }) => (
                        <button key={v} onClick={() => set("gender", v)}
                          className={`flex-1 py-3 rounded-xl border-2 text-sm font-heading font-semibold transition-all ${data.gender === v ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Idade */}
                  <div>
                    <p className="text-sm font-heading font-semibold text-foreground mb-2">Idade</p>
                    <input type="number" min="10" max="99" placeholder="Ex: 28"
                      value={data.age} onChange={e => set("age", e.target.value)}
                      className="w-full h-12 bg-card border border-border rounded-xl px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                  </div>
                  {/* Peso e Altura */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm font-heading font-semibold text-foreground mb-2">Peso (kg)</p>
                      <input type="number" min="30" max="250" placeholder="Ex: 75"
                        value={data.weight} onChange={e => set("weight", e.target.value)}
                        className="w-full h-12 bg-card border border-border rounded-xl px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm font-heading font-semibold text-foreground mb-2">Altura (cm)</p>
                      <input type="number" min="100" max="250" placeholder="Ex: 175"
                        value={data.height} onChange={e => set("height", e.target.value)}
                        className="w-full h-12 bg-card border border-border rounded-xl px-4 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 1: Objetivo */}
            {step === 1 && (
              <motion.div key="s1" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                <h2 className="text-2xl font-heading font-bold text-foreground mb-1">Qual seu objetivo?</h2>
                <p className="text-sm text-muted-foreground mb-6">Escolha o que mais se alinha com suas metas</p>
                <div className="space-y-2.5">
                  {goals.map(g => (
                    <button key={g.value} onClick={() => set("goal", g.value)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${data.goal === g.value ? "border-primary bg-primary/8" : "border-border bg-card hover:border-primary/30"}`}>
                      <span className="text-2xl shrink-0">{g.emoji}</span>
                      <div className="flex-1 text-left">
                        <p className={`text-sm font-heading font-bold ${data.goal === g.value ? "text-primary" : "text-foreground"}`}>{g.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{g.desc}</p>
                      </div>
                      {data.goal === g.value && <Check className="w-5 h-5 text-primary shrink-0" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Experiência e disponibilidade */}
            {step === 2 && (
              <motion.div key="s2" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                <h2 className="text-2xl font-heading font-bold text-foreground mb-1">Experiência e disponibilidade</h2>
                <p className="text-sm text-muted-foreground mb-6">Para calibrar o volume e frequência do plano</p>
                <div className="space-y-5">
                  {/* Nível */}
                  <div>
                    <p className="text-sm font-heading font-semibold text-foreground mb-2">Nível de experiência</p>
                    <div className="space-y-2">
                      {levels.map(l => (
                        <button key={l.value} onClick={() => set("level", l.value)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${data.level === l.value ? "border-primary bg-primary/8" : "border-border bg-card hover:border-primary/30"}`}>
                          <div className="text-left">
                            <p className={`text-sm font-heading font-semibold ${data.level === l.value ? "text-primary" : "text-foreground"}`}>{l.label}</p>
                            <p className="text-xs text-muted-foreground">{l.desc}</p>
                          </div>
                          {data.level === l.value && <Check className="w-4 h-4 text-primary" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Dias por semana */}
                  <div>
                    <p className="text-sm font-heading font-semibold text-foreground mb-2">Quantos dias por semana?</p>
                    <div className="flex gap-2">
                      {[2,3,4,5,6].map(d => (
                        <button key={d} onClick={() => { set("daysPerWeek", d); set("selectedDays", []); }}
                          className={`flex-1 py-3 rounded-xl border-2 text-sm font-heading font-bold transition-all ${data.daysPerWeek === d ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"}`}>
                          {d}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quais dias */}
                  {data.daysPerWeek > 0 && (
                    <div>
                      <p className="text-sm font-heading font-semibold text-foreground mb-1">Quais dias você vai treinar?</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        Selecione exatamente {data.daysPerWeek} dia{data.daysPerWeek > 1 ? 's' : ''} — {data.selectedDays.length}/{data.daysPerWeek} selecionado{data.selectedDays.length !== 1 ? 's' : ''}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {ALL_DAYS.map(day => {
                          const active = data.selectedDays.includes(day);
                          const full = !active && data.selectedDays.length >= data.daysPerWeek;
                          return (
                            <button
                              key={day}
                              onClick={() => toggleDay(day)}
                              disabled={full}
                              className={`px-3 py-2 rounded-xl border-2 text-xs font-heading font-bold transition-all ${
                                active ? 'border-primary bg-primary/10 text-primary' :
                                full ? 'border-border bg-card text-muted-foreground/30 cursor-not-allowed' :
                                'border-border bg-card text-muted-foreground hover:border-primary/40'
                              }`}
                            >
                              {day.slice(0, 3).toUpperCase()}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {/* Duração */}
                  <div>
                    <p className="text-sm font-heading font-semibold text-foreground mb-2">Duração por sessão</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[{v:"30",l:"30 min"},{v:"45",l:"45 min"},{v:"60",l:"60 min"},{v:"90",l:"90 min+"}].map(({v,l}) => (
                        <button key={v} onClick={() => set("sessionDuration", v)}
                          className={`py-3 rounded-xl border-2 text-sm font-heading font-semibold transition-all ${data.sessionDuration === v ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Equipamentos e saúde */}
            {step === 3 && (
              <motion.div key="s3" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                <h2 className="text-2xl font-heading font-bold text-foreground mb-1">Equipamentos e saúde</h2>
                <p className="text-sm text-muted-foreground mb-6">Para adaptar os exercícios à sua realidade</p>
                <div className="space-y-5">
                  {/* Equipamentos */}
                  <div>
                    <p className="text-sm font-heading font-semibold text-foreground mb-2">Onde você treina?</p>
                    <div className="space-y-2">
                      {equipment.map(e => (
                        <button key={e.value} onClick={() => set("equipment", e.value)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${data.equipment === e.value ? "border-primary bg-primary/8" : "border-border bg-card hover:border-primary/30"}`}>
                          <div className="text-left">
                            <p className={`text-sm font-heading font-semibold ${data.equipment === e.value ? "text-primary" : "text-foreground"}`}>{e.label}</p>
                            <p className="text-xs text-muted-foreground">{e.desc}</p>
                          </div>
                          {data.equipment === e.value && <Check className="w-4 h-4 text-primary" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Histórico */}
                  <div>
                    <p className="text-sm font-heading font-semibold text-foreground mb-2">Histórico de treino</p>
                    <div className="grid grid-cols-2 gap-2">
                      {histories.map(h => (
                        <button key={h.value} onClick={() => set("trainingHistory", h.value)}
                          className={`py-3 px-3 rounded-xl border-2 text-xs font-heading font-semibold text-center transition-all ${data.trainingHistory === h.value ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"}`}>
                          {h.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Lesão */}
                  <div>
                    <p className="text-sm font-heading font-semibold text-foreground mb-2">Tem alguma lesão ou limitação?</p>
                    <div className="flex gap-3 mb-3">
                      {[{v:false,l:"Não"},{v:true,l:"Sim"}].map(({v,l}) => (
                        <button key={l} onClick={() => set("hasInjury", v)}
                          className={`flex-1 py-3 rounded-xl border-2 text-sm font-heading font-semibold transition-all ${data.hasInjury === v ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                    {data.hasInjury && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                        <textarea
                          placeholder="Descreva a lesão ou limitação (ex: hérnia de disco L4-L5, dor no ombro direito...)"
                          value={data.injuryDetail}
                          onChange={e => set("injuryDetail", e.target.value)}
                          rows={3}
                          className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                        />
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Músculos prioritários */}
            {step === 4 && (
              <motion.div key="s4" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                <h2 className="text-2xl font-heading font-bold text-foreground mb-1">Músculos prioritários</h2>
                <p className="text-sm text-muted-foreground mb-2">Selecione os grupos que quer focar mais <span className="text-foreground">(opcional)</span></p>
                <p className="text-xs text-muted-foreground mb-6">Deixe em branco para um plano equilibrado</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {muscles.map(m => {
                    const active = data.priorityMuscles.includes(m);
                    return (
                      <button key={m} onClick={() => toggleMuscle(m)}
                        className={`flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 transition-all ${active ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/30"}`}>
                        <span className={`text-sm font-heading font-semibold ${active ? "text-primary" : "text-foreground"}`}>{m}</span>
                        {active && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Botão de ação */}
        <div className="pt-4 pb-6 shrink-0">
          {error && <p className="text-sm text-destructive text-center mb-4">{error}</p>}
          {step < TOTAL_STEPS - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}
              className="w-full bg-primary text-primary-foreground font-heading font-semibold rounded-xl h-14 text-base disabled:opacity-30">
              Continuar <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleGenerate} disabled={!canProceed()}
              className="w-full bg-primary text-primary-foreground font-heading font-semibold rounded-xl h-14 text-base disabled:opacity-30">
              ✨ VITA, crie meu plano!
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
