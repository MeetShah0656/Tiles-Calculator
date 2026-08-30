export async function signOut() {
  const res = await fetch('/api/auth/signout', { method: 'POST' });
  return { ok: res.ok };
}
