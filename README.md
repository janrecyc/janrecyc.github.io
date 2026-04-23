Scrap Yard POS — Supabase Multi-Page POS System

ระบบ POS ร้านรับซื้อของเก่า (Scrap Yard)
สร้างด้วย HTML + Tailwind + JavaScript + Supabase

รองรับการใช้งานจริงแบบ Multi-User + Online Database

---

Features

- ระบบ Login (Supabase Auth)
- POS ซื้อสินค้า
- ระบบคลังสินค้า (Items)
- ระบบลูกค้า (Customers)
- Stock อัปเดตอัตโนมัติ
- Multi-Page UI
- Responsive Mobile
- Sidebar Toggle
- Supabase Database จริง

---

Screens

- Login Page
- Dashboard POS
- Items (คลังสินค้า)
- Customers (ลูกค้า)

---

Tech Stack

Frontend

- HTML
- TailwindCSS
- Vanilla JavaScript

Backend

- Supabase
- PostgreSQL
- Supabase Auth

---

Project Structure

scrap-pos/

index.html
dashboard.html
items.html
customers.html

/js
config.js
login.js
auth.js
pos.js
items.js
customers.js
ui.js

/css
style.css

---

Installation

Clone Project

git clone https://github.com/yourusername/scrap-pos.git

เข้าโฟลเดอร์

cd scrap-pos

รัน local server

python -m http.server 8080

เปิด

http://localhost:8080

---

Supabase Setup

1. สร้าง Project Supabase
2. เปิด SQL Editor
3. วาง SQL จากไฟล์ "sql.txt"
4. กด Run

---

ตั้งค่า config.js

js/config.js

ใส่

const SUPABASE_URL = "YOUR_URL"
const SUPABASE_KEY = "YOUR_KEY"

---

Login System

ใช้ Supabase Auth

สร้าง user

Supabase
→ Authentication
→ Users
→ Add User

---

Database Tables

ระบบใช้ตาราง

- items
- customers
- transactions
- transaction_items

---

Stock Auto Update

ระบบใช้ Trigger

- BUY → stock เพิ่ม
- SELL → stock ลด

ทำงานอัตโนมัติใน Supabase

---

Pages

Dashboard

- ซื้อสินค้า
- คำนวณยอด
- บันทึกบิล

Items

- เพิ่มสินค้า
- ดู stock
- ตั้งราคา

Customers

- เพิ่มลูกค้า
- จัดเก็บข้อมูลลูกค้า

---

UI Features

- Sidebar toggle
- Responsive mobile
- Professional layout
- Multi-page navigation

---

Security

- Supabase Auth
- Row Level Security
- Session Listener

---

Future Features

- ใบเสร็จ
- รายงานยอดขาย
- Dashboard Summary
- Admin Role
- Barcode Scanner

---

Author

Developed by

Scrap Yard POS Project

---

License

Free for personal and commercial use
