import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/api/supabaseClient";
import { VitaRobot } from "@/components/VitaRobot";

export default function AICoach({ onClose }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("aiCoach", {});
      if (fnError) throw fnError;
      setAnalysis(data);
    } catch {
      setError("Não foi possível analisar seus dados. Tente novamente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden">
            <VitaRobot size={42} />
          </div>
          <div>
            <p className="text-xs text-primary uppercase tracking-widest font-heading font-bold">VITA</p>
            <h2 className="text-lg font-heading font-bold text-foreground leading-tight">Análise de Treino</h2>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-muted-foreground rotate-180" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {/* Estado inicial */}
        {!analysis && !isAnalyzing && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-10">
            <div className="flex justify-center mb-5">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-110" />
                <VitaRobot size={110} className="relative drop-shadow-lg" />
              </div>
            </div>
            <h3 className="text-2xl font-heading font-bold text-foreground mb-1">Olá! Sou a VITA</h3>
            <p className="text-sm text-muted-foreground mb-1 font-medium">Sua treinadora com inteligência artificial</p>
            <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto">
              Analisarei seus treinos, evolução e padrões para te dar insights personalizados.
            </p>
            <Button
              onClick={handleAnalyze}
              className="w-full max-w-xs bg-primary text-primary-foreground font-heading font-semibold rounded-xl h-12"
            >
              <Zap className="w-5 h-5 mr-2" />
              Analisar Meus Dados
            </Button>
          </motion.div>
        )}

        {/* Analisando */}
        {isAnalyzing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10">
            <div className="flex justify-center mb-5">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <VitaRobot size={110} />
              </motion.div>
            </div>
            <h3 className="text-xl font-heading font-bold text-foreground mb-2">VITA está analisando...</h3>
            <div className="flex justify-center gap-1 mt-3">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.25 }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Erro */}
        {error && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6 text-center">
            <p className="text-destructive text-sm font-medium">{error}</p>
            <Button onClick={handleAnalyze} variant="outline" className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </motion.div>
        )}

        {/* Resultado */}
        {analysis && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-card border border-primary/20 rounded-2xl p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                  <VitaRobot size={36} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-primary uppercase tracking-widest font-heading font-bold mb-1">
                    VITA{analysis.timestamp && !isNaN(new Date(analysis.timestamp)) ? ` · ${new Date(analysis.timestamp).toLocaleDateString("pt-BR")}` : ""}
                  </p>
                  <p className="text-foreground font-body leading-relaxed whitespace-pre-line text-sm">
                    {analysis.analysis}
                  </p>
                </div>
              </div>
            </div>
            <Button onClick={handleAnalyze} variant="outline" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Nova Análise
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
