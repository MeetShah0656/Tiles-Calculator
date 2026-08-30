export async function getCurrentUser() {
  const res = await fetch('/api/auth/session');
  const data = await res.json().catch(() => ({ user: null }));
  return data.user || null;
}
