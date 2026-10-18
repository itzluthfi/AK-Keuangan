import { z } from 'zod';

// ============================================================================
// RATE LIMITING ENGINE (In-Memory Sliding Window & Lockout Protection)
// ============================================================================
interface RateLimitEntry {
	attempts: number;
	firstAttempt: number;
	lockoutUntil: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_DURATION_MS = 15 * 60 * 1000; // 15 menit
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 menit penalti lockout

export function checkRateLimit(identifier: string): {
	isBlocked: boolean;
	remainingAttempts: number;
	retryAfterSeconds: number;
} {
	const now = Date.now();
	const entry = rateLimitStore.get(identifier);

	if (!entry) {
		return { isBlocked: false, remainingAttempts: MAX_FAILED_ATTEMPTS, retryAfterSeconds: 0 };
	}

	// Cek jika sedang dalam masa lockout aktif
	if (entry.lockoutUntil > now) {
		const retryAfterSeconds = Math.ceil((entry.lockoutUntil - now) / 1000);
		return { isBlocked: true, remainingAttempts: 0, retryAfterSeconds };
	}

	// Cek jika window waktu sudah kadaluarsa (reset)
	if (now - entry.firstAttempt > WINDOW_DURATION_MS) {
		rateLimitStore.delete(identifier);
		return { isBlocked: false, remainingAttempts: MAX_FAILED_ATTEMPTS, retryAfterSeconds: 0 };
	}

	const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - entry.attempts);
	return { isBlocked: remaining === 0, remainingAttempts: remaining, retryAfterSeconds: 0 };
}

export function recordFailedAttempt(identifier: string): {
	isBlocked: boolean;
	remainingAttempts: number;
	retryAfterSeconds: number;
} {
	const now = Date.now();
	let entry = rateLimitStore.get(identifier);

	if (!entry || (now - entry.firstAttempt > WINDOW_DURATION_MS && entry.lockoutUntil <= now)) {
		entry = {
			attempts: 1,
			firstAttempt: now,
			lockoutUntil: 0
		};
	} else {
		entry.attempts += 1;
	}

	if (entry.attempts >= MAX_FAILED_ATTEMPTS) {
		entry.lockoutUntil = now + LOCKOUT_DURATION_MS;
		rateLimitStore.set(identifier, entry);
		const retryAfterSeconds = Math.ceil(LOCKOUT_DURATION_MS / 1000);
		return { isBlocked: true, remainingAttempts: 0, retryAfterSeconds };
	}

	rateLimitStore.set(identifier, entry);
	const remaining = MAX_FAILED_ATTEMPTS - entry.attempts;
	return { isBlocked: false, remainingAttempts: remaining, retryAfterSeconds: 0 };
}

export function resetRateLimit(identifier: string): void {
	rateLimitStore.delete(identifier);
}

// ============================================================================
// DUAL-LAYER VALIDATION SCHEMA (ZOD)
// ============================================================================
export const loginSchema = z.object({
	email: z
		.string()
		.trim()
		.min(3, 'Alamat email atau username minimal 3 karakter'),
	password: z
		.string()
		.min(4, 'Kata sandi minimal 4 karakter')
		.max(100, 'Kata sandi melebihi batas 100 karakter')
});

// ============================================================================
// DAFTAR AKUN TERDAFTAR (SISTEM KAS SPPG)
// ============================================================================
export interface AppUser {
	id: string;
	name: string;
	email: string;
	role: 'DIREKTUR' | 'FINANCE' | 'SITE_MANAGER';
	avatar: string;
}

export function generateAvatar(name: string): string {
	if (!name) return 'U';
	const parts = name.trim().split(/\s+/);
	if (parts.length >= 2) {
		return (parts[0][0] + parts[1][0]).toUpperCase();
	}
	return name.slice(0, 2).toUpperCase();
}

export const USERS: Record<string, { passwordHash: string; user: AppUser }> = {
	'azka@sppg.id': {
		passwordHash: 'demo123',
		user: {
			id: 'USR-001',
			name: 'Bpk. Azka (Pimpinan)',
			email: 'azka@sppg.id',
			role: 'DIREKTUR',
			avatar: 'BA'
		}
	},
	'finance@sppg.id': {
		passwordHash: 'demo123',
		user: {
			id: 'USR-002',
			name: 'Ibu Sarah (Finance SPPG)',
			email: 'finance@sppg.id',
			role: 'FINANCE',
			avatar: 'SF'
		}
	},
	'lapangan@sppg.id': {
		passwordHash: 'demo123',
		user: {
			id: 'USR-003',
			name: 'Bpk. Wahyu (Site Manager)',
			email: 'lapangan@sppg.id',
			role: 'SITE_MANAGER',
			avatar: 'WS'
		}
	}
};
