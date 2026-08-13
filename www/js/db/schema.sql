-- ============================================================
-- db/schema.sql — member/user table for PIN-based login.
-- Run once by db.js on first app launch (CREATE TABLE IF NOT EXISTS,
-- safe to re-run every launch).
--
-- SECURITY NOTE: pin_hash is SHA-256(pin + pin_salt), never the raw
-- PIN. pin_salt is a random value generated per user at creation
-- time (see auth/pin-hash.js). This is appropriate for a
-- device-local, shared-device POS/shop app (staff PIN switching),
-- NOT a design for a public-facing multi-tenant login — there's no
-- server, no rate-limiting, no account lockout here. If this app
-- ever needs to defend against someone with physical access
-- brute-forcing a 6-digit PIN (only 1,000,000 combinations), add a
-- failed-attempt counter + lockout in db.js's verifyPin().
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'staff',   -- 'owner' | 'manager' | 'staff'
  avatar_icon   TEXT,                            -- emoji or icon key, shown on the picker button
  pin_hash      TEXT NOT NULL,                   -- SHA-256(pin + pin_salt), hex string
  pin_salt      TEXT NOT NULL,                   -- random hex string, unique per user
  active        INTEGER NOT NULL DEFAULT 1,      -- 0 = disabled, hidden from the login picker
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Example seed row (DO NOT ship real PINs like this — this is here
-- only to show the shape; db.js does NOT run this automatically).
-- The real pin_hash/pin_salt values must come from hashPin() in
-- auth/pin-hash.js, never typed in by hand.
--
-- INSERT INTO users (name, role, avatar_icon, pin_hash, pin_salt)
-- VALUES ('เจ้าของร้าน', 'owner', '👤', '<hash>', '<salt>');
