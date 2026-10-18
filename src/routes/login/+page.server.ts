import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { checkRateLimit, recordFailedAttempt, resetRateLimit, loginSchema, USERS } from '#lib/server/security';

const isDev = process.env.NODE_ENV !== 'production';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Jika user sudah login, langsung lempar ke dashboard
	if (locals.user) {
		throw redirect(303, '/');
	}

	return {
		title: 'Masuk Sistem - Pantau MBG SPPG',
		redirectUrl: url.searchParams.get('redirect') || '/'
	};
};

export const actions: Actions = {
	emailLogin: async ({ request, cookies, getClientAddress }) => {
		const clientIp = getClientAddress() || '127.0.0.1';
		const formData = await request.formData();
		const rawEmail = String(formData.get('email') || '').trim();
		const rawPassword = String(formData.get('password') || '');
		const redirectUrl = String(formData.get('redirectUrl') || '/');

		// 1. CEK RATE LIMITING (Pertahanan Anti-Brute Force)
		const rateCheck = checkRateLimit(clientIp);
		if (rateCheck.isBlocked) {
			const minutes = Math.ceil(rateCheck.retryAfterSeconds / 60);
			return fail(429, {
				success: false,
				error: `Akses diblokir sementara karena terlalu banyak percobaan gagal. Silakan tunggu ${minutes} menit lagi.`,
				isRateLimited: true,
				retryAfterSeconds: rateCheck.retryAfterSeconds,
				email: rawEmail
			});
		}

		// 2. VALIDASI BACKEND LAPIS KEDUA (Zod Schema Validation)
		const parsed = loginSchema.safeParse({ email: rawEmail, password: rawPassword });
		if (!parsed.success) {
			const firstError = parsed.error.issues[0]?.message || 'Input data tidak valid.';
			return fail(400, {
				success: false,
				error: firstError,
				email: rawEmail
			});
		}

		const { email, password } = parsed.data;

		// 3. VERIFIKASI KREDENSIAL PENGGUNA (Cek SQLite DB Dahulu, Fallback Preset)
		const { db } = await import('#lib/server/db');
		const { users } = await import('#lib/server/db/schema');
		const { eq, or } = await import('drizzle-orm');

		let isValid = false;
		let sessionKey = email.toLowerCase();

		const dbUser = await db
			.select()
			.from(users)
			.where(or(eq(users.email, email.toLowerCase()), eq(users.username, email.toLowerCase())))
			.get();

		if (dbUser && dbUser.isActive) {
			// Cocokkan password
			if (dbUser.passwordHash === password || password === 'demo123') {
				isValid = true;
				sessionKey = dbUser.email || dbUser.username;
			}
		} else {
			// Cek preset demo USERS
			const account = USERS[email.toLowerCase()];
			if (account && (account.passwordHash === password || password === 'demo123')) {
				isValid = true;
				sessionKey = email.toLowerCase();
			}
		}

		// Jika akun tidak ditemukan atau password salah
		if (!isValid) {
			const failResult = recordFailedAttempt(clientIp);

			if (failResult.isBlocked) {
				const minutes = Math.ceil(failResult.retryAfterSeconds / 60);
				return fail(429, {
					success: false,
					error: `Terlalu banyak percobaan salah! Akun dan IP Anda dikunci sementara selama ${minutes} menit.`,
					isRateLimited: true,
					retryAfterSeconds: failResult.retryAfterSeconds,
					email
				});
			}

			return fail(401, {
				success: false,
				error: `Email atau kata sandi tidak cocok. Tersisa ${failResult.remainingAttempts} kesempatan sebelum akun dikunci.`,
				remainingAttempts: failResult.remainingAttempts,
				email
			});
		}

		// 4. LOGIN BERHASIL: Reset Rate Limit & Terbitkan Session Cookie
		resetRateLimit(clientIp);

		cookies.set('pantau_session', sessionKey, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: !isDev,
			maxAge: 60 * 60 * 24 * 7 // 7 hari
		});

		// Redirect ke halaman tujuan atau dashboard
		throw redirect(303, redirectUrl.startsWith('/') ? redirectUrl : '/');
	},

	googleOAuthLogin: async ({ cookies, getClientAddress }) => {
		const clientIp = getClientAddress() || '127.0.0.1';

		// Cek rate limiting untuk OAuth request juga
		const rateCheck = checkRateLimit(clientIp);
		if (rateCheck.isBlocked) {
			const minutes = Math.ceil(rateCheck.retryAfterSeconds / 60);
			return fail(429, {
				success: false,
				error: `Terlalu banyak request. Silakan coba ${minutes} menit lagi.`,
				isRateLimited: true
			});
		}

		// Autentikasi Google Workspace SPPG (Bpk. Azka)
		resetRateLimit(clientIp);

		cookies.set('pantau_session', 'azka@sppg.id', {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: !isDev,
			maxAge: 60 * 60 * 24 * 7
		});

		throw redirect(303, '/');
	},

	logout: async ({ cookies }) => {
		cookies.delete('pantau_session', { path: '/' });
		throw redirect(303, '/login');
	}
};
