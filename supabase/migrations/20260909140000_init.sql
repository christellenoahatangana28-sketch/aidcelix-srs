-- AIDCELIX production schema.
-- Customer-facing prices are aidcelix_price only. medindex_base stays private.

create extension if not exists postgis with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists moddatetime with schema extensions;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to postgres, anon, authenticated, service_role;

create table public.countries (
  code text primary key,
  name text not null,
  currency text not null,
  locale text not null default 'fr'
);

create type public.user_role as enum ('customer', 'pharmacy', 'admin');
create type public.stock_status as enum ('in_stock', 'low_stock', 'out_of_stock');
create type public.order_status as enum (
  'pending_payment',
  'paid',
  'notified_gozem',
  'preparing',
  'out_for_delivery',
  'delivered',
  'failed_payment',
  'cancelled'
);
create type public.delivery_status as enum (
  'order_received',
  'driver_assigned',
  'pickup_in_progress',
  'en_route',
  'delivered'
);
create type public.payment_status as enum ('pending', 'succeeded', 'failed');
create type public.payment_method as enum ('orange', 'mtn');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone text unique,
  role public.user_role not null default 'customer',
  country_code text not null default 'CM' references public.countries (code),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  label text not null default 'Home',
  line text not null,
  lat double precision,
  lng double precision,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  constraint addresses_lat_check check (lat is null or lat between -90 and 90),
  constraint addresses_lng_check check (lng is null or lng between -180 and 180)
);

create table public.pharmacies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  address text not null,
  phone text,
  hours text,
  rating numeric(2,1) not null default 4.5 check (rating between 0 and 5),
  prep_minutes int not null default 15 check (prep_minutes >= 0),
  country_code text not null references public.countries (code),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  location geography(point, 4326)
    generated always as (st_setsrid(st_makepoint(lng, lat), 4326)::geography) stored
);

create table public.medications (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  generic_name text not null,
  brand text not null,
  category text not null,
  dosage text not null,
  manufacturer text not null,
  image_path text not null
);

create table public.price_snapshots (
  medication_id uuid primary key references public.medications (id) on delete cascade,
  medindex_base numeric(12,2) not null check (medindex_base >= 0),
  aidcelix_price numeric(12,2) not null check (aidcelix_price >= 0),
  currency text not null,
  fetched_at timestamptz not null default now()
);

create table public.pharmacy_inventory (
  pharmacy_id uuid not null references public.pharmacies (id) on delete cascade,
  medication_id uuid not null references public.medications (id) on delete cascade,
  stock_status public.stock_status not null default 'in_stock',
  updated_at timestamptz not null default now(),
  primary key (pharmacy_id, medication_id)
);

