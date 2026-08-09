# ScrapPOS — เวอร์ชันฐานข้อมูลในเครื่อง (offline เต็มรูปแบบ)

แปลงจาก ScrapPOS เดิม (Supabase) มาเป็น **SQLite ในเครื่อง** ทั้งหมด ใช้งานคนเดียว ไม่ต้องมีเน็ต ไม่มีระบบ login

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

## แก้ไขล่าสุด (debug pass)

- **ข้อมูลเริ่มต้น**: `db.js` จะ seed หมวดหมู่ 5 หมวด + สินค้า 13 รายการ + โรงงาน 4 แห่งให้อัตโนมัติตอนเปิดแอพครั้งแรก (ครั้งเดียว ถ้าตารางว่าง) แก้ปัญหาเปิดแอพครั้งแรกแล้วไม่มีอะไรให้เลือก
- **โรงงาน**: ฟีเจอร์ "แก้ไขชื่อโรงงาน" ในหน้าขายออก เปลี่ยนจากเก็บใน `localStorage` มาบันทึกลงตาราง `factories` ใน SQLite โดยตรง ให้สอดคล้องกับข้อมูลส่วนอื่นๆ ของแอพ
- **ลบโค้ดที่ตายแล้ว**: เอาระบบ "อนุมัติรีวิว" (`reviews` table + UI ใน dashboard) ที่ควรถูกตัดไปตั้งแต่ต้นแต่ตกค้างอยู่ออกทั้งหมด
- **ตำแหน่งร้าน (GPS)**: เปลี่ยนไปใช้ `@capacitor/geolocation` (เพิ่มใน `package.json`) แทน `navigator.geolocation` ตรงๆ เพื่อให้ขอ permission บน Android ได้ถูกต้อง — ต้องรัน `npm install` ใหม่ก่อน sync
- **แก้ id type-safety** ในหน้าจัดการสินค้า (`items.js`) ให้เทียบ id แบบ `Number()` เสมอ กันปัญหาแก้ไข/ลบสินค้าไม่ได้เงียบๆ
- ลบการเรียกซ้ำซ้อนของ `loadCashBalance()` หลังบันทึกรับซื้อ
- **พิมพ์ใบเสร็จ**: `window.print()` ใช้ไม่ได้ใน Android WebView — เปลี่ยนปุ่ม "พิมพ์ใบเสร็จ/ใบส่ง" ไปใช้ `@capacitor/share` (เพิ่มใน `package.json`) เปิด native share sheet แทน ให้ส่งไปแอปพิมพ์ Bluetooth (เช่น RawBT) หรือแชร์ผ่านไลน์/อีเมลได้
- **หน้าโปรไฟล์**: ลบ "อีเมล / สมัครเมื่อ / เข้าสู่ระบบล่าสุด / User ID" ที่เป็นข้อมูลปลอมจากระบบ auth เดิม (แอพนี้ไม่มีระบบ login) ออก — เปลี่ยนไปแสดงชื่อร้านจากตาราง `profiles` แทน
- **เพิ่มหน้า "ประวัติการซื้อขาย" ใหม่** (`history.html`) — ไทม์ไลน์เลื่อนดูรายการรับซื้อ/ขายออก/คัดแยก/เติม-ถอนเงินทั้งหมด จัดกลุ่มตามวันที่ กดแต่ละรายการเพื่อดูรายละเอียดเต็ม เข้าถึงได้จากเมนูโปรไฟล์ (ไอคอนมุมขวาบนของ Dashboard)
- **ออกแบบไอคอนแอพใหม่** (`resources/android-icon/`) — อัปเดตเป็นดีไซน์ล่าสุด: ถุงของเก่าวางบนตาชั่งดิจิทัล ล้อมด้วยลูกศรรีไซเคิลสีส้มบนพื้นกรมท่า พร้อมโลโก้ ScrapPOS ครบทั้ง legacy icon และ adaptive icon (Android 8.0+ ใช้เลเยอร์ `@drawable/ic_launcher_background` + `@drawable/ic_launcher_foreground`) ทุก density — เห็นตัวอย่างได้ที่ `resources/icon-preview.png` — workflow จะคัดลอกเข้าไปแทนที่ไอคอน default ให้อัตโนมัติทุกครั้งที่ build (ขั้นตอน "Apply custom app icon")

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
