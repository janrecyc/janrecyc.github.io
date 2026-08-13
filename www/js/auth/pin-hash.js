/* ============================================================
   auth/pin-hash.js — hashes a 6-digit PIN with a per-user random
   salt using the Web Crypto API (SHA-256). Never store or compare
   a raw PIN — only hashPin(pin, salt) output.

   Available everywhere as window.AuthPinHash.{generateSalt, hashPin}
   ============================================================ */
(function () {
  function generateSalt() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }

  async function hashPin(pin, salt) {
    const data = new TextEncoder().encode(pin + salt);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  }

  window.AuthPinHash = { generateSalt, hashPin };
})();
