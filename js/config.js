// js/config.js
// ดึง Supabase จาก CDN ที่รองรับ ES Modules
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ⚠️ เถ้าแก่ต้องเอา URL และ Anon Key จากเว็บ Supabase (Project Settings -> API) มาใส่ตรงนี้นะครับ
const supabaseUrl = 'https://aaapxrvrlllsesglkmbq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhYXB4cnZybGxsc2VzZ2xrbWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDgxOTksImV4cCI6MjA5MjA4NDE5OX0.2YvQpokcdGD3p8YKL_CcysqNsN4re-bDYAqLFF3C0YE';

export const supabase = createClient(supabaseUrl, supabaseKey);
