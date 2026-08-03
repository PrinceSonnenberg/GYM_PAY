import { auth } from '../src/lib/firebase.ts';

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
};
