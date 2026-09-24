create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
begin
  v_role := case
    when coalesce(new.raw_app_meta_data->>'role', '') = 'admin'
      then 'admin'::public.user_role
    when lower(coalesce(new.raw_user_meta_data->>'account_type', '')) = 'pharmacy'
      then 'pharmacy'::public.user_role
    else 'customer'::public.user_role
  end;

  insert into public.profiles (id, full_name, phone, role, country_code)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      case when v_role = 'admin' then 'AIDCELIX Admin' else 'Customer' end
    ),
    nullif(trim(new.raw_user_meta_data->>'phone'), ''),
    v_role,
    coalesce(nullif(trim(new.raw_user_meta_data->>'country_code'), ''), 'CM')
  );

  return new;
end;
$$;

revoke execute on function public.claim_first_admin() from authenticated, anon, public;
revoke execute on function private.claim_first_admin() from authenticated, anon, public;
