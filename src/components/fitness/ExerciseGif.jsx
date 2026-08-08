import React, { useState, useEffect } from "react";
import { Dumbbell } from "lucide-react";

// Mapa completo: nome do exercício (minúsculas) → ID verificado na ExerciseDB API
const EXERCISE_ID_MAP = {
  // ── PEITO ────────────────────────────────────────────────
  "supino reto com barra":         "EIeI8Vf", // barbell bench press (deitado)
  "supino reto":                   "EIeI8Vf",
  "supino inclinado com barra":    "3TZduzM", // barbell incline bench press
  "supino inclinado":              "3TZduzM",
  "supino declinado":              "GrO65fd", // barbell decline bench press
  "supino":                        "EIeI8Vf",
  "crucifixo reto":                "1PLE8e9", // dumbbell incline twisted flyes (crucifixo)
  "crucifixo inclinado":           "1PLE8e9",
  "crucifixo":                     "1PLE8e9",
  "flexão de braço":               "0V2YQjW",
  "flexão":                        "0V2YQjW",
  "cross over":                    "0CXGHya", // cable cross-over variation

  // ── COSTAS ───────────────────────────────────────────────
  "levantamento terra":            "ila4NZS", // barbell deadlift
  "barra fixa":                    "0V2YQjW", // pull up neutral grip
  "puxada alta":                   "LEprlgG", // cable lat pulldown full range
  "pulldown":                      "LEprlgG",
  "remada curvada com barra":      "eZyBC3j", // barbell bent over row (EM PÉ inclinado)
  "remada curvada":                "eZyBC3j",
  "remada com halteres":           "BJ0Hz5L", // dumbbell bent over row
  "remada unilateral":             "C0MA9bC", // dumbbell one arm bent-over row
  "remada baixa":                  "A3P4O0R", // cable seated row

  // ── PERNAS ───────────────────────────────────────────────
  "agachamento livre":             "DhMl549", // barbell full squat
  "agachamento":                   "DhMl549",
  "agachamento hack":              "5VCj6iH", // barbell hack squat
  "agachamento sumô":              "dzz6BiV", // smith sumo squat (pernas bem abertas)
  "leg press 45°":                 "10Z2DXU", // sled 45 leg press
  "leg press":                     "10Z2DXU",
  "cadeira extensora":             "my33uHU", // lever leg extension (máquina)
  "mesa flexora":                  "17lJ1kr", // lever lying leg curl (máquina deitado)
  "cadeira flexora":               "17lJ1kr",
  "stiff":                         "5eLRITT", // dumbbell stiff leg deadlift
  "afundo":                        "62Nw60O", // barbell rear lunge
  "panturrilha em pé":             "bJYHBIN", // bodyweight standing calf raise
  "panturrilha":                   "bJYHBIN",
  "hip thrust":                    "qKBpF7I", // barbell glute bridge (mais próximo do hip thrust)
  "elevação pélvica":              "qKBpF7I",
  "agachamento sumo":              "dzz6BiV",

  // ── OMBROS ───────────────────────────────────────────────
  "desenvolvimento militar":       "kTbSH9h", // barbell seated overhead press
  "desenvolvimento com barra":     "kTbSH9h",
  "desenvolvimento com halteres":  "A6wtbuL", // dumbbell standing overhead press
  "desenvolvimento arnold":        "Xy4jlWA", // dumbbell arnold press
  "desenvolvimento":               "kTbSH9h",
  "elevação lateral":              "DsgkuIt", // dumbbell lateral raise
  "elevação frontal":              "3eGE2JC", // dumbbell front raise
  "remada alta":                   "83HoW9X",
  "face pull":                     "gAwDzB3",
  "encolhimento":                  "EIeI8Vf",

  // ── BÍCEPS ───────────────────────────────────────────────
  "rosca direta com barra":        "25GPyDY", // barbell curl
  "rosca direta":                  "25GPyDY",
  "rosca alternada":               "25GPyDY",
  "rosca martelo":                 "2sQGZ5b", // dumbbell one arm standing hammer curl (pegada neutra)
  "rosca scott":                   "1V1gj1u", // barbell seated close-grip concentration curl
  "rosca concentrada":             "1V1gj1u",
  "rosca inclinada":               "25GPyDY",

  // ── TRÍCEPS ──────────────────────────────────────────────
  "tríceps pulley":                "gAwDzB3", // cable triceps pushdown v-bar
  "tríceps corda":                 "gAwDzB3",
  "tríceps francês":               "2IxROQ1", // cable overhead triceps extension
  "tríceps testa":                 "1TVoin7", // barbell lying triceps extension (deitado)
  "tríceps coice":                 "3T12T87", // dumbbell standing bent over triceps extension (em pé)
  "mergulho no banco":             "aWedzZX", // glute bridge two legs on bench → na falta de bench dip, usar próximo

  // ── ABDÔMEN ──────────────────────────────────────────────
  "prancha abdominal":             "VBAWRPG", // weighted front plank
  "prancha":                       "VBAWRPG",
  "abdominal supra":               "8xUv4J7", // cable seated crunch (similar ao crunch)
  "abdominal infra":               "8xUv4J7",
  // ── CARDIO ───────────────────────────────────────────────
  "polichinelo":                   "1g5bPpA", // jack jump (male)

  // ── GLÚTEOS ──────────────────────────────────────────────
  "cadeira de abdutor":            "CHpahtl", // lever seated hip abduction (máquina sentada, pernas abrem)
};

