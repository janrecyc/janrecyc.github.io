# VPN App Template

เทมเพลตแอพ VPN (หน้า UI) ที่บิ้วเป็น APK ได้อัตโนมัติผ่าน GitHub Actions
โครงสร้างเป็นแบบ **data-driven** — เพิ่มเมนู/รายการ/ข้อมูลในอนาคตได้โดยแก้ไฟล์ data เพียงไฟล์เดียว ไม่ต้องรื้อ HTML/CSS ที่มีอยู่

## โครงสร้างโปรเจกต์

```
www/
├── index.html          หน้าหลัก (shell — โครงเปล่า พร้อมใส่เนื้อหา)
├── country.html         ประเทศ  (ดึงข้อมูลจาก data/countries.js)
├── profile.html          โปรไฟล์ (shell)
├── settings.html         การตั้งค่า (ดึงข้อมูลจาก data/settings.js)
│
├── css/
│   ├── tokens.css        สีธีม / ตัวแปรสว่าง-มืด — เพิ่มธีมใหม่ที่นี่
│   ├── layout.css        โครง app shell (แทบไม่ต้องแก้)
│   ├── nav.css           แถบเมนูล่าง/ข้าง (responsive)
│   └── components.css    ชิ้นส่วน UI ที่ใช้ซ้ำ (แถวรายการ, สวิตช์ ฯลฯ)
│
├── js/
│   ├── theme.js           จัดการสว่าง/มืด (ผูกกับสวิตช์อัตโนมัติไม่ว่าจะ render จากไหน)
│   ├── data/               ★ ที่ใส่ "ข้อมูล" ในอนาคต
│   │   ├── nav.js          รายการเมนูล่าง/ข้าง — เพิ่มแท็บใหม่ที่นี่
│   │   ├── settings.js     รายการในหน้าตั้งค่า — เพิ่มแถวใหม่ที่นี่
│   │   ├── countries.js    รายชื่อประเทศ (ว่างไว้ก่อน) — เพิ่มประเทศที่นี่
│   │   └── country-filters.js  4 ชิป (ทั้งหมด/Secure Core/P2P/Tor)
│   ├── components/         ★ ตัว render ข้อมูลเป็น HTML (ปกติไม่ต้องแก้)
│   │   ├── nav.js
│   │   ├── settings-list.js
│   │   ├── country-list.js
│   │   ├── country-filters.js
│   │   └── search-bar.js   ปุ่มค้นหา + ช่องค้นหาที่ยุบ/ขยายได้ (ใช้ซ้ำได้ทุกหน้า)
│   └── pages/               ★ ตัวเชื่อม data+component เฉพาะหน้า
│       └── country-page.js  ผูกค้นหา + ฟิลเตอร์ + รายการเข้าด้วยกัน
│
└── assets/icons/          ไอคอน/รูปในอนาคต
```

### หน้าประเทศ — โครงที่วางไว้สำหรับ 4 เมนูย่อย

หน้าประเทศตอนนี้มี: ปุ่มค้นหา (มุมขวาบน) + แถบชิป 4 ปุ่ม (ทั้งหมด / Secure Core / P2P / Tor) + รายการประเทศ ที่กรองตามชิปที่เลือกและคำค้นหาพร้อมกัน

- **ตอนนี้**: กดชิปแค่กรองรายการเดิม (client-side filter) เพราะยังไม่มีข้อมูลจริง
- **เพิ่มประเทศ**: ใส่ `tags: ['p2p']` ในแต่ละ object ที่ `js/data/countries.js` ให้ตรงกับ `tag` ใน `js/data/country-filters.js`
- **ถ้าต้องการให้แต่ละชิปเป็น "หน้าย่อย" จริง ๆ** (ดีไซน์/เนื้อหาต่างกันไปเลย ไม่ใช่แค่กรองรายการ) จุดที่ต้องแก้มีจุดเดียวคือ `js/pages/country-page.js` — ฟังก์ชัน `applyView()` เปลี่ยนจาก filter ธรรมดาเป็น router สลับเนื้อหาตามแท็บที่เลือกได้เลย ไม่กระทบไฟล์อื่น


