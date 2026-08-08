-- Tabela: body_measurements (histórico de medidas corporais do usuário)
create table if not exists body_measurements (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date            date not null default current_date,
  weight_kg       numeric(5,2),
  body_fat_pct    numeric(4,1),
  chest_cm        numeric(5,1),
  waist_cm        numeric(5,1),
  hips_cm         numeric(5,1),
  arms_cm         numeric(5,1),
  thighs_cm       numeric(5,1),
  notes           text,
  created_at      timestamptz default now()
);

alter table body_measurements enable row level security;

create policy "users_manage_own_measurements"
  on body_measurements for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_body_measurements_user_date
  on body_measurements(user_id, date desc);
