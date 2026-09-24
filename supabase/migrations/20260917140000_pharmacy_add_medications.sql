-- Pharmacies add their own medications (name, category, price, stock).
-- Authorization uses public.profiles.role and pharmacy_members, never JWT user_metadata.

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
    inv.stock_status,
    snap.aidcelix_price,
    snap.currency
  from public.pharmacy_inventory inv
  join public.medications med on med.id = inv.medication_id
  left join public.price_snapshots snap on snap.medication_id = med.id
  where inv.pharmacy_id = v_pharmacy_id
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
  v_price numeric;
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
    select med.id into v_med_id
    from public.medications med
    join public.pharmacy_inventory inv
      on inv.medication_id = med.id and inv.pharmacy_id = v_pharmacy_id
    where med.slug = v_item->>'slug';
    if v_med_id is null then
      continue;
    end if;
    v_status := coalesce((v_item->>'stock_status')::public.stock_status, 'out_of_stock');
    insert into public.pharmacy_inventory (pharmacy_id, medication_id, stock_status)
    values (v_pharmacy_id, v_med_id, v_status)
    on conflict (pharmacy_id, medication_id)
    do update set stock_status = excluded.stock_status;

    v_price := nullif(v_item->>'aidcelix_price', '')::numeric;
    if v_price is not null then
      if v_price < 0 then
        raise exception 'Price cannot be negative';
      end if;
      insert into public.price_snapshots (medication_id, medindex_base, aidcelix_price, currency)
      values (v_med_id, v_price, v_price, 'XAF')
      on conflict (medication_id)
      do update set
        medindex_base = excluded.medindex_base,
        aidcelix_price = excluded.aidcelix_price,
        currency = excluded.currency,
        fetched_at = now();
    end if;
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

create or replace function private.upsert_my_medication(
  p_name text,
  p_category text,
  p_price numeric,
  p_in_stock boolean,
  p_generic_name text default null,
  p_dosage text default null,
  p_slug text default null
)
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
set search_path = public, extensions
as $$
declare
  v_uid uuid := (select auth.uid());
  v_role public.user_role;
  v_pharmacy_id uuid;
  v_pharmacy_name text;
  v_med_id uuid;
  v_slug text;
  v_base text;
  v_n int := 1;
  v_name text := trim(p_name);
  v_category text := trim(p_category);
  v_generic text := coalesce(nullif(trim(p_generic_name), ''), v_name);
  v_dosage text := coalesce(nullif(trim(p_dosage), ''), 'As labeled');
  v_status public.stock_status := case when coalesce(p_in_stock, true) then 'in_stock' else 'out_of_stock' end;
  v_price numeric := coalesce(p_price, 0);
  v_image text;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select p.role into v_role from public.profiles p where p.id = v_uid;
  if v_role is null or v_role not in ('pharmacy', 'admin') then
    raise exception 'Only pharmacy accounts can manage stock';
  end if;

  select m.pharmacy_id, ph.name into v_pharmacy_id, v_pharmacy_name
  from public.pharmacy_members m
  join public.pharmacies ph on ph.id = m.pharmacy_id
  where m.user_id = v_uid
  limit 1;

  if v_pharmacy_id is null then
    raise exception 'Save your pharmacy details first';
  end if;

  if v_name is null or v_name = '' or v_category is null or v_category = '' then
    raise exception 'Medication name and category are required';
  end if;

  if v_price <= 0 then
    raise exception 'Enter a price greater than zero';
  end if;

  v_image := case lower(v_category)
    when 'malaria' then '/meds/malaria.svg'
    when 'vitamins' then '/meds/vitamin.svg'
    when 'digestive' then '/meds/ors.svg'
    when 'diabetes' then '/meds/metformin.svg'
    when 'allergy' then '/meds/cetirizine.svg'
    when 'antibiotics' then '/meds/amoxicillin.svg'
    else '/meds/paracetamol.svg'
  end;

  if nullif(trim(p_slug), '') is not null then
    select med.id, med.slug into v_med_id, v_slug
    from public.medications med
    join public.pharmacy_inventory inv
      on inv.medication_id = med.id and inv.pharmacy_id = v_pharmacy_id
    where med.slug = trim(p_slug);
  end if;

  if v_med_id is null then
    v_base := trim(both '-' from lower(regexp_replace(unaccent(v_name), '[^a-zA-Z0-9]+', '-', 'g')));
    if v_base is null or v_base = '' then
      v_base := 'medication';
    end if;
    v_slug := v_base;
    while exists (select 1 from public.medications x where x.slug = v_slug) loop
      v_n := v_n + 1;
      v_slug := v_base || '-' || v_n::text;
    end loop;

    insert into public.medications (
      slug, name, generic_name, brand, category, dosage, manufacturer, image_path
    )
    values (
      v_slug,
      v_name,
      v_generic,
      v_generic,
      v_category,
      v_dosage,
      v_pharmacy_name,
      v_image
    )
    returning medications.id into v_med_id;
  else
    update public.medications
    set
      name = v_name,
      generic_name = v_generic,
      brand = v_generic,
      category = v_category,
      dosage = v_dosage,
      image_path = v_image
    where id = v_med_id;
  end if;

  insert into public.price_snapshots (medication_id, medindex_base, aidcelix_price, currency)
  values (v_med_id, v_price, v_price, 'XAF')
  on conflict (medication_id)
  do update set
    medindex_base = excluded.medindex_base,
    aidcelix_price = excluded.aidcelix_price,
    currency = excluded.currency,
    fetched_at = now();

  insert into public.pharmacy_inventory (pharmacy_id, medication_id, stock_status)
  values (v_pharmacy_id, v_med_id, v_status)
  on conflict (pharmacy_id, medication_id)
  do update set stock_status = excluded.stock_status;

  return query
  select
    med.slug,
    med.name,
    med.generic_name,
    med.category,
    med.dosage,
    inv.stock_status,
    snap.aidcelix_price,
    snap.currency
  from public.medications med
  join public.pharmacy_inventory inv
    on inv.medication_id = med.id and inv.pharmacy_id = v_pharmacy_id
  join public.price_snapshots snap on snap.medication_id = med.id
  where med.id = v_med_id;
end;
$$;

create or replace function public.upsert_my_medication(
  p_name text,
  p_category text,
  p_price numeric,
  p_in_stock boolean,
  p_generic_name text default null,
  p_dosage text default null,
  p_slug text default null
)
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
  select * from private.upsert_my_medication(
    p_name, p_category, p_price, p_in_stock, p_generic_name, p_dosage, p_slug
  );
$$;

grant execute on function private.upsert_my_medication(text, text, numeric, boolean, text, text, text) to authenticated;
grant execute on function public.upsert_my_medication(text, text, numeric, boolean, text, text, text) to authenticated;
revoke execute on function public.upsert_my_medication(text, text, numeric, boolean, text, text, text) from anon, public;
