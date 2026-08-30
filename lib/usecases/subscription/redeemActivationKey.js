export async function redeemActivationKey(key) {
  const res = await fetch('/api/activation/redeem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.success) {
    return { ok: false, error: data?.error || 'Failed to redeem activation key.' };
  }
  return { ok: true, message: data.message, planName: data.planName, expiresAt: data.expiresAt };
}
