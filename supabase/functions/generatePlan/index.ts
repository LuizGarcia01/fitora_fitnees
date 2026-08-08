import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Lista canônica — o AI deve usar SOMENTE estes nomes (ou variações mínimas)
const EXERCISE_VOCABULARY = `
PEITO: Supino reto com barra, Supino inclinado com halteres, Supino declinado com barra, Supino reto com halteres, Crucifixo reto com halteres, Crossover alto no cabo, Crossover baixo no cabo, Flexão de braço, Chest press na máquina, Peck deck

COSTAS: Puxada frontal, Puxada por trás, Remada baixa no cabo, Remada curvada com barra, Remada unilateral com haltere, Barra fixa pronada, Barra fixa supinada, Pullover com haltere, Encolhimento com barra, Remada na máquina, Remada cavalinho, Puxada supinada

PERNAS: Agachamento livre, Agachamento goblet, Leg press 45 graus, Cadeira extensora, Mesa flexora, Stiff com barra, Avanço com halteres, Afundo caminhando, Agachamento sumô, Hack squat, Afundo búlgaro, Elevação de panturrilha em pé, Elevação de panturrilha sentado

GLÚTEOS: Elevação pélvica com barra, Hip thrust na máquina, Glúteo no cabo, Coice no cabo, Cadeira abdutora, Cadeira adutora

OMBROS: Desenvolvimento com halteres, Desenvolvimento com barra, Elevação lateral com halteres, Elevação frontal com halteres, Crucifixo inverso, Desenvolvimento Arnold, Remada alta com barra, Elevação lateral no cabo, Face pull no cabo

BÍCEPS: Rosca direta com barra, Rosca direta com halteres, Rosca martelo, Rosca concentrada, Rosca scott com barra EZ, Rosca no cabo, Rosca alternada com halteres

TRÍCEPS: Tríceps pulley corda, Tríceps pulley barra reta, Tríceps testa com barra EZ, Tríceps banco, Tríceps coice com haltere, Tríceps francês com haltere, Mergulho entre bancos, Extensão de tríceps no cabo

ABDÔMEN: Prancha frontal, Prancha lateral, Abdominal crunch, Elevação de pernas suspenso, Russian twist, Mountain climber, Abdominal na polia, Bicicleta abdominal

CARDIO: Esteira, Bicicleta ergométrica, Elíptico, Corrida intervalada, Burpee
`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const { assessmentData, goal, level, daysPerWeek } = body;

    const isAssessment = !!assessmentData;

    const equipmentMap: Record<string, string> = {
      academia_completa: "academia completa com todos os equipamentos",
      academia_basica: "academia básica com pesos livres e máquinas simples",
      casa_equipamentos: "em casa com halteres, barra e elásticos",
      casa_sem: "em casa sem equipamentos (peso corporal)",
    };
    const historyMap: Record<string, string> = {
      nunca: "nunca treinou antes",
      parei_recente: "parou de treinar há menos de 6 meses",
      parei_antigo: "parou de treinar há mais de 6 meses",
      regular: "treina regularmente",
    };

    const selectedDays = assessmentData?.selectedDays?.length
      ? assessmentData.selectedDays
      : null;

    const prompt = isAssessment
      ? `Você é um personal trainer especialista. Crie um plano de treino em JSON seguindo RIGOROSAMENTE todas as regras abaixo.

═══════════════════════════════════════
⚠️  REGRAS ABSOLUTAS — NÃO NEGOCIE
═══════════════════════════════════════
REGRA 1 — NÚMERO DE DIAS: O plano deve ter EXATAMENTE ${assessmentData.daysPerWeek} dia(s) de treino. Não crie mais nem menos.
REGRA 2 — DIAS DA SEMANA: ${selectedDays ? `Use SOMENTE estes dias: ${selectedDays.join(', ')}. Não use outros dias.` : `Distribua os ${assessmentData.daysPerWeek} dias de forma inteligente na semana.`}
REGRA 3 — NOMES DE EXERCÍCIOS: Use SOMENTE os nomes exatos da lista abaixo. Não invente variações nem nomes diferentes. Se um exercício não estiver na lista, escolha o mais próximo que esteja.
${assessmentData.hasInjury ? `REGRA 4 — LESÃO (PRIORIDADE MÁXIMA): O usuário informou: "${assessmentData.injuryDetail}"

Aplique as restrições:
━━ COLUNA (lombar, cervical, hérnia, disco, L4, L5, escoliose, dor nas costas) ━━
❌ PROIBIDO: Agachamento livre, Stiff com barra, Remada curvada com barra, Leg press 45 graus, Desenvolvimento com barra, qualquer carga axial na coluna
✅ PERMITIDO: Remada na máquina, Puxada frontal, Rosca direta com barra, Tríceps pulley corda, Mesa flexora, Cadeira extensora (baixa carga), Cadeira abdutora, Cadeira adutora, Prancha frontal

━━ JOELHO (menisco, ligamento, condromalácia, artrose) ━━
❌ PROIBIDO: Agachamento livre, Leg press 45 graus, Avanço com halteres, Afundo caminhando, Afundo búlgaro, Hack squat
✅ PERMITIDO: Mesa flexora, Cadeira adutora, Cadeira abdutora, Elevação de panturrilha em pé, Stiff com barra

