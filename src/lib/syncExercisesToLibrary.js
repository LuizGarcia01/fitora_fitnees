import { supabase } from '@/api/supabaseClient';

/**
 * Garante que todo exercício do plano existe na biblioteca.
 * Usa os metadados que a IA já retorna em cada exercício.
 * Para exercícios manuais, infere categoria pelo nome.
 */
export async function syncExercisesToLibrary(weeklyPlan) {
  if (!weeklyPlan?.length) return;

  // Coleta exercícios únicos por nome, preservando metadados da IA
  const exerciseMap = new Map();
  for (const day of weeklyPlan) {
    for (const ex of day.exercises || []) {
      const name = ex.name?.trim();
      if (name && !exerciseMap.has(name)) {
        exerciseMap.set(name, ex);
      }
    }
  }
  if (!exerciseMap.size) return;

  const names = [...exerciseMap.keys()];

  // Descobre quais já existem
  const { data: existing } = await supabase
    .from('exercise_library')
    .select('name')
    .in('name', names);

  const existingSet = new Set((existing || []).map(e => e.name));
  const missing = names.filter(n => !existingSet.has(n));
  if (!missing.length) return;

  // Insere os que faltam com dados completos da IA (ou inferidos).
  // onConflict: 'name' requer a constraint unique criada em 005_exercise_library_insert_policy.sql
  await supabase.from('exercise_library').upsert(
    missing.map(name => {
      const ex = exerciseMap.get(name);
      return {
        name,
        category:           ex.category        || inferCategory(name),
        primary_muscle:     ex.primary_muscle  || 'Não especificado',
        secondary_muscles:  ex.secondary_muscles || [],
        equipment:          'Não especificado',
        difficulty:         ex.difficulty       || 'iniciante',
        instructions:       ex.instructions     || `Execute o ${name} com boa postura e amplitude completa de movimento.`,
      };
    }),
    { onConflict: 'name', ignoreDuplicates: true }
  );
}

function inferCategory(name) {
  const n = name.toLowerCase();
  if (/agachamento|legpress|extensão|flexão de perna|panturrilha|avanço|stiff|hack/.test(n)) return 'pernas';
  if (/supino|crucifixo|flexão|cross|peck/.test(n)) return 'peito';
  if (/remada|puxada|levantamento terra|pull|barra fixa|encolhimento/.test(n)) return 'costas';
  if (/desenvolvimento|elevação|arnold|ombro/.test(n)) return 'ombros';
  if (/rosca|bíceps|curl/.test(n)) return 'biceps';
  if (/tríceps|extensão de braço|mergulho|dip|skull/.test(n)) return 'triceps';
  if (/abdominal|prancha|crunch|oblíquo|core/.test(n)) return 'abdomen';
  if (/glúteo|hip thrust|elevação pélvica|kickback/.test(n)) return 'gluteos';
  if (/burpee|corrida|hiit|kettlebell|corda|jumping|cardio/.test(n)) return 'cardio';
  return 'outros';
}
