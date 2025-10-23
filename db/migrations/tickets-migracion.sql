-- 1) Tabla de tickets
create table if not exists public.tickets (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  subject text not null,
  status text not null default 'OPEN',
  -- Campos opcionales para compras manuales:
  purchase_method text null,           -- 'BANK_TRANSFER', 'PAYPAL', 'OTHERS', etc.
  transaction_code text null,          -- código/ID de la transacción
  amount numeric(10,2) null,
  currency text null default 'USD',
  plan_id bigint null references public.membership_plans (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tickets_type_check check (type in ('SUPPORT','PURCHASE')),
  constraint tickets_status_check check (status in ('OPEN','IN_PROGRESS','CLOSED'))
);

create index if not exists tickets_user_id_idx on public.tickets (user_id);
create index if not exists tickets_status_idx on public.tickets (status);
create index if not exists tickets_type_idx on public.tickets (type);

create trigger update_tickets_updated_at
before update on public.tickets
for each row execute function update_updated_at_column();

-- 2) Tabla de mensajes de ticket
create table if not exists public.ticket_messages (
  id bigserial primary key,
  ticket_id bigint not null references public.tickets (id) on delete cascade,
  author_id uuid null references auth.users (id) on delete set null,
  author_role text not null,           -- 'USER' | 'ADMIN' | 'SYSTEM'
  body text not null,
  is_internal boolean not null default false, -- para notas internas (no enviar email)
  created_at timestamptz not null default now(),
  constraint ticket_messages_role_check check (author_role in ('USER','ADMIN','SYSTEM'))
);

create index if not exists ticket_messages_ticket_id_created_at_idx
on public.ticket_messages (ticket_id, created_at);

-- 3) RLS
alter table public.tickets enable row level security;
alter table public.ticket_messages enable row level security;

-- Usuarios: pueden ver sus tickets; crear nuevos; (no actualizar/borrar).
create policy tickets_user_select on public.tickets
for select using (auth.uid() = user_id or is_admin());

create policy tickets_user_insert on public.tickets
for insert with check (auth.uid() = user_id);

-- Admin: control total
create policy tickets_admin_all on public.tickets
for all using (is_admin()) with check (is_admin());

-- Mensajes: leer si el ticket les pertenece (o admin)
create policy ticket_messages_select on public.ticket_messages
for select using (
  exists(select 1 from public.tickets t
         where t.id = ticket_id
           and (t.user_id = auth.uid() or is_admin()))
);

-- Insertar mensaje: el dueño puede escribir en su ticket como USER
create policy ticket_messages_insert_user on public.ticket_messages
for insert with check (
  author_id = auth.uid()
  and author_role = 'USER'
  and exists(select 1 from public.tickets t
             where t.id = ticket_id and t.user_id = auth.uid())
);

-- Admin: control total en mensajes
create policy ticket_messages_admin_all on public.ticket_messages
for all using (is_admin()) with check (is_admin());
