# JanRecyc — เวอร์ชันฐานข้อมูลในเครื่อง (offline เต็มรูปแบบ)

แปลงจาก JanRecyc เดิม (Supabase) มาเป็น **SQLite ในเครื่อง** ทั้งหมด ใช้งานคนเดียว ไม่ต้องมีเน็ต ไม่มีระบบ login

## สิ่งที่ตัดออกจากต้นฉบับ (ตามที่คุยกันไว้)

- **JANRECYC หน้าร้าน (storefront) + ระบบรีวิว** — ตัดออกทั้งหมด เพราะออกแบบมาเพื่อให้คนอื่นเข้าดูผ่านเน็ต ไม่มีความหมายถ้าเป็น local
- **ระบบ Login** — ตัดออก เข้าแอพมาเจอหน้า "รับซื้อ" ทันที

## สิ่งที่เก็บไว้ครบ (ทำงานผ่าน SQLite ในเครื่องแล้ว)

- **รับซื้อ** (`buy.html`) — ตะกร้าสินค้า, คำนวณเงินสดคงเหลือ, บันทึกลง SQLite
- **ขายออก** (`sell.html`) — เลือกโรงงานปลายทาง, ตะกร้า, บันทึกรายการขาย
- **คัดแยก** (`sort.html`) — แปลงวัตถุดิบ 1 ชนิด → หลายชนิดตามน้ำหนักที่คัดได้ อัปเดตสต๊อกอัตโนมัติ
- **จัดการสินค้า** (`items.html`) — เพิ่ม/แก้ไข/ลบสินค้าและหมวดหมู่
- **Dashboard** (`dashboard.html`) — กราฟยอดขาย/ซื้อ, สต๊อกคงเหลือ, เติม/ถอนเงินสด (ตัดปุ่ม "ป้ายหน้าร้าน" และ "อนุมัติรีวิว" ออกเพราะผูกกับฟีเจอร์ที่ตัดไป)

## วิธีทำงานภายใน (สำหรับแก้โค้ดต่อ)

ไฟล์เดิม (`buy.js`, `sell.js`, `sort.js`, `items.js`, `dashboard.js`) แทบไม่ได้ถูกแก้ logic เลย — เพราะทุกไฟล์เดิมเรียกข้อมูลผ่านฟังก์ชันเดียว (`sbFetch()` หรือ `sb()`) ที่ยิง REST ไปหา Supabase ด้วย path แบบ PostgREST เช่น `items?select=id,name&order=name` หรือ `rpc/record_buy_transaction`

สิ่งที่ทำคือเพิ่มไฟล์ใหม่ 2 ไฟล์ แล้วสลับให้ `sbFetch()`/`sb()` เรียกไฟล์ใหม่แทน:

- **`js/db.js`** — เปิดการเชื่อมต่อ SQLite + สร้างตาราง `items`, `categories`, `transactions`, `factories`
- **`js/local-rest.js`** — ตัวแปลง path/opts สไตล์ Supabase ให้กลายเป็นคำสั่ง SQL จริง (SELECT/INSERT/UPDATE/DELETE) รวมถึง RPC 3 ตัว (`record_buy_transaction`, `record_sell_transaction`, `record_sort`) ที่อัปเดตสต๊อกสินค้า + บันทึกรายการพร้อมกันในทีเดียว เหมือน Supabase function เดิม

ถ้าจะเพิ่มตารางใหม่ในอนาคต ให้เพิ่ม schema ใน `db.js` และเพิ่มชื่อตารางใน `KNOWN_TABLES` ที่ `local-rest.js`

## สิ่งที่ต้องมีก่อนเริ่ม (ทำบนคอม)

1. [Node.js](https://nodejs.org) (LTS)
2. [Android Studio](https://developer.android.com/studio) — **หรือไม่มีก็ได้** ใช้ GitHub Actions build แทน (ดูด้านล่าง)

## ขั้นตอน Build (ถ้ามี Android Studio)

```bash
npm install
npx cap add android
npx cap sync android
npx cap open android
```

## ไม่มี Android Studio — ให้ GitHub Actions build ให้ (ฟรี)

โปรเจกต์นี้มี `.github/workflows/build-android.yml` พร้อมแล้ว วิธีเดียวกับโปรเจกต์ก่อนหน้า:

1. สร้าง repo บน GitHub แล้วอัปโหลดโฟลเดอร์นี้ทั้งหมด (รวมโฟลเดอร์ที่ขึ้นต้นด้วยจุด `.github`)
2. เข้าแท็บ **Actions** — รอ build เสร็จ (~5-10 นาที)
3. ดาวน์โหลด artifact `app-debug-apk` → แตกไฟล์ → ติดตั้ง `.apk`

## ข้อควรรู้: ข้อมูลอยู่ในเครื่องเดียว

ไม่มี cloud sync เหมือนเดิม — ถ้าอยากสำรองข้อมูล จะต้องเพิ่มฟีเจอร์ Export (เหมือนแอพ "รับซื้อ-ขาย" แบบง่ายก่อนหน้า) แจ้งได้ถ้าอยากให้เพิ่มให้

## โครงสร้างไฟล์

```
scrappos_local/
├── capacitor.config.json
├── package.json
├── .github/workflows/build-android.yml
├── www/
│   ├── index.html            → redirect เข้า pages/buy.html ทันที (ไม่มี login)
│   ├── pages/
│   │   ├── buy.html
│   │   ├── sell.html
│   │   ├── sort.html
│   │   ├── items.html
│   │   └── dashboard.html
│   ├── js/
│   │   ├── db.js              ← ใหม่: เปิด SQLite + สร้างตาราง
│   │   ├── local-rest.js      ← ใหม่: แปล REST/RPC เดิมให้วิ่งบน SQLite
│   │   ├── buy.js, sell.js, sort.js, items.js, dashboard.js  (ของเดิม แก้แค่จุดเชื่อมข้อมูล)
│   │   └── supabase.js        (ของเดิม เหลือไว้เป็น placeholder เฉยๆ)
│   └── css/
└── android/                   จะถูกสร้างหลังรัน `npx cap add android`
```
