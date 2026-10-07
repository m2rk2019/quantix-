/**
 * Map Supabase Auth / network failures to safe user-facing login messages.
 * Never include secrets, stack traces, or raw env values.
 */

export function isNetworkAuthFailure(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const record = error as {
    name?: string;
    message?: string;
    status?: number;
  };

  if (record.name === 'AuthRetryableFetchError') {
    return true;
  }

  const message = (record.message ?? '').toLowerCase();
  if (
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('load failed') ||
    message.includes('network request failed') ||
    message.includes('fetch failed') ||
    message.includes('upstream connect error') ||
    message.includes('error code 521') ||
    message.includes('503') ||
    message.includes('502')
  ) {
    return true;
  }

  // Transport / origin-down statuses from Auth client.
  if (
    typeof record.status === 'number' &&
    (record.status === 0 ||
      record.status === 502 ||
      record.status === 503 ||
      record.status === 521 ||
      record.status === 522 ||
      record.status === 524)
  ) {
    return true;
  }

  return false;
}

export function getLoginErrorMessage(error: unknown): string {
  if (isNetworkAuthFailure(error)) {
    return 'Unable to reach authentication services. Your Supabase project may be paused or unreachable. Restore it in the Supabase Dashboard, then try again.';
  }

  if (error && typeof error === 'object') {
    const message = String((error as { message?: string }).message ?? '').toLowerCase();
    if (
      message.includes('invalid login credentials') ||
      message.includes('invalid email or password') ||
      message.includes('email not confirmed')
    ) {
      return 'Invalid email or password';
    }
  }

  return 'Invalid email or password';
}