// Busca dinâmica para exercícios não mapeados
const SEARCH_TERMS = {
  "flexão de braço": "push up",
  "flexão": "push up",
  "prancha abdominal": "plank",
  "russian twist": "russian twist",
  "mountain climber": "mountain climber",
  "polichinelo": "jumping jack",
  "burpee": "burpee",
  "tríceps pulley": "cable triceps pushdown",
  "mergulho no banco": "bench dip",
};

function getMatch(name) {
  const lower = name.toLowerCase().trim();

  // Busca exata ou substring — ordem por tamanho para priorizar matches mais específicos
  const keys = Object.keys(EXERCISE_ID_MAP).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    if (lower === key || lower.includes(key)) {
      return { type: "id", value: EXERCISE_ID_MAP[key] };
    }
  }

  // Fallback: pesquisa por termo
  const searchKeys = Object.keys(SEARCH_TERMS).sort((a, b) => b.length - a.length);
  for (const key of searchKeys) {
    if (lower.includes(key)) {
      return { type: "search", value: SEARCH_TERMS[key] };
    }
  }

  // Último recurso: busca pelo próprio nome em inglês não
  return { type: "search", value: lower };
}

async function fetchGifUrl(name) {
  const match = getMatch(name);

  if (match.type === "id") {
    return `https://static.exercisedb.dev/media/${match.value}.gif`;
  }

  const res = await fetch(
    `https://oss.exercisedb.dev/api/v1/exercises?name=${encodeURIComponent(match.value)}&limit=5`
  );
  const data = await res.json();
  const exercises = data?.data || [];
  const exact = exercises.find(e => e.name.toLowerCase() === match.value.toLowerCase());
  return (exact || exercises[0])?.gifUrl || null;
}

export default function ExerciseGif({ exerciseName, animationUrl }) {
  const [gifUrl, setGifUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Se o banco já forneceu a URL, usar direto sem lookup
    if (animationUrl) {
      setGifUrl(animationUrl);
      setLoading(false);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);
    setGifUrl(null);

    fetchGifUrl(exerciseName)
      .then(url => {
        if (url) setGifUrl(url);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [exerciseName, animationUrl]);

  if (loading) {
    return (
      <div className="w-full h-44 bg-secondary rounded-2xl flex items-center justify-center">
        <div className="w-7 h-7 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !gifUrl) {
    return (
      <div className="w-full h-44 bg-secondary rounded-2xl flex flex-col items-center justify-center gap-2 opacity-40">
        <Dumbbell className="w-8 h-8 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Sem demonstração</p>
      </div>
    );
  }

  return (
    <div
      className="w-full rounded-2xl overflow-hidden bg-secondary border border-border flex items-center justify-center"
      style={{ height: 200 }}
    >
      <img
        src={gifUrl}
        alt={exerciseName}
        className="h-full w-full object-contain"
        style={{ maxHeight: 200 }}
      />
    </div>
  );
}