## เพิ่มข้อมูลในอนาคตยังไง (ไม่ต้องรื้อระบบ)

**เพิ่มประเทศ** → แก้ `js/data/countries.js` เติม object ในอาเรย์ เช่น
```js
{ flag: '🇺🇸', name: 'สหรัฐอเมริกา', ping: '28 ms' }
```
หน้า `country.html` จะ render ให้เองอัตโนมัติ

**เพิ่มรายการตั้งค่า** → แก้ `js/data/settings.js` เติม object ใหม่ ระบุ `type` เป็น `toggle` / `value` / `link`

**เพิ่มแท็บเมนูใหม่** → แก้ `js/data/nav.js` เติมแท็บ แล้วสร้างไฟล์หน้าใหม่ (คัดลอกโครงจาก `profile.html` เป็นต้นแบบ) ทุกหน้าจะเห็นแท็บใหม่ทันทีเพราะเมนูโหลดจากไฟล์เดียวกัน

**เพิ่ม type ใหม่ที่ settings ยังไม่รองรับ** → แก้ที่ `js/components/settings-list.js` จุดเดียว (เพิ่ม `case` ใน switch)

## วิธีใช้งาน

### 1. ทดสอบในเบราว์เซอร์ก่อน
เปิดไฟล์ `www/index.html` ตรง ๆ ในเบราว์เซอร์ก็ดูหน้าตาได้เลย

### 2. อัปโหลดขึ้น GitHub
```bash
git init
git add .
git commit -m "init vpn app template"
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

### 3. ให้ GitHub Actions บิ้วให้อัตโนมัติ
พอ push ขึ้น branch `main` เวิร์กโฟลว์ `.github/workflows/build.yml` จะรันเอง:
- ติดตั้ง Node + JDK
- เพิ่ม Android platform ด้วย Capacitor (`npx cap add android`)
- sync ไฟล์เว็บเข้าโปรเจกต์ Android
- บิ้ว `app-debug.apk`
- อัปโหลดเป็น Artifact ให้โหลดจากแท็บ **Actions** ของ repo

ไม่ต้องมีเครื่อง Android Studio เองก็บิ้วได้ เพราะรันบนเครื่อง GitHub

### 4. รองรับทุกอุปกรณ์/การหมุนจอ
เลย์เอาต์เป็นแบบ responsive เต็มรูปแบบ ไม่ได้ล็อกทิศทางใด ๆ:
- **แนวตั้ง (มือถือ)** — เมนูอยู่แถบล่าง
- **แนวนอน / แท็บเล็ต / จอกว้าง** — เมนูย้ายไปเป็นแถบข้างซ้ายอัตโนมัติ เนื้อหาขยายเต็มพื้นที่ที่เหลือ
- ใช้ `env(safe-area-inset-*)` ทุกด้าน รองรับรอยบาก/แถบนำทางท่าทาง

ปรับ breakpoint ได้ที่ `www/css/layout.css` และ `www/css/nav.css` ส่วน `@media (orientation: landscape)`

### 5. เปลี่ยนไอคอน / ชื่อแอพ / appId
แก้ที่ `capacitor.config.json` (`appId`, `appName`) ก่อน push ครั้งแรก
เปลี่ยนไอคอนจริงทีหลังได้ที่ `android/app/src/main/res/mipmap-*`

## หมายเหตุ
โค้ดนี้เป็น **เทมเพลต UI เปล่า ๆ** เท่านั้น (ปุ่มเชื่อมต่อเป็นแค่ mock, ยังไม่ได้ต่อ VPN protocol จริง) ต้องเพิ่ม native plugin (เช่น WireGuard/OpenVPN SDK) เองถ้าจะใช้งานจริง
