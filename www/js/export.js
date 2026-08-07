// ══════════════════════════════════════════
//  export.js — สำรองข้อมูลเป็นไฟล์ JSON
//  เพราะฐานข้อมูลอยู่ในเครื่องเดียว ไม่มี cloud sync
//  ใช้ @capacitor/filesystem + @capacitor/share
// ══════════════════════════════════════════

async function exportAllData() {
  try {
    const items = await DB.getItems();
    const txs = await DB.getAllTransactions();
    const payload = { exported_at: new Date().toISOString(), items, transactions: txs };
    const json = JSON.stringify(payload, null, 2);
    const fileName = `scrap_backup_${new Date().toISOString().slice(0,10)}.json`;

    const Filesystem = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem;
    const Share = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Share;

    if (Filesystem) {
      const result = await Filesystem.writeFile({
        path: fileName,
        data: json,
        directory: 'CACHE',
        encoding: 'utf8'
      });
      if (Share) {
        await Share.share({ title: 'สำรองข้อมูล', url: result.uri });
      } else {
        toast('✅ บันทึกไฟล์แล้ว: ' + fileName);
      }
    } else {
      // fallback บนเบราว์เซอร์ปกติ (ไม่ใช่แอพ native)
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }
  } catch (e) {
    console.error(e);
    toast('❌ Export ไม่สำเร็จ: ' + e.message);
  }
}
