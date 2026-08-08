import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Dumbbell, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const muscleGroupExercises = {
  "Peito": [
    "Supino reto com barra", "Supino inclinado com halteres", "Supino declinado com barra",
    "Crucifixo reto com halteres", "Crossover alto no cabo", "Crossover baixo no cabo",
    "Flexão de braço", "Chest press na máquina", "Peck deck", "Supino reto com halteres",
    "Supino inclinado com barra",
  ],
  "Costas": [
    "Puxada frontal", "Puxada por trás", "Remada baixa no cabo", "Remada curvada com barra",
    "Remada unilateral com haltere", "Barra fixa pronada", "Barra fixa supinada",
    "Pullover com haltere", "Encolhimento com barra", "Remada na máquina",
    "Remada cavalinho", "Puxada supinada",
  ],
  "Pernas": [
    "Agachamento livre", "Agachamento goblet", "Leg press 45 graus", "Cadeira extensora",
    "Mesa flexora", "Stiff com barra", "Avanço com halteres", "Afundo caminhando",
    "Agachamento sumô", "Hack squat", "Afundo búlgaro", "Elevação de panturrilha em pé",
    "Elevação de panturrilha sentado",
  ],
  "Glúteos": [
    "Elevação pélvica com barra", "Hip thrust na máquina", "Glúteo no cabo",
    "Coice no cabo", "Agachamento sumô", "Afundo búlgaro", "Cadeira abdutora",
    "Cadeira adutora",
  ],
  "Ombros": [
    "Desenvolvimento com halteres", "Desenvolvimento com barra", "Elevação lateral com halteres",
    "Elevação frontal com halteres", "Crucifixo inverso", "Desenvolvimento Arnold",
    "Remada alta com barra", "Elevação lateral no cabo", "Face pull no cabo",
  ],
  "Bíceps": [
    "Rosca direta com barra", "Rosca direta com halteres", "Rosca martelo",
    "Rosca concentrada", "Rosca scott com barra EZ", "Rosca no cabo", "Rosca alternada com halteres",
  ],
  "Tríceps": [
    "Tríceps pulley corda", "Tríceps pulley barra reta", "Tríceps testa com barra EZ",
    "Tríceps banco", "Tríceps coice com haltere", "Tríceps francês com haltere",
    "Mergulho entre bancos", "Extensão de tríceps no cabo",
  ],
  "Abdômen": [
    "Prancha frontal", "Prancha lateral", "Abdominal crunch", "Elevação de pernas suspenso",
    "Russian twist", "Mountain climber", "Abdominal na polia", "Abdominal remador",
    "Bicicleta abdominal",
  ],
  "Cardio": [
    "Esteira", "Bicicleta ergométrica", "Elíptico", "Corrida intervalada", "Burpee",
    "Corda naval", "Step", "Jumping jack",
  ],
};

export default function ExerciseSubstitution({ originalExercise, onSubstitute, onClose }) {
  const [selected, setSelected] = useState(null);

  // Extrair grupo muscular do nome ou usar mapeamento
  const getMuscleGroup = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes("supino") || lower.includes("crucifixo") || lower.includes("peito") || lower.includes("peck") || lower.includes("chest") || lower.includes("crossover")) return "Peito";
    if (lower.includes("puxada") || lower.includes("pullover") || lower.includes("encolhimento") || lower.includes("barra fixa") || lower.includes("cavalinho")) return "Costas";
    if ((lower.includes("remada") && !lower.includes("alta"))) return "Costas";
    if (lower.includes("glúteo") || lower.includes("gluteo") || lower.includes("hip thrust") || lower.includes("elevação pélvica") || lower.includes("coice") || lower.includes("adutora") || lower.includes("abdutora")) return "Glúteos";
    if (lower.includes("agachamento") || lower.includes("leg press") || lower.includes("cadeira extensora") || lower.includes("mesa flexora") || lower.includes("stiff") || lower.includes("avanço") || lower.includes("afundo") || lower.includes("panturrilha") || lower.includes("hack")) return "Pernas";
    if (lower.includes("desenvolvimento") || lower.includes("face pull") || lower.includes("remada alta") || lower.includes("crucifixo inverso") || lower.includes("arnold") || (lower.includes("elevação") && (lower.includes("lateral") || lower.includes("frontal")))) return "Ombros";
    if (lower.includes("rosca") || lower.includes("bíceps") || lower.includes("curl")) return "Bíceps";
    if (lower.includes("tríceps") || lower.includes("triceps") || lower.includes("mergulho") || lower.includes("extensão de tríceps")) return "Tríceps";
    if (lower.includes("prancha") || lower.includes("abdominal") || lower.includes("crunch") || lower.includes("russian") || lower.includes("mountain") || lower.includes("elevação de perna")) return "Abdômen";
    if (lower.includes("esteira") || lower.includes("bicicleta") || lower.includes("elíptico") || lower.includes("burpee") || lower.includes("corrida") || lower.includes("cardio")) return "Cardio";
    return null;
  };

  const muscleGroup = getMuscleGroup(originalExercise.name);
  const alternatives = muscleGroup ? muscleGroupExercises[muscleGroup].filter(e => e !== originalExercise.name) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-heading">Substituir</p>
            <h2 className="text-lg font-heading font-bold text-foreground leading-tight">{originalExercise.name}</h2>
          </div>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="px-5 flex-1 overflow-y-auto">
        {muscleGroup && (
          <>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-heading mb-3">
              Grupo Muscular
            </p>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 mb-6">
              <p className="text-sm font-heading font-semibold text-primary">{muscleGroup}</p>
            </div>
          </>
        )}

        <p className="text-xs text-muted-foreground uppercase tracking-widest font-heading mb-3">
          Exercícios Alternativos
        </p>

        {alternatives.length > 0 ? (
          <div className="space-y-2">
            {alternatives.map((exercise, i) => (
              <motion.button
                key={exercise}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelected(exercise)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                  selected === exercise
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    selected === exercise ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}>
                    {selected === exercise ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                  </div>
                  <span className="text-sm font-heading font-semibold text-foreground">{exercise}</span>
                </div>
                <ArrowRight className={`w-4 h-4 ${selected === exercise ? "text-primary" : "text-muted-foreground"}`} />
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Sem alternativas encontradas para este exercício.
            </p>
          </div>
        )}
      </div>

      {/* Action */}
      {selected && (
        <div className="px-5 pb-24 pt-4">
          <Button
            onClick={() => onSubstitute(selected)}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-heading font-bold text-base"
          >
            <Check className="w-5 h-5 mr-2" />
            Substituir por "{selected}"
          </Button>
        </div>
      )}
    </motion.div>
  );
}