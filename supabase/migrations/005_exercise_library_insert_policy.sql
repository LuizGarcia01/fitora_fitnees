-- Permite que usuários autenticados insiram exercícios na biblioteca.
-- Necessário para syncExercisesToLibrary funcionar ao criar planos.
-- A leitura continua pública (política existente em 001_initial_schema.sql).
create policy "authenticated_users_insert_exercises"
  on exercise_library for insert
  to authenticated
  with check (true);

-- Também precisamos de um unique constraint em 'name' para que ON CONFLICT funcione
-- corretamente (evitar duplicatas ao re-rodar syncExercisesToLibrary).
alter table exercise_library
  add constraint exercise_library_name_key unique (name);
