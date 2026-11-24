-- CAREVIA Healthcare Ecosystem Schema
-- Maintains strict role separation (user_roles) and row-level security (RLS)

create type public.app_role as enum ('patient', 'doctor', 'pharmacy', 'admin');

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  mobile text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

create table if not exists public.pharmacies (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  drug_license_number text not null,
  gstin text,
  address text not null,
  city text not null,
  pin_code text not null,
  latitude double precision not null,
  longitude double precision not null,
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'rejected')),
  subscription_plan text not null default 'Starter' check (subscription_plan in ('Starter', 'Growth', 'Enterprise')),
  premium_listing boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.pharmacy_inventory (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null references public.pharmacies (id) on delete cascade,
  product_sku text not null,
  product_name text not null,
  category text not null,
  price_inr numeric(10, 2) not null check (price_inr >= 0),
  stock_qty integer not null default 0 check (stock_qty >= 0),
  rx_required boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (pharmacy_id, product_sku)
);

create table if not exists public.doctors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade unique,
  display_name text not null,
  qualification text not null,
  specialty text not null,
  experience_years integer not null check (experience_years >= 0),
  medical_registration_number text not null,
  medical_council text not null,
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'rejected')),
  consultation_fee_inr numeric(10, 2) not null check (consultation_fee_inr >= 0),
  offers_online boolean not null default true,
  offers_offline boolean not null default true,
  clinic_city text,
  latitude double precision,
  longitude double precision,
  available_slots text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_user_id uuid not null references auth.users (id) on delete cascade,
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  consultation_kind text not null check (consultation_kind in ('Online', 'In-Person')),
  mode text check (mode in ('Audio', 'Video')),
  scheduled_date date not null,
  scheduled_time text not null,
  fee_inr numeric(10, 2) not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rescheduled', 'cancelled', 'completed')),
  created_at timestamptz not null default now()
);

