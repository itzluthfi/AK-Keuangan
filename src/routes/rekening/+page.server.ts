import type { PageServerLoad, Actions } from './$types';
import { db } from '#lib/server/db';
import { masterAccounts } from '#lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const accountsList = await db
		.select()
		.from(masterAccounts)
		.orderBy(masterAccounts.tipe)
		.all();

	return {
		accountsList,
		currentUser: locals.user
	};
};

export const actions: Actions = {
	addMasterAccount: async ({ request }) => {
		const form = await request.formData();
		const kode = String(form.get('kode') || '').trim().toUpperCase();
		const tipe = String(form.get('tipe') || 'BANK') as 'BANK' | 'POOLING' | 'KAS_KECIL';
		const nama = String(form.get('nama') || '').trim();
		const bankNama = String(form.get('bankNama') || '').trim();
		const noRekening = String(form.get('noRekening') || '').trim();
		const atasNama = String(form.get('atasNama') || '').trim();

		if (!kode || !nama) {
			return fail(400, { success: false, error: 'Kode dan Nama Rekening wajib diisi.' });
		}

		try {
			await db.insert(masterAccounts).values({
				kode,
				tipe,
				nama,
				bankNama,
				noRekening,
				atasNama,
				saldoAwal: 0
			});

			return { success: true, message: `Rekening ${nama} berhasil ditambahkan.` };
		} catch (e: any) {
			return fail(400, { success: false, error: 'Gagal menambah rekening: Kode akun mungkin sudah terdaftar.' });
		}
	},

	deleteMasterAccount: async ({ request }) => {
		const form = await request.formData();
		const id = parseInt(String(form.get('id') || '0'));

		if (!id) return fail(400, { success: false, error: 'ID Rekening tidak valid.' });

		await db.delete(masterAccounts).where(eq(masterAccounts.id, id));
		return { success: true, message: 'Rekening kas/bank berhasil dihapus.' };
	}
};
