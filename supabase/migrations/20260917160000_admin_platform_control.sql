-- Admin control center: platform metrics, pharmacy assignment, order ops, prices, activity.

drop function if exists public.admin_overview();
drop function if exists private.admin_overview();

create or replace function private.admin_overview()
returns table (
  users bigint,
  customers bigint,
  pharmacy_accounts bigint,
  pharmacy_locations bigint,
  medications bigint,
  orders bigint,
  open_orders bigint,
  pending_payment bigint,
  active_deliveries bigint,
  delivered_orders bigint,
  cancelled_orders bigint,
  failed_payments bigint,
  gmv numeric
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
  select * from (
    select
      (select count(*) from public.profiles)::bigint,
      (select count(*) from public.profiles where role = 'customer')::bigint,
      (select count(*) from public.profiles where role = 'pharmacy')::bigint,
      (select count(*) from public.pharmacies)::bigint,
      (select count(*) from public.medications)::bigint,
      (select count(*) from public.orders)::bigint,
      (select count(*) from public.orders
        where status not in ('delivered', 'cancelled', 'failed_payment'))::bigint,
      (select count(*) from public.orders where status = 'pending_payment')::bigint,
      (select count(*) from public.orders
        where status in ('notified_gozem', 'preparing', 'out_for_delivery', 'paid'))::bigint,
      (select count(*) from public.orders where status = 'delivered')::bigint,
      (select count(*) from public.orders where status = 'cancelled')::bigint,
      (select count(*) from public.orders where status = 'failed_payment')::bigint,
      coalesce((
        select sum(grand_total) from public.orders
        where status not in ('pending_payment', 'failed_payment', 'cancelled')
      ), 0)::numeric
  ) as stats(
    users, customers, pharmacy_accounts, pharmacy_locations, medications, orders,
    open_orders, pending_payment, active_deliveries, delivered_orders,
    cancelled_orders, failed_payments, gmv
  );
end;
$$;

create or replace function public.admin_overview()
returns table (
  users bigint,
  customers bigint,
  pharmacy_accounts bigint,
  pharmacy_locations bigint,
  medications bigint,
  orders bigint,
  open_orders bigint,
  pending_payment bigint,
  active_deliveries bigint,
  delivered_orders bigint,
  cancelled_orders bigint,
  failed_payments bigint,
  gmv numeric
)
language sql
security invoker
set search_path = public, private
as $$
  select * from private.admin_overview();
$$;

create or replace function private.admin_list_pharmacies()
returns table (
  id uuid,
  slug text,
  name text,
  address text,
  phone text,
  hours text,
  prep_minutes int,
  rating numeric,
  owner_id uuid,
  owner_name text,
  owner_email text,
  member_count bigint,
  stocked_items bigint,
  order_count bigint
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
  select
    p.id,
    p.slug,
    p.name,
    p.address,
    p.phone,
    p.hours,
    p.prep_minutes,
    p.rating,
    own.user_id,
    pr.full_name,
    u.email::text,
    coalesce(mc.member_count, 0),
    coalesce(sc.stocked_items, 0),
    coalesce(oc.order_count, 0)
  from public.pharmacies p
  left join lateral (
    select m.user_id
    from public.pharmacy_members m
    where m.pharmacy_id = p.id
    order by m.user_id
    limit 1
  ) own on true
  left join public.profiles pr on pr.id = own.user_id
  left join auth.users u on u.id = own.user_id
  left join (
    select pharmacy_id, count(*)::bigint as member_count
    from public.pharmacy_members
    group by pharmacy_id
  ) mc on mc.pharmacy_id = p.id
  left join (
    select pharmacy_id, count(*)::bigint as stocked_items
    from public.pharmacy_inventory
    where stock_status in ('in_stock', 'low_stock')
    group by pharmacy_id
  ) sc on sc.pharmacy_id = p.id
  left join (
    select pharmacy_id, count(*)::bigint as order_count
    from public.orders
    group by pharmacy_id
  ) oc on oc.pharmacy_id = p.id
  order by p.name;
end;
$$;

create or replace function public.admin_list_pharmacies()
returns table (
  id uuid,
  slug text,
  name text,
  address text,
  phone text,
  hours text,
  prep_minutes int,
  rating numeric,
  owner_id uuid,
  owner_name text,
  owner_email text,
  member_count bigint,
  stocked_items bigint,
  order_count bigint
)
language sql
security invoker
set search_path = public, private
as $$
  select * from private.admin_list_pharmacies();
$$;

create or replace function private.admin_assign_pharmacy(p_pharmacy_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
begin
  if not private.is_admin() then
    raise exception 'Not authorized';
  end if;
  if not exists (select 1 from public.pharmacies where id = p_pharmacy_id) then
    raise exception 'Pharmacy not found';
  end if;
  select role into v_role from public.profiles where id = p_user_id;
  if v_role is null then
    raise exception 'User not found';
  end if;

  delete from public.pharmacy_members where user_id = p_user_id;
  insert into public.pharmacy_members (pharmacy_id, user_id)
  values (p_pharmacy_id, p_user_id)
  on conflict do nothing;

  if v_role = 'customer' then
    update public.profiles set role = 'pharmacy' where id = p_user_id;
  end if;

  insert into public.audit_events (user_id, action)
  values ((select auth.uid()), 'admin_assign_pharmacy:' || p_pharmacy_id || ':' || p_user_id);
end;
$$;

create or replace function public.admin_assign_pharmacy(p_pharmacy_id uuid, p_user_id uuid)
returns void
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  perform private.admin_assign_pharmacy(p_pharmacy_id, p_user_id);
end;
$$;

create or replace function private.admin_update_pharmacy(
  p_pharmacy_id uuid,
  p_name text,
  p_address text,
  p_phone text,
  p_hours text,
  p_prep_minutes int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not private.is_admin() then
    raise exception 'Not authorized';
  end if;
  if nullif(trim(p_name), '') is null or nullif(trim(p_address), '') is null then
    raise exception 'Pharmacy name and address are required';
  end if;
  update public.pharmacies
  set
    name = trim(p_name),
    address = trim(p_address),
    phone = nullif(trim(p_phone), ''),
    hours = nullif(trim(p_hours), ''),
    prep_minutes = greatest(coalesce(p_prep_minutes, 15), 0)
  where id = p_pharmacy_id;
  if not found then
    raise exception 'Pharmacy not found';
  end if;
  insert into public.audit_events (user_id, action)
  values ((select auth.uid()), 'admin_update_pharmacy:' || p_pharmacy_id);
end;
$$;

create or replace function public.admin_update_pharmacy(
  p_pharmacy_id uuid,
  p_name text,
  p_address text,
  p_phone text,
  p_hours text,
  p_prep_minutes int
)
returns void
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  perform private.admin_update_pharmacy(
    p_pharmacy_id, p_name, p_address, p_phone, p_hours, p_prep_minutes
  );
end;
$$;

create or replace function private.admin_cancel_order(p_order_id uuid)
returns public.order_status
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.order_status;
begin
  if not private.is_admin() then
    raise exception 'Not authorized';
  end if;
  select status into v_status from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found';
  end if;
  if v_status in ('delivered', 'cancelled') then
    raise exception 'Order cannot be cancelled';
  end if;
  update public.orders set status = 'cancelled' where id = p_order_id;
  insert into public.audit_events (user_id, action)
  values ((select auth.uid()), 'admin_cancel_order:' || p_order_id);
  return 'cancelled'::public.order_status;
end;
$$;

create or replace function public.admin_cancel_order(p_order_id uuid)
returns public.order_status
language sql
security invoker
set search_path = public, private
as $$
  select private.admin_cancel_order(p_order_id);
$$;

create or replace function private.advance_delivery(p_order_id uuid)
returns public.delivery_status
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_current public.delivery_status;
  v_next public.delivery_status;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from public.orders o
    where o.id = p_order_id
      and (
        o.user_id = v_user_id
        or private.is_admin()
        or exists (
          select 1
          from public.pharmacy_members m
          where m.pharmacy_id = o.pharmacy_id
            and m.user_id = v_user_id
        )
      )
  ) then
    raise exception 'Order not found';
  end if;

  select status into v_current from public.deliveries where order_id = p_order_id;
  if not found then
    raise exception 'Delivery not found';
  end if;

  v_next := case v_current
    when 'order_received' then 'driver_assigned'
    when 'driver_assigned' then 'pickup_in_progress'
    when 'pickup_in_progress' then 'en_route'
    when 'en_route' then 'delivered'
    else 'delivered'
  end;

  update public.deliveries set status = v_next where order_id = p_order_id;
  update public.orders
  set status = case v_next
    when 'delivered' then 'delivered'::public.order_status
    when 'en_route' then 'out_for_delivery'::public.order_status
    else 'preparing'::public.order_status
  end
  where id = p_order_id;

  insert into public.audit_events (user_id, action)
  values (v_user_id, 'advance_delivery:' || p_order_id || ':' || v_next);

  return v_next;
end;
$$;

create or replace function private.admin_set_price(p_medication_id uuid, p_price numeric)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
begin
  if not private.is_admin() then
    raise exception 'Not authorized';
  end if;
  if p_price is null or p_price <= 0 then
    raise exception 'Price must be greater than zero';
  end if;
  update public.price_snapshots
  set aidcelix_price = p_price, fetched_at = now()
  where medication_id = p_medication_id;
  if not found then
    raise exception 'Price not found';
  end if;
  insert into public.audit_events (user_id, action)
  values ((select auth.uid()), 'admin_set_price:' || p_medication_id);
  return p_price;
end;
$$;

create or replace function public.admin_set_price(p_medication_id uuid, p_price numeric)
returns numeric
language sql
security invoker
set search_path = public, private
as $$
  select private.admin_set_price(p_medication_id, p_price);
$$;

create or replace function private.admin_list_activity()
returns table (
  id bigint,
  actor_name text,
  action text,
  created_at timestamptz
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
  select e.id, coalesce(p.full_name, 'System'), e.action, e.created_at
  from public.audit_events e
  left join public.profiles p on p.id = e.user_id
  order by e.created_at desc
  limit 80;
end;
$$;

create or replace function public.admin_list_activity()
returns table (
  id bigint,
  actor_name text,
  action text,
  created_at timestamptz
)
language sql
security invoker
set search_path = public, private
as $$
  select * from private.admin_list_activity();
$$;

drop policy if exists audit_select_admin on public.audit_events;
create policy audit_select_admin on public.audit_events
  for select using ((select private.is_admin()));

grant execute on function private.admin_overview() to authenticated;
grant execute on function private.admin_list_pharmacies() to authenticated;
grant execute on function private.admin_assign_pharmacy(uuid, uuid) to authenticated;
grant execute on function private.admin_update_pharmacy(uuid, text, text, text, text, int) to authenticated;
grant execute on function private.admin_cancel_order(uuid) to authenticated;
grant execute on function private.admin_set_price(uuid, numeric) to authenticated;
grant execute on function private.admin_list_activity() to authenticated;

grant execute on function public.admin_overview() to authenticated;
grant execute on function public.admin_list_pharmacies() to authenticated;
grant execute on function public.admin_assign_pharmacy(uuid, uuid) to authenticated;
grant execute on function public.admin_update_pharmacy(uuid, text, text, text, text, int) to authenticated;
grant execute on function public.admin_cancel_order(uuid) to authenticated;
grant execute on function public.admin_set_price(uuid, numeric) to authenticated;
grant execute on function public.admin_list_activity() to authenticated;

revoke execute on function public.admin_overview() from anon, public;
revoke execute on function public.admin_list_pharmacies() from anon, public;
revoke execute on function public.admin_assign_pharmacy(uuid, uuid) from anon, public;
revoke execute on function public.admin_update_pharmacy(uuid, text, text, text, text, int) from anon, public;
revoke execute on function public.admin_cancel_order(uuid) from anon, public;
revoke execute on function public.admin_set_price(uuid, numeric) from anon, public;
revoke execute on function public.admin_list_activity() from anon, public;
