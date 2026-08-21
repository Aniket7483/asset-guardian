-- ============ enums & helpers ============
create type public.app_role as enum ('super_admin','admin','staff');

create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- ============ profiles ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles readable by authenticated" on public.profiles for select to authenticated using (true);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create trigger trg_profiles_updated before update on public.profiles for each row execute function public.update_updated_at_column();

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

create or replace function public.is_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin','super_admin'));
$$;

create policy "roles readable by authenticated" on public.user_roles for select to authenticated using (true);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare first_user boolean;
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), new.email)
  on conflict (id) do nothing;
  select not exists (select 1 from public.user_roles) into first_user;
  insert into public.user_roles (user_id, role)
  values (new.id, case when first_user then 'super_admin'::public.app_role else 'admin'::public.app_role end)
  on conflict do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ============ lookups ============
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.asset_statuses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default 'muted',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create table public.asset_conditions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create table public.buildings (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  address text,
  created_at timestamptz not null default now()
);
create table public.floors (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (building_id, name)
);
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  floor_id uuid not null references public.floors(id) on delete cascade,
  name text not null,
  area text,
  created_at timestamptz not null default now(),
  unique (floor_id, name)
);
create table public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_code text not null unique,
  name text not null,
  department text,
  designation text,
  email text,
  phone text,
  room_id uuid references public.rooms(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_employees_updated before update on public.employees for each row execute function public.update_updated_at_column();

-- ============ assets ============
create sequence public.asset_code_seq start 1;

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  asset_code text not null unique,
  name text not null,
  category_id uuid references public.categories(id) on delete set null,
  asset_type text,
  description text,
  ownership text default 'Company Owned',
  brand text,
  model text,
  serial_number text,
  quantity int not null default 1,
  condition text not null default 'Good',
  status text not null default 'Available',
  purchase_date date,
  purchase_price numeric(14,2),
  vendor text,
  invoice_number text,
  warranty_start date,
  warranty_end date,
  building_id uuid references public.buildings(id) on delete set null,
  floor_id uuid references public.floors(id) on delete set null,
  room_id uuid references public.rooms(id) on delete set null,
  specific_location text,
  assigned_employee_id uuid references public.employees(id) on delete set null,
  assigned_at date,
  expected_return_date date,
  photo_url text,
  notes text,
  archived boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index assets_serial_unique on public.assets (lower(serial_number)) where serial_number is not null and serial_number <> '';
create index assets_room_idx on public.assets(room_id);
create index assets_status_idx on public.assets(status);
create trigger trg_assets_updated before update on public.assets for each row execute function public.update_updated_at_column();

create or replace function public.set_asset_code()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.asset_code is null or new.asset_code = '' then
    new.asset_code := 'AST-' || lpad(nextval('public.asset_code_seq')::text, 6, '0');
  end if;
  return new;
end; $$;
create trigger trg_assets_code before insert on public.assets for each row execute function public.set_asset_code();

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  assigned_date date not null default current_date,
  expected_return_date date,
  returned_date date,
  notes text,
  created_at timestamptz not null default now()
);
create index assignments_asset_idx on public.assignments(asset_id);

create table public.maintenance (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  maintenance_date date not null default current_date,
  problem text,
  description text,
  service_provider text,
  cost numeric(14,2),
  status text not null default 'Open',
  expected_completion date,
  completion_date date,
  notes text,
  created_at timestamptz not null default now()
);

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  type text not null default 'Damage',
  reported_date date not null default current_date,
  reported_by text,
  description text,
  location text,
  employee_id uuid references public.employees(id) on delete set null,
  resolution_status text not null default 'Open',
  notes text,
  created_at timestamptz not null default now()
);

create table public.asset_history (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  action text not null,
  details text,
  actor_id uuid references auth.users(id) on delete set null,
  actor_name text,
  created_at timestamptz not null default now()
);
create index asset_history_asset_idx on public.asset_history(asset_id, created_at desc);

