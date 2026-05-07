-- ══════════════════════════════════════════════════════
--  ScrapPOS — Supabase SQL Schema
--  รันใน SQL Editor ของ Supabase Dashboard
-- ══════════════════════════════════════════════════════

-- 1. ตารางสินค้า
create table if not exists items (
  id          bigint primary key generated always as identity,
  name        text not null,
  icon        text default '📦',
  cat         text not null,         -- metal, paper, plastic, glass, electric
  buy_price   numeric(10,2) not null,
  sell_price  numeric(10,2) not null,
  unit        text default 'กก.',
  stock_qty   numeric(12,2) default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 2. ตารางธุรกรรม
create table if not exists transactions (
  id            bigint primary key generated always as identity,
  type          text not null check (type in ('buy','sell')),
  factory_id    text,                -- สำหรับ sell เท่านั้น
  factory_name  text,
  total_kg      numeric(12,2),
  total_amount  numeric(12,2),
  lines         jsonb,               -- [{item_id, item_name, kg, price, subtotal}]
  created_at    timestamptz default now()
);

-- 3. Trigger: อัปเดต stock_qty อัตโนมัติเมื่อมี transaction ใหม่
create or replace function update_stock_on_transaction()
returns trigger language plpgsql as $$
declare
  line jsonb;
begin
  for line in select * from jsonb_array_elements(NEW.lines)
  loop
    if NEW.type = 'buy' then
      update items
        set stock_qty  = stock_qty + (line->>'kg')::numeric,
            updated_at = now()
        where id = (line->>'item_id')::bigint;
    elsif NEW.type = 'sell' then
      update items
        set stock_qty  = greatest(0, stock_qty - (line->>'kg')::numeric),
            updated_at = now()
        where id = (line->>'item_id')::bigint;
    end if;
  end loop;
  return NEW;
end;
$$;

drop trigger if exists trg_update_stock on transactions;
create trigger trg_update_stock
  after insert on transactions
  for each row execute function update_stock_on_transaction();

-- 4. RPC: Weekly chart data (รับซื้อ vs ขายออก 7 วันย้อนหลัง)
create or replace function get_weekly_chart()
returns json language plpgsql as $$
declare
  result json;
begin
  select json_build_object(
    'labels', array['จ','อ','พ','พฤ','ศ','ส','อา'],
    'buy', (
      select array_agg(coalesce(sum_buy,0) order by d)
      from (
        select d, sum(total_amount) filter (where type='buy') as sum_buy
        from generate_series(
          date_trunc('week', now())::date,
          date_trunc('week', now())::date + 6,
          '1 day'
        ) as d
        left join transactions t
          on t.created_at::date = d and t.type = 'buy'
        group by d
      ) q
    ),
    'sell', (
      select array_agg(coalesce(sum_sell,0) order by d)
      from (
        select d, sum(total_amount) filter (where type='sell') as sum_sell
        from generate_series(
          date_trunc('week', now())::date,
          date_trunc('week', now())::date + 6,
          '1 day'
        ) as d
        left join transactions t
          on t.created_at::date = d and t.type = 'sell'
        group by d
      ) q
    )
  ) into result;
  return result;
end;
$$;

-- 5. Enable RLS (Row Level Security) — ปรับตามต้องการ
alter table items        enable row level security;
alter table transactions enable row level security;

-- Allow anonymous read for items (กรณีไม่ต้องการ auth)
create policy "Allow anon read items"
  on items for select using (true);

-- Allow anon insert transactions (production: เปลี่ยนเป็น authenticated)
create policy "Allow anon insert transactions"
  on transactions for insert with check (true);

-- Allow anon update stock
create policy "Allow anon update items"
  on items for update using (true);

-- ══════════════════════════════════════════════════════
--  ข้อมูลตัวอย่าง (seed)
-- ══════════════════════════════════════════════════════
insert into items (name, icon, cat, buy_price, sell_price, stock_qty) values
  ('เหล็กหนัก',          '🔩', 'metal',    4.50, 5.80, 4200),
  ('เหล็กบาง',           '🔧', 'metal',    2.80, 3.50, 1800),
  ('ทองแดง',             '🪙', 'metal',  195.00,215.00,  320),
  ('อลูมิเนียม',         '🫗', 'metal',   42.00, 50.00,  960),
  ('สแตนเลส',            '⚙️', 'metal',   18.00, 22.00,  550),
  ('กระดาษหนังสือพิมพ์', '📰', 'paper',    2.20,  2.80, 3000),
  ('กระดาษลัง',          '📦', 'paper',    2.50,  3.20, 5200),
  ('กระดาษขาว',          '📄', 'paper',    3.00,  3.80, 1100),
  ('พลาสติกขาว',         '🥛', 'plastic',  8.50, 11.00,  780),
  ('ขวด PET',            '🍶', 'plastic',  6.00,  8.00,  620),
  ('แก้วใส',             '🪟', 'glass',    1.20,  1.60, 2100),
  ('สายไฟทองแดง',        '🔌', 'electric',85.00,100.00,  180),
  ('มอเตอร์เก่า',        '⚡', 'electric',25.00, 32.00,   95)
on conflict do nothing;
