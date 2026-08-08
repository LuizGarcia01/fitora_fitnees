process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const PAT = process.env.SUPABASE_PAT; // export SUPABASE_PAT=seu_token antes de rodar
const REF = 'fugztekwkpmambvcyrmm';
const BASE = 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0';

const fixes = [
  // Peito
  ['Flexão de Braço',           `${BASE}/pectorals/push-up.gif`],
  ['Flexão com Pés Elevados',   `${BASE}/pectorals/decline-push-up.gif`],
  ['Mergulho entre Bancos',     `${BASE}/pectorals/chest-dip.gif`],
  // Costas
  ['Puxada Alta',               `${BASE}/lats/cable-pulldown.gif`],
  ['Puxada Neutra',             `${BASE}/lats/twin-handle-parallel-grip-lat-pulldown.gif`],
  ['Remada Baixa no Cabo',      `${BASE}/upper-back/cable-seated-row.gif`],
  ['Encolhimento com Barra',    `${BASE}/traps/barbell-shrug.gif`],
  // Pernas
  ['Mesa Flexora',              `${BASE}/hamstrings/lever-lying-leg-curl.gif`],
  ['Cadeira Flexora',           `${BASE}/hamstrings/lever-seated-leg-curl.gif`],
  ['Panturrilha Sentado',       `${BASE}/calves/lever-seated-calf-raise.gif`],
  ['Stiff Unilateral',          `${BASE}/hamstrings/barbell-straight-leg-deadlift.gif`],
  // Ombros
  ['Elevação Posterior com Halteres', `${BASE}/delts/dumbbell-rear-delt-raise.gif`],
  // Bíceps
  ['Rosca Alternada com Halteres', `${BASE}/biceps/dumbbell-alternate-biceps-curl.gif`],
  ['Rosca Concentrada',         `${BASE}/biceps/dumbbell-concentration-curl.gif`],
  ['Rosca Inclinada',           `${BASE}/biceps/dumbbell-incline-curl.gif`],
  ['Rosca no Cabo',             `${BASE}/biceps/cable-curl.gif`],
  // Tríceps
  ['Tríceps Corda no Cabo',     `${BASE}/triceps/cable-pushdown-with-rope-attachment.gif`],
  ['Tríceps Testa',             `${BASE}/triceps/barbell-lying-triceps-extension-skull-crusher.gif`],
  ['Mergulho nas Paralelas',    `${BASE}/triceps/elbow-dips.gif`],
  ['Mergulho no Banco',         `${BASE}/triceps/assisted-triceps-dip-kneeling.gif`],
  // Abdômen
  ['Abdominal Supra',           `${BASE}/abs/crunch-floor.gif`],
  ['Abdominal Infra',           `${BASE}/abs/cable-reverse-crunch.gif`],
  ['Prancha Lateral',           `${BASE}/abs/bodyweight-incline-side-plank.gif`],
  ['Abdominal com Rotação',     `${BASE}/abs/band-bicycle-crunch.gif`],
  ['Elevação de Pernas',        `${BASE}/abs/lying-leg-raise-flat-bench.gif`],
  ['Abdominal no Cabo',         `${BASE}/abs/cable-kneeling-crunch.gif`],
  ['Mountain Climber',          `${BASE}/cardio/mountain-climber.gif`],
  // Glúteos
  ['Hip Thrust com Barra',           `${BASE}/glutes/barbell-glute-bridge-two-legs-on-bench-male.gif`],
  ['Elevação Pélvica',               `${BASE}/glutes/glute-bridge-two-legs-on-bench-male.gif`],
  ['Elevação de Quadril Unilateral', `${BASE}/glutes/low-glute-bridge-on-floor.gif`],
  ['Agachamento com Faixa Elástica', `${BASE}/glutes/band-squat.gif`],
  ['Kick Back no Cabo',              `${BASE}/glutes/cable-standing-hip-extension.gif`],
  // Cardio
  ['Polichinelo',         `${BASE}/cardio/jack-jump-male.gif`],
  ['Corrida Estacionária',`${BASE}/cardio/short-stride-run.gif`],
  ['Pular Corda',         `${BASE}/cardio/jump-rope.gif`],
  ['Agachamento com Salto',`${BASE}/cardio/semi-squat-jump-male.gif`],
  ['Sprint',              `${BASE}/cardio/run.gif`],
  ['Burpee',              `${BASE}/cardio/burpee.gif`],
];

// Monta um CASE WHEN ... END para atualizar tudo de uma vez
const names = fixes.map(([n]) => n);
const escaped = fixes.map(([n, u]) =>
  `WHEN '${n.replace(/'/g, "''")}' THEN '${u}'`
).join('\n  ');
const inList = names.map(n => `'${n.replace(/'/g, "''")}'`).join(', ');

const sql = `
UPDATE exercise_library
SET animation_url = CASE name
  ${escaped}
END
WHERE name IN (${inList})
`;

async function doSQL(q) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${PAT}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: q }),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`SQL ${r.status}: ${t}`);
  return t;
}

async function main() {
  console.log(`Atualizando ${fixes.length} GIFs...`);
  const result = await doSQL(sql);
  console.log('Resposta:', result);
  console.log(`\n✓ ${fixes.length} exercícios atualizados!`);
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
