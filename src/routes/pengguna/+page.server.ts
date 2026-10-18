import type { PageServerLoad, Actions } from './$types';
import { db } from '#lib/server/db';
import { users, roles } from '#lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const usersList = await db
		.select({
			id: users.id,
			username: users.username,
			email: users.email,
			namaLengkap: users.namaLengkap,
			role: users.role,
			roleId: users.roleId,
			noHp: users.noHp,
			isActive: users.isActive,
			createdAt: users.createdAt
		})
		.from(users)
		.all();

	const rawRoles = await db
		.select()
		.from(roles)
		.orderBy(roles.id)
		.all();

	return {
		usersList,
		rolesList: rawRoles,
		currentUser: locals.user
	};
};

export const actions: Actions = {
	addUser: async ({ request }) => {
		const form = await request.formData();
		const username = String(form.get('username') || '').trim().toLowerCase();
		const email = String(form.get('email') || '').trim().toLowerCase();
		const namaLengkap = String(form.get('namaLengkap') || '').trim();
		const role = String(form.get('role') || 'SITE_MANAGER') as 'DIREKTUR' | 'FINANCE' | 'SITE_MANAGER';
		const noHp = String(form.get('noHp') || '').trim();
		const password = String(form.get('password') || 'demo123').trim();

		if (!username || !namaLengkap) {
			return fail(400, { success: false, error: 'Username dan Nama Lengkap wajib diisi.' });
		}

		try {
			await db.insert(users).values({
				username,
				email: email || `${username}@sppg.id`,
				namaLengkap,
				role,
				noHp,
				passwordHash: password,
				isActive: true
			});

			return { success: true, message: `Pengguna ${namaLengkap} (${role}) berhasil ditambahkan.` };
		} catch (e: any) {
			return fail(400, { success: false, error: 'Gagal menambah user: Username atau Email mungkin sudah terdaftar.' });
		}
	},

	editUser: async ({ request }) => {
		const form = await request.formData();
		const id = parseInt(String(form.get('id') || '0'));
		const namaLengkap = String(form.get('namaLengkap') || '').trim();
		const username = String(form.get('username') || '').trim().toLowerCase();
		const email = String(form.get('email') || '').trim().toLowerCase();
		const role = String(form.get('role') || 'SITE_MANAGER') as 'DIREKTUR' | 'FINANCE' | 'SITE_MANAGER';
		const noHp = String(form.get('noHp') || '').trim();

		if (!id || !namaLengkap || !username) {
			return fail(400, { success: false, error: 'Data pengguna tidak lengkap.' });
		}

		try {
			await db.update(users).set({
				namaLengkap,
				username,
				email,
				role,
				noHp
			}).where(eq(users.id, id));

			return { success: true, message: `Data pengguna ${namaLengkap} berhasil diperbarui.` };
		} catch (e: any) {
			return fail(400, { success: false, error: 'Gagal memperbarui pengguna: Username atau email mungkin sudah digunakan.' });
		}
	},

	resetPassword: async ({ request }) => {
		const form = await request.formData();
		const id = parseInt(String(form.get('id') || '0'));
		const newPassword = String(form.get('newPassword') || '').trim();

		if (!id || !newPassword) {
			return fail(400, { success: false, error: 'Kata sandi baru tidak boleh kosong.' });
		}

		if (newPassword.length < 4) {
			return fail(400, { success: false, error: 'Kata sandi minimal 4 karakter.' });
		}

		try {
			await db.update(users).set({
				passwordHash: newPassword
			}).where(eq(users.id, id));

			return { success: true, message: 'Kata sandi pengguna berhasil diubah.' };
		} catch (e: any) {
			return fail(400, { success: false, error: 'Gagal mengubah kata sandi.' });
		}
	},

	toggleUserStatus: async ({ request }) => {
		const form = await request.formData();
		const id = parseInt(String(form.get('id') || '0'));
		const currentStatus = form.get('isActive') === 'true' || form.get('isActive') === '1';

		if (!id) return fail(400, { success: false, error: 'ID Pengguna tidak valid.' });

		await db.update(users).set({ isActive: !currentStatus }).where(eq(users.id, id));

		return {
			success: true,
			message: `Status pengguna berhasil ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}.`
		};
	},

	deleteUser: async ({ request, locals }) => {
		const form = await request.formData();
		const id = parseInt(String(form.get('id') || '0'));

		if (!id) return fail(400, { success: false, error: 'ID Pengguna tidak valid.' });

		if (locals.user && locals.user.id === `USR-${id}`) {
			return fail(400, { success: false, error: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.' });
		}

		await db.delete(users).where(eq(users.id, id));
		return { success: true, message: 'Akun pengguna berhasil dihapus dari sistem.' };
	}
};
