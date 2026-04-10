export interface JwtHeader {
  alg: string;
  typ: string;
  [key: string]: unknown;
}

export interface JwtPayload {
  sub?: string;
  name?: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

export interface JwtDecoded {
  header: JwtHeader;
  payload: JwtPayload;
  signature: string;
}

export interface ExpirationStatus {
  isExpired: boolean;
  expiresAt: Date | null;
  timeLeft: string | null;
}

function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return decodeURIComponent(
    Array.from(atob(padded))
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join(''),
  );
}

export function decodeJwt(token: string): JwtDecoded {
  const parts = token.trim().split('.');

  if (parts.length !== 3) {
    throw new Error('Invalid JWT: token must have 3 parts');
  }

  try {
    const header = JSON.parse(base64UrlDecode(parts[0]));
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    const signature = parts[2];

    return { header, payload, signature };
  } catch {
    throw new Error('Invalid JWT: failed to decode token');
  }
}

export function checkExpiration(payload: JwtPayload): ExpirationStatus {
  if (!payload.exp) {
    return { isExpired: false, expiresAt: null, timeLeft: null };
  }

  const expiresAt = new Date(payload.exp * 1000);
  const now = new Date();
  const isExpired = now > expiresAt;

  if (isExpired) {
    return { isExpired: true, expiresAt, timeLeft: null };
  }

  const diff = expiresAt.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return {
    isExpired: false,
    expiresAt,
    timeLeft: `${days}d ${hours}h ${minutes}m`,
  };
}
