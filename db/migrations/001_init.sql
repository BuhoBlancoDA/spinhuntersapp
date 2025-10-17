create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  country_code text not null,
  discord_user text not null,
  whatsapp text null,
  email_alt text null,
  how_heard text null,
  how_heard_other text null,
  is_gmail boolean default false,
  non_gmail boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.set_email_flags()
returns trigger language plpgsql as $$
begin
  new.is_gmail := (select coalesce(split_part(u.email,'@',2) in ('gmail.com','googlemail.com'), false)
                   from auth.users u where u.id = new.user_id);
  new.non_gmail := not new.is_gmail;
  new.updated_at := now();
  return new;
end$$;

drop trigger if exists trg_profiles_email_flags on public.profiles;
create trigger trg_profiles_email_flags
before insert or update on public.profiles
for each row execute function public.set_email_flags();

create table if not exists public.membership_plans (
  id bigserial primary key,
  code text unique not null,
  name text not null,
  description text,
  is_active boolean default true
);

create table if not exists public.memberships (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id bigint not null references public.membership_plans(id),
  status text not null check (status in ('ACTIVE','EXPIRED','CANCELLED','PENDING')),
  start_at timestamptz not null default now(),
  end_at timestamptz not null,
  source text,
  created_at timestamptz default now()
);

create table if not exists public.announcements (
  id bigserial primary key,
  title text not null,
  body text not null,
  visible_from timestamptz default now(),
  visible_to timestamptz,
  audience text default 'ALL'
);

create table if not exists public.resource_links (
  id bigserial primary key,
  title text not null,
  url text not null,
  min_plan_code text default 'ROOKIE',
  admin_only boolean default false,
  sort_order int default 100
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.announcements enable row level security;
alter table public.resource_links enable row level security;
alter table public.admin_users enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable as $$
  select exists (select 1 from public.admin_users a where a.user_id = auth.uid());
$$;

create policy "profiles_select_self_or_admin" on public.profiles
  for select using (auth.uid() = user_id or public.is_admin());

create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "profiles_insert_self" on public.profiles
  for insert with check (auth.uid() = user_id);

create policy "memberships_select_self_or_admin" on public.memberships
  for select using (auth.uid() = user_id or public.is_admin());

create policy "admin_users_all_admin_only" on public.admin_users
  for all using (public.is_admin());

create policy "announcements_read_all" on public.announcements
  for select using (true);

create policy "resource_links_read_all" on public.resource_links
  for select using (true);

-- Seeds
insert into public.membership_plans (code,name) values
 ('ROOKIE','Rookie'),('SHARK','Shark'),('ULTIMATE','Ultimate')
on conflict (code) do nothing;