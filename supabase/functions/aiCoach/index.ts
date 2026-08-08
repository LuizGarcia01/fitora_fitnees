import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const [{ data: workoutLogs }, { data: exerciseLogs }, { data: plans }] = await Promise.all([
      supabase.from('workout_logs').select('*').order('date', { ascending: false }).limit(50),
      supabase.from('exercise_logs').select('*').order('date', { ascending: false }).limit(100),
      supabase.from('workout_plans').select('*').eq('is_active', true).limit(1),
    ]);

    const context = {
      user: { email: user.email },
      stats: {
        totalWorkouts: workoutLogs?.length || 0,
        recentWorkouts: workoutLogs?.slice(0, 10).map(log => ({
          date: log.date,
          day: log.day,
          duration: log.duration_minutes,
          exercises: log.completed_exercises?.filter((e: any) => e.completed).length || 0,
        })) || [],
        exercises: exerciseLogs?.slice(0, 20).map(log => ({
          name: log.exercise_name,
          date: log.date,
          best_set: log.sets_data?.reduce((best: any, s: any) =>
            (s.weight_kg * s.reps_done) > (best?.score || 0)
              ? { weight: s.weight_kg, reps: s.reps_done, score: s.weight_kg * s.reps_done }
              : best,
            null),
        })) || [],
        activePlan: plans?.[0] ? {
          name: plans[0].name,
          goal: plans[0].goal,
          days_per_week: plans[0].days_per_week,
        } : null,
      },
    };

    const EXERCISE_VOCABULARY = [
      "Supino reto com barra","Supino inclinado com halteres","Supino declinado com barra","Supino reto com halteres","Crucifixo reto com halteres","Crossover alto no cabo","Crossover baixo no cabo","Flexão de braço","Chest press na máquina","Peck deck",
      "Puxada frontal","Puxada por trás","Remada baixa no cabo","Remada curvada com barra","Remada unilateral com haltere","Barra fixa pronada","Barra fixa supinada","Pullover com haltere","Encolhimento com barra","Remada na máquina","Remada cavalinho","Puxada supinada",
      "Agachamento livre","Agachamento goblet","Leg press 45 graus","Cadeira extensora","Mesa flexora","Stiff com barra","Avanço com halteres","Afundo caminhando","Agachamento sumô","Hack squat","Afundo búlgaro","Elevação de panturrilha em pé","Elevação de panturrilha sentado",
      "Elevação pélvica com barra","Hip thrust na máquina","Glúteo no cabo","Coice no cabo","Cadeira abdutora","Cadeira adutora",
      "Desenvolvimento com halteres","Desenvolvimento com barra","Elevação lateral com halteres","Elevação frontal com halteres","Crucifixo inverso","Desenvolvimento Arnold","Remada alta com barra","Elevação lateral no cabo","Face pull no cabo",
      "Rosca direta com barra","Rosca direta com halteres","Rosca martelo","Rosca concentrada","Rosca scott com barra EZ","Rosca no cabo","Rosca alternada com halteres",
      "Tríceps pulley corda","Tríceps pulley barra reta","Tríceps testa com barra EZ","Tríceps banco","Tríceps coice com haltere","Tríceps francês com haltere","Mergulho entre bancos","Extensão de tríceps no cabo",
      "Prancha frontal","Prancha lateral","Abdominal crunch","Elevação de pernas suspenso","Russian twist","Mountain climber","Abdominal na polia","Bicicleta abdominal",
      "Esteira","Bicicleta ergométrica","Elíptico","Corrida intervalada","Burpee",
    ].join(", ");

    const prompt = `Você é VITA, coach de musculação do app Fitora. Analise os dados de treino deste usuário e forneça insights motivadores e práticos.

DADOS DO USUÁRIO:
${JSON.stringify(context, null, 2)}

REGRAS OBRIGATÓRIAS:
- Se precisar citar exercícios específicos, use SOMENTE nomes desta lista: ${EXERCISE_VOCABULARY}
- NUNCA invente ou sugira exercícios que não estejam nessa lista
- Analise frequência, volume e grupos musculares trabalhados
- Detecte desequilíbrios ou quedas de rendimento
- Seja encorajador e realista
- Foque em 2-3 insights concretos
- Use linguagem motivacional, conversacional, em português do Brasil
- Máximo 150 palavras

Responda como um coach falando diretamente com seu aluno.`;

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const result = await anthropicRes.json();
    const analysis = result.content[0].text;

    return new Response(JSON.stringify({ analysis, timestamp: new Date().toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
