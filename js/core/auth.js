// js/core/auth.js

import {
  signIn,
  signOut,
  getSession,
  getUserProfile
} from './api.js';

let currentUser = null;

export async function login(email, password) {
  const result = await signIn(email, password);
  const user = result.user;

  const profile = await getUserProfile(user.id);

  currentUser = {
    ...user,
    profile
  };

  return currentUser;
}

export async function logout() {
  await signOut();
  currentUser = null;
  window.location.href = '/pages/login.html';
}

export async function getCurrentUser() {
  if (currentUser) return currentUser;

  const session = await getSession();
  if (!session) return null;

  const user = session.user;
  const profile = await getUserProfile(user.id);

  currentUser = {
    ...user,
    profile
  };

  return currentUser;
}

export function requireAuth() {
  return getCurrentUser().then(user => {
    if (!user) {
      window.location.href = '/pages/login.html';
      throw new Error('Unauthorized');
    }
    return user;
  });
}