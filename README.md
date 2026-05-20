# ScrapPOS

ระบบ POS ร้านรับซื้อของเก่า / รีไซเคิล  
สร้างด้วย Vanilla HTML + JavaScript + Supabase — ไม่ต้อง build, เปิดไฟล์ได้เลย

---

## Tech Stack

| ชั้น | เทคโนโลยี |
|------|-----------|
| Frontend | HTML5, Vanilla JavaScript, CSS3 (no framework) |
| Font | Prompt (Google Fonts) |
| Icons | Phosphor Icons |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Deploy | GitHub Pages / static hosting ใดก็ได้ |

---

## หน้าในระบบ

| ไฟล์ | ชื่อหน้า | หน้าที่ |
|------|----------|---------|
| `login.html` | Login | Supabase Auth — อีเมล + รหัสผ่าน |
| `buy.html` | รับซื้อ | รับซื้อของจากชาวบ้าน เลือกสินค้า → ใส่น้ำหนัก/จำนวน → ตะกร้า → บันทึก |
| `sell.html` | ขายออก | ขายสินค้าให้โรงงาน เลือกสินค้า → ใส่น้ำหนัก/จำนวน → เลือกโรงงาน → ส่ง |
| `sort.html` | คัดแยก | แปลงสินค้าดิบเป็นสินค้าแยกประเภท (เช่น เศษโลหะรวม → ทองแดง + เหล็ก) |
| `items.html` | จัดการสินค้า | เพิ่ม / แก้ไข / ลบสินค้า, ตั้งราคา, กำหนดหน่วย (กก./ชิ้น), จัดการหมวดหมู่ |
| `dashboard.html` | Dashboard | ดูยอด กำไร สต๊อก กราฟ เติม/ถอนเงินสด |

---

## โครงสร้างฐานข้อมูล

### ตาราง `items`
เก็บสินค้าทั้งหมดในร้าน

| คอลัมน์ | ประเภท | คำอธิบาย |
|---------|--------|----------|
| `id` | bigint PK | รหัสสินค้า |
| `name` | text | ชื่อสินค้า |
| `icon` | text | Phosphor class หรือ emoji |
| `cat` | text | slug หมวดหมู่ (FK → categories) |
| `buy_price` | numeric | ราคารับซื้อต่อหน่วย |
| `sell_price` | numeric | ราคาขายออกต่อหน่วย |
| `stock_qty` | numeric | สต๊อกคงเหลือ |
| `unit` | text | หน่วย เช่น กก., ลัง, ชิ้น |
| `sell_mode` | text | `'kg'` หรือ `'piece'` |

### ตาราง `categories`
| คอลัมน์ | ประเภท | คำอธิบาย |
|---------|--------|----------|
| `id` | bigint PK | |
| `slug` | text UNIQUE | เช่น `metal`, `paper`, `beer-crate` |
| `label` | text | ชื่อแสดงผล เช่น โลหะ, กระดาษ |
| `icon` | text | Phosphor class หรือ emoji |

### ตาราง `factories`
โรงงานปลายทางสำหรับการขายออก

| คอลัมน์ | ประเภท | คำอธิบาย |
|---------|--------|----------|
| `id` | bigint PK | |
| `name` | text | ชื่อโรงงาน |
| `location` | text | ที่ตั้ง |
| `is_active` | boolean | แสดงใน dropdown หรือไม่ |

### ตาราง `transactions`
บันทึกทุก transaction (รับซื้อ, ขายออก, เติมเงิน, ถอนเงิน)

| คอลัมน์ | ประเภท | คำอธิบาย |
|---------|--------|----------|
| `id` | bigint PK | |
| `type` | text | `buy` / `sell` / `deposit` / `withdraw` |
| `lines` | jsonb | รายละเอียดแต่ละรายการ |
| `total_amount` | numeric | ยอดรวม |
| `total_kg` | numeric | น้ำหนักรวม (กรณี kg) |
| `factory_id` | bigint | FK → factories (กรณี sell) |
| `factory_name` | text | ชื่อโรงงาน snapshot |
| `created_at` | timestamptz | เวลาบันทึก |

### ตาราง `sort_logs`
บันทึกประวัติการคัดแยก

### ตาราง `cash_logs`
บันทึกประวัติเติม/ถอนเงินสด *(หรือใช้ร่วมกับ transactions type=deposit/withdraw)*

---

## Supabase Functions (RPC)

