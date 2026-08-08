insert into exercise_library (name, category, primary_muscle, secondary_muscles, equipment, difficulty, instructions) values

-- PEITO
('Supino Reto com Barra', 'peito', 'Peitoral Maior', array['Tríceps','Deltóide Anterior'], 'Barra', 'intermediario', 'Deite no banco, segure a barra na largura dos ombros, desça ao peito e empurre de volta.'),
('Supino Inclinado com Barra', 'peito', 'Peitoral Superior', array['Tríceps','Deltóide Anterior'], 'Barra', 'intermediario', 'Banco inclinado a 30-45°. Foco na parte superior do peitoral.'),
('Supino Declinado com Barra', 'peito', 'Peitoral Inferior', array['Tríceps'], 'Barra', 'intermediario', 'Banco declinado. Enfatiza a porção inferior do peitoral.'),
('Supino Reto com Halteres', 'peito', 'Peitoral Maior', array['Tríceps','Deltóide Anterior'], 'Halteres', 'iniciante', 'Maior amplitude de movimento que a barra. Mantenha os cotovelos a 45°.'),
('Supino Inclinado com Halteres', 'peito', 'Peitoral Superior', array['Tríceps'], 'Halteres', 'iniciante', 'Banco a 30-45°. Desça os halteres até a linha do peito.'),
('Crucifixo Reto', 'peito', 'Peitoral Maior', array['Deltóide Anterior'], 'Halteres', 'iniciante', 'Deite no banco, abra os braços em arco até sentir o alongamento no peitoral.'),
('Crucifixo Inclinado', 'peito', 'Peitoral Superior', array['Deltóide Anterior'], 'Halteres', 'iniciante', 'Banco inclinado. Isola melhor a parte superior do peitoral.'),
('Cross Over', 'peito', 'Peitoral Maior', array['Deltóide Anterior'], 'Cabo', 'iniciante', 'Puxe os cabos em arco frente ao corpo. Contraia o peitoral na posição final.'),
('Flexão de Braço', 'peito', 'Peitoral Maior', array['Tríceps','Deltóide Anterior'], 'Peso corporal', 'iniciante', 'Mãos na largura dos ombros. Desça até o peito quase tocar o chão.'),
('Flexão com Pés Elevados', 'peito', 'Peitoral Superior', array['Tríceps','Deltóide Anterior'], 'Peso corporal', 'intermediario', 'Pés elevados para maior ativação da parte superior do peitoral.'),
('Mergulho entre Bancos', 'peito', 'Peitoral Inferior', array['Tríceps'], 'Peso corporal', 'iniciante', 'Incline o corpo para frente para focar no peitoral inferior.'),

-- COSTAS
('Levantamento Terra', 'costas', 'Eretores da Espinha', array['Glúteos','Isquiotibiais','Trapézio'], 'Barra', 'avancado', 'Pés na largura do quadril, barra sobre os pés. Empurre o chão e mantenha as costas retas.'),
('Barra Fixa', 'costas', 'Grande Dorsal', array['Bíceps','Rombóides'], 'Barra', 'intermediario', 'Pegada pronada, largura maior que os ombros. Puxe até o queixo ultrapassar a barra.'),
('Puxada Alta', 'costas', 'Grande Dorsal', array['Bíceps','Rombóides'], 'Máquina', 'iniciante', 'Puxe a barra até a clavícula, cotovelos apontando para baixo.'),
('Puxada Neutra', 'costas', 'Grande Dorsal', array['Bíceps'], 'Máquina', 'iniciante', 'Pegada paralela. Menor estresse no ombro, boa opção para iniciantes.'),
('Remada Curvada com Barra', 'costas', 'Grande Dorsal', array['Rombóides','Trapézio','Bíceps'], 'Barra', 'intermediario', 'Tronco a 45°, puxe a barra em direção ao umbigo. Mantenha as costas retas.'),
('Remada Unilateral com Halter', 'costas', 'Grande Dorsal', array['Rombóides','Bíceps'], 'Halteres', 'iniciante', 'Apoie um joelho no banco. Puxe o halter até o quadril.'),
('Remada Baixa no Cabo', 'costas', 'Grande Dorsal', array['Rombóides','Trapézio'], 'Cabo', 'iniciante', 'Puxe o cabo em direção ao abdômen, cotovelos próximos ao corpo.'),
('Remada com Halteres', 'costas', 'Rombóides', array['Trapézio','Deltóide Posterior'], 'Halteres', 'iniciante', 'Incline o tronco. Puxe os halteres em direção ao quadril.'),
('Encolhimento com Barra', 'costas', 'Trapézio', array['Deltóide'], 'Barra', 'iniciante', 'Eleve os ombros em direção às orelhas. Não rode os ombros.'),
('Pull Over', 'costas', 'Grande Dorsal', array['Peitoral','Tríceps'], 'Halteres', 'intermediario', 'Deite no banco, segure um halter com as duas mãos e desça atrás da cabeça.'),

