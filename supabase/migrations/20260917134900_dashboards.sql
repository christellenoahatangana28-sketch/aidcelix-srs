-- Role-aware dashboards: pharmacy catalog entry, admin tools, customer home.
-- Authorization uses public.profiles.role, never user-editable JWT metadata.

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

create or replace function private.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = (select auth.uid());
$$;

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
    when lower(coalesce(new.raw_user_meta_data->>'account_type', '')) = 'pharmacy'
      then 'pharmacy'::public.user_role
    else 'customer'::public.user_role
  end;

  insert into public.profiles (id, full_name, phone, role, country_code)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), 'Customer'),
    nullif(trim(new.raw_user_meta_data->>'phone'), ''),
    v_role,
    coalesce(nullif(trim(new.raw_user_meta_data->>'country_code'), ''), 'CM')
  );

  return new;
end;
$$;

create or replace function private.upsert_my_pharmacy(
  p_name text,
  p_address text,
  p_phone text,
  p_hours text,
  p_prep_minutes int,
  p_lat double precision,
  p_lng double precision
)
returns table (
  id uuid,
  slug text,
  name text,
  address text,
  phone text,
  hours text,
  prep_minutes int,
  lat double precision,
  lng double precision,
  rating numeric
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_uid uuid := (select auth.uid());
  v_role public.user_role;
  v_pharmacy_id uuid;
  v_slug text;
  v_base text;
  v_n int := 1;
  v_lat double precision := coalesce(p_lat, 4.0511);
  v_lng double precision := coalesce(p_lng, 9.7679);
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select p.role into v_role from public.profiles p where p.id = v_uid;
  if v_role is null or v_role not in ('pharmacy', 'admin') then
    raise exception 'Only pharmacy accounts can manage a pharmacy';
  end if;

  if nullif(trim(p_name), '') is null or nullif(trim(p_address), '') is null then
    raise exception 'Pharmacy name and address are required';
  end if;

  select m.pharmacy_id into v_pharmacy_id
  from public.pharmacy_members m
  where m.user_id = v_uid
  limit 1;

  if v_pharmacy_id is null then
    v_base := trim(both '-' from lower(regexp_replace(unaccent(trim(p_name)), '[^a-zA-Z0-9]+', '-', 'g')));
    if v_base is null or v_base = '' then
      v_base := 'pharmacy';
    end if;
    v_slug := v_base;
    while exists (select 1 from public.pharmacies x where x.slug = v_slug) loop
      v_n := v_n + 1;
      v_slug := v_base || '-' || v_n::text;
    end loop;

    insert into public.pharmacies (
      slug, name, address, phone, hours, prep_minutes, country_code, lat, lng
    )
    values (
      v_slug,
      trim(p_name),
      trim(p_address),
      nullif(trim(p_phone), ''),
      nullif(trim(p_hours), ''),
      greatest(coalesce(p_prep_minutes, 15), 0),
      'CM',
      v_lat,
      v_lng
    )
    returning pharmacies.id into v_pharmacy_id;

    insert into public.pharmacy_members (pharmacy_id, user_id)
    values (v_pharmacy_id, v_uid);
  else
    update public.pharmacies
    set
      name = trim(p_name),
      address = trim(p_address),
      phone = nullif(trim(p_phone), ''),
      hours = nullif(trim(p_hours), ''),
      prep_minutes = greatest(coalesce(p_prep_minutes, 15), 0),
      lat = v_lat,
      lng = v_lng
    where pharmacies.id = v_pharmacy_id;
  end if;

  return query
  select
    ph.id,
    ph.slug,
    ph.name,
    ph.address,
    ph.phone,
    ph.hours,
    ph.prep_minutes,
    ph.lat,
    ph.lng,
    ph.rating
  from public.pharmacies ph
  where ph.id = v_pharmacy_id;
end;
$$;

create or replace function private.my_pharmacy()
returns table (
  id uuid,
  slug text,
  name text,
  address text,
  phone text,
  hours text,
  prep_minutes int,
  lat double precision,
  lng double precision,
  rating numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  return query
  select
    ph.id,
    ph.slug,
    ph.name,
    ph.address,
    ph.phone,
    ph.hours,
    ph.prep_minutes,
    ph.lat,
    ph.lng,
    ph.rating
  from public.pharmacies ph
  join public.pharmacy_members m on m.pharmacy_id = ph.id
  where m.user_id = v_uid
  limit 1;
end;
$$;

create or replace function private.list_my_inventory()
returns table (
  slug text,
  name text,
  generic_name text,
  category text,
  dosage text,
  stock_status public.stock_status,
  aidcelix_price numeric,
  currency text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_pharmacy_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select m.pharmacy_id into v_pharmacy_id
  from public.pharmacy_members m
  where m.user_id = v_uid
  limit 1;

  if v_pharmacy_id is null then
    return;
  end if;

  return query
  select
    med.slug,
    med.name,
    med.generic_name,
    med.category,
    med.dosage,
    coalesce(inv.stock_status, 'out_of_stock'::public.stock_status),
    snap.aidcelix_price,
    snap.currency
  from public.medications med
  left join public.pharmacy_inventory inv
    on inv.medication_id = med.id and inv.pharmacy_id = v_pharmacy_id
  left join public.price_snapshots snap on snap.medication_id = med.id
  order by med.name;
end;
$$;

create or replace function private.set_my_inventory(p_items jsonb)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_pharmacy_id uuid;
  v_item jsonb;
  v_med_id uuid;
  v_status public.stock_status;
  v_count int := 0;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select m.pharmacy_id into v_pharmacy_id
  from public.pharmacy_members m
  where m.user_id = v_uid
  limit 1;

  if v_pharmacy_id is null then
    raise exception 'Save your pharmacy details first';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Inventory payload is invalid';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    select med.id into v_med_id from public.medications med where med.slug = v_item->>'slug';
    if v_med_id is null then
      continue;
    end if;
    v_status := coalesce((v_item->>'stock_status')::public.stock_status, 'out_of_stock');
    insert into public.pharmacy_inventory (pharmacy_id, medication_id, stock_status)
    values (v_pharmacy_id, v_med_id, v_status)
    on conflict (pharmacy_id, medication_id)
    do update set stock_status = excluded.stock_status;
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

create or replace function private.claim_first_admin()
returns public.user_role
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if exists (select 1 from public.profiles where role = 'admin') then
    raise exception 'An admin already exists';
  end if;
  update public.profiles set role = 'admin' where id = v_uid;
  return 'admin'::public.user_role;
end;
$$;

create or replace function private.admin_set_role(p_user_id uuid, p_role public.user_role)
returns public.user_role
language plpgsql
security definer
set search_path = public
as $$
begin
  if not private.is_admin() then
    raise exception 'Not authorized';
  end if;
  if p_role <> 'admin' then
    if (
      select count(*) from public.profiles where role = 'admin' and id <> p_user_id
    ) = 0 and exists (
      select 1 from public.profiles where id = p_user_id and role = 'admin'
    ) then
      raise exception 'Keep at least one admin';
    end if;
  end if;
  update public.profiles set role = p_role where id = p_user_id;
  if not found then
    raise exception 'User not found';
  end if;
  return p_role;
end;
$$;

create or replace function private.admin_list_users()
returns table (
  id uuid,
  full_name text,
  email text,
  phone text,
  role public.user_role,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not private.is_admin() then
    raise exception 'Not authorized';
  end if;
  return query
  select p.id, p.full_name, u.email::text, p.phone, p.role, p.created_at
  from public.profiles p
  join auth.users u on u.id = p.id
  order by p.created_at desc;
end;
$$;

create or replace function private.admin_overview()
returns table (
  users bigint,
  customers bigint,
  pharmacy_accounts bigint,
  pharmacy_locations bigint,
  orders bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not private.is_admin() then
    raise exception 'Not authorized';
  end if;
  return query
  select
    (select count(*) from public.profiles),
    (select count(*) from public.profiles where role = 'customer'),
    (select count(*) from public.profiles where role = 'pharmacy'),
    (select count(*) from public.pharmacies),
    (select count(*) from public.orders);
end;
$$;

create or replace function public.upsert_my_pharmacy(
  p_name text,
  p_address text,
  p_phone text,
  p_hours text,
  p_prep_minutes int,
  p_lat double precision,
  p_lng double precision
)
returns table (
  id uuid,
  slug text,
  name text,
  address text,
  phone text,
  hours text,
  prep_minutes int,
  lat double precision,
  lng double precision,
  rating numeric
)
language sql
security invoker
set search_path = public, private
as $$
  select * from private.upsert_my_pharmacy(
    p_name, p_address, p_phone, p_hours, p_prep_minutes, p_lat, p_lng
  );
$$;

create or replace function public.my_pharmacy()
returns table (
  id uuid,
  slug text,
  name text,
  address text,
  phone text,
  hours text,
  prep_minutes int,
  lat double precision,
  lng double precision,
  rating numeric
)
language sql
security invoker
set search_path = public, private
as $$
  select * from private.my_pharmacy();
$$;

create or replace function public.list_my_inventory()
returns table (
  slug text,
  name text,
  generic_name text,
  category text,
  dosage text,
  stock_status public.stock_status,
  aidcelix_price numeric,
  currency text
)
language sql
security invoker
set search_path = public, private
as $$
  select * from private.list_my_inventory();
$$;

create or replace function public.set_my_inventory(p_items jsonb)
returns int
language sql
security invoker
set search_path = public, private
as $$
  select private.set_my_inventory(p_items);
$$;

create or replace function public.claim_first_admin()
returns public.user_role
language sql
security invoker
set search_path = public, private
as $$
  select private.claim_first_admin();
$$;

create or replace function public.admin_set_role(p_user_id uuid, p_role public.user_role)
returns public.user_role
language sql
security invoker
set search_path = public, private
as $$
  select private.admin_set_role(p_user_id, p_role);
$$;

create or replace function public.admin_list_users()
returns table (
  id uuid,
  full_name text,
  email text,
  phone text,
  role public.user_role,
  created_at timestamptz
)
language sql
security invoker
set search_path = public, private
as $$
  select * from private.admin_list_users();
$$;

create or replace function public.admin_overview()
returns table (
  users bigint,
  customers bigint,
  pharmacy_accounts bigint,
  pharmacy_locations bigint,
  orders bigint
)
language sql
security invoker
set search_path = public, private
as $$
  select * from private.admin_overview();
$$;

create policy profiles_select_admin on public.profiles
  for select using ((select private.is_admin()));

create policy orders_select_staff on public.orders
  for select using (
    (select private.is_admin())
    or exists (
      select 1
      from public.pharmacy_members m
      where m.pharmacy_id = orders.pharmacy_id
        and m.user_id = (select auth.uid())
    )
  );

create policy order_items_select_staff on public.order_items
  for select using (
    (select private.is_admin())
    or exists (
      select 1
      from public.orders o
      join public.pharmacy_members m on m.pharmacy_id = o.pharmacy_id
      where o.id = order_items.order_id
        and m.user_id = (select auth.uid())
    )
  );

create policy payments_select_staff on public.payments
  for select using (
    (select private.is_admin())
    or exists (
      select 1
      from public.orders o
      join public.pharmacy_members m on m.pharmacy_id = o.pharmacy_id
      where o.id = payments.order_id
        and m.user_id = (select auth.uid())
    )
  );

create policy deliveries_select_staff on public.deliveries
  for select using (
    (select private.is_admin())
    or exists (
      select 1
      from public.orders o
      join public.pharmacy_members m on m.pharmacy_id = o.pharmacy_id
      where o.id = deliveries.order_id
        and m.user_id = (select auth.uid())
    )
  );

grant execute on function private.is_admin() to authenticated;
grant execute on function private.current_role() to authenticated;
grant execute on function private.upsert_my_pharmacy(text, text, text, text, int, double precision, double precision) to authenticated;
grant execute on function private.my_pharmacy() to authenticated;
grant execute on function private.list_my_inventory() to authenticated;
grant execute on function private.set_my_inventory(jsonb) to authenticated;
grant execute on function private.claim_first_admin() to authenticated;
grant execute on function private.admin_set_role(uuid, public.user_role) to authenticated;
grant execute on function private.admin_list_users() to authenticated;
grant execute on function private.admin_overview() to authenticated;

grant execute on function public.upsert_my_pharmacy(text, text, text, text, int, double precision, double precision) to authenticated;
grant execute on function public.my_pharmacy() to authenticated;
grant execute on function public.list_my_inventory() to authenticated;
grant execute on function public.set_my_inventory(jsonb) to authenticated;
grant execute on function public.claim_first_admin() to authenticated;
grant execute on function public.admin_set_role(uuid, public.user_role) to authenticated;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_overview() to authenticated;

revoke execute on function public.upsert_my_pharmacy(text, text, text, text, int, double precision, double precision) from anon, public;
revoke execute on function public.my_pharmacy() from anon, public;
revoke execute on function public.list_my_inventory() from anon, public;
revoke execute on function public.set_my_inventory(jsonb) from anon, public;
revoke execute on function public.claim_first_admin() from anon, public;
revoke execute on function public.admin_set_role(uuid, public.user_role) from anon, public;
revoke execute on function public.admin_list_users() from anon, public;
revoke execute on function public.admin_overview() from anon, public;
