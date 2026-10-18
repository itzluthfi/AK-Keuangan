import { redirect, type RequestEvent } from '@sveltejs/kit';
import { USERS, generateAvatar, type AppUser } from '#lib/server/security';
import { db } from '#lib/server/db';
import { users } from '#lib/server/db/schema';
import { eq, or } from 'drizzle-orm';

export async function handle({ event, resolve }: { event: RequestEvent; resolve: (event: RequestEvent) => Promise<Response> }): Promise<Response> {
	const sessionEmailOrRole = event.cookies.get('pantau_session');

	// 1. Resolve Session User (Database Priority, Fallback to Preset Dictionary)
	let currentUser: AppUser | null = null;
	if (sessionEmailOrRole) {
		try {
			// Cek ke tabel users di database SQLite
			const dbUser = await db
				.select()
				.from(users)
				.where(or(eq(users.email, sessionEmailOrRole), eq(users.username, sessionEmailOrRole)))
				.get();

			if (dbUser && dbUser.isActive) {
				currentUser = {
					id: `USR-${dbUser.id}`,
					name: dbUser.namaLengkap,
					email: dbUser.email || `${dbUser.username}@sppg.id`,
					role: dbUser.role as any,
					avatar: generateAvatar(dbUser.namaLengkap)
				};
			}
		} catch (e) {
			console.error('Error fetching user from database session:', e);
		}

		// Fallback ke preset USERS atau role shortcuts
		if (!currentUser) {
			if (USERS[sessionEmailOrRole]) {
				currentUser = USERS[sessionEmailOrRole].user;
			} else if (sessionEmailOrRole === 'direktur') {
				currentUser = USERS['azka@sppg.id'].user;
			} else if (sessionEmailOrRole === 'finance') {
				currentUser = USERS['finance@sppg.id'].user;
			} else if (sessionEmailOrRole === 'site_manager') {
				currentUser = USERS['lapangan@sppg.id'].user;
			} else if (sessionEmailOrRole.startsWith('google:')) {
				const email = sessionEmailOrRole.replace('google:', '');
				currentUser = {
					id: 'USR-GGL-' + email.split('@')[0],
					name: 'Bpk. Azka (Google SSO)',
					email,
					role: 'DIREKTUR',
					avatar: 'GA'
				};
			}
		}
	}

	event.locals.user = currentUser;

	const pathname = event.url.pathname;
	const isLoginPage = pathname.startsWith('/login');

	// 2. Redirect jika sudah login namun mencoba akses /login
	if (isLoginPage && currentUser) {
		throw redirect(303, '/');
	}

	// 3. Autentikasi Publik vs Privat
	const isPublic = isLoginPage || pathname.startsWith('/api/health');
	if (!isPublic && !currentUser) {
		throw redirect(303, `/login?redirect=${encodeURIComponent(pathname)}`);
	}

	// 4. KONTROL AKSES BERBASIS PERAN (ROLE-BASED ACCESS CONTROL - RBAC)
	if (currentUser) {
		// A. Pengaturan Sistem & Manajemen User: EKSKLUSIF DIREKTUR
		if (pathname.startsWith('/pengaturan') && currentUser.role !== 'DIREKTUR') {
			throw redirect(303, '/?auth_error=Hanya%20Direktur%20yang%20memiliki%20akses%20ke%20Pengaturan%20Sistem');
		}

		// B. Cash Pooling, Invoice, dan Laporan Rekapitulasi: HANYA DIREKTUR & FINANCE (SITE_MANAGER DIBLOKIR)
		const isRestrictedToHO = pathname.startsWith('/cash-pooling') || pathname.startsWith('/invoice') || pathname.startsWith('/cetak');
		if (isRestrictedToHO && currentUser.role === 'SITE_MANAGER') {
			throw redirect(303, '/?auth_error=Akses%20dibatasi%20untuk%20otoritas%20Holding%20dan%20Finance');
		}
	}

	return resolve(event);
}
