/* ============================================================
   auth/pin-hash.js — hashes a 6-digit PIN with a per-user random
   salt using PBKDF2-SHA256 (Web Crypto API) with many iterations,
   so brute-forcing a 6-digit PIN (1,000,000 combinations) from a
   stolen pin_hash/pin_salt pair takes real time instead of well
   under a second. Never store or compare a raw PIN — only
   hashPin(pin, salt) output.

   ⚠️ BREAKING CHANGE FROM PLAIN SHA-256: earlier versions of this
   file used a single SHA-256 round, which a modern computer can
   brute-force across all 1,000,000 six-digit PINs in well under a
   second per user if the database file leaks. This version is
   deliberately slow instead — a hash produced by the old version
   will NOT verify against this one. There are no real staff PINs
   in this template yet (only the seeded demo PIN, 000000), so
   there's nothing to migrate here — but if you're updating a shop
   that already has real PINs stored, every user needs their PIN
   reset via "จัดการผู้ใช้งาน" after deploying this change (old
   pin_hash values in the DB become permanently unverifiable).

   Available everywhere as window.AuthPinHash.{generateSalt, hashPin}
   ============================================================ */
(function () {
  // OWASP's 2023 floor recommendation for PBKDF2-HMAC-SHA256. Higher
  // = slower to brute-force, but also slower on the device itself —
  // this is still well under ~100ms on typical phone hardware for a
  // single PIN entry, so it's not noticeable in the UI. If a real
  // device test shows this feels slow on low-end hardware, this is
  // the one number to turn down — never remove the iteration loop
  // entirely (that's what put the app back at plain-SHA-256 risk).
  const PBKDF2_ITERATIONS = 210000;

  function generateSalt() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }

  async function hashPin(pin, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(pin),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: enc.encode(salt),
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      256 // 256-bit output — same length as the old SHA-256 digest
    );
    return Array.from(new Uint8Array(bits), b => b.toString(16).padStart(2, '0')).join('');
  }

  window.AuthPinHash = { generateSalt, hashPin };
})();
