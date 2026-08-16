// ══════════════════════════════════════════
//  shop-brand.js
//  อัปเดตชื่อร้านที่โชว์บน header (.app-name) ทุกหน้า ให้ตรงกับ
//  ชื่อที่ตั้งไว้ในเมนู "ข้อมูลร้าน" (ตาราง profiles) แทนคำว่า "ScrapPOS" ตายตัว
//  ต้องโหลดหลัง local-rest.js (ใช้ฟังก์ชัน localRest() ร่วมกัน)
// ══════════════════════════════════════════
(async function () {
  try {
    const rows = await localRest('profiles?is_active=eq.true&order=id&limit=1');
    if (!rows || !rows.length) return;
    const p = rows[0];
    if (p.name) {
      document.querySelectorAll('.app-name').forEach(el => { el.textContent = p.name; });
    }
    if (p.logo) {
      document.querySelectorAll('.logo-mark').forEach(el => {
        el.innerHTML = `<img src="${p.logo}" alt="โลโก้ร้าน" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`;
      });
    }
  } catch (e) { console.warn('shop-brand:', e); }
})();