create table public.verifications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  building_id uuid references public.buildings(id) on delete set null,
  floor_id uuid references public.floors(id) on delete set null,
  room_id uuid references public.rooms(id) on delete set null,
  status text not null default 'In Progress',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null
);
create table public.verification_items (
  id uuid primary key default gen_random_uuid(),
  verification_id uuid not null references public.verifications(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  result text not null default 'Verified',
  scanned_at timestamptz not null default now(),
  unique (verification_id, asset_id)
);

-- ============ grants + rls ============
do $$
declare t text;
begin
  foreach t in array array['categories','asset_statuses','asset_conditions','buildings','floors','rooms','employees','assets','assignments','maintenance','incidents','asset_history','verifications','verification_items']
  loop
    execute format('grant select, insert, update, delete on public.%I to authenticated;', t);
    execute format('grant all on public.%I to service_role;', t);
    execute format('alter table public.%I enable row level security;', t);
    execute format('create policy "read all authenticated" on public.%I for select to authenticated using (true);', t);
    execute format('create policy "insert authenticated" on public.%I for insert to authenticated with check (true);', t);
    execute format('create policy "update authenticated" on public.%I for update to authenticated using (true) with check (true);', t);
    execute format('create policy "delete admins only" on public.%I for delete to authenticated using (public.is_admin(auth.uid()));', t);
  end loop;
end $$;

-- ============ seed ============
insert into public.asset_statuses (name, color, sort_order) values
 ('Available','success',1),('Assigned','info',2),('In Use','info',3),('Under Maintenance','warning',4),
 ('Damaged','danger',5),('Lost','danger',6),('Retired','muted',7),('Disposed','muted',8);

insert into public.asset_conditions (name, sort_order) values
 ('New',1),('Excellent',2),('Good',3),('Fair',4),('Damaged',5),('Non-functional',6);

insert into public.categories (name) values
 ('Laptops'),('Desktop Computers'),('CPUs'),('Monitors'),('Keyboards'),('Mice'),('Printers'),('Scanners'),
 ('Projectors'),('UPS'),('Routers'),('Network Equipment'),('Phones'),('Tablets'),('IT Accessories'),
 ('Chairs'),('Tables'),('Desks'),('Cabinets'),('Sofas'),('Electrical Equipment'),('Air Conditioners'),
 ('Fans'),('Lights'),('Extension Boards'),('Pantry Items'),('Bathroom Items'),('Cleaning Equipment'),
 ('Safety Equipment'),('Fire Extinguishers'),('Stationery'),('Miscellaneous');

insert into public.buildings (name, address) values ('Main Office','Head Office');

insert into public.floors (building_id, name, sort_order)
select b.id, f.name, f.ord from public.buildings b,
 (values ('Ground Floor',1),('1st Floor',2),('2nd Floor',3)) as f(name, ord)
where b.name = 'Main Office';

insert into public.rooms (floor_id, name)
select fl.id, r.name from public.floors fl,
 (values ('Reception'),('HR Room'),('Meeting Room'),('Staff Room'),('Accounts Room'),('Director Office'),('IT Room'),('Pantry'),('Bathroom')) as r(name)
where fl.name = 'Ground Floor';

insert into public.rooms (floor_id, name)
select fl.id, r.name from public.floors fl,
 (values ('Staff Room'),('Meeting Room'),('Director Office'),('Server Room')) as r(name)
where fl.name = '1st Floor';

insert into public.employees (employee_code, name, department, designation, email, phone)
values ('EMP-001','Rahul Sharma','IT','System Administrator','rahul@company.com','+91 98765 43210'),
       ('EMP-002','Priya Verma','HR','HR Manager','priya@company.com','+91 98765 43211'),
       ('EMP-003','Amit Singh','Accounts','Accountant','amit@company.com','+91 98765 43212');

insert into public.assets (name, category_id, brand, model, serial_number, condition, status, purchase_date, purchase_price, vendor, invoice_number, warranty_start, warranty_end, building_id, floor_id, room_id, specific_location, assigned_employee_id, assigned_at)
select v.name, c.id, v.brand, v.model, v.serial, v.cond, v.status, v.pdate::date, v.price, v.vendor, v.inv, v.pdate::date, (v.pdate::date + interval '2 years')::date,
       b.id, fl.id, rm.id, v.spec, e.id, case when v.status = 'Assigned' then v.pdate::date else null end
from (values
 ('Dell Latitude 5440','Laptops','Dell','Latitude 5440','SN-LAP-0001','Excellent','Assigned','2025-04-10',82000,'Tech Traders','INV-1001','Director Desk','Director Office','EMP-001'),
 ('HP LaserJet Pro','Printers','HP','M404dn','SN-PRN-0001','Good','Available','2025-02-18',28000,'Office Mart','INV-1002','Corner Table','IT Room',null),
 ('Samsung 24 inch Monitor','Monitors','Samsung','S24R350','SN-MON-0001','Good','Assigned','2025-04-10',12000,'Tech Traders','INV-1001','Director Desk','Director Office','EMP-001'),
 ('Executive Chair','Chairs','Featherlite','Optima','SN-CHR-0001','New','In Use','2025-01-05',15000,'Furniture Hub','INV-1003','Director Desk','Director Office',null),
 ('Voltas Split AC 1.5T','Air Conditioners','Voltas','183V','SN-AC-0001','Good','Under Maintenance','2024-06-20',38000,'CoolAir','INV-1004','Wall Mounted','Meeting Room',null),
 ('APC UPS 1kVA','UPS','APC','BX1100C','SN-UPS-0001','Fair','Available','2024-08-11',9500,'Power Plus','INV-1005','Server Rack','IT Room',null),
 ('Logitech Keyboard','Keyboards','Logitech','K120','SN-KB-0001','Good','Assigned','2025-04-10',900,'Tech Traders','INV-1001','HR Desk','HR Room','EMP-002'),
 ('Meeting Table','Tables','Godrej','MT-8','SN-TBL-0001','Excellent','In Use','2024-03-15',45000,'Furniture Hub','INV-1006','Center','Meeting Room',null),
 ('Ball Pen (Box)','Stationery',null,null,null,'New','Available','2026-01-09',500,'Stationery World','INV-1007','Store Cabinet','Accounts Room',null),
 ('Fire Extinguisher ABC','Fire Extinguishers','Safex','ABC-6kg','SN-FE-0001','Good','Available','2024-11-01',3500,'SafeGuard','INV-1008','Near Exit','Reception',null)
) as v(name, cat, brand, model, serial, cond, status, pdate, price, vendor, inv, spec, room, emp)
join public.categories c on c.name = v.cat
join public.rooms rm on rm.name = v.room
join public.floors fl on fl.id = rm.floor_id and fl.name = 'Ground Floor'
join public.buildings b on b.id = fl.building_id
left join public.employees e on e.employee_code = v.emp;

update public.assets set quantity = 50 where name = 'Ball Pen (Box)';

insert into public.asset_history (asset_id, action, details, actor_name)
select id, 'Asset Created', 'Initial asset registry entry', 'System' from public.assets;

insert into public.assignments (asset_id, employee_id, assigned_date, notes)
select a.id, a.assigned_employee_id, coalesce(a.assigned_at, current_date), 'Initial assignment'
from public.assets a where a.assigned_employee_id is not null;