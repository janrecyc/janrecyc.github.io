import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// ⚠️ เปลี่ยนเป็นของจริงตอน deploy
const SUPABASE_URL = "https://aaapxrvrlllsesglkmbq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhYXB4cnZybGxsc2VzZ2xrbWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDgxOTksImV4cCI6MjA5MjA4NDE5OX0.2YvQpokcdGD3p8YKL_CcysqNsN4re-bDYAqLFF3C0YE";

// Guard ป้องกัน config ว่าง
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("Supabase config missing");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
