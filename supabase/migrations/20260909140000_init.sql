-- AIDCELIX Phase 1 schema. Apply with the Supabase CLI or SQL editor.
-- Prices: persist medindex_base privately; expose only aidcelix_price to anon/customer.

create extension if not exists postgis;

create table if not exists public.countries (
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

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone text unique,
  role public.user_role not null default 'customer',
  country_code text not null default 'CM' references public.countries (code)
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  label text,
  line text not null,
  lat double precision,
  lng double precision,
  is_default boolean not null default false
);

create table if not exists public.pharmacies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  phone text,
  hours text,
  rating numeric(2,1) default 4.5,
  prep_minutes int default 15,
  country_code text not null references public.countries (code),
  location geography(point, 4326) not null
);

create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  generic_name text,
  brand text,
  category text,
  dosage text,
  manufacturer text,
  image_path text
);

create table if not exists public.price_snapshots (
  medication_id uuid primary key references public.medications (id) on delete cascade,
  medindex_base numeric(12,2) not null,
  aidcelix_price numeric(12,2) not null,
  currency text not null,
  fetched_at timestamptz not null default now()
);

create table if not exists public.pharmacy_inventory (
  pharmacy_id uuid not null references public.pharmacies (id) on delete cascade,
  medication_id uuid not null references public.medications (id) on delete cascade,
  stock_status public.stock_status not null default 'in_stock',
  primary key (pharmacy_id, medication_id)
);

create table if not exists public.pharmacy_members (
  pharmacy_id uuid not null references public.pharmacies (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (pharmacy_id, user_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  pharmacy_id uuid not null references public.pharmacies (id),
  status public.order_status not null default 'pending_payment',
  med_total numeric(12,2) not null,
  platform_fee numeric(12,2) not null,
  pharmacy_due numeric(12,2) not null,
  delivery_fee numeric(12,2) not null,
  grand_total numeric(12,2) not null,
  currency text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  medication_id uuid not null references public.medications (id),
  quantity int not null,
  aidcelix_unit_price numeric(12,2) not null
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  method text not null,
  amount numeric(12,2) not null,
  collect_to text not null default '674246887',
  provider_ref text,
  status text not null
);

create table if not exists public.deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  provider_ref text,
  status text not null default 'order_received'
);

create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  user_id uuid,
  action text not null,
  created_at timestamptz not null default now()
);

create index if not exists pharmacies_location_gix on public.pharmacies using gist (location);

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

create policy prices_public_select on public.price_snapshots
  for select using (true);

revoke select (medindex_base) on public.price_snapshots from anon, authenticated;

create policy profiles_self on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy addresses_self on public.addresses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy orders_self on public.orders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy order_items_self on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

create policy payments_self on public.payments
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

create policy deliveries_self on public.deliveries
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

insert into public.countries (code, name, currency, locale)
values ('CM', 'Cameroon', 'XAF', 'fr-CM')
on conflict (code) do nothing;
