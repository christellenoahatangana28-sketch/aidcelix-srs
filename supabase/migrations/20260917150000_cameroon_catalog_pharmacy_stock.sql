-- National Cameroon medication catalog for pharmacy stock selection.
-- Pharmacies offer catalog items and set in_stock / low_stock / out_of_stock.

insert into public.medications (
  slug, name, generic_name, brand, category, dosage, manufacturer, image_path
)
select
  v.slug,
  v.name,
  v.generic_name,
  v.brand,
  v.category,
  v.dosage,
  v.manufacturer,
  v.image_path
from (
  values
    ('paracetamol-500', 'Paracetamol 500 mg', 'Paracetamol', 'Doliprane', 'Pain relief', '500 mg × 20 tablets', 'Cameroon catalog', '/meds/paracetamol.svg'),
    ('paracetamol-syrup', 'Paracetamol syrup', 'Paracetamol', 'Doliprane', 'Pain relief', '120 mg/5 ml × 100 ml', 'Cameroon catalog', '/meds/paracetamol.svg'),
    ('ibuprofen-400', 'Ibuprofen 400 mg', 'Ibuprofen', 'Ibuprofen', 'Pain relief', '400 mg × 20 tablets', 'Cameroon catalog', '/meds/ibuprofen.svg'),
    ('aspirin-500', 'Aspirin 500 mg', 'Acetylsalicylic acid', 'Aspirin', 'Pain relief', '500 mg × 20 tablets', 'Cameroon catalog', '/meds/aspirin.svg'),
    ('diclofenac-50', 'Diclofenac 50 mg', 'Diclofenac', 'Voltaren', 'Pain relief', '50 mg × 20 tablets', 'Cameroon catalog', '/meds/ibuprofen.svg'),
    ('tramadol-50', 'Tramadol 50 mg', 'Tramadol', 'Tramadol', 'Pain relief', '50 mg × 10 capsules', 'Cameroon catalog', '/meds/paracetamol.svg'),
    ('amoxicillin-500', 'Amoxicillin 500 mg', 'Amoxicillin', 'Amoxil', 'Antibiotics', '500 mg × 16 capsules', 'Cameroon catalog', '/meds/amoxicillin.svg'),
    ('amoxicillin-syrup', 'Amoxicillin syrup', 'Amoxicillin', 'Amoxil', 'Antibiotics', '250 mg/5 ml × 100 ml', 'Cameroon catalog', '/meds/amoxicillin.svg'),
    ('amoxicillin-clavulanate', 'Amoxicillin-clavulanate 1 g', 'Amoxicillin + clavulanic acid', 'Augmentin', 'Antibiotics', '1 g × 12 tablets', 'Cameroon catalog', '/meds/amoxicillin.svg'),
    ('azithromycin-500', 'Azithromycin 500 mg', 'Azithromycin', 'Zithromax', 'Antibiotics', '500 mg × 3 tablets', 'Cameroon catalog', '/meds/azithromycin.svg'),
    ('ciprofloxacin-500', 'Ciprofloxacin 500 mg', 'Ciprofloxacin', 'Cipro', 'Antibiotics', '500 mg × 10 tablets', 'Cameroon catalog', '/meds/amoxicillin.svg'),
    ('metronidazole-500', 'Metronidazole 500 mg', 'Metronidazole', 'Flagyl', 'Antibiotics', '500 mg × 20 tablets', 'Cameroon catalog', '/meds/amoxicillin.svg'),
    ('doxycycline-100', 'Doxycycline 100 mg', 'Doxycycline', 'Doxycycline', 'Antibiotics', '100 mg × 10 capsules', 'Cameroon catalog', '/meds/azithromycin.svg'),
    ('cloxacillin-500', 'Cloxacillin 500 mg', 'Cloxacillin', 'Cloxacillin', 'Antibiotics', '500 mg × 16 capsules', 'Cameroon catalog', '/meds/amoxicillin.svg'),
    ('cotrimoxazole-480', 'Co-trimoxazole 480 mg', 'Sulfamethoxazole + trimethoprim', 'Bactrim', 'Antibiotics', '480 mg × 20 tablets', 'Cameroon catalog', '/meds/amoxicillin.svg'),
    ('cefixime-200', 'Cefixime 200 mg', 'Cefixime', 'Cefixime', 'Antibiotics', '200 mg × 10 tablets', 'Cameroon catalog', '/meds/azithromycin.svg'),
    ('coartem', 'Coartem', 'Artemether + lumefantrine', 'Coartem', 'Malaria', '20/120 mg × 24 tablets', 'Cameroon catalog', '/meds/malaria.svg'),
    ('artesunate-50', 'Artesunate 50 mg', 'Artesunate', 'Artesunate', 'Malaria', '50 mg × 12 tablets', 'Cameroon catalog', '/meds/malaria.svg'),
    ('amodiaquine-153', 'Amodiaquine 153 mg', 'Amodiaquine', 'Amodiaquine', 'Malaria', '153 mg × 12 tablets', 'Cameroon catalog', '/meds/malaria.svg'),
    ('quinine-300', 'Quinine 300 mg', 'Quinine', 'Quinine', 'Malaria', '300 mg × 10 tablets', 'Cameroon catalog', '/meds/malaria.svg'),
    ('sp-fansidar', 'Sulfadoxine-pyrimethamine', 'Sulfadoxine + pyrimethamine', 'Fansidar', 'Malaria', '500/25 mg × 3 tablets', 'Cameroon catalog', '/meds/malaria.svg'),
    ('asaq', 'Artesunate-amodiaquine', 'Artesunate + amodiaquine', 'ASAQ', 'Malaria', 'Adult pack', 'Cameroon catalog', '/meds/malaria.svg'),
    ('ors', 'Oral rehydration salts', 'ORS', 'ORS', 'Digestive', 'WHO sachet × 10', 'Cameroon catalog', '/meds/ors.svg'),
    ('omeprazole-20', 'Omeprazole 20 mg', 'Omeprazole', 'Omeprazole', 'Digestive', '20 mg × 14 capsules', 'Cameroon catalog', '/meds/omeprazole.svg'),
    ('loperamide-2', 'Loperamide 2 mg', 'Loperamide', 'Imodium', 'Digestive', '2 mg × 10 capsules', 'Cameroon catalog', '/meds/ors.svg'),
    ('metoclopramide-10', 'Metoclopramide 10 mg', 'Metoclopramide', 'Primperan', 'Digestive', '10 mg × 20 tablets', 'Cameroon catalog', '/meds/omeprazole.svg'),
    ('albendazole-400', 'Albendazole 400 mg', 'Albendazole', 'Zentel', 'Digestive', '400 mg × 1 tablet', 'Cameroon catalog', '/meds/ors.svg'),
    ('mebendazole-100', 'Mebendazole 100 mg', 'Mebendazole', 'Vermox', 'Digestive', '100 mg × 6 tablets', 'Cameroon catalog', '/meds/ors.svg'),
    ('hyoscine-10', 'Hyoscine butylbromide 10 mg', 'Hyoscine butylbromide', 'Buscopan', 'Digestive', '10 mg × 20 tablets', 'Cameroon catalog', '/meds/omeprazole.svg'),
    ('domperidone-10', 'Domperidone 10 mg', 'Domperidone', 'Motilium', 'Digestive', '10 mg × 20 tablets', 'Cameroon catalog', '/meds/omeprazole.svg'),
    ('cetirizine-10', 'Cetirizine 10 mg', 'Cetirizine', 'Zyrtec', 'Allergy', '10 mg × 10 tablets', 'Cameroon catalog', '/meds/cetirizine.svg'),
    ('loratadine-10', 'Loratadine 10 mg', 'Loratadine', 'Clarityne', 'Allergy', '10 mg × 10 tablets', 'Cameroon catalog', '/meds/cetirizine.svg'),
    ('chlorpheniramine-4', 'Chlorpheniramine 4 mg', 'Chlorpheniramine', 'Piriton', 'Allergy', '4 mg × 20 tablets', 'Cameroon catalog', '/meds/cetirizine.svg'),
    ('prednisolone-5', 'Prednisolone 5 mg', 'Prednisolone', 'Prednisolone', 'Allergy', '5 mg × 20 tablets', 'Cameroon catalog', '/meds/cetirizine.svg'),
    ('dexamethasone-05', 'Dexamethasone 0.5 mg', 'Dexamethasone', 'Dexamethasone', 'Allergy', '0.5 mg × 20 tablets', 'Cameroon catalog', '/meds/cetirizine.svg'),
    ('metformin-500', 'Metformin 500 mg', 'Metformin', 'Glucophage', 'Diabetes', '500 mg × 30 tablets', 'Cameroon catalog', '/meds/metformin.svg'),
    ('glibenclamide-5', 'Glibenclamide 5 mg', 'Glibenclamide', 'Daonil', 'Diabetes', '5 mg × 30 tablets', 'Cameroon catalog', '/meds/metformin.svg'),
    ('gliclazide-80', 'Gliclazide 80 mg', 'Gliclazide', 'Diamicron', 'Diabetes', '80 mg × 30 tablets', 'Cameroon catalog', '/meds/metformin.svg'),
    ('insulin-nph', 'Insulin NPH', 'Insulin isophane', 'Insulatard', 'Diabetes', '100 IU/ml vial', 'Cameroon catalog', '/meds/metformin.svg'),
    ('vitamin-c-500', 'Vitamin C 500 mg', 'Ascorbic acid', 'Vitamin C', 'Vitamins', '500 mg × 20 tablets', 'Cameroon catalog', '/meds/vitamin.svg'),
    ('folic-acid-5', 'Folic acid 5 mg', 'Folic acid', 'Folic acid', 'Vitamins', '5 mg × 30 tablets', 'Cameroon catalog', '/meds/vitamin.svg'),
    ('ferrous-sulfate', 'Ferrous sulfate', 'Ferrous sulfate', 'Tardyferon', 'Vitamins', '80 mg × 30 tablets', 'Cameroon catalog', '/meds/vitamin.svg'),
    ('multivitamin', 'Multivitamin', 'Multivitamins', 'Supradyn', 'Vitamins', '30 tablets', 'Cameroon catalog', '/meds/vitamin.svg'),
    ('vitamin-b-complex', 'Vitamin B complex', 'Vitamin B complex', 'Becozym', 'Vitamins', '20 tablets', 'Cameroon catalog', '/meds/vitamin.svg'),
    ('zinc-sulfate-20', 'Zinc sulfate 20 mg', 'Zinc sulfate', 'Zinc', 'Vitamins', '20 mg × 10 tablets', 'Cameroon catalog', '/meds/vitamin.svg'),
    ('salbutamol-4', 'Salbutamol 4 mg', 'Salbutamol', 'Ventolin', 'Cough and cold', '4 mg × 20 tablets', 'Cameroon catalog', '/meds/paracetamol.svg'),
    ('salbutamol-inhaler', 'Salbutamol inhaler', 'Salbutamol', 'Ventolin', 'Cough and cold', '100 mcg inhaler', 'Cameroon catalog', '/meds/paracetamol.svg'),
    ('ambroxol', 'Ambroxol', 'Ambroxol', 'Mucosolvan', 'Cough and cold', '30 mg × 20 tablets', 'Cameroon catalog', '/meds/paracetamol.svg'),
    ('acetylcysteine-200', 'Acetylcysteine 200 mg', 'Acetylcysteine', 'Fluimucil', 'Cough and cold', '200 mg × 20 sachets', 'Cameroon catalog', '/meds/paracetamol.svg'),
    ('cold-combo', 'Paracetamol cold combo', 'Paracetamol + chlorpheniramine', 'Fervex', 'Cough and cold', '8 sachets', 'Cameroon catalog', '/meds/paracetamol.svg'),
    ('clotrimazole-cream', 'Clotrimazole cream', 'Clotrimazole', 'Canesten', 'Skin care', '1% 20 g tube', 'Cameroon catalog', '/meds/cetirizine.svg'),
    ('hydrocortisone-cream', 'Hydrocortisone cream', 'Hydrocortisone', 'Hydrocortisone', 'Skin care', '1% 15 g tube', 'Cameroon catalog', '/meds/cetirizine.svg'),
    ('benzyl-benzoate', 'Benzyl benzoate lotion', 'Benzyl benzoate', 'Ascabiol', 'Skin care', '25% 100 ml', 'Cameroon catalog', '/meds/cetirizine.svg'),
    ('calamine-lotion', 'Calamine lotion', 'Calamine', 'Calamine', 'Skin care', '100 ml', 'Cameroon catalog', '/meds/cetirizine.svg'),
    ('povidone-iodine', 'Povidone iodine', 'Povidone iodine', 'Betadine', 'Skin care', '10% 125 ml', 'Cameroon catalog', '/meds/cetirizine.svg'),
    ('amlodipine-5', 'Amlodipine 5 mg', 'Amlodipine', 'Amlor', 'Other', '5 mg × 30 tablets', 'Cameroon catalog', '/meds/paracetamol.svg'),
    ('captopril-25', 'Captopril 25 mg', 'Captopril', 'Captopril', 'Other', '25 mg × 30 tablets', 'Cameroon catalog', '/meds/paracetamol.svg'),
    ('hctz-25', 'Hydrochlorothiazide 25 mg', 'Hydrochlorothiazide', 'Esidrex', 'Other', '25 mg × 30 tablets', 'Cameroon catalog', '/meds/paracetamol.svg'),
    ('furosemide-40', 'Furosemide 40 mg', 'Furosemide', 'Lasilix', 'Other', '40 mg × 20 tablets', 'Cameroon catalog', '/meds/paracetamol.svg'),
    ('nifedipine-20', 'Nifedipine 20 mg', 'Nifedipine', 'Adalat', 'Other', '20 mg × 30 tablets', 'Cameroon catalog', '/meds/paracetamol.svg'),
    ('atorvastatin-20', 'Atorvastatin 20 mg', 'Atorvastatin', 'Tahor', 'Other', '20 mg × 30 tablets', 'Cameroon catalog', '/meds/paracetamol.svg'),
    ('fluconazole-150', 'Fluconazole 150 mg', 'Fluconazole', 'Diflucan', 'Other', '150 mg × 1 capsule', 'Cameroon catalog', '/meds/amoxicillin.svg'),
    ('paracetamol-codeine', 'Paracetamol + codeine', 'Paracetamol + codeine', 'Dafalgan Codeine', 'Pain relief', '500/30 mg × 16 tablets', 'Cameroon catalog', '/meds/paracetamol.svg'),
    ('nystatin-oral', 'Nystatin oral suspension', 'Nystatin', 'Mycostatin', 'Other', '100 000 IU/ml × 30 ml', 'Cameroon catalog', '/meds/amoxicillin.svg'),
    ('ors-zinc-pack', 'ORS + zinc pack', 'ORS + zinc', 'ORS Zinc', 'Digestive', '4 sachets + 10 zinc tablets', 'Cameroon catalog', '/meds/ors.svg')
) as v(slug, name, generic_name, brand, category, dosage, manufacturer, image_path)
on conflict (slug) do nothing;

