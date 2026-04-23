// js/core/api.js

import { CONFIG } from '../config.js';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// ---------- AUTH ----------
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

// ---------- USERS ----------
export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

// ---------- PRICES ----------
export async function fetchPrices() {
  const { data, error } = await supabase
    .from('prices')
    .select(`
      *,
      items (
        id,
        name,
        category_id
      )
    `);

  if (error) throw error;
  return data;
}

export function subscribePrices(callback) {
  return supabase
    .channel('prices-channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'prices' },
      payload => callback(payload)
    )
    .subscribe();
}

// ---------- ITEMS ----------
export async function fetchItems() {
  const { data, error } = await supabase
    .from('items')
    .select('*');

  if (error) throw error;
  return data;
}

// ---------- TRANSACTIONS ----------
export async function createTransaction(payload) {
  // ⚠️ IMPORTANT:
  // แนะนำให้เปลี่ยนเป็น RPC ในอนาคต
  const { data, error } = await supabase
    .from('transactions')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function insertTransactionLines(lines) {
  const { error } = await supabase
    .from('transaction_lines')
    .insert(lines);

  if (error) throw error;
}

// ---------- INVENTORY ----------
export async function fetchLatestInventory(itemId) {
  const { data, error } = await supabase
    .from('inventory_ledger')
    .select('balance_weight')
    .eq('item_id', itemId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data?.balance_weight || 0;
}

// ---------- CASH ----------
export async function fetchCashBalance() {
  const { data, error } = await supabase
    .from('cash_flow')
    .select('balance')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data?.balance || 0;
}