create table public.pharmacy_members (
  pharmacy_id uuid not null references public.pharmacies (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (pharmacy_id, user_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  pharmacy_id uuid not null references public.pharmacies (id),
  status public.order_status not null default 'pending_payment',
  med_total numeric(12,2) not null check (med_total >= 0),
  platform_fee numeric(12,2) not null check (platform_fee >= 0),
  pharmacy_due numeric(12,2) not null check (pharmacy_due >= 0),
  delivery_fee numeric(12,2) not null check (delivery_fee >= 0),
  grand_total numeric(12,2) not null check (grand_total >= 0),
  currency text not null,
  dropoff_label text not null,
  dropoff_lat double precision not null,
  dropoff_lng double precision not null,
  dropoff_contact text not null,
  delivery_distance_km numeric(8,3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  medication_id uuid not null references public.medications (id),
  medication_name text not null,
  quantity int not null check (quantity > 0),
  aidcelix_unit_price numeric(12,2) not null check (aidcelix_unit_price >= 0),
  platform_fee numeric(12,2) not null check (platform_fee >= 0),
  pharmacy_due numeric(12,2) not null check (pharmacy_due >= 0)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  method public.payment_method not null,
  amount numeric(12,2) not null check (amount >= 0),
  collect_to text not null default '674246887',
  provider_ref text,
  status public.payment_status not null,
  created_at timestamptz not null default now()
);

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  provider_ref text,
  status public.delivery_status not null default 'order_received',
  updated_at timestamptz not null default now()
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  user_id uuid,
  action text not null,
  created_at timestamptz not null default now()
);

create index pharmacies_location_gix on public.pharmacies using gist (location);
create index pharmacies_country_code_idx on public.pharmacies (country_code);
create index medications_category_idx on public.medications (category);
create index medications_name_trgm_idx on public.medications using gin (name gin_trgm_ops);
create index medications_generic_trgm_idx on public.medications using gin (generic_name gin_trgm_ops);
create index medications_brand_trgm_idx on public.medications using gin (brand gin_trgm_ops);
create index pharmacy_inventory_medication_id_idx on public.pharmacy_inventory (medication_id);
create index pharmacy_members_user_id_idx on public.pharmacy_members (user_id);
create index addresses_user_id_idx on public.addresses (user_id);
create index orders_user_id_created_at_idx on public.orders (user_id, created_at desc);
create index orders_pharmacy_id_idx on public.orders (pharmacy_id);
create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_medication_id_idx on public.order_items (medication_id);
create index payments_order_id_idx on public.payments (order_id);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function extensions.moddatetime (updated_at);

create trigger orders_updated_at
  before update on public.orders
  for each row execute function extensions.moddatetime (updated_at);

create trigger deliveries_updated_at
  before update on public.deliveries
  for each row execute function extensions.moddatetime (updated_at);

create trigger pharmacy_inventory_updated_at
  before update on public.pharmacy_inventory
  for each row execute function extensions.moddatetime (updated_at);

create view public.medication_prices
with (security_invoker = true) as
select medication_id, aidcelix_price, currency, fetched_at
from public.price_snapshots;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role, country_code)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), 'Customer'),
    nullif(trim(new.raw_user_meta_data->>'phone'), ''),
    'customer',
    coalesce(nullif(trim(new.raw_user_meta_data->>'country_code'), ''), 'CM')
  );

  if nullif(trim(new.raw_user_meta_data->>'address'), '') is not null then
    insert into public.addresses (user_id, label, line, is_default)
    values (new.id, 'Home', trim(new.raw_user_meta_data->>'address'), true);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create or replace function public.stocked_pharmacies_near(
  p_medication_id uuid,
  p_lat double precision default null,
  p_lng double precision default null
)
returns jsonb
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with origin as (
    select case
      when p_lat is null or p_lng is null then null::geography
      else st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography
    end as geog
  ),
  ranked as (
    select
      p.slug,
      p.name,
      p.address,
      p.phone,
      p.hours,
      p.rating,
      p.prep_minutes,
      p.lat,
      p.lng,
      i.stock_status,
      case
        when o.geog is null then 0::double precision
        else st_distance(p.location, o.geog) / 1000.0
      end as distance_km
    from public.pharmacy_inventory i
    join public.pharmacies p on p.id = i.pharmacy_id
    cross join origin o
    where i.medication_id = p_medication_id
      and i.stock_status <> 'out_of_stock'
  ),
  filtered as (
    select *
    from ranked
    where (select geog from origin) is null
       or distance_km <= 10
       or (
         not exists (select 1 from ranked r2 where r2.distance_km <= 10)
         and distance_km <= 25
       )
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', slug,
        'name', name,
        'address', address,
        'phone', phone,
        'hours', hours,
        'rating', rating,
        'prepMinutes', prep_minutes,
        'lat', lat,
        'lng', lng,
        'stockStatus', stock_status,
        'distanceKm', round(distance_km::numeric, 3)
      )
      order by distance_km asc
    ),
    '[]'::jsonb
  )
  from filtered;
$$;