insert into public.price_snapshots (medication_id, medindex_base, aidcelix_price, currency)
select med.id, p.price, p.price, 'XAF'
from (
  values
    ('paracetamol-500', 800),
    ('paracetamol-syrup', 1500),
    ('ibuprofen-400', 1200),
    ('aspirin-500', 700),
    ('diclofenac-50', 1500),
    ('tramadol-50', 2500),
    ('amoxicillin-500', 2200),
    ('amoxicillin-syrup', 2800),
    ('amoxicillin-clavulanate', 6500),
    ('azithromycin-500', 4500),
    ('ciprofloxacin-500', 2800),
    ('metronidazole-500', 1800),
    ('doxycycline-100', 2400),
    ('cloxacillin-500', 2600),
    ('cotrimoxazole-480', 1500),
    ('cefixime-200', 5200),
    ('coartem', 3500),
    ('artesunate-50', 4000),
    ('amodiaquine-153', 1800),
    ('quinine-300', 2200),
    ('sp-fansidar', 1200),
    ('asaq', 2800),
    ('ors', 500),
    ('omeprazole-20', 2500),
    ('loperamide-2', 900),
    ('metoclopramide-10', 1400),
    ('albendazole-400', 700),
    ('mebendazole-100', 800),
    ('hyoscine-10', 2100),
    ('domperidone-10', 1800),
    ('cetirizine-10', 1500),
    ('loratadine-10', 1600),
    ('chlorpheniramine-4', 600),
    ('prednisolone-5', 1200),
    ('dexamethasone-05', 1100),
    ('metformin-500', 2500),
    ('glibenclamide-5', 1800),
    ('gliclazide-80', 3200),
    ('insulin-nph', 8500),
    ('vitamin-c-500', 1000),
    ('folic-acid-5', 800),
    ('ferrous-sulfate', 1800),
    ('multivitamin', 3500),
    ('vitamin-b-complex', 2200),
    ('zinc-sulfate-20', 900),
    ('salbutamol-4', 1400),
    ('salbutamol-inhaler', 4500),
    ('ambroxol', 1700),
    ('acetylcysteine-200', 2800),
    ('cold-combo', 2500),
    ('clotrimazole-cream', 2200),
    ('hydrocortisone-cream', 1800),
    ('benzyl-benzoate', 1500),
    ('calamine-lotion', 1200),
    ('povidone-iodine', 2500),
    ('amlodipine-5', 2800),
    ('captopril-25', 1500),
    ('hctz-25', 1200),
    ('furosemide-40', 900),
    ('nifedipine-20', 2000),
    ('atorvastatin-20', 4500),
    ('fluconazole-150', 1800),
    ('paracetamol-codeine', 2800),
    ('nystatin-oral', 2400),
    ('ors-zinc-pack', 1500)
) as p(slug, price)
join public.medications med on med.slug = p.slug
on conflict (medication_id) do nothing;

