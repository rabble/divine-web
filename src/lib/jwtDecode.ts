// ABOUTME: JWT token decoding utility for extracting expiration and claims
// ABOUTME: Lightweight decoder without external dependencies

export interface JWTPayload {
  exp?: number; // Expiration time (seconds since epoch)
  iat?: number; // Issued at (seconds since epoch)
  sub?: string; // Subject (user ID)
  email?: string;
  [key: string]: any;
}

/**
 * Decode a JWT token and return its payload
 * @param token - JWT token string
 * @returns Decoded payload object
 */
export function decodeJWT(token: string): JWTPayload {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    // Decode the payload (second part)
    const payload = parts[1];

    // Base64 decode (URL-safe base64)
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));

    return JSON.parse(decoded);
  } catch (error) {
    throw new Error(`Failed to decode JWT: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get the expiration time from a JWT token
 * @param token - JWT token string
 * @returns Expiration timestamp in milliseconds, or null if no exp claim
 */
export function getJWTExpiration(token: string): number | null {
  try {
    const payload = decodeJWT(token);
    if (!payload.exp) return null;

    // JWT exp is in seconds, convert to milliseconds
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

/**
 * Check if a JWT token is expired
 * @param token - JWT token string
 * @returns true if expired, false if still valid
 */
export function isJWTExpired(token: string): boolean {
  const expiration = getJWTExpiration(token);
  if (!expiration) return true; // No expiration claim = treat as expired

  return Date.now() >= expiration;
}
