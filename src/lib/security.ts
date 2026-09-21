/**
 * 📚 HOW THIS WORKS — Security Library (src/lib/security.ts)
 *
 * This file is the "security toolbox" for the whole website.
 * It provides reusable functions for:
 *   1. Password hashing with bcrypt + salt
 *   2. Input sanitization (blocks SQL injection & XSS)
 *   3. In-memory rate limiting (blocks brute-force attacks)
 *   4. CSRF token generation (prevents cross-site request forgery)
 *   5. Email validation
 *
 * Think of it like a security guard you can call from anywhere in the app.
 */

// ─── bcryptjs ─────────────────────────────────────────────────────────────────
// bcryptjs is a pure JavaScript implementation of the bcrypt algorithm.
// bcrypt is a "one-way" hashing function: you can turn a password INTO a hash,
// but you CANNOT turn the hash back into a password. To check if a password is
// correct, you hash it again and compare the result.
//
// SALT: A random string added to the password before hashing. This ensures that
// even if two users have the same password (e.g. "password123"), their hashes
// will be completely different. This defeats "rainbow table" attacks where
// attackers pre-compute hashes for common passwords.
//
// SALT ROUNDS: How many times bcrypt iterates its hashing algorithm. 12 rounds
// is the current security recommendation — it's slow enough to deter brute
// force attacks, but fast enough that real users won't notice the delay.
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hashes a plaintext password using bcrypt + a unique salt.
 *
 * 📚 What happens internally:
 *   1. bcrypt generates a random 22-character salt (e.g. "$2a$12$someRandomChars")
 *   2. It runs the password + salt through the blowfish cipher 2^12 = 4096 times
 *   3. Returns a 60-character string that includes the algorithm, cost, salt,
 *      AND the hash — all in one string: "$2a$12$<salt><hash>"
 *
 * @param password - The plaintext password to hash
 * @returns The bcrypt hash string (safe to store in DB)
 */
export async function hashPassword(password: string): Promise<string> {
  // bcrypt.hash() generates a new salt automatically each time it's called.
  // So even if you hash the same password twice, you get two different hashes.
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compares a plaintext password against a stored bcrypt hash.
 *
 * 📚 What happens internally:
 *   1. bcrypt extracts the salt from the stored hash
 *   2. It hashes the provided password using that SAME salt
 *   3. Compares the result with the stored hash
 *   4. Returns true if they match, false otherwise
 *
 * @param plainPassword - The password the user typed in
 * @param hash - The bcrypt hash stored in the database
 * @returns true if password matches, false otherwise
 */
export async function verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plainPassword, hash);
  } catch {
    // If the hash is malformed or not a bcrypt hash, comparison fails safely
    return false;
  }
}

// ─── Input Sanitization ───────────────────────────────────────────────────────
// 📚 WHAT IS SQL INJECTION?
// SQL injection is when an attacker puts SQL code into a form field.
// Example: if you type  '; DROP TABLE bookings; --  into a name field,
// a vulnerable app would execute that as actual SQL and delete your table.
//
// HOW WE PREVENT IT:
//   1. Supabase's JavaScript client uses parameterized queries by default,
//      meaning user input is NEVER directly concatenated into SQL strings.
//      The library handles escaping automatically.
//   2. As an extra safety layer, sanitizeInput() removes the most dangerous
//      characters before the data even reaches Supabase.
//
// WHAT IS XSS (Cross-Site Scripting)?
// An attacker stores <script>alert('hacked')</script> in your database.
// When another user's browser loads that data and renders it as HTML,
// the script runs in their browser. sanitizeInput() strips HTML tags.

