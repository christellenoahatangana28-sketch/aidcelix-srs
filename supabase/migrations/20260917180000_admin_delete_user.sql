-- Admin can remove a customer or pharmacy account. Orders that block the FK are removed first.

create or replace function private.admin_delete_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_role public.user_role;
begin
  if not private.is_admin() then
    raise exception 'Not authorized';
  end if;
  if p_user_id is null or p_user_id = (select auth.uid()) then
    raise exception 'You cannot delete your own account';
  end if;

  select role into v_role from public.profiles where id = p_user_id;
  if v_role is null then
    raise exception 'User not found';
  end if;
  if v_role = 'admin' then
    raise exception 'Cannot delete an admin';
  end if;

  delete from public.orders where user_id = p_user_id;
  delete from auth.users where id = p_user_id;

  if exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'Could not delete user';
  end if;

  insert into public.audit_events (user_id, action)
  values ((select auth.uid()), 'admin_delete_user:' || p_user_id);
end;
$$;

create or replace function public.admin_delete_user(p_user_id uuid)
returns void
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  perform private.admin_delete_user(p_user_id);
end;
$$;

grant execute on function private.admin_delete_user(uuid) to authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;
revoke execute on function public.admin_delete_user(uuid) from anon, public;
