export const HANDLE_REGEX = /^[a-zA-Z0-9_-]{1,24}$/;

export interface ValidationResult {
  valid: boolean;
  error: string | null;
}

/**
 * Extracts a handle from a Codeforces profile URL, or returns the raw input.
 * Per spec: url.split('/profile/')[1]?.split('/')[0]; if that yields empty,
 * fall back to the raw input.
 */
export function extractHandle(input: string): string {
  const trimmed = input.trim();
  if (trimmed.includes('/profile/')) {
    const extracted = trimmed.split('/profile/')[1]?.split('/')[0]?.split('?')[0];
    if (extracted) return extracted;
  }
  return trimmed;
}

export function validateHandle(input: string): ValidationResult {
  const handle = input.trim();
  if (handle.length === 0) {
    return { valid: false, error: 'Please enter a Codeforces handle.' };
  }
  if (handle.length > 24) {
    return { valid: false, error: 'Handle must be at most 24 characters.' };
  }
  if (!HANDLE_REGEX.test(handle)) {
    return {
      valid: false,
      error: 'Handle may only contain letters, numbers, underscores, and hyphens.',
    };
  }
  return { valid: true, error: null };
}
