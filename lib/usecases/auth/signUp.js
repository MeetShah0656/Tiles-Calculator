export async function signUp({ email, password, businessName, phoneNumber }) {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, businessName, phoneNumber })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data?.error || 'Sign up failed. Please try again.' };
  }
  return { ok: true, user: data.user };
}
