-- ============================================================
-- Fitness Plus — Schema inicial
-- Execute este SQL no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ============================================================

-- Tabela: workout_plans
create table if not exists workout_plans (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name          text not null,
  goal          text,
  level         text,
  days_per_week integer,
  weekly_plan   jsonb,
  is_active     boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table workout_plans enable row level security;

create policy "users_manage_own_plans"
  on workout_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Tabela: workout_logs
create table if not exists workout_logs (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null default auth.uid() references auth.users(id) on delete cascade,
  plan_id              uuid references workout_plans(id) on delete set null,
  date                 date not null,
  day                  text,
  duration_minutes     integer,
  completed_exercises  jsonb,
  notes                text,
  created_at           timestamptz default now()
);

alter table workout_logs enable row level security;

create policy "users_manage_own_logs"
  on workout_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Tabela: exercise_logs
create table if not exists exercise_logs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  exercise_name  text not null,
  date           date not null,
  sets_data      jsonb,
  created_at     timestamptz default now()
);

alter table exercise_logs enable row level security;

create policy "users_manage_own_exercise_logs"
  on exercise_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Tabela: exercise_library (catálogo compartilhado, somente leitura para usuários)
create table if not exists exercise_library (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  category          text,
  primary_muscle    text,
  secondary_muscles text[],
  equipment         text,
  difficulty        text,
  instructions      text,
  animation_url     text,
  created_at        timestamptz default now()
);

alter table exercise_library enable row level security;

create policy "everyone_reads_exercise_library"
  on exercise_library for select
  using (true);

-- ============================================================
-- Índices para performance
-- ============================================================
create index if not exists idx_workout_plans_user_active on workout_plans(user_id, is_active);
create index if not exists idx_workout_logs_user_date on workout_logs(user_id, date desc);
create index if not exists idx_exercise_logs_user_exercise on exercise_logs(user_id, exercise_name, date desc);
