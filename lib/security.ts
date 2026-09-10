/**
 * lib/security.ts
 * 
 * Password hashing and cryptographic utilities for Pinnacle Distributing.
 * Uses bcryptjs with salt rounds 12 for strong security and 100% pure JavaScript cross-platform compatibility.
 */

import bcrypt from "bcryptjs";
import crypto from "crypto";

export const BCRYPT_SALT_ROUNDS = 12;

/**
 * Hashes a plaintext password using bcryptjs with 12 salt rounds.
 * 
 * @param password - Plaintext password string.
 * @returns Promise<string> - The generated bcrypt hash.
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== "string") {
    throw new Error("Password must be a non-empty string");
  }
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters in length");
  }
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Compares a plaintext password against a stored bcrypt hash.
 * 
 * @param plainTextPassword - Plaintext candidate password.
 * @param passwordHash - Stored bcrypt hash from database.
 * @returns Promise<boolean> - True if matches, false otherwise.
 */
export async function comparePassword(
  plainTextPassword: string | null | undefined,
  passwordHash: string | null | undefined
): Promise<boolean> {
  if (!plainTextPassword || !passwordHash) {
    return false;
  }
  try {
    return await bcrypt.compare(plainTextPassword, passwordHash);
  } catch (error) {
    console.error("[Security] bcrypt compare error:", error);
    return false;
  }
}

/**
 * Generates a cryptographically secure random token (e.g. for email verification, password reset, or session tokens).
 * 
 * @param bytes - Number of random bytes (default: 32 -> 64 hex characters).
 * @returns Hex-encoded random string.
 */
export function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Masks sensitive credential strings (such as SMTP App Passwords) for safe display in admin views.
 * Example: "abcdefghijklmnop" -> "••••••••••••mnop"
 * 
 * @param val - The sensitive string to mask.
 * @param visibleSuffixChars - Number of unmasked trailing characters (default: 4).
 * @returns Masked string.
 */
export function maskSensitiveString(
  val: string | null | undefined,
  visibleSuffixChars: number = 4
): string {
  if (!val) return "••••••••••••";
  if (val.length <= visibleSuffixChars) return "••••••••••••";
  const maskedLength = Math.max(8, val.length - visibleSuffixChars);
  const mask = "•".repeat(maskedLength);
  const suffix = val.slice(-visibleSuffixChars);
  return `${mask}${suffix}`;
}

/**
 * Sanitizes input strings to prevent basic injection and clean unwanted control characters.
 * 
 * @param input - Raw input string.
 * @returns Trimmed, sanitized string.
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input) return "";
  return input.trim().replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, "");
}