| ฟังก์ชัน | หน้าที่ |
|---------|---------|
| `record_buy_transaction(p_lines)` | INSERT transaction type=buy + อัปเดต stock (บวก) |
| `record_sell_transaction(p_factory_id, p_factory_name, p_lines)` | INSERT transaction type=sell + อัปเดต stock (ลบ) |
| `record_sort(p_from_item_id, p_from_kg, p_results)` | หัก stock ต้นทาง + เพิ่ม stock ปลายทาง พร้อมเช็กไม่ให้ติดลบ |
| `adjust_stock(p_item_id, p_delta)` | ปรับ stock โดยตรง (ใช้ใน items.html) |
| `update_stock_on_transaction()` | Trigger function — ทำงานหลัง INSERT ตรงเข้า transactions |

---

## Row Level Security

ทุกตารางใน `public` schema เปิด RLS และมี policy ให้เฉพาะ `authenticated` user เข้าถึง

```sql
-- ตัวอย่าง
CREATE POLICY auth_select ON public.items
  FOR SELECT TO authenticated USING (true);
```

---

## การติดตั้ง

### 1. Clone

```bash
git clone https://github.com/yourusername/scrap-pos.git
cd scrap-pos
```

### 2. สร้าง Supabase Project

1. ไปที่ [supabase.com](https://supabase.com) → New Project
2. เปิด **SQL Editor**
3. รัน `patch.sql` เพื่อสร้าง schema + functions ทั้งหมด

### 3. ใส่ Supabase credentials

ทุกไฟล์ `.html` มีบล็อกนี้ด้านบน script — แก้ให้ตรง:

```js
const SUPABASE_URL  = 'https://xxxx.supabase.co';
const SUPABASE_ANON = 'eyJ...';
```

### 4. สร้าง user

Supabase Dashboard → **Authentication → Users → Add User**  
ใส่อีเมล + รหัสผ่าน แล้วเข้าใช้งานผ่าน `login.html`

### 5. รัน local (ถ้าต้องการทดสอบ)

```bash
python -m http.server 8080
# แล้วเปิด http://localhost:8080/buy.html
```

หรือจะลาก `buy.html` เปิดใน browser ตรง ๆ ก็ได้ (ไม่มี build step)

---

## วิธีใช้งาน

### รับซื้อ (`buy.html`)
1. กดการ์ดสินค้า → กรอกน้ำหนัก (กก.) หรือจำนวน (ชิ้น) → **เพิ่มในตะกร้า**
2. เพิ่มสินค้าได้หลายรายการในตะกร้าเดียว
3. กด **บันทึก X รายการ** → stock อัปเดตอัตโนมัติ

### ขายออก (`sell.html`)
1. กดการ์ดสินค้า → กรอกน้ำหนัก/จำนวน → เพิ่มในรายการ
2. เลือกโรงงานปลายทาง
3. กด **ยืนยันส่งโรงงาน** → stock ลดอัตโนมัติ

### คัดแยก (`sort.html`)
1. เลือกสินค้าต้นทาง + ปริมาณที่จะคัดแยก
2. ระบุผลลัพธ์แต่ละประเภท
3. บันทึก → stock ต้นทางลด, stock ปลายทางเพิ่ม

### จัดการสินค้า (`items.html`)
- เพิ่ม/แก้ไขสินค้า: ชื่อ, ราคา, หน่วย, **วิธีรับซื้อ (กก./ชิ้น)**, หมวดหมู่, ไอคอน
- จัดการหมวดหมู่: เพิ่ม slug + label + ไอคอน

### Dashboard (`dashboard.html`)
- เลือก range: วันนี้ / สัปดาห์ / เดือน / ไตรมาส / ปี
- ดูยอดรับซื้อ, ขายออก, กำไร, Margin, เงินสด, มูลค่าสต๊อก
- กราฟแนวโน้ม + ตารางสต๊อกคงเหลือ
- เติมเงิน / ถอนเงิน พร้อมประวัติ

---

## หมายเหตุ

- ระบบรองรับสินค้าทั้ง **กิโลกรัม** และ **ชิ้น/อัน** — ตั้งค่าต่อรายการสินค้าใน `items.html`
- ไม่มี dependency build เลย — แก้ไฟล์ `.html` แล้ว refresh ได้ทันที
- ถ้ายังไม่ได้ตั้งค่า Supabase ระบบจะรันในโหมด **Demo** โดยอัตโนมัติ (ข้อมูลไม่บันทึกจริง)
ติดต่อผู้จัดทำ
https://www.facebook.com/share/1EBPdzadhW/
