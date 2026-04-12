export type SecretType = 'token' | 'password' | 'api-key' | 'jwt-secret';

const ALPHA_NUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const PASSWORD_CHARS = ALPHA_NUMERIC + '!@#$%^&*()_+-=[]{}|;:,.<>?';
const URL_SAFE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function randomFromCharset(charset: string, length: number): string {
  const bytes = randomBytes(length);
  return Array.from(bytes)
    .map((b) => charset[b % charset.length])
    .join('');
}

export function generateToken(length: number): string {
  return randomFromCharset(ALPHA_NUMERIC, length);
}

export function generatePassword(length: number): string {
  // Ensure at least one of each type
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (length < 4) {
    return randomFromCharset(PASSWORD_CHARS, length);
  }

  // Start with one guaranteed char of each type
  const required = [
    upper[randomBytes(1)[0] % upper.length],
    lower[randomBytes(1)[0] % lower.length],
    digits[randomBytes(1)[0] % digits.length],
    symbols[randomBytes(1)[0] % symbols.length],
  ];

  // Fill the rest
  const rest = randomFromCharset(PASSWORD_CHARS, length - 4);

  // Shuffle the combined result
  const combined = [...required, ...rest];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = randomBytes(1)[0] % (i + 1);
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  return combined.join('');
}

export function generateApiKey(prefix = 'sk'): string {
  const bytes = randomBytes(32);
  const base64 = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${prefix}_${base64}`;
}

export function generateJwtSecret(length: number): string {
  return randomFromCharset(URL_SAFE, length);
}

export function generateSecret(type: SecretType, length: number): string {
  switch (type) {
    case 'token':
      return generateToken(length);
    case 'password':
      return generatePassword(length);
    case 'api-key':
      return generateApiKey();
    case 'jwt-secret':
      return generateJwtSecret(length);
  }
}

export function getSecretStrength(secret: string): 'weak' | 'medium' | 'strong' {
  const length = secret.length;
  const hasUpper = /[A-Z]/.test(secret);
  const hasLower = /[a-z]/.test(secret);
  const hasDigit = /\d/.test(secret);
  const hasSymbol = /[^A-Za-z0-9]/.test(secret);
  const charTypes = [hasUpper, hasLower, hasDigit, hasSymbol].filter(Boolean).length;

  if (length >= 32 && charTypes >= 3) return 'strong';
  if (length >= 16 && charTypes >= 2) return 'medium';
  return 'weak';
}
