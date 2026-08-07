# รับซื้อ-ขายของเก่า — แอพง่ายๆ (ฐานข้อมูลในเครื่อง)

แอพ Android แบบง่าย ใช้คนเดียว **ไม่ต้องมีเน็ต ไม่ต้องมี Supabase** — ข้อมูลเก็บในฐานข้อมูล SQLite ที่อยู่ในเครื่องมือถือเอง

## หน้าจอ (ไม่มี Login)

1. **หน้าหลัก** — ปุ่มใหญ่ "รับซื้อ" / "ขายออก" + สรุปยอดวันนี้
2. **หน้าทำรายการ** — เลือกสินค้า (หรือเพิ่มสินค้าใหม่ตรงนี้เลย) → กรอกน้ำหนัก → ราคาต่อหน่วยดึงมาอัตโนมัติแต่แก้ได้ → บันทึก
3. **หน้าประวัติ** — ดูรายการทั้งหมด รวมยอด ลบรายการที่ผิดได้

## เรื่องสำคัญ: ข้อมูลอยู่ในเครื่องเดียว

- ไม่มี cloud sync — ถ้าเปลี่ยนเครื่อง/ลบแอพ ข้อมูลหาย
- มีปุ่ม **"Export ข้อมูล"** ที่หน้าหลัก กดแล้วจะสร้างไฟล์ `.json` สำรองข้อมูลทั้งหมด แล้วเปิดหน้าต่างแชร์ให้ส่งไฟล์ไปเก็บที่อื่น (เช่น LINE ตัวเอง, Google Drive) — แนะนำให้กดเป็นระยะเพื่อกันข้อมูลหาย

## สิ่งที่ต้องมีก่อนเริ่ม (ทำบนคอม)

1. [Node.js](https://nodejs.org) (LTS)
2. [Android Studio](https://developer.android.com/studio)

## ขั้นตอน Build (ถ้ามี Android Studio)

```bash
npm install
npx cap add android
npx cap sync android
npx cap open android
```

จากนั้นใน Android Studio กด Run ▶️ หรือ Build > Build APK(s)

ทุกครั้งที่แก้โค้ดในโฟลเดอร์ `www/` ต้องรัน `npx cap sync android` ใหม่ก่อน build

## ไม่มี Android Studio? ให้ GitHub Actions build ให้ (ฟรี)

โปรเจกต์นี้มีไฟล์ `.github/workflows/build-android.yml` เตรียมไว้แล้ว — ให้ GitHub เป็นคน build APK ให้บน cloud ไม่ต้องติดตั้งอะไรในเครื่องนอกจาก git

**ขั้นตอน (ทำครั้งเดียว)**

1. สมัคร/ล็อกอิน [github.com](https://github.com) แล้วสร้าง repository ใหม่ (private ก็ได้) เช่นชื่อ `simple-scrap-app`
2. อัปโหลดโฟลเดอร์นี้ทั้งหมดขึ้น repo — ถ้าไม่ถนัด command line ใช้วิธีลาก-วางไฟล์ผ่านหน้าเว็บ GitHub ได้เลย (ปุ่ม "Add file" → "Upload files")
   - หรือถ้าถนัด command line:
     ```bash
     cd simple_scrap_app
     git init
     git add .
     git commit -m "first commit"
     git branch -M main
     git remote add origin https://github.com/<username>/simple-scrap-app.git
     git push -u origin main
     ```
3. เข้าไปที่แท็บ **Actions** ในหน้า repo — GitHub จะเริ่ม build อัตโนมัติ (ใช้เวลาประมาณ 5-10 นาที)
4. เมื่อ build เสร็จ (เครื่องหมายถูกสีเขียว) กดเข้าไปในรายการ build นั้น เลื่อนลงไปที่ **Artifacts** จะเจอไฟล์ `app-debug-apk` กดดาวน์โหลด (เป็น .zip ข้างในมี `app-debug.apk`)
5. ส่งไฟล์ `.apk` เข้ามือถือ (ผ่าน LINE ตัวเอง, Google Drive, สาย USB) แล้วเปิดติดตั้ง — ต้องเปิด "อนุญาตติดตั้งจากแหล่งที่ไม่รู้จัก" ในมือถือก่อน (Android จะแจ้งเตือนให้เปิดเองตอนติดตั้ง)

**แก้โค้ดแล้วอยาก build ใหม่**: แค่ push โค้ดที่แก้ขึ้น GitHub อีกครั้ง (`git add . && git commit -m "update" && git push`) หรืออัปโหลดไฟล์ใหม่ทับผ่านหน้าเว็บ — workflow จะรันอัตโนมัติทุกครั้งที่ push เข้า branch `main`

## โครงสร้างไฟล์

```
simple_scrap_app/
├── capacitor.config.json
├── package.json
├── www/
│   ├── index.html          หน้าหลัก
│   ├── transaction.html    หน้ารับซื้อ/ขายออก
│   ├── history.html        หน้าประวัติ
│   ├── js/
│   │   ├── db.js            SQLite helper (ตาราง items, transactions)
│   │   ├── export.js        สำรองข้อมูลเป็นไฟล์ JSON
│   │   ├── common.js        toast, format ตัวเลข/เงิน
│   │   └── capacitor-bridge.js  แจ้งเตือน native (optional)
│   └── css/style.css
└── android/                 จะถูกสร้างหลังรัน `npx cap add android`
```

## ฐานข้อมูล (SQLite)

- `items` — สินค้า: ชื่อ, หน่วย, ราคารับซื้อ, ราคาขายออก
- `transactions` — ทุกรายการซื้อ/ขาย: ประเภท, ชื่อสินค้า, จำนวน, ราคา/หน่วย, ยอดรวม, เวลา

เพิ่มสินค้าได้จากปุ่ม "＋ เพิ่มสินค้าใหม่" ในหน้าทำรายการเลย ไม่ต้องมีหน้าจัดการสินค้าแยก

## ถ้าอยากได้ push/sync ในอนาคต

ถ้าวันหนึ่งมีหลายเครื่อง/หลายคนใช้ หรืออยากดูยอดจากที่อื่น สามารถย้ายไปใช้ Supabase (เหมือนโปรเจกต์ ScrapPOS เดิม) ได้ทีหลัง — โครงสร้างตาราง items/transactions ในนี้ออกแบบให้ map ไป schema แบบ cloud ได้ไม่ยาก
