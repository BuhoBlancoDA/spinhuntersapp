create or replace function public.enroll_package_user(
  p_package_id bigint,
  p_user_id uuid,
  p_start_at timestamptz default now(),
  p_end_at timestamptz default null,
  p_status text default 'ACTIVE'
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
begin
  -- Permisos admin
  select is_admin() into v_is_admin;
  if not v_is_admin then
    raise exception 'NOT_ADMIN';
  end if;

  -- Paquete existe y activo
  perform 1 from public.course_packages where id = p_package_id and is_active = true;
  if not found then
    raise exception 'PACKAGE_NOT_FOUND';
  end if;

  -- Upsert de la inscripción al PAQUETE
  insert into public.course_package_enrollments (package_id, user_id, status, start_at, end_at)
  values (p_package_id, p_user_id, coalesce(p_status, 'ACTIVE'), coalesce(p_start_at, now()), p_end_at)
  on conflict (package_id, user_id) do update
    set status     = excluded.status,
        start_at   = excluded.start_at,
        end_at     = excluded.end_at,
        updated_at = now();

  -- Upsert masivo de INSCRIPCIONES a cada CURSO del paquete (solo cursos activos)
  insert into public.course_enrollments (course_id, user_id, status, start_at, end_at)
  select
    cpi.course_id,
    p_user_id,
    coalesce(p_status, 'ACTIVE'),
    coalesce(p_start_at, now()),
    p_end_at
  from public.course_package_items cpi
  join public.courses c
    on c.id = cpi.course_id
   and c.is_active = true
  where cpi.package_id = p_package_id
  on conflict (course_id, user_id) do update
    set status     = excluded.status,
        start_at   = excluded.start_at,
        end_at     = excluded.end_at,
        updated_at = now();

  return json_build_object('ok', true);
exception
  when others then
    return json_build_object('ok', false, 'error', SQLERRM);
end;
$$;
