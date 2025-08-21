import bcrypt from 'bcrypt';
import crypto from 'crypto';

// Password configuration
const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;
const PASSWORD_RESET_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a temporary password
 */
export function generateTempPassword(): string {
  // Generate a 12-character password with uppercase, lowercase, numbers, and symbols
  const uppercase = 'ABCDEFGHIJKLMNPQRSTUVWXYZ'; // Excluding O
  const lowercase = 'abcdefghijkmnpqrstuvwxyz';  // Excluding l, o
  const numbers = '23456789';                    // Excluding 0, 1
  const symbols = '!@#$%^&*';
  
  const allChars = uppercase + lowercase + numbers + symbols;
  let password = '';
  
  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill remaining characters
  for (let i = 4; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

/**
 * Generate a secure password reset token
 */
export function generateResetToken(): {
  token: string;
  expires: Date;
} {
  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY);
  
  return { token, expires };
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password cannot contain repeated characters (more than 2 in a row)');
  }
  
  if (/^[0-9]*$/.test(password)) {
    errors.push('Password cannot be only numbers');
  }
  
  if (/^[a-zA-Z]*$/.test(password)) {
    errors.push('Password cannot be only letters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Check if a password reset token is valid and not expired
 */
export function isResetTokenValid(tokenExpires: Date | null): boolean {
  if (!tokenExpires) return false;
  return new Date() < tokenExpires;
}

/**
 * Sanitize password from logs and error messages
 */
export function sanitizePassword(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  const sanitized = { ...obj };
  
  // Remove password-related fields from any object
  const passwordFields = ['password', 'newPassword', 'oldPassword', 'confirmPassword', 'tempPassword'];
  
  for (const field of passwordFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}