-- PERNAS
('Agachamento Livre', 'pernas', 'Quadríceps', array['Glúteos','Isquiotibiais','Panturrilha'], 'Barra', 'intermediario', 'Pés na largura dos ombros, desça até as coxas ficarem paralelas ao chão.'),
('Agachamento Hack', 'pernas', 'Quadríceps', array['Glúteos'], 'Máquina', 'iniciante', 'Ênfase na parte frontal da coxa. Pés a 45° para proteger os joelhos.'),
('Agachamento Sumô', 'pernas', 'Quadríceps', array['Glúteos','Adutores'], 'Barra', 'intermediario', 'Pés mais afastados, pontas voltadas para fora. Ativa mais o glúteo e adutor.'),
('Agachamento Búlgaro', 'pernas', 'Quadríceps', array['Glúteos','Isquiotibiais'], 'Halteres', 'avancado', 'Pé traseiro elevado. Excelente para força unilateral.'),
('Leg Press 45°', 'pernas', 'Quadríceps', array['Glúteos','Isquiotibiais'], 'Máquina', 'iniciante', 'Pés na largura dos ombros. Desça até 90° nos joelhos.'),
('Cadeira Extensora', 'pernas', 'Quadríceps', array[]::text[], 'Máquina', 'iniciante', 'Isola o quadríceps. Faça contração no ponto final do movimento.'),
('Mesa Flexora', 'pernas', 'Isquiotibiais', array[]::text[], 'Máquina', 'iniciante', 'Curl de perna deitado. Foco nos isquiotibiais.'),
('Cadeira Flexora', 'pernas', 'Isquiotibiais', array[]::text[], 'Máquina', 'iniciante', 'Curl de perna sentado. Mais estresse no isquiotibial distal.'),
('Stiff', 'pernas', 'Isquiotibiais', array['Glúteos','Eretores da Espinha'], 'Barra', 'intermediario', 'Pernas quase estendidas, desça a barra pela frente das pernas sentindo o alongamento.'),
('Afundo', 'pernas', 'Quadríceps', array['Glúteos','Isquiotibiais'], 'Halteres', 'iniciante', 'Passo longo à frente, desça o joelho traseiro próximo ao chão.'),
('Panturrilha em Pé', 'pernas', 'Panturrilha', array[]::text[], 'Máquina', 'iniciante', 'Suba na ponta dos pés com amplitude completa. Faça a contração no topo.'),
('Panturrilha Sentado', 'pernas', 'Panturrilha', array[]::text[], 'Máquina', 'iniciante', 'Foca no músculo sóleo. Importante para o volume total da panturrilha.'),

-- OMBROS
('Desenvolvimento Militar com Barra', 'ombros', 'Deltóide Anterior', array['Deltóide Medial','Tríceps','Trapézio'], 'Barra', 'intermediario', 'Empurre a barra acima da cabeça. Pode ser feito em pé ou sentado.'),
('Desenvolvimento com Halteres', 'ombros', 'Deltóide Anterior', array['Deltóide Medial','Tríceps'], 'Halteres', 'iniciante', 'Maior amplitude que com barra. Cotovelos a 90° na posição inicial.'),
('Desenvolvimento Arnold', 'ombros', 'Deltóide Anterior', array['Deltóide Medial','Tríceps'], 'Halteres', 'intermediario', 'Inicie com palmas viradas para você e gire durante o movimento.'),
('Elevação Lateral', 'ombros', 'Deltóide Medial', array[]::text[], 'Halteres', 'iniciante', 'Eleve os braços lateralmente até a altura dos ombros. Leve inclinação no cotovelo.'),
('Elevação Frontal', 'ombros', 'Deltóide Anterior', array[]::text[], 'Halteres', 'iniciante', 'Eleve os braços à frente até a altura dos ombros. Controle a descida.'),
('Remada Alta', 'ombros', 'Deltóide Medial', array['Trapézio','Bíceps'], 'Barra', 'intermediario', 'Puxe a barra até a altura do queixo, cotovelos acima da barra.'),
('Face Pull', 'ombros', 'Deltóide Posterior', array['Rombóides','Trapézio'], 'Cabo', 'iniciante', 'Puxe o cabo em direção ao rosto, cotovelos elevados. Rotação externa no final.'),
('Elevação Posterior com Halteres', 'ombros', 'Deltóide Posterior', array['Rombóides'], 'Halteres', 'iniciante', 'Incline o tronco a 90°, eleve os halteres lateralmente com cotovelos levemente flexionados.'),

