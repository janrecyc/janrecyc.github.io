-- 1. สร้างตาราง Users (เชื่อมกับระบบ Supabase Auth)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('admin', 'cashier')) DEFAULT 'cashier',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE public.users IS 'ข้อมูลพนักงาน ผูกกับ auth.users ของ Supabase';

-- 2. สร้างตาราง Categories (หมวดหมู่สินค้า เช่น เหล็ก, กระดาษ, พลาสติก)
CREATE TABLE public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. สร้างตาราง Items (รายการสินค้า)
CREATE TABLE public.items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL UNIQUE,
    default_deduction_percent NUMERIC(5,2) DEFAULT 0.00, -- หักสิ่งเจือปนพื้นฐาน (เช่น 2.00%)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. สร้างตาราง Prices (บอร์ดราคารับซื้อ-ขายออก)
CREATE TABLE public.prices (
    item_id UUID REFERENCES public.items(id) ON DELETE CASCADE PRIMARY KEY,
    buy_price NUMERIC(10,2) DEFAULT 0.00,
    sell_price NUMERIC(10,2) DEFAULT 0.00,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. สร้างตาราง Transactions (หัวบิล/รายการหลัก)
CREATE TABLE public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT CHECK (type IN ('buy', 'sell', 'sort', 'cash_in', 'cash_out')) NOT NULL,
    total_amount NUMERIC(12,2) DEFAULT 0.00,
    status TEXT CHECK (status IN ('completed', 'voided')) DEFAULT 'completed',
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. สร้างตาราง Transaction Lines (รายละเอียดในบิล)
CREATE TABLE public.transaction_lines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
    item_id UUID REFERENCES public.items(id) ON DELETE RESTRICT,
    gross_weight NUMERIC(10,3) DEFAULT 0.000, -- น้ำหนักชั่งรวม (kg มีทศนิยม 3 ตำแหน่ง)
    deduction_weight NUMERIC(10,3) DEFAULT 0.000, -- น้ำหนักสิ่งเจือปนที่หักออก
    
    -- คำนวณน้ำหนักสุทธิ และ ยอดรวมให้อัตโนมัติ (ป้องกัน Front-end คำนวณพลาด)
    net_weight NUMERIC(10,3) GENERATED ALWAYS AS (gross_weight - deduction_weight) STORED,
    unit_price NUMERIC(10,2) DEFAULT 0.00,
    subtotal NUMERIC(12,2) GENERATED ALWAYS AS ((gross_weight - deduction_weight) * unit_price) STORED
);

-- 7. สร้างตาราง Inventory Ledger (สมุดบัญชีสต๊อกสินค้า)
CREATE TABLE public.inventory_ledger (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id UUID REFERENCES public.items(id) ON DELETE RESTRICT NOT NULL,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
    change_weight NUMERIC(10,3) NOT NULL, -- ค่าบวก = ของเข้า, ค่าลบ = ของออก
    balance_weight NUMERIC(10,3) NOT NULL, -- ยอดยกไป (Snapshot สต๊อก ณ เวลานั้น)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. สร้างตาราง Cash Flow (ความเคลื่อนไหวเงินสดในลิ้นชัก)
CREATE TABLE public.cash_flow (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
    amount_in NUMERIC(12,2) DEFAULT 0.00,
    amount_out NUMERIC(12,2) DEFAULT 0.00,
    balance NUMERIC(12,2) NOT NULL, -- ยอดเงินคงเหลือในลิ้นชัก
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-------------------------------------------------------------------
-- ⚙️ การตั้งค่าระบบรักษาความปลอดภัย (RLS) และ Supabase Realtime
-------------------------------------------------------------------

-- เปิดใช้งาน RLS สำหรับตาราง prices
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;

-- Policy 1: ให้ทุกคนที่ Login (admin/cashier) สามารถ "อ่าน" ราคาได้
CREATE POLICY "Anyone authenticated can read prices" 
ON public.prices FOR SELECT 
TO authenticated 
USING (true);

-- Policy 2: ให้เฉพาะ "admin" (เถ้าแก่) เท่านั้นที่สามารถ "แก้ไข" ราคาได้
CREATE POLICY "Only admins can update prices" 
ON public.prices FOR UPDATE 
TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- Policy 3: ให้เฉพาะ "admin" สามารถ "เพิ่ม" รายการราคาใหม่ได้
CREATE POLICY "Only admins can insert prices" 
ON public.prices FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- เปิดการส่งข้อมูล Realtime สำหรับตาราง prices (เถ้าแก่เปลี่ยนราคาปุ๊บ หน้าจอลูกน้องอัปเดตปั๊บ)
ALTER PUBLICATION supabase_realtime ADD TABLE prices;
