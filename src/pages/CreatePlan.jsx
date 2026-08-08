import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, PenLine, Dumbbell, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { VitaRobot } from "@/components/VitaRobot";
import { Button } from "@/components/ui/button";
import CreatePlanAI from "./CreatePlanAI";
import CreatePlanManual from "./CreatePlanManual";

function ActivePlanBlock({ plan, onDelete, isDeleting }) {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-14 z-20 bg-background/95 backdrop-blur-sm border-b border-border/40 px-4 pt-5 pb-4">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <button onClick={() => navigate("/")}
            className="w-10 h-10 rounded-2xl bg-card border border-border/50 flex items-center justify-center hover:border-primary/30 transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Novo Plano</p>
            <h1 className="text-lg font-heading font-bold text-foreground">Plano ativo encontrado</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-8 flex-1 flex flex-col">
        {/* Alerta */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-500/8 border border-yellow-500/30 rounded-2xl p-5 flex items-start gap-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/15 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-sm font-heading font-bold text-foreground mb-1">Você já tem um plano ativo</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Só é possível ter um plano ativo por vez. Para criar um novo, você precisa concluir ou excluir o atual.
            </p>
          </div>
        </motion.div>

        {/* Card do plano atual */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="bg-card border border-border rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Dumbbell className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <p className="text-xs text-primary font-semibold uppercase tracking-wider">Ativo</p>
              </div>
              <p className="text-base font-heading font-bold text-foreground truncate">{plan.name}</p>
            </div>
          </div>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="bg-secondary px-2.5 py-1 rounded-lg">{plan.days_per_week}x por semana</span>
            {plan.goal && <span className="bg-secondary px-2.5 py-1 rounded-lg capitalize">{plan.goal.replace("_", " ")}</span>}
            {plan.level && <span className="bg-secondary px-2.5 py-1 rounded-lg capitalize">{plan.level}</span>}
          </div>
        </motion.div>

        {/* Ações */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
          className="space-y-3">
          {/* Continuar com o plano atual */}
          <Button onClick={() => navigate("/plano")}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-heading font-bold text-base shadow-lg shadow-primary/25">
            Continuar com o plano atual
          </Button>

          {/* Excluir e criar novo */}
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)}
              className="w-full h-14 rounded-2xl border-2 border-destructive/30 bg-destructive/5 text-destructive font-heading font-semibold text-sm flex items-center justify-center gap-2 hover:bg-destructive/10 transition-colors">
              <Trash2 className="w-4 h-4" />
              Excluir plano atual e criar novo
            </button>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-destructive/8 border-2 border-destructive/30 rounded-2xl p-4">
              <p className="text-sm font-heading font-bold text-foreground text-center mb-1">Tem certeza?</p>
              <p className="text-xs text-muted-foreground text-center mb-4">
                O plano <span className="font-semibold text-foreground">"{plan.name}"</span> será excluído permanentemente.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(false)}
                  className="flex-1 h-10 rounded-xl border border-border bg-card text-sm font-heading font-semibold text-foreground hover:bg-secondary transition-colors">
                  Cancelar
                </button>
                <button onClick={onDelete} disabled={isDeleting}
                  className="flex-1 h-10 rounded-xl bg-destructive text-destructive-foreground text-sm font-heading font-bold flex items-center justify-center gap-2 hover:bg-destructive/90 transition-colors disabled:opacity-50">
                  {isDeleting
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><Trash2 className="w-4 h-4" /> Excluir</>}
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function CreatePlan() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState(null);

  const { data: activePlan, isLoading } = useQuery({
    queryKey: ["active-plan-check"],
    queryFn: async () => {
      const { data } = await supabase
        .from("workout_plans")
        .select("id, name, goal, level, days_per_week")
        .eq("is_active", true)
        .maybeSingle();
      return data ?? null;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await supabase.from("workout_plans").delete().eq("id", activePlan.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-plan-check"] });
      queryClient.invalidateQueries({ queryKey: ["workout-plans"] });
    },
  });

  if (mode === "ai")     return <CreatePlanAI onBack={() => setMode(null)} />;
  if (mode === "manual") return <CreatePlanManual onBack={() => setMode(null)} />;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (activePlan) {
    return (
      <ActivePlanBlock
        plan={activePlan}
        onDelete={() => deleteMutation.mutate()}
        isDeleting={deleteMutation.isPending}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-14 z-20 bg-background/95 backdrop-blur-sm border-b border-border/40 px-4 pt-5 pb-4">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <button onClick={() => navigate("/")}
            className="w-10 h-10 rounded-2xl bg-card border border-border/50 flex items-center justify-center hover:border-primary/30 transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Novo Plano</p>
            <h1 className="text-lg font-heading font-bold text-foreground">Como deseja criar?</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-10 flex-1 flex flex-col gap-4">
        <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          onClick={() => setMode("ai")}
          className="w-full text-left rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-6 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10 transition-all">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/30 overflow-hidden">
              <VitaRobot size={52} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">Recomendado</p>
              <h2 className="text-xl font-heading font-bold text-foreground mb-2">VITA cria seu plano</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Responda uma avaliação rápida. A VITA cria um plano 100% personalizado considerando seu perfil, lesões e objetivos.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {["Avaliação física", "Objetivos", "Nível", "Equipamentos"].map(tag => (
              <span key={tag} className="text-[11px] font-medium text-primary bg-primary/10 border border-primary/20 rounded-full px-2.5 py-1">{tag}</span>
            ))}
          </div>
        </motion.button>

        <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          onClick={() => setMode("manual")}
          className="w-full text-left rounded-3xl border-2 border-border bg-card p-6 hover:border-primary/40 hover:shadow-md transition-all">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center shrink-0">
              <PenLine className="w-7 h-7 text-foreground" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-heading font-bold text-foreground mb-2">Criar do Zero</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Monte seu próprio plano manualmente. Escolha os dias, grupos musculares e exercícios do jeito que preferir.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {["Controle total", "Seus exercícios", "Seu ritmo"].map(tag => (
              <span key={tag} className="text-[11px] font-medium text-muted-foreground bg-secondary border border-border rounded-full px-2.5 py-1">{tag}</span>
            ))}
          </div>
        </motion.button>
      </div>
    </div>
  );
}