━━ OMBRO (manguito rotador, impacto, SLAP, tendinite) ━━
❌ PROIBIDO: Desenvolvimento com barra, Supino inclinado com halteres, Remada alta com barra, Crucifixo reto com halteres, Puxada por trás
✅ PERMITIDO: Elevação lateral no cabo, Face pull no cabo, Puxada frontal (pegada neutra), Remada na máquina, Crucifixo inverso

━━ Outra região: elimine exercícios que recrutam diretamente a área ━━
⚠️ Na dúvida, EXCLUA. Segurança primeiro.` : ''}
═══════════════════════════════════════

LISTA DE EXERCÍCIOS PERMITIDOS (use APENAS estes nomes):
${EXERCISE_VOCABULARY}

PERFIL DO USUÁRIO:
- Idade: ${assessmentData.age} anos | Sexo: ${assessmentData.gender}
- Peso: ${assessmentData.weight}kg | Altura: ${assessmentData.height}cm
- Objetivo: ${assessmentData.goal}
- Nível: ${assessmentData.level} | Histórico: ${historyMap[assessmentData.trainingHistory] || assessmentData.trainingHistory}
- Duração por sessão: ${assessmentData.sessionDuration} minutos
- Local/equipamentos: ${equipmentMap[assessmentData.equipment] || assessmentData.equipment}
- Músculos prioritários: ${assessmentData.priorityMuscles?.length ? assessmentData.priorityMuscles.join(', ') : 'equilíbrio geral'}

Retorne SOMENTE o JSON, sem texto, sem markdown, sem explicações:
{
  "name": "Nome descritivo do plano",
  "weekly_plan": [
    {
      "day": "Segunda",
      "muscle_group": "Nome do grupo muscular",
      "exercises": [
        {
          "name": "Nome exato da lista acima",
          "sets": 4,
          "reps": "8-12",
          "rest_seconds": 90,
          "notes": "Dica de execução",
          "primary_muscle": "Músculo principal trabalhado",
          "secondary_muscles": ["Músculo secundário 1", "Músculo secundário 2"],
          "category": "peito",
          "difficulty": "intermediario",
          "instructions": "Descrição técnica de como executar o exercício corretamente em 2-3 frases."
        }
      ]
    }
  ]
}

REGRAS DE FORMATAÇÃO:
- Dias EXATAMENTE como: Segunda, Terça, Quarta, Quinta, Sexta, Sábado, Domingo
- CONFIRME: o array weekly_plan tem ${assessmentData.daysPerWeek} item(s)${selectedDays ? ` com os dias: ${selectedDays.join(', ')}` : ''}
- 5-7 exercícios por dia adaptados ao tempo de ${assessmentData.sessionDuration} min
- category: peito | costas | pernas | ombros | biceps | triceps | abdomen | gluteos | cardio
- difficulty: iniciante | intermediario | avancado`

      : `Crie um plano de treino de academia completo em JSON com as seguintes especificações:
- Objetivo: ${goal}
- Nível: ${level}
- Dias por semana: ${daysPerWeek}

Use SOMENTE os nomes de exercícios desta lista:
${EXERCISE_VOCABULARY}

Retorne SOMENTE o JSON no formato abaixo, sem texto adicional, sem markdown:
{
  "name": "Nome descritivo do plano",
  "weekly_plan": [
    {
      "day": "Segunda",
      "muscle_group": "Nome do grupo muscular",
      "exercises": [
        {
          "name": "Nome exato da lista",
          "sets": 4,
          "reps": "8-12",
          "rest_seconds": 90,
          "notes": "Dica sobre execução",
          "primary_muscle": "Músculo principal trabalhado",
          "secondary_muscles": ["Músculo secundário 1"],
          "category": "peito",
          "difficulty": "intermediario",
          "instructions": "Descrição técnica de como executar o exercício corretamente em 2-3 frases."
        }
      ]
    }
  ]
}

Regras:
- Use os dias da semana em português: Segunda, Terça, Quarta, Quinta, Sexta, Sábado
- Inclua exatamente ${daysPerWeek} dias de treino
- Cada dia deve ter 5-7 exercícios
- Adapte volume e intensidade ao nível ${level}
- category deve ser um de: peito, costas, pernas, ombros, biceps, triceps, abdomen, gluteos, cardio
- difficulty deve ser: iniciante, intermediario ou avancado`;

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8192,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const result = await anthropicRes.json();

    if (!anthropicRes.ok || result.error || !result.content?.[0]?.text) {
      const detail = result.error?.message || JSON.stringify(result);
      return new Response(JSON.stringify({ error: `Anthropic error: ${detail}` }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const text = result.content[0].text.trim();

    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    if (jsonStart === -1 || jsonEnd === 0) {
      return new Response(JSON.stringify({ error: 'AI did not return valid JSON', raw: text.slice(0, 200) }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const plan = JSON.parse(text.substring(jsonStart, jsonEnd));

    return new Response(JSON.stringify(plan), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
