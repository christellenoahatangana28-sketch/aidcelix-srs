-- A short code ties each command to the customer and the pharmacy they chose.

create or replace function private.next_pickup_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  index int;
  attempt int;
begin
  for attempt in 1..12 loop
    code := '';
    for index in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    if not exists (select 1 from public.orders where pickup_code = code) then
      return code;
    end if;
  end loop;
  raise exception 'Could not create a pickup code';
end;
$$;

revoke all on function private.next_pickup_code() from public, anon, authenticated;

alter table public.orders
  add column if not exists pickup_code text,
  add column if not exists customer_name text;

create or replace function private.assign_pickup_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.pickup_code is null or btrim(new.pickup_code) = '' then
    new.pickup_code := private.next_pickup_code();
  end if;
  if new.customer_name is null or btrim(new.customer_name) = '' then
    select full_name into new.customer_name
    from public.profiles
    where id = new.user_id;
  end if;
  new.customer_name := coalesce(nullif(btrim(new.customer_name), ''), 'Customer');
  return new;
end;
$$;

revoke all on function private.assign_pickup_code() from public, anon, authenticated;

drop trigger if exists orders_assign_pickup_code on public.orders;

create trigger orders_assign_pickup_code
  before insert on public.orders
  for each row execute function private.assign_pickup_code();

update public.orders as orders
set customer_name = coalesce(nullif(btrim(profiles.full_name), ''), 'Customer')
from public.profiles
where profiles.id = orders.user_id
  and (orders.customer_name is null or btrim(orders.customer_name) = '');

do $$
declare
  order_row record;
begin
  for order_row in select id from public.orders where pickup_code is null loop
    update public.orders
    set
      pickup_code = private.next_pickup_code(),
      customer_name = coalesce(nullif(btrim(customer_name), ''), 'Customer')
    where id = order_row.id;
  end loop;
end $$;

alter table public.orders
  alter column pickup_code set not null,
  alter column customer_name set not null;

create unique index if not exists orders_pickup_code_key on public.orders (pickup_code);
