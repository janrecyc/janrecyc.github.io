# VPN App Template

เทมเพลตแอพ VPN (หน้า UI) ที่บิ้วเป็น APK ได้อัตโนมัติผ่าน GitHub Actions

## โครงสร้างเมนู (ตามภาพ)
- หน้าหลัก — `www/index.html`
- ประเทศ — `www/country.html`
- โปรไฟล์ — `www/profile.html`
- การตั้งค่า — `www/settings.html`

## วิธีใช้งาน

### 1. ทดสอบในเบราว์เซอร์ก่อน
เปิดไฟล์ `www/index.html` ตรง ๆ ในเบราว์เซอร์ก็ดูหน้าตาได้เลย (เปิดจากเครื่องได้)

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

### 4. เปลี่ยนไอคอน / ชื่อแอพ / appId
แก้ที่ `capacitor.config.json` (`appId`, `appName`) ก่อน push ครั้งแรก
เปลี่ยนไอคอนจริงทีหลังได้ที่ `android/app/src/main/res/mipmap-*`

## หมายเหตุ
โค้ดนี้เป็น **เทมเพลต UI เปล่า ๆ** เท่านั้น (ปุ่มเชื่อมต่อเป็นแค่ mock, ยังไม่ได้ต่อ VPN protocol จริง) ต้องเพิ่ม native plugin (เช่น WireGuard/OpenVPN SDK) เองถ้าจะใช้งานจริง