drop function if exists public.list_my_inventory();
drop function if exists private.list_my_inventory();

create or replace function private.list_my_inventory()
returns table (
  slug text,
  name text,
  generic_name text,
  category text,
  dosage text,
  offered boolean,
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
    (inv.medication_id is not null) as offered,
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

create or replace function public.list_my_inventory()
returns table (
  slug text,
  name text,
  generic_name text,
  category text,
  dosage text,
  offered boolean,
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

create or replace function private.set_my_inventory(p_items jsonb)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := (select auth.uid());
  v_role public.user_role;
  v_pharmacy_id uuid;
  v_item jsonb;
  v_med_id uuid;
  v_status public.stock_status;
  v_offered boolean;
  v_count int := 0;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select p.role into v_role from public.profiles p where p.id = v_uid;
  if v_role is null or v_role not in ('pharmacy', 'admin') then
    raise exception 'Only pharmacy accounts can manage stock';
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
    where med.slug = v_item->>'slug';
    if v_med_id is null then
      continue;
    end if;

    v_offered := coalesce((v_item->>'offered')::boolean, true);
    if not v_offered then
      delete from public.pharmacy_inventory
      where pharmacy_id = v_pharmacy_id and medication_id = v_med_id;
      v_count := v_count + 1;
      continue;
    end if;

    v_status := coalesce((v_item->>'stock_status')::public.stock_status, 'in_stock');
    insert into public.pharmacy_inventory (pharmacy_id, medication_id, stock_status)
    values (v_pharmacy_id, v_med_id, v_status)
    on conflict (pharmacy_id, medication_id)
    do update set stock_status = excluded.stock_status;
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

create or replace function private.set_my_stock_item(
  p_slug text,
  p_offered boolean,
  p_stock_status public.stock_status default 'in_stock'
)
returns table (
  slug text,
  name text,
  generic_name text,
  category text,
  dosage text,
  offered boolean,
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
  v_role public.user_role;
  v_pharmacy_id uuid;
  v_med_id uuid;
  v_status public.stock_status := coalesce(p_stock_status, 'in_stock');
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select p.role into v_role from public.profiles p where p.id = v_uid;
  if v_role is null or v_role not in ('pharmacy', 'admin') then
    raise exception 'Only pharmacy accounts can manage stock';
  end if;

  select m.pharmacy_id into v_pharmacy_id
  from public.pharmacy_members m
  where m.user_id = v_uid
  limit 1;

  if v_pharmacy_id is null then
    raise exception 'Save your pharmacy details first';
  end if;

  select med.id into v_med_id
  from public.medications med
  where med.slug = trim(p_slug);

  if v_med_id is null then
    raise exception 'Medication not found';
  end if;

  if coalesce(p_offered, false) then
    insert into public.pharmacy_inventory (pharmacy_id, medication_id, stock_status)
    values (v_pharmacy_id, v_med_id, v_status)
    on conflict (pharmacy_id, medication_id)
    do update set stock_status = excluded.stock_status;
  else
    delete from public.pharmacy_inventory
    where pharmacy_id = v_pharmacy_id and medication_id = v_med_id;
  end if;

  return query
  select
    med.slug,
    med.name,
    med.generic_name,
    med.category,
    med.dosage,
    (inv.medication_id is not null) as offered,
    coalesce(inv.stock_status, 'out_of_stock'::public.stock_status),
    snap.aidcelix_price,
    snap.currency
  from public.medications med
  left join public.pharmacy_inventory inv
    on inv.medication_id = med.id and inv.pharmacy_id = v_pharmacy_id
  left join public.price_snapshots snap on snap.medication_id = med.id
  where med.id = v_med_id;
end;
$$;

create or replace function public.set_my_stock_item(
  p_slug text,
  p_offered boolean,
  p_stock_status public.stock_status default 'in_stock'
)
returns table (
  slug text,
  name text,
  generic_name text,
  category text,
  dosage text,
  offered boolean,
  stock_status public.stock_status,
  aidcelix_price numeric,
  currency text
)
language sql
security invoker
set search_path = public, private
as $$
  select * from private.set_my_stock_item(p_slug, p_offered, p_stock_status);
$$;

grant execute on function private.list_my_inventory() to authenticated;
grant execute on function public.list_my_inventory() to authenticated;
grant execute on function private.set_my_stock_item(text, boolean, public.stock_status) to authenticated;
grant execute on function public.set_my_stock_item(text, boolean, public.stock_status) to authenticated;
revoke execute on function public.list_my_inventory() from anon, public;
revoke execute on function public.set_my_stock_item(text, boolean, public.stock_status) from anon, public;
