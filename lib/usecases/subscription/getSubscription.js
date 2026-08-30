export async function getSubscription() {
  const res = await fetch('/api/subscription');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: data?.error || 'Failed to load subscription.' };
  }
  return { ok: true, subscription: data.subscription };
}