create or replace function public.search_catalog(
  p_query text default '',
  p_lat double precision default null,
  p_lng double precision default null
)
returns table (
  id text,
  name text,
  generic_name text,
  brand text,
  category text,
  dosage text,
  manufacturer text,
  image text,
  aidcelix_price numeric,
  currency text,
  pharmacies jsonb
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    m.slug,
    m.name,
    m.generic_name,
    m.brand,
    m.category,
    m.dosage,
    m.manufacturer,
    m.image_path,
    ps.aidcelix_price,
    ps.currency,
    public.stocked_pharmacies_near(m.id, p_lat, p_lng)
  from public.medications m
  join public.price_snapshots ps on ps.medication_id = m.id
  where nullif(trim(p_query), '') is null
     or extensions.unaccent(lower(m.name)) like '%' || extensions.unaccent(lower(trim(p_query))) || '%'
     or extensions.unaccent(lower(m.generic_name)) like '%' || extensions.unaccent(lower(trim(p_query))) || '%'
     or extensions.unaccent(lower(m.brand)) like '%' || extensions.unaccent(lower(trim(p_query))) || '%'
     or extensions.unaccent(lower(m.category)) like '%' || extensions.unaccent(lower(trim(p_query))) || '%'
  order by m.name;
$$;

create or replace function public.get_medication(
  p_slug text,
  p_lat double precision default null,
  p_lng double precision default null
)
returns table (
  id text,
  name text,
  generic_name text,
  brand text,
  category text,
  dosage text,
  manufacturer text,
  image text,
  aidcelix_price numeric,
  currency text,
  pharmacies jsonb
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    m.slug,
    m.name,
    m.generic_name,
    m.brand,
    m.category,
    m.dosage,
    m.manufacturer,
    m.image_path,
    ps.aidcelix_price,
    ps.currency,
    public.stocked_pharmacies_near(m.id, p_lat, p_lng)
  from public.medications m
  join public.price_snapshots ps on ps.medication_id = m.id
  where m.slug = p_slug;
$$;

create or replace function public.list_nearby_pharmacies(
  p_lat double precision default null,
  p_lng double precision default null,
  p_limit int default 20
)
returns table (
  id text,
  name text,
  address text,
  phone text,
  hours text,
  rating numeric,
  prep_minutes int,
  lat double precision,
  lng double precision,
  distance_km numeric
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    p.slug,
    p.name,
    p.address,
    p.phone,
    p.hours,
    p.rating,
    p.prep_minutes,
    p.lat,
    p.lng,
    round(
      (
        case
          when p_lat is null or p_lng is null then 0
          else st_distance(
            p.location,
            st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography
          ) / 1000.0
        end
      )::numeric,
      3
    ) as distance_km
  from public.pharmacies p
  order by
    case when p_lat is null or p_lng is null then p.name end,
    p.location <-> case
      when p_lat is null or p_lng is null then null
      else st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography
    end
  limit greatest(p_limit, 1);
$$;

create or replace function public.get_pharmacy(
  p_slug text,
  p_lat double precision default null,
  p_lng double precision default null
)
returns table (
  id text,
  name text,
  address text,
  phone text,
  hours text,
  rating numeric,
  prep_minutes int,
  lat double precision,
  lng double precision,
  distance_km numeric
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    p.slug,
    p.name,
    p.address,
    p.phone,
    p.hours,
    p.rating,
    p.prep_minutes,
    p.lat,
    p.lng,
    round(
      (
        case
          when p_lat is null or p_lng is null then 0
          else st_distance(
            p.location,
            st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography
          ) / 1000.0
        end
      )::numeric,
      3
    ) as distance_km
  from public.pharmacies p
  where p.slug = p_slug;
$$;

create or replace function public.list_categories()
returns table (category text)
language sql
stable
security invoker
set search_path = public
as $$
  select distinct m.category
  from public.medications m
  order by 1;
$$;

create or replace function private.place_order(
  p_pharmacy_slug text,
  p_items jsonb,
  p_dropoff_label text,
  p_dropoff_lat double precision,
  p_dropoff_lng double precision,
  p_dropoff_contact text
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_pharmacy public.pharmacies%rowtype;
  v_order_id uuid;
  v_item jsonb;
  v_med public.medications%rowtype;
  v_snap public.price_snapshots%rowtype;
  v_qty int;
  v_med_total numeric(12,2) := 0;
  v_platform_fee numeric(12,2) := 0;
  v_pharmacy_due numeric(12,2) := 0;
  v_weight numeric := 0;
  v_distance numeric;
  v_delivery_fee numeric(12,2);
  v_currency text;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty';
  end if;

  select * into v_pharmacy from public.pharmacies where slug = p_pharmacy_slug;
  if not found then
    raise exception 'Pharmacy not found';
  end if;

  v_distance := st_distance(
    v_pharmacy.location,
    st_setsrid(st_makepoint(p_dropoff_lng, p_dropoff_lat), 4326)::geography
  ) / 1000.0;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    select * into v_med from public.medications where slug = v_item->>'slug';
    if not found then
      raise exception 'Medication % not found', v_item->>'slug';
    end if;

    if not exists (
      select 1
      from public.pharmacy_inventory i
      where i.pharmacy_id = v_pharmacy.id
        and i.medication_id = v_med.id
        and i.stock_status <> 'out_of_stock'
    ) then
      raise exception '% is not in stock at this pharmacy', v_med.name;
    end if;

    select * into v_snap from public.price_snapshots where medication_id = v_med.id;
    if not found then
      raise exception 'No AIDCELIX price for %', v_med.name;
    end if;

    v_qty := greatest(coalesce((v_item->>'quantity')::int, 0), 0);
    if v_qty < 1 then
      raise exception 'Invalid quantity for %', v_med.name;
    end if;

    v_med_total := v_med_total + (v_snap.aidcelix_price * v_qty);
    v_platform_fee := v_platform_fee + ((v_snap.aidcelix_price - v_snap.medindex_base) * v_qty);
    v_pharmacy_due := v_pharmacy_due + (v_snap.medindex_base * v_qty);
    v_weight := v_weight + (v_qty * 0.08);
    v_currency := v_snap.currency;
  end loop;

  v_delivery_fee := round(800 + v_distance * 250 + greatest(v_weight - 0.5, 0) * 200);

  insert into public.orders (
    user_id,
    pharmacy_id,
    status,
    med_total,
    platform_fee,
    pharmacy_due,
    delivery_fee,
    grand_total,
    currency,
    dropoff_label,
    dropoff_lat,
    dropoff_lng,
    dropoff_contact,
    delivery_distance_km
  )
  values (
    v_user_id,
    v_pharmacy.id,
    'pending_payment',
    v_med_total,
    v_platform_fee,
    v_pharmacy_due,
    v_delivery_fee,
    v_med_total + v_delivery_fee,
    coalesce(v_currency, 'XAF'),
    coalesce(nullif(trim(p_dropoff_label), ''), v_pharmacy.address),
    p_dropoff_lat,
    p_dropoff_lng,
    p_dropoff_contact,
    round(v_distance::numeric, 3)
  )
  returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    select * into v_med from public.medications where slug = v_item->>'slug';
    select * into v_snap from public.price_snapshots where medication_id = v_med.id;
    v_qty := (v_item->>'quantity')::int;

    insert into public.order_items (
      order_id,
      medication_id,
      medication_name,
      quantity,
      aidcelix_unit_price,
      platform_fee,
      pharmacy_due
    )
    values (
      v_order_id,
      v_med.id,
      v_med.name,
      v_qty,
      v_snap.aidcelix_price,
      (v_snap.aidcelix_price - v_snap.medindex_base) * v_qty,
      v_snap.medindex_base * v_qty
    );
  end loop;

  insert into public.audit_events (user_id, action)
  values (v_user_id, 'place_order:' || v_order_id);

  return v_order_id;
end;
$$;

create or replace function public.place_order(
  p_pharmacy_slug text,
  p_items jsonb,
  p_dropoff_label text,
  p_dropoff_lat double precision,
  p_dropoff_lng double precision,
  p_dropoff_contact text
)
returns uuid
language sql
security invoker
set search_path = public, private
as $$
  select private.place_order(
    p_pharmacy_slug,
    p_items,
    p_dropoff_label,
    p_dropoff_lat,
    p_dropoff_lng,
    p_dropoff_contact
  );
$$;

create or replace function private.complete_checkout_payment(
  p_order_id uuid,
  p_method public.payment_method,
  p_succeeded boolean,
  p_payment_ref text,
  p_gozem_ref text
)
returns public.order_status
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order public.orders%rowtype;
  v_status public.order_status;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id and user_id = v_user_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if v_order.status not in ('pending_payment', 'failed_payment') then
    raise exception 'Order is not awaiting payment';
  end if;

  insert into public.payments (order_id, method, amount, provider_ref, status)
  values (
    p_order_id,
    p_method,
    v_order.grand_total,
    p_payment_ref,
    case when p_succeeded then 'succeeded'::public.payment_status else 'failed'::public.payment_status end
  );

  if not p_succeeded then
    update public.orders set status = 'failed_payment' where id = p_order_id;
    return 'failed_payment';
  end if;

  insert into public.deliveries (order_id, provider_ref, status)
  values (p_order_id, p_gozem_ref, 'order_received')
  on conflict (order_id) do update
    set provider_ref = excluded.provider_ref,
        status = 'order_received';

  v_status := 'notified_gozem';
  update public.orders set status = v_status where id = p_order_id;

  insert into public.audit_events (user_id, action)
  values (v_user_id, 'payment_succeeded:' || p_order_id);

  return v_status;
end;
$$;

create or replace function public.complete_checkout_payment(
  p_order_id uuid,
  p_method public.payment_method,
  p_succeeded boolean,
  p_payment_ref text,
  p_gozem_ref text
)
returns public.order_status
language sql
security invoker
set search_path = public, private
as $$
  select private.complete_checkout_payment(
    p_order_id,
    p_method,
    p_succeeded,
    p_payment_ref,
    p_gozem_ref
  );
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
    select 1 from public.orders o where o.id = p_order_id and o.user_id = v_user_id
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

  return v_next;
end;
$$;

create or replace function public.advance_delivery(p_order_id uuid)
returns public.delivery_status
language sql
security invoker
set search_path = public, private
as $$
  select private.advance_delivery(p_order_id);
$$;

alter table public.countries enable row level security;
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.pharmacies enable row level security;
alter table public.medications enable row level security;
alter table public.price_snapshots enable row level security;
alter table public.pharmacy_inventory enable row level security;
alter table public.pharmacy_members enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.deliveries enable row level security;
alter table public.audit_events enable row level security;

create policy countries_read on public.countries for select using (true);
create policy pharmacies_read on public.pharmacies for select using (true);
create policy medications_read on public.medications for select using (true);
create policy inventory_read on public.pharmacy_inventory for select using (true);
create policy prices_public_select on public.price_snapshots for select using (true);

create policy profiles_select_self on public.profiles
  for select using (auth.uid() = id);
create policy profiles_update_self on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy addresses_select_self on public.addresses
  for select using (auth.uid() = user_id);
create policy addresses_insert_self on public.addresses
  for insert with check (auth.uid() = user_id);
create policy addresses_update_self on public.addresses
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy addresses_delete_self on public.addresses
  for delete using (auth.uid() = user_id);

create policy pharmacy_members_select_self on public.pharmacy_members
  for select using (auth.uid() = user_id);

create policy orders_select_self on public.orders
  for select using (auth.uid() = user_id);

create policy order_items_select_self on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

create policy payments_select_self on public.payments
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

create policy deliveries_select_self on public.deliveries
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

grant usage on schema public to anon, authenticated, service_role;

grant select on public.countries, public.pharmacies, public.medications, public.pharmacy_inventory, public.medication_prices to anon, authenticated;
grant select (medication_id, aidcelix_price, currency, fetched_at) on public.price_snapshots to anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.addresses to authenticated;
grant select on public.pharmacy_members to authenticated;
grant select on public.orders, public.order_items, public.payments, public.deliveries to authenticated;

revoke update (role) on public.profiles from authenticated;
revoke select (medindex_base) on public.price_snapshots from anon, authenticated;

grant execute on function public.stocked_pharmacies_near(uuid, double precision, double precision) to anon, authenticated;
grant execute on function public.search_catalog(text, double precision, double precision) to anon, authenticated;
grant execute on function public.get_medication(text, double precision, double precision) to anon, authenticated;
grant execute on function public.list_nearby_pharmacies(double precision, double precision, int) to anon, authenticated;
grant execute on function public.get_pharmacy(text, double precision, double precision) to anon, authenticated;
grant execute on function public.list_categories() to anon, authenticated;

grant execute on function private.place_order(text, jsonb, text, double precision, double precision, text) to authenticated;
grant execute on function public.place_order(text, jsonb, text, double precision, double precision, text) to authenticated;
grant execute on function private.complete_checkout_payment(uuid, public.payment_method, boolean, text, text) to authenticated;
grant execute on function public.complete_checkout_payment(uuid, public.payment_method, boolean, text, text) to authenticated;
grant execute on function private.advance_delivery(uuid) to authenticated;
grant execute on function public.advance_delivery(uuid) to authenticated;

revoke execute on function public.place_order(text, jsonb, text, double precision, double precision, text) from anon, public;
revoke execute on function public.complete_checkout_payment(uuid, public.payment_method, boolean, text, text) from anon, public;
revoke execute on function public.advance_delivery(uuid) from anon, public;

insert into public.countries (code, name, currency, locale)
values ('CM', 'Cameroon', 'XAF', 'fr-CM')
on conflict (code) do nothing;