-- BÍCEPS
('Rosca Direta com Barra', 'biceps', 'Bíceps Braquial', array['Braquial'], 'Barra', 'iniciante', 'Cotovelos fixos ao longo do corpo. Curl completo sem balançar o tronco.'),
('Rosca Alternada com Halteres', 'biceps', 'Bíceps Braquial', array['Braquial'], 'Halteres', 'iniciante', 'Um braço de cada vez, supinando o pulso durante o movimento.'),
('Rosca Martelo', 'biceps', 'Braquial', array['Bíceps Braquial'], 'Halteres', 'iniciante', 'Pegada neutra (polegar para cima). Ativa mais o braquial e antebraço.'),
('Rosca Scott', 'biceps', 'Bíceps Braquial', array[]::text[], 'Barra/Halteres', 'iniciante', 'Apoio do braço no banco Scott. Isola o bíceps eliminando trapaça.'),
('Rosca Concentrada', 'biceps', 'Bíceps Braquial', array[]::text[], 'Halteres', 'iniciante', 'Cotovelo apoiado na coxa. Máximo isolamento do bíceps.'),
('Rosca Inclinada', 'biceps', 'Bíceps Braquial', array[]::text[], 'Halteres', 'intermediario', 'Banco inclinado. Alongamento máximo do bíceps no ponto inferior.'),
('Rosca no Cabo', 'biceps', 'Bíceps Braquial', array[]::text[], 'Cabo', 'iniciante', 'Tensão constante ao longo do movimento. Ótimo para finalização.'),

-- TRÍCEPS
('Tríceps Pulley', 'triceps', 'Tríceps Braquial', array[]::text[], 'Cabo', 'iniciante', 'Cotovelos fixos ao lado do corpo. Estenda completamente os braços.'),
('Tríceps Corda no Cabo', 'triceps', 'Tríceps Braquial', array[]::text[], 'Cabo', 'iniciante', 'Abra a corda no final do movimento para maior amplitude.'),
('Tríceps Francês', 'triceps', 'Tríceps Braquial', array[]::text[], 'Halteres/Barra', 'intermediario', 'Deite ou sente. Desça o peso atrás da cabeça, cotovelos apontando para cima.'),
('Tríceps Testa', 'triceps', 'Tríceps Braquial', array[]::text[], 'Barra', 'intermediario', 'Deite no banco. Desça a barra em direção à testa com cotovelos fixos.'),
('Tríceps Coice', 'triceps', 'Tríceps Braquial', array[]::text[], 'Halteres', 'iniciante', 'Incline o tronco, cotovelo fixo. Estenda o braço para trás.'),
('Mergulho no Banco', 'triceps', 'Tríceps Braquial', array['Peitoral Inferior'], 'Peso corporal', 'iniciante', 'Mãos no banco atrás, pernas estendidas. Desça flexionando os cotovelos.'),
('Mergulho nas Paralelas', 'triceps', 'Tríceps Braquial', array['Peitoral'], 'Peso corporal', 'intermediario', 'Tronco ereto para focar no tríceps. Cotovelos próximos ao corpo.'),

