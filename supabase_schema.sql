-- ==========================================
-- STEP 1: สร้างตาราง
-- ==========================================
create extension if not exists "pgcrypto";

-- TABLE: items (ประเภทของเก่า)
create table public.items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  buy_price numeric not null default 0,
  sell_price numeric default 0,
  stock_qty numeric default 0,
  unit text default 'kg',
  created_at timestamp with time zone default now()
);

-- TABLE: customers (ลูกค้า)
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text,
  created_at timestamp with time zone default now()
);

-- TABLE: transactions (หัวบิล)
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  type text check (type in ('BUY','SELL')) not null,
  customer_id uuid references customers(id),
  total_amount numeric default 0,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now()
);

-- TABLE: transaction_items (รายการในบิล)
create table public.transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references transactions(id) on delete cascade,
  item_id uuid references items(id),
  qty numeric not null,
  price_per_unit numeric not null,
  subtotal numeric not null
);

-- ==========================================
-- STEP 2: ระบบอัปเดต STOCK อัตโนมัติ (Trigger)
-- ==========================================
create or replace function update_stock()
returns trigger as $$
declare trx_type text;
begin
  select type into trx_type from transactions where id = new.transaction_id;

  if trx_type = 'BUY' then
    update items set stock_qty = stock_qty + new.qty where id = new.item_id;
  elsif trx_type = 'SELL' then
    update items set stock_qty = stock_qty - new.qty where id = new.item_id;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trigger_update_stock
after insert on transaction_items
for each row execute function update_stock();

-- ==========================================
-- STEP 3: เปิด RLS + สร้าง Policy (ปรับให้แอปใช้งานได้ทันที)
-- ==========================================
alter table items enable row level security;
alter table customers enable row level security;
alter table transactions enable row level security;
alter table transaction_items enable row level security;

-- สร้าง Policy แบบรวบรัด ให้แอป (ทั้ง anon และ authenticated) สามารถ อ่าน/เพิ่ม/แก้ไข/ลบ ได้
create policy "Allow All on items" on items for all using (true) with check (true);
create policy "Allow All on customers" on customers for all using (true) with check (true);
create policy "Allow All on transactions" on transactions for all using (true) with check (true);
create policy "Allow All on transaction_items" on transaction_items for all using (true) with check (true);

-- ==========================================
-- STEP 4: ปลดล็อก API (กันปัญหา Permission Denied แบบคราวที่แล้ว)
-- ==========================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
