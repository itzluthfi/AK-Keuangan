import type { PageServerLoad, Actions } from './$types';
import { db } from '#lib/server/db';
import { roles, users } from '#lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const rawRoles = await db
		.select()
		.from(roles)
		.orderBy(roles.id)
		.all();

	const rolesList = rawRoles.map(r => ({
		...r,
		permissionsList: (() => {
			try {
				return JSON.parse(r.permissions) as string[];
			} catch {
				return [];
			}
		})()
	}));

	return {
		rolesList,
		currentUser: locals.user
	};
};

export const actions: Actions = {
	addRole: async ({ request }) => {
		const form = await request.formData();
		const kode = String(form.get('kode') || '').trim().toUpperCase().replace(/\s+/g, '_');
		const nama = String(form.get('nama') || '').trim();
		const deskripsi = String(form.get('deskripsi') || '').trim();
		const permissions = form.getAll('permissions').map(p => String(p));

		if (!kode || !nama) {
			return fail(400, { success: false, error: 'Kode Peran dan Nama Peran wajib diisi.' });
		}

		try {
			await db.insert(roles).values({
				kode,
				nama,
				deskripsi,
				isSystem: false,
				permissions: JSON.stringify(permissions)
			});

			return { success: true, message: `Peran baru "${nama}" berhasil dibuat.` };
		} catch (e: any) {
			return fail(400, { success: false, error: 'Gagal membuat peran: Kode peran mungkin sudah terdaftar.' });
		}
	},

	editRole: async ({ request }) => {
		const form = await request.formData();
		const id = parseInt(String(form.get('id') || '0'));
		const nama = String(form.get('nama') || '').trim();
		const deskripsi = String(form.get('deskripsi') || '').trim();
		const permissions = form.getAll('permissions').map(p => String(p));

		if (!id) return fail(400, { success: false, error: 'ID Peran tidak valid.' });

		try {
			await db.update(roles).set({
				nama,
				deskripsi,
				permissions: JSON.stringify(permissions)
			}).where(eq(roles.id, id));

			return { success: true, message: 'Hak akses peran berhasil disimpan.' };
		} catch (e: any) {
			return fail(400, { success: false, error: 'Gagal memperbarui hak akses peran.' });
		}
	},

	deleteRole: async ({ request }) => {
		const form = await request.formData();
		const id = parseInt(String(form.get('id') || '0'));

		if (!id) return fail(400, { success: false, error: 'ID Peran tidak valid.' });

		const targetRole = await db.select().from(roles).where(eq(roles.id, id)).get();
		if (!targetRole) return fail(404, { success: false, error: 'Peran tidak ditemukan.' });

		if (targetRole.isSystem) {
			return fail(400, { success: false, error: 'Peran bawaan sistem tidak boleh dihapus demi integritas keamanan.' });
		}

		// Periksa apakah peran sedang dipakai oleh pengguna
		const userCount = (await db.select().from(users).where(eq(users.role, targetRole.kode as any)).all()).length;
		if (userCount > 0) {
			return fail(400, { success: false, error: `Peran masih digunakan oleh ${userCount} pengguna. Ubah peran pengguna terlebih dahulu sebelum menghapus.` });
		}

		await db.delete(roles).where(eq(roles.id, id));
		return { success: true, message: `Peran "${targetRole.nama}" berhasil dihapus.` };
	}
};
