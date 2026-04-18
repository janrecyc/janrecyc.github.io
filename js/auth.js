// js/auth.js
import { supabase } from './config.js';

// ฟังก์ชันเข้าสู่ระบบด้วย Email
export async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });
    return { data, error };
}

// ฟังก์ชันออกจากระบบ
export async function logout() {
    const { error } = await supabase.auth.signOut();
    return { error };
}

// ฟังก์ชันเช็คว่าเคย Login ไว้หรือยัง (Session ติดอยู่ไหม)
export async function checkSession() {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
}
