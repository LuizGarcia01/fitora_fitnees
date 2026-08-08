-- Adiciona exercícios que podem estar faltando no banco
INSERT INTO exercise_library (name, category, primary_muscle, secondary_muscles, equipment, difficulty, instructions)
VALUES
  ('Kettlebell Swing', 'cardio', 'Glúteos', array['Isquiotibiais','Lombar','Core'], 'Kettlebell', 'intermediario', 'Pés na largura dos ombros, segure o kettlebell com as duas mãos. Agache levemente e balance o kettlebell para frente usando o impulso do quadril.'),
  ('Pullover com Halter', 'costas', 'Grande Dorsal', array['Peitoral','Tríceps'], 'Halteres', 'intermediario', 'Deite no banco, segure um halter com as duas mãos acima do peito. Desça o halter atrás da cabeça mantendo os cotovelos levemente flexionados.')
ON CONFLICT (name) DO NOTHING;

-- Atualiza nomes inconsistentes para coincidir com os planos gerados pela IA
UPDATE exercise_library SET name = 'Pullover com Halter' WHERE name = 'Pull Over';
