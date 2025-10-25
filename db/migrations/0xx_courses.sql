-- =========================
-- 1) Tabla de cursos
-- =========================
create table if not exists public.courses (
  id                bigserial primary key,
  code              text not null unique,            -- ej: "PRE-FLOP-101"
  slug              text not null unique,            -- ej: "pre-flop-101"
  title             text not null,                   -- ej: "Preflop desde cero"
  description       text null,
  is_active         boolean not null default true,
  default_duration_days integer null,                -- si quieres predefinir duraciones
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_courses_active on public.courses(is_active);

create trigger trg_courses_updated_at
before update on public.courses
for each row execute function update_updated_at_column();

-- =========================
-- 2) Inscripciones a cursos
-- =========================
create table if not exists public.course_enrollments (
  id          bigserial primary key,
  course_id   bigint not null references public.courses(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  status      text not null default 'ACTIVE',  -- ACTIVE | EXPIRED | CANCELLED | PENDING
  start_at    timestamptz not null default now(),
  end_at      timestamptz null,                -- null = sin caducidad
  added_by    uuid null references auth.users(id) on delete set null, -- admin que inscribe
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint uq_course_user unique(course_id, user_id)
);

create index if not exists idx_course_enrollments_user on public.course_enrollments(user_id);
create index if not exists idx_course_enrollments_course on public.course_enrollments(course_id);
create index if not exists idx_course_enrollments_endat on public.course_enrollments(end_at);

create trigger trg_course_enrollments_updated_at
before update on public.course_enrollments
for each row execute function update_updated_at_column();

-- =========================
-- 3) RLS
-- =========================
alter table public.courses enable row level security;
alter table public.course_enrollments enable row level security;

-- Solo admin gestiona cursos
create policy courses_admin_all
  on public.courses
  using (is_admin())
  with check (is_admin());

-- Usuarios pueden ver cursos activos (para listado público, si no quieres, quítala)
create policy courses_select_public
  on public.courses
  for select
  using (is_active);

-- Inscripciones: admin full; usuario solo ve las suyas
create policy course_enrollments_admin_all
  on public.course_enrollments
  using (is_admin())
  with check (is_admin());

create policy course_enrollments_select_self
  on public.course_enrollments
  for select
  using (auth.uid() = user_id);

-- =========================
-- 4) Helper: ¿está inscrito y vigente?
-- =========================
create or replace function public.is_enrolled(p_course_id bigint)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.course_enrollments ce
    where ce.course_id = p_course_id
      and ce.user_id = auth.uid()
      and ce.status = 'ACTIVE'
      and (ce.end_at is null or ce.end_at > now())
  );
$$;
