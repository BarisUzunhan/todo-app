const BASE = 'https://zkqdlyyjgmqzjyzvmyms.supabase.co';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcWRseXlqZ21xemp5enZteW1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2OTg2MTIsImV4cCI6MjA5MjI3NDYxMn0.MzNa_nrS33-74YVzXh_AKQa8fQ0VHV9iAV4q9dHnGdQ';

function headers(token) {
  return {
    apikey: ANON,
    Authorization: `Bearer ${token || ANON}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

async function post(path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(body),
  });
  return res.json();
}

/* ── AUTH ── */

export function signUp(email, password) {
  return post('/auth/v1/signup', { email, password });
}

export function verifyOtp(email, token) {
  return post('/auth/v1/verify', { type: 'signup', email, token });
}

export function signIn(email, password) {
  return post('/auth/v1/token?grant_type=password', { email, password });
}

export function refreshToken(refresh_token) {
  return post('/auth/v1/token?grant_type=refresh_token', { refresh_token });
}

export async function logout(accessToken) {
  await fetch(`${BASE}/auth/v1/logout`, {
    method: 'POST',
    headers: headers(accessToken),
  });
}

/* ── TODOS ── */

export async function fetchTodos(accessToken) {
  const res = await fetch(`${BASE}/rest/v1/todos?order=created_at.desc`, {
    headers: headers(accessToken),
  });
  return res.json();
}

export async function addTodo(accessToken, userId, text) {
  const res = await fetch(`${BASE}/rest/v1/todos`, {
    method: 'POST',
    headers: headers(accessToken),
    body: JSON.stringify({ text, done: false, user_id: userId }),
  });
  const data = await res.json();
  return data[0];
}

export async function toggleTodo(accessToken, id, currentDone) {
  const res = await fetch(`${BASE}/rest/v1/todos?id=eq.${id}`, {
    method: 'PATCH',
    headers: headers(accessToken),
    body: JSON.stringify({ done: !currentDone }),
  });
  const data = await res.json();
  return data[0];
}

export async function deleteTodo(accessToken, id) {
  await fetch(`${BASE}/rest/v1/todos?id=eq.${id}`, {
    method: 'DELETE',
    headers: headers(accessToken),
  });
}

export async function clearDoneTodos(accessToken, userId) {
  await fetch(`${BASE}/rest/v1/todos?done=eq.true&user_id=eq.${userId}`, {
    method: 'DELETE',
    headers: headers(accessToken),
  });
}
