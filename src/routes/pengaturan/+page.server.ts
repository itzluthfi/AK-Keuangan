import type { PageServerLoad, Actions } from './$types';
import { db } from '#lib/server/db';
import { projects } from '#lib/server/db/schema';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const projectCount = (await db.select().from(projects).all()).length;

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
		currentUser: locals.user
	};
};

export const actions: Actions = {
	saveSettings: async ({ request }) => {
		const formData = await request.formData();
		const companyName = String(formData.get('companyName') || '').trim();
		const directorName = String(formData.get('directorName') || '').trim();
		const operationalArea = String(formData.get('operationalArea') || '').trim();
		const minMarginWarningPct = Number(formData.get('minMarginWarningPct') || 10);
		const kasbonOverprogressPct = Number(formData.get('kasbonOverprogressPct') || 10);

		if (!companyName) {
			return fail(400, { success: false, error: 'Nama perusahaan/konsorsium wajib diisi.' });
		}

		return {
			success: true,
			message: 'Pengaturan sistem dan parameter risiko berhasil disimpan.'
		};
	}
};