-- ABDÔMEN
('Abdominal Supra', 'abdomen', 'Reto Abdominal', array['Oblíquos'], 'Peso corporal', 'iniciante', 'Deite, joelhos flexionados. Suba apenas o suficiente para as escápulas saírem do chão.'),
('Abdominal Infra', 'abdomen', 'Reto Abdominal Inferior', array[]::text[], 'Peso corporal', 'iniciante', 'Deite. Eleve os joelhos em direção ao peito controlando o movimento.'),
('Prancha Abdominal', 'abdomen', 'Core', array['Oblíquos','Glúteos'], 'Peso corporal', 'iniciante', 'Apoio nos cotovelos e pés. Mantenha o corpo reto. Respire normalmente.'),
('Prancha Lateral', 'abdomen', 'Oblíquos', array['Core'], 'Peso corporal', 'intermediario', 'Apoio em um cotovelo e pé. Quadril elevado formando linha reta.'),
('Abdominal com Rotação', 'abdomen', 'Oblíquos', array['Reto Abdominal'], 'Peso corporal', 'iniciante', 'Suba e gire o tronco alternando os lados. Cotovelo em direção ao joelho oposto.'),
('Elevação de Pernas', 'abdomen', 'Reto Abdominal Inferior', array[]::text[], 'Peso corporal', 'intermediario', 'Deite, pernas estendidas. Eleve até 90° e desça controlando.'),
('Abdominal no Cabo', 'abdomen', 'Reto Abdominal', array[]::text[], 'Cabo', 'iniciante', 'Ajoelhe-se de costas para o cabo. Flexione o tronco contraindo o abdômen.'),
('Mountain Climber', 'abdomen', 'Core', array['Oblíquos','Quadríceps'], 'Peso corporal', 'intermediario', 'Posição de flexão. Alterne puxando os joelhos em direção ao peito rapidamente.'),

-- GLÚTEOS
('Hip Thrust com Barra', 'gluteos', 'Glúteo Máximo', array['Isquiotibiais','Core'], 'Barra', 'intermediario', 'Costas apoiadas no banco, barra no quadril. Empurre o quadril para cima contraindo o glúteo.'),
('Elevação Pélvica', 'gluteos', 'Glúteo Máximo', array['Isquiotibiais'], 'Peso corporal', 'iniciante', 'Deite, joelhos flexionados. Eleve o quadril contraindo o glúteo no topo.'),
('Cadeira de Abdutora', 'gluteos', 'Glúteo Médio', array[]::text[], 'Máquina', 'iniciante', 'Abra as pernas contra a resistência. Foco no glúteo médio e lateral.'),
('Elevação de Quadril Unilateral', 'gluteos', 'Glúteo Máximo', array['Core'], 'Peso corporal', 'intermediario', 'Uma perna estendida. Maior ativação e desequilíbrio muscular corrigido.'),
('Agachamento com Faixa Elástica', 'gluteos', 'Glúteo Máximo', array['Quadríceps','Glúteo Médio'], 'Faixa Elástica', 'iniciante', 'Faixa acima dos joelhos. Empurre os joelhos para fora durante o agachamento.'),
('Stiff Unilateral', 'gluteos', 'Glúteo Máximo', array['Isquiotibiais'], 'Halteres', 'intermediario', 'Uma perna de cada vez. Inclina o tronco enquanto eleva a perna traseira.'),
('Kick Back no Cabo', 'gluteos', 'Glúteo Máximo', array[]::text[], 'Cabo', 'iniciante', 'De frente para o cabo, empurre a perna para trás contraindo o glúteo.'),

-- CARDIO
('Polichinelo', 'cardio', 'Corpo Todo', array['Cardiorrespiratório'], 'Peso corporal', 'iniciante', 'Salte abrindo pernas e braços simultaneamente. Mantenha ritmo constante.'),
('Burpee', 'cardio', 'Corpo Todo', array['Cardiorrespiratório'], 'Peso corporal', 'avancado', 'Flexão + salto. Movimento explosivo. Um dos melhores para condicionamento.'),
('Corrida Estacionária', 'cardio', 'Cardiorrespiratório', array[]::text[], 'Peso corporal', 'iniciante', 'Corra no lugar elevando os joelhos acima da linha do quadril.'),
('Pular Corda', 'cardio', 'Cardiorrespiratório', array['Panturrilha','Coordenação'], 'Corda', 'iniciante', 'Saltos baixos e rápidos. Punhos fazem o movimento circular.'),
('Agachamento com Salto', 'cardio', 'Quadríceps', array['Glúteos','Cardiorrespiratório'], 'Peso corporal', 'intermediario', 'Agache e salte explosivamente. Alta demanda cardiovascular e muscular.'),
('Sprint', 'cardio', 'Cardiorrespiratório', array['Quadríceps','Glúteos'], 'Peso corporal', 'intermediario', 'Corrida em alta velocidade por intervalos curtos. HIIT eficiente.');
