drop policy if exists profiles_select_self on public.profiles;
drop policy if exists profiles_select_admin on public.profiles;
create policy profiles_select_visible on public.profiles
  for select using (
    id = (select auth.uid())
    or (select private.is_admin())
  );

drop policy if exists orders_select_self on public.orders;
drop policy if exists orders_select_staff on public.orders;
create policy orders_select_visible on public.orders
  for select using (
    user_id = (select auth.uid())
    or (select private.is_admin())
    or exists (
      select 1 from public.pharmacy_members m
      where m.pharmacy_id = orders.pharmacy_id
        and m.user_id = (select auth.uid())
    )
  );

drop policy if exists order_items_select_self on public.order_items;
drop policy if exists order_items_select_staff on public.order_items;
create policy order_items_select_visible on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.user_id = (select auth.uid())
    )
    or (select private.is_admin())
    or exists (
      select 1
      from public.orders o
      join public.pharmacy_members m on m.pharmacy_id = o.pharmacy_id
      where o.id = order_items.order_id
        and m.user_id = (select auth.uid())
    )
  );

drop policy if exists payments_select_self on public.payments;
drop policy if exists payments_select_staff on public.payments;
create policy payments_select_visible on public.payments
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = payments.order_id
        and o.user_id = (select auth.uid())
    )
    or (select private.is_admin())
    or exists (
      select 1
      from public.orders o
      join public.pharmacy_members m on m.pharmacy_id = o.pharmacy_id
      where o.id = payments.order_id
        and m.user_id = (select auth.uid())
    )
  );

drop policy if exists deliveries_select_self on public.deliveries;
drop policy if exists deliveries_select_staff on public.deliveries;
create policy deliveries_select_visible on public.deliveries
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = deliveries.order_id
        and o.user_id = (select auth.uid())
    )
    or (select private.is_admin())
    or exists (
      select 1
      from public.orders o
      join public.pharmacy_members m on m.pharmacy_id = o.pharmacy_id
      where o.id = deliveries.order_id
        and m.user_id = (select auth.uid())
    )
  );
