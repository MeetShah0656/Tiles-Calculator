export async function cancelSubscription() {
  const res = await fetch('/api/subscription/cancel', { method: 'POST' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data?.error || 'Failed to cancel subscription.' };
  }
  return { ok: true };
}
