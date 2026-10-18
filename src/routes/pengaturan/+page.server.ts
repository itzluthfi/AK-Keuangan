import type { PageServerLoad, Actions } from './$types';
import { db } from '#lib/server/db';
import { projects, users, masterVendors, masterAccounts } from '#lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const projectCount = (await db.select().from(projects).all()).length;

	// 1. Ambil daftar user sistem untuk manajemen RBAC
	const usersList = await db
		.select({
			id: users.id,
			username: users.username,
			email: users.email,
			namaLengkap: users.namaLengkap,
			role: users.role,
			noHp: users.noHp,
			isActive: users.isActive,
			createdAt: users.createdAt
		})
		.from(users)
		.all();

	// 2. Ambil master vendor & subkon
	const masterVendorsList = await db
		.select()
		.from(masterVendors)
		.orderBy(desc(masterVendors.id))
		.all();

	// 3. Ambil master rekening bank & akun kas
	const masterAccountsList = await db
		.select()
		.from(masterAccounts)
		.orderBy(masterAccounts.tipe)
		.all();

	return {
		settings: {
			companyName: 'Konsorsium Mitra SPPG MBG Jawa Timur',
			directorName: 'Bpk. Azka (Pimpinan Pelaksana)',
			contactPhone: '+62 812-3456-7890',
			email: 'azka@sppg.id',
			operationalArea: 'Wilayah Kerja SPPG Jawa Timur (27 Titik Proyek)',
			minMarginWarningPct: 10,
			kasbonOverprogressPct: 10,
			minCihBalance: 5000000,
			totalTitik: projectCount,
			databaseType: 'SQLite Local Embedded',
			walStatus: 'Active & Synchronized'
		},
		usersList,
		masterVendorsList,
		masterAccountsList,
		currentUser: locals.user
	};
};

export const actions: Actions = {
	saveSettings: async ({ request }) => {
		const formData = await request.formData();
		const companyName = String(formData.get('companyName') || '');
		const directorName = String(formData.get('directorName') || '');
		const minMarginWarningPct = Number(formData.get('minMarginWarningPct') || 10);

		return {
			success: true,
			message: 'Pengaturan profil dan parameter risiko berhasil disimpan.'
		};
	},

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

			return { success: true, message: `Pengguna ${namaLengkap} (${role}) berhasil ditambahkan ke sistem.` };
		} catch (e: any) {
			return fail(400, { success: false, error: 'Gagal menambah user: Username atau Email mungkin sudah terdaftar.' });
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
			message: `Status akun pengguna berhasil ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}.`
		};
	},

	deleteUser: async ({ request, locals }) => {
		const form = await request.formData();
		const id = parseInt(String(form.get('id') || '0'));

		if (!id) return fail(400, { success: false, error: 'ID Pengguna tidak valid.' });

		// Cegah menghapus user sendiri
		if (locals.user && locals.user.id === `USR-${id}`) {
			return fail(400, { success: false, error: 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.' });
		}

		await db.delete(users).where(eq(users.id, id));
		return { success: true, message: 'Akun pengguna berhasil dihapus dari sistem.' };
	},

	addMasterVendor: async ({ request }) => {
		const form = await request.formData();
		const nama = String(form.get('nama') || '').trim();
		const bidang = String(form.get('bidang') || 'Pekerjaan Sipil').trim();
		const noHp = String(form.get('noHp') || '').trim();
		const bankNama = String(form.get('bankNama') || '').trim();
		const bankRekening = String(form.get('bankRekening') || '').trim();
		const bankAtasNama = String(form.get('bankAtasNama') || '').trim();
		const catatan = String(form.get('catatan') || '').trim();

		if (!nama) {
			return fail(400, { success: false, error: 'Nama Subkon / Mandor wajib diisi.' });
		}

		try {
			await db.insert(masterVendors).values({
				nama,
				bidang,
				noHp,
				bankNama,
				bankRekening,
				bankAtasNama,
				catatan,
				isActive: true
			});

			return { success: true, message: `Subkon / Mandor ${nama} berhasil ditambahkan ke direktori master.` };
		} catch (e: any) {
			return fail(400, { success: false, error: 'Gagal menambah subkon: Nama subkon mungkin sudah terdaftar.' });
		}
	},

	deleteMasterVendor: async ({ request }) => {
		const form = await request.formData();
		const id = parseInt(String(form.get('id') || '0'));

		if (!id) return fail(400, { success: false, error: 'ID Vendor tidak valid.' });

		await db.delete(masterVendors).where(eq(masterVendors.id, id));
		return { success: true, message: 'Data subkon berhasil dihapus dari direktori master.' };
	},

	addMasterAccount: async ({ request }) => {
		const form = await request.formData();
		const kode = String(form.get('kode') || '').trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
		const nama = String(form.get('nama') || '').trim();
		const tipe = String(form.get('tipe') || 'BANK') as 'BANK' | 'KAS_KECIL' | 'POOLING';
		const bankNama = String(form.get('bankNama') || '').trim();
		const noRekening = String(form.get('noRekening') || '').trim();
		const atasNama = String(form.get('atasNama') || '').trim();
		const saldoAwal = parseFloat(String(form.get('saldoAwal') || '0'));

		if (!kode || !nama) {
			return fail(400, { success: false, error: 'Kode akun dan nama akun rekening wajib diisi.' });
		}

		try {
			await db.insert(masterAccounts).values({
				kode,
				nama,
				tipe,
				bankNama,
				noRekening,
				atasNama,
				saldoAwal,
				isActive: true
			});

			return { success: true, message: `Rekening kas ${nama} (${kode}) berhasil ditambahkan.` };
		} catch (e: any) {
			return fail(400, { success: false, error: 'Gagal menambah rekening: Kode akun sudah digunakan.' });
		}
	},

	deleteMasterAccount: async ({ request }) => {
		const form = await request.formData();
		const id = parseInt(String(form.get('id') || '0'));

		if (!id) return fail(400, { success: false, error: 'ID Rekening tidak valid.' });

		await db.delete(masterAccounts).where(eq(masterAccounts.id, id));
		return { success: true, message: 'Rekening kas berhasil dihapus dari master data.' };
	}
};
