export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Returns an error message for a weak or invalid password, or null when it is acceptable. */
export function passwordError(password) {
  if (typeof password !== 'string' || password.length < 8) return 'Use at least 8 characters';
  if (password.length > 128) return 'Use 128 characters or fewer';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Mix letters and numbers';
  return null;
}
