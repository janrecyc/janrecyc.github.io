// ══════════════════════════════════════════
//  capacitor-bridge.js — helper แจ้งเตือนแบบ native (optional)
//  ถ้าไม่ได้ติดตั้ง plugin แจ้งเตือน จะไม่ error แค่ข้ามไปเฉยๆ
// ══════════════════════════════════════════
const CapBridge = (() => {
  function isNative() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  }
  let notifId = 1;
  async function notify(title, body) {
    if (!isNative() || !window.Capacitor.Plugins.LocalNotifications) return;
    try {
      await window.Capacitor.Plugins.LocalNotifications.schedule({
        notifications: [{ id: notifId++, title, body, schedule: { at: new Date(Date.now() + 200) } }]
      });
    } catch (e) { /* plugin ยังไม่ได้ติดตั้งก็ไม่เป็นไร */ }
  }
  return { isNative, notify };
})();
