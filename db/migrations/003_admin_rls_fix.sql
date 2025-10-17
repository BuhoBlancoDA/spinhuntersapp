-- 003_admin_rls_fix.sql
-- Ajuste de políticas para evitar recursión y permitir "select self"
drop policy if exists "admin_users_all_admin_only" on public.admin_users;

-- Permitir que cada usuario consulte si es admin (solo su propia fila)
create policy "admin_users_select_self"
on public.admin_users
for select
using (auth.uid() = user_id);

-- Solo los admins pueden insertar/actualizar/eliminar filas en admin_users
create policy "admin_users_insert_admin_only"
on public.admin_users
for insert
with check (public.is_admin());

create policy "admin_users_update_admin_only"
on public.admin_users
for update
using (public.is_admin())
with check (public.is_admin());

create policy "admin_users_delete_admin_only"
on public.admin_users
for delete
using (public.is_admin());