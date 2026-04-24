import { supabase } from "./supabase.js";

/**
 * Get current session
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error("Get session error:", error.message);
    return null;
  }

  return data.session;
}

/**
 * Login with email/password
 */
export async function login(email, password) {
  if (!email || !password) {
    throw new Error("Email และ Password จำเป็น");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw new Error(error.message);
  }

  return data.user;
}

/**
 * Logout
 */
export async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Logout error:", error.message);
  }
}

/**
 * Auth State Listener (Realtime)
 */
export function onAuthStateChange(callback) {
  supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}
