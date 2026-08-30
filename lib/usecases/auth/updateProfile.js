export async function updateProfile({ businessName, phoneNumber }) {
  const res = await fetch('/api/auth/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ businessName, phoneNumber })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data?.error || 'Failed to update profile.' };
  }
  return { ok: true, user: data.user };
}
