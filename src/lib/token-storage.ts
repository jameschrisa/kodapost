import { cookies } from "next/headers";
import crypto from "crypto";

// -----------------------------------------------------------------------------
// Token Data Structure
// -----------------------------------------------------------------------------

export interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  platformUserId?: string;
  platformUsername?: string;
  platformDisplayName?: string;
  connectedAt: string;
}

// -----------------------------------------------------------------------------
// Encryption (AES-256-GCM)
// -----------------------------------------------------------------------------

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "Missing TOKEN_ENCRYPTION_KEY environment variable. " +
        "Generate one with: openssl rand -hex 32"
    );
  }
  return Buffer.from(key, "hex");
}

export function encryptToken(data: TokenData): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const json = JSON.stringify(data);
  let encrypted = cipher.update(json, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decryptToken(encrypted: string): TokenData | null {
  try {
    const key = getEncryptionKey();
    const [ivHex, authTagHex, data] = encrypted.split(":");

    if (!ivHex || !authTagHex || !data) return null;

    // Validate expected hex string lengths: IV = 16 bytes = 32 hex chars, auth tag = 16 bytes = 32 hex chars
    if (ivHex.length !== 32 || authTagHex.length !== 32) return null;

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(data, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return JSON.parse(decrypted) as TokenData;
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// Cookie Management
// -----------------------------------------------------------------------------

const COOKIE_PREFIX = "nf_token_";
const MAX_AGE_DAYS = 90;

export function setTokenCookie(platform: string, tokenData: TokenData): void {
  const cookieStore = cookies();
  const encrypted = encryptToken(tokenData);

  cookieStore.set(`${COOKIE_PREFIX}${platform}`, encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_DAYS * 24 * 60 * 60,
    path: "/api",
  });
}

export function getTokenCookie(platform: string): TokenData | null {
  const cookieStore = cookies();
  const cookie = cookieStore.get(`${COOKIE_PREFIX}${platform}`);

  if (!cookie?.value) return null;
  return decryptToken(cookie.value);
}

export function clearTokenCookie(platform: string): void {
  const cookieStore = cookies();
  cookieStore.delete(`${COOKIE_PREFIX}${platform}`);
}

export function isTokenExpired(tokenData: TokenData): boolean {
  if (!tokenData.expiresAt) return false;
  return new Date(tokenData.expiresAt) < new Date();
}