const SQL_INJECTION_PATTERN = /['";\\]/g;
const HTML_TAG_PATTERN = /<[^>]*>/g;
const SCRIPT_PATTERN = /javascript:/gi;

/**
 * Sanitizes user input to prevent SQL injection and XSS attacks.
 *
 * NOTE: Supabase parameterized queries already prevent SQL injection.
 * This is a defense-in-depth measure — multiple layers of protection.
 *
 * @param input - Raw user input string
 * @param maxLength - Maximum allowed length (default: 500)
 * @returns Sanitized string safe for storage and display
 */
export function sanitizeInput(input: string, maxLength = 500): string {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    .slice(0, maxLength)                    // Enforce max length to prevent payload bloat
    .replace(HTML_TAG_PATTERN, '')          // Strip all HTML tags (prevents XSS)
    .replace(SCRIPT_PATTERN, '')            // Remove javascript: protocol (prevents XSS)
    .replace(SQL_INJECTION_PATTERN, (match) => {
      // Replace dangerous SQL characters with safe alternatives
      // Single quote → right single quotation mark (visual look-alike, not SQL special)
      if (match === "'") return '\u2019';
      // Semicolon, backslash, double quote → empty string
      return '';
    });
}

/**
 * Sanitizes an email address.
 * Only allows characters valid in email addresses per RFC 5321.
 */
export function sanitizeEmail(email: string): string {
  return email
    .trim()
    .toLowerCase()
    .slice(0, 254) // RFC 5321 max email length
    .replace(/[^a-z0-9@._+\-]/g, ''); // Only allow email-safe characters
}

/**
 * Validates email format using RFC 5322-compliant regex.
 * @returns true if email looks valid
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// 📚 WHAT IS RATE LIMITING?
// Rate limiting means restricting how many times someone can do something
// within a time window. For login forms, this prevents "brute force attacks"
// where an attacker tries thousands of passwords until one works.
//
// HOW THIS WORKS:
// We keep an in-memory map of { identifier → { count, firstAttemptAt } }
// If the count exceeds MAX_ATTEMPTS within WINDOW_MS, we block further attempts.
//
// LIMITATION: This in-memory approach resets when the server restarts.
// For production with multiple servers, use Redis or Supabase rate limit tables.
// For a single Next.js server (like this project), this works well.

interface RateLimitEntry {
  count: number;
  firstAttemptAt: number; // Unix timestamp in ms
}

// In-memory store — persists across requests but resets on server restart
const rateLimitStore = new Map<string, RateLimitEntry>();

const MAX_ATTEMPTS = 5;           // Max login attempts before lockout
const WINDOW_MS = 15 * 60 * 1000; // 15-minute window

/**
 * Checks if an identifier (email/IP) is rate-limited.
 *
 * 📚 HOW TO USE:
 *   const check = checkRateLimit('user@example.com');
 *   if (check.blocked) {
 *     return error(`Too many attempts. Try again in ${check.retryAfterMinutes} min`);
 *   }
 *
 * @param identifier - Email address, IP address, or any unique string
 * @returns { allowed, attemptsRemaining, retryAfterMinutes }
 */
export function checkRateLimit(identifier: string): {
  allowed: boolean;
  attemptsRemaining: number;
  retryAfterMinutes: number;
} {
  const key = identifier.toLowerCase();
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // No previous attempts, or window has expired → start fresh
  if (!entry || now - entry.firstAttemptAt > WINDOW_MS) {
    rateLimitStore.set(key, { count: 1, firstAttemptAt: now });
    return { allowed: true, attemptsRemaining: MAX_ATTEMPTS - 1, retryAfterMinutes: 0 };
  }

  // Within the window — check attempt count
  if (entry.count >= MAX_ATTEMPTS) {
    const elapsed = now - entry.firstAttemptAt;
    const remaining = Math.ceil((WINDOW_MS - elapsed) / 60000);
    return { allowed: false, attemptsRemaining: 0, retryAfterMinutes: remaining };
  }

  // Increment counter
  entry.count += 1;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    attemptsRemaining: MAX_ATTEMPTS - entry.count,
    retryAfterMinutes: 0,
  };
}

/**
 * Resets the rate limit counter for an identifier.
 * Call this after a SUCCESSFUL login to clear the attempt counter.
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier.toLowerCase());
}

// ─── CSRF Token ────────────────────────────────────────────────────────────────
// 📚 WHAT IS CSRF (Cross-Site Request Forgery)?
// An attacker tricks a logged-in user's browser into making a request your
// site didn't intend. For example, a malicious page could secretly submit
// your admin login form. CSRF tokens prevent this by requiring a secret token
// that only your own page knows.
//
// HOW IT WORKS:
//   1. When the login page loads, generate a random token and store it in
//      sessionStorage (browser) and pass it as a hidden form field.
//   2. When the form submits, verify the token matches. A cross-site request
//      cannot read sessionStorage from your domain, so it can't forge the token.

/**
 * Generates a cryptographically random CSRF token.
 * Works in both browser (crypto.getRandomValues) and Node.js environments.
 */
export function generateCSRFToken(): string {
  // Use the Web Crypto API (available in modern browsers and Node.js 18+)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(32); // 32 bytes = 256 bits of randomness
    crypto.getRandomValues(array);
    return Array.from(array)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback for older environments
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Generates a secure random password of specified length.
 * Useful for creating temporary passwords for new staff members.
 *
 * @param length - Password length (default: 16)
 * @returns A random password containing letters, numbers, and symbols
 */
export function generateSecurePassword(length = 16): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => charset[b % charset.length])
    .join('');
}
