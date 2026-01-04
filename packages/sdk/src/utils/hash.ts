import crypto from 'crypto';

/**
 * Hash a string for PII protection
 * Returns first 16 characters of SHA-256 hash
 */
export function hash(data: string): string {
    return crypto
        .createHash('sha256')
        .update(data)
        .digest('hex')
        .substring(0, 16);  // First 16 chars for brevity
}

/**
 * Hash an object by stringifying it first
 */
export function hashObject(obj: any): string {
    return hash(JSON.stringify(obj));
}