create table if not exists public.consultation_threads (
  id uuid primary key default gen_random_uuid(),
  patient_user_id uuid not null references auth.users (id) on delete cascade,
  doctor_id uuid not null references public.doctors (id) on delete cascade,
  reason text not null,
  fee_inr numeric(10, 2) not null,
  status text not null default 'requested' check (status in ('requested', 'accepted', 'rejected', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.consultation_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.consultation_threads (id) on delete cascade,
  sender_user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  attachment_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.medicine_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  medicine_name text not null,
  dosage text not null,
  frequency text not null,
  start_date date not null,
  end_date date not null,
  timings text[] not null,
  meal_instruction text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reminder_doses (
  id uuid primary key default gen_random_uuid(),
  reminder_id uuid not null references public.medicine_reminders (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  scheduled_date date not null,
  scheduled_time text not null,
  status text not null check (status in ('upcoming', 'taken', 'snoozed', 'skipped', 'missed')),
  snoozed_until text,
  updated_at timestamptz not null default now(),
  unique (reminder_id, scheduled_date, scheduled_time)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  patient_user_id uuid not null references auth.users (id) on delete cascade,
  pharmacy_id uuid references public.pharmacies (id) on delete set null,
  subtotal_inr numeric(10, 2) not null,
  delivery_fee_inr numeric(10, 2) not null,
  extended_distance_fee_inr numeric(10, 2) not null default 0,
  commission_inr numeric(10, 2) not null default 0,
  total_inr numeric(10, 2) not null,
  delivery_address jsonb not null,
  delivery_option text not null,
  payment_method text not null,
  payment_status text not null default 'unconfigured_demo',
  stage text not null default 'Order Placed',
  has_rx boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_sku text not null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price_inr numeric(10, 2) not null
);

create table if not exists public.platform_settings (
  id integer primary key default 1 check (id = 1),
  pharmacy_commission_pct numeric(5, 2) not null default 12.00,
  consultation_commission_pct numeric(5, 2) not null default 15.00,
  starter_plan_inr numeric(10, 2) not null default 999.00,
  growth_plan_inr numeric(10, 2) not null default 2499.00,
  enterprise_plan_inr numeric(10, 2) not null default 4999.00,
  premium_listing_inr numeric(10, 2) not null default 1499.00,
  updated_at timestamptz not null default now()
);

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references auth.users (id) on delete cascade,
  subject text not null,
  category text not null,
  details text not null,
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved')),
  created_at timestamptz not null default now()
);

-- Enable RLS across all tables
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.pharmacies enable row level security;
alter table public.pharmacy_inventory enable row level security;
alter table public.doctors enable row level security;
alter table public.appointments enable row level security;
alter table public.consultation_threads enable row level security;
alter table public.consultation_messages enable row level security;
alter table public.medicine_reminders enable row level security;
alter table public.reminder_doses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.platform_settings enable row level security;
alter table public.complaints enable row level security;

-- Core RLS Policies
create policy "Users view own profile or admin" on public.profiles
  for select using (auth.uid() = id or public.has_role(auth.uid(), 'admin'));
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users view own roles or admin" on public.user_roles
  for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "Only admins assign partner or admin roles" on public.user_roles
  for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy "Verified pharmacies readable publicly; owners and admins manage" on public.pharmacies
  for select using (verification_status = 'verified' or owner_user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Pharmacy owners insert own pharmacy" on public.pharmacies
  for insert with check (owner_user_id = auth.uid() and verification_status = 'pending');
create policy "Pharmacy owners or admin update pharmacy" on public.pharmacies
  for update using (owner_user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "Inventory readable for verified pharmacies" on public.pharmacy_inventory
  for select using (
    exists (
      select 1 from public.pharmacies p
      where p.id = pharmacy_id and (p.verification_status = 'verified' or p.owner_user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
    )
  );
create policy "Pharmacy owners manage own inventory" on public.pharmacy_inventory
  for all using (
    exists (select 1 from public.pharmacies p where p.id = pharmacy_id and p.owner_user_id = auth.uid())
    or public.has_role(auth.uid(), 'admin')
  );

create policy "Verified doctors readable publicly; doctor or admin manages" on public.doctors
  for select using (verification_status = 'verified' or user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Doctor inserts own profile as pending" on public.doctors
  for insert with check (user_id = auth.uid() and verification_status = 'pending');
create policy "Doctor or admin updates doctor record" on public.doctors
  for update using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create policy "Patient, assigned doctor, or admin accesses appointments" on public.appointments
  for select using (
    patient_user_id = auth.uid()
    or exists (select 1 from public.doctors d where d.id = doctor_id and d.user_id = auth.uid())
    or public.has_role(auth.uid(), 'admin')
  );
create policy "Patients create own appointments" on public.appointments
  for insert with check (patient_user_id = auth.uid());
create policy "Participants update appointment status" on public.appointments
  for update using (
    patient_user_id = auth.uid()
    or exists (select 1 from public.doctors d where d.id = doctor_id and d.user_id = auth.uid())
    or public.has_role(auth.uid(), 'admin')
  );

create policy "Participants read consultation threads" on public.consultation_threads
  for select using (
    patient_user_id = auth.uid()
    or exists (select 1 from public.doctors d where d.id = doctor_id and d.user_id = auth.uid())
    or public.has_role(auth.uid(), 'admin')
  );
create policy "Patients create consultation requests" on public.consultation_threads
  for insert with check (patient_user_id = auth.uid());
create policy "Doctor or patient updates thread" on public.consultation_threads
  for update using (
    patient_user_id = auth.uid()
    or exists (select 1 from public.doctors d where d.id = doctor_id and d.user_id = auth.uid())
  );

create policy "Participants access messages after thread acceptance" on public.consultation_messages
  for select using (
    exists (
      select 1 from public.consultation_threads t
      left join public.doctors d on d.id = t.doctor_id
      where t.id = thread_id and (t.patient_user_id = auth.uid() or d.user_id = auth.uid())
    )
  );
create policy "Participants send messages on accepted threads" on public.consultation_messages
  for insert with check (
    sender_user_id = auth.uid()
    and exists (
      select 1 from public.consultation_threads t
      left join public.doctors d on d.id = t.doctor_id
      where t.id = thread_id and t.status = 'accepted' and (t.patient_user_id = auth.uid() or d.user_id = auth.uid())
    )
  );

create policy "Users manage own medicine reminders" on public.medicine_reminders
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users manage own reminder doses" on public.reminder_doses
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Patient, fulfilling pharmacy, or admin views orders" on public.orders
  for select using (
    patient_user_id = auth.uid()
    or exists (select 1 from public.pharmacies p where p.id = pharmacy_id and p.owner_user_id = auth.uid())
    or public.has_role(auth.uid(), 'admin')
  );
create policy "Patients place orders" on public.orders
  for insert with check (patient_user_id = auth.uid());
create policy "Fulfilling pharmacy or admin updates order stage" on public.orders
  for update using (
    exists (select 1 from public.pharmacies p where p.id = pharmacy_id and p.owner_user_id = auth.uid())
    or public.has_role(auth.uid(), 'admin')
  );

create policy "Order items follow order access" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      left join public.pharmacies p on p.id = o.pharmacy_id
      where o.id = order_id and (o.patient_user_id = auth.uid() or p.owner_user_id = auth.uid() or public.has_role(auth.uid(), 'admin'))
    )
  );
create policy "Patients insert own order items" on public.order_items
  for insert with check (exists (select 1 from public.orders o where o.id = order_id and o.patient_user_id = auth.uid()));

create policy "Platform settings readable by authenticated users, editable by admin" on public.platform_settings
  for select using (auth.role() = 'authenticated');
create policy "Admins update platform settings" on public.platform_settings
  for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy "Users create and view own complaints; admin manages all" on public.complaints
  for select using (reporter_user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Users submit complaints" on public.complaints
  for insert with check (reporter_user_id = auth.uid());
create policy "Admins update complaints" on public.complaints
  for update using (public.has_role(auth.uid(), 'admin'));

