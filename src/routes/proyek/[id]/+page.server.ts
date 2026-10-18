import { db } from '#lib/server/db';
import { projects, projectTermins, projectVendors, vendorPayments, cashTransactions } from '#lib/server/db/schema';
import { decodeId, encodeId } from '#lib/server/sqids';
import { eq } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	// Decode obfuscated hash ID
	const projectId = decodeId(params.id);
	if (!projectId) {
		throw error(404, 'Proyek tidak ditemukan atau URL tidak valid.');
	}

	const project = await db.select().from(projects).where(eq(projects.id, projectId)).get();
	if (!project) {
		throw error(404, 'Proyek tidak ditemukan.');
	}

	// Ambil termin masuk
	const termins = await db.select().from(projectTermins).where(eq(projectTermins.projectId, projectId)).all();
	const totalTerminMasuk = termins.reduce((acc, t) => acc + (t.nominalCair || 0), 0);
	const sisaTermin = Math.max(0, project.rabKontrak - totalTerminMasuk);

	// Ambil vendor / subkon
	const vendors = await db.select().from(projectVendors).where(eq(projectVendors.projectId, projectId)).all();
	const vendorIds = new Set(vendors.map(v => v.id));

	// Ambil riwayat kasbon/pembayaran vendor
	const allPayments = await db.select().from(vendorPayments).all();
	const payments = allPayments.filter(pm => vendorIds.has(pm.projectVendorId));

	// Hitung agregasi per vendor
	const vendorDetails = vendors.map(v => {
		const vPayments = payments.filter(pm => pm.projectVendorId === v.id);
		const totalTerbayar = vPayments.reduce((acc, pm) => acc + (pm.nominal || 0), 0);
		const sisaHutang = Math.max(0, v.rapNilai - totalTerbayar);
		const plafonWajar = v.rapNilai * (project.progresFisikPct / 100);
		const isOverPlafon = totalTerbayar > plafonWajar;

		return {
			...v,
			totalTerbayar,
			sisaHutang,
			plafonWajar,
			isOverPlafon,
			payments: vPayments
		};
	});

	const totalRapVendors = vendors.reduce((acc, v) => acc + (v.rapNilai || 0), 0);
	const totalBebanVendors = payments.reduce((acc, pm) => acc + (pm.nominal || 0), 0);
	const totalFeeVendors = vendors.reduce((acc, v) => acc + (v.feeAlokasi || 0), 0);

	// Ambil mutasi kas kecil operasional (CIH) untuk proyek ini
	const cihTransactions = await db.select().from(cashTransactions).where(eq(cashTransactions.projectId, projectId)).all();
	const totalOperasionalCih = cihTransactions.filter(c => c.tipe === 'OUT').reduce((acc, c) => acc + (c.nominal || 0), 0);

	// Perhitungan Laba & Kontrol Kas
	const totalPengeluaran = totalBebanVendors + totalOperasionalCih + totalFeeVendors;
	const estimasiTotalBeban = totalRapVendors > 0 ? (totalRapVendors + totalFeeVendors + totalOperasionalCih) : totalPengeluaran;
	const labaProyek = project.rabKontrak - (project.progresFisikPct === 100 ? totalPengeluaran : estimasiTotalBeban);
	const labaPct = project.rabKontrak > 0 ? (labaProyek / project.rabKontrak) * 100 : 0;
	const arusKas = totalTerminMasuk - totalPengeluaran;
	const marginBersih = arusKas;
	const marginPct = labaPct;

	return {
		project: {
			...project,
			hashId: params.id,
			totalTerminMasuk,
			sisaTermin,
			totalRapVendors,
			totalBebanVendors,
			totalFeeVendors,
			totalOperasionalCih,
			totalPengeluaran,
			labaProyek,
			labaPct,
			arusKas,
			marginBersih,
			marginPct
		},
		termins,
		vendors: vendorDetails,
		cihTransactions
	};
};

export const actions: Actions = {
	updateProgres: async ({ request, params }) => {
		const projectId = decodeId(params.id);
		if (!projectId) return fail(400, { message: 'Invalid ID' });

		const form = await request.formData();
		const progres = parseFloat(String(form.get('progresFisikPct') || '0'));

		await db.update(projects).set({
			progresFisikPct: progres,
			status: progres >= 100 ? 'SELESAI' : 'BERJALAN'
		}).where(eq(projects.id, projectId));

		return { success: true, message: 'Progres fisik proyek berhasil diperbarui.' };
	},

	addTermin: async ({ request, params }) => {
		const projectId = decodeId(params.id);
		if (!projectId) return fail(400, { message: 'Invalid ID' });

		const form = await request.formData();
		const terminKe = String(form.get('terminKe') || '').trim();
		const nominalCair = parseFloat(String(form.get('nominalCair') || '0'));
		const tglCair = String(form.get('tglCair') || '').trim();

		if (!terminKe || nominalCair <= 0) {
			return fail(400, { message: 'Nama termin dan nominal pencairan wajib diisi.' });
		}

		await db.insert(projectTermins).values({
			projectId,
			terminKe,
			nominalRencana: nominalCair,
			nominalCair,
			tglCair: tglCair || new Date().toISOString().split('T')[0],
			isLunas: true
		});

		return { success: true, message: 'Pencairan termin masuk berhasil dicatat.' };
	},

	addVendor: async ({ request, params }) => {
		const projectId = decodeId(params.id);
		if (!projectId) return fail(400, { message: 'Invalid ID' });

		const form = await request.formData();
		const namaVendor = String(form.get('namaVendor') || '').trim();
		const pekerjaan = String(form.get('pekerjaan') || '').trim();
		const rapNilai = parseFloat(String(form.get('rapNilai') || '0'));
		const feeAlokasi = parseFloat(String(form.get('feeAlokasi') || '0'));

		if (!namaVendor || rapNilai <= 0) {
			return fail(400, { message: 'Nama subkon dan nilai RAP pekerjaan wajib diisi.' });
		}

		await db.insert(projectVendors).values({
			projectId,
			namaVendor,
			pekerjaan,
			rapNilai,
			feeAlokasi
		});

		return { success: true, message: 'Subkon pelaksana berhasil ditambahkan.' };
	},

	addKasbon: async ({ request, params }) => {
		const projectId = decodeId(params.id);
		if (!projectId) return fail(400, { message: 'Invalid ID' });

		const form = await request.formData();
		const projectVendorId = parseInt(String(form.get('projectVendorId') || '0'));
		const tipe = String(form.get('tipe') || 'KASBON_PROGRES');
		const nominal = parseFloat(String(form.get('nominal') || '0'));
		const penerimaNama = String(form.get('penerimaNama') || '').trim();
		const tglBayar = String(form.get('tglBayar') || '').trim();
		const isApproved = form.get('isApproved') === 'on' || form.get('isApproved') === 'true';

		if (!projectVendorId || nominal <= 0 || !penerimaNama) {
			return fail(400, { message: 'Pilih vendor, isi nominal kasbon, dan nama penerima.' });
		}

		await db.insert(vendorPayments).values({
			projectVendorId,
			tipe,
			nominal,
			tglBayar: tglBayar || new Date().toISOString().split('T')[0],
			penerimaNama,
			isApproved
		});

		return { success: true, message: 'Kasbon/pembayaran subkon berhasil dicatat.' };
	},

	editTermin: async ({ request }) => {
		const form = await request.formData();
		const id = parseInt(String(form.get('id') || '0'));
		const terminKe = String(form.get('terminKe') || '').trim();
		const nominalCair = parseFloat(String(form.get('nominalCair') || '0').replace(/[^0-9.]/g, ''));
		const tglCair = String(form.get('tglCair') || '').trim();

		if (!id || !terminKe || nominalCair <= 0) {
			return fail(400, { message: 'Data termin tidak valid.' });
		}

		await db.update(projectTermins).set({
			terminKe,
			nominalCair,
			nominalRencana: nominalCair,
			tglCair
		}).where(eq(projectTermins.id, id));

		return { success: true, message: 'Data termin berhasil diperbarui.' };
	},

	deleteTermin: async ({ request }) => {
		const form = await request.formData();
		const id = parseInt(String(form.get('id') || '0'));
		if (!id) return fail(400, { message: 'ID termin tidak valid.' });

		await db.delete(projectTermins).where(eq(projectTermins.id, id));
		return { success: true, message: 'Pencairan termin berhasil dihapus.' };
	},

	editVendor: async ({ request }) => {
		const form = await request.formData();
		const id = parseInt(String(form.get('id') || '0'));
		const namaVendor = String(form.get('namaVendor') || '').trim();
		const pekerjaan = String(form.get('pekerjaan') || '').trim();
		const rapNilai = parseFloat(String(form.get('rapNilai') || '0').replace(/[^0-9.]/g, ''));
		const feeAlokasi = parseFloat(String(form.get('feeAlokasi') || '0').replace(/[^0-9.]/g, ''));

		if (!id || !namaVendor || rapNilai <= 0) {
			return fail(400, { message: 'Nama subkon dan nilai RAP wajib diisi.' });
		}

		await db.update(projectVendors).set({
			namaVendor,
			pekerjaan,
			rapNilai,
			feeAlokasi
		}).where(eq(projectVendors.id, id));

		return { success: true, message: 'Data subkon berhasil diperbarui.' };
	},

	deleteVendor: async ({ request }) => {
		const form = await request.formData();
		const id = parseInt(String(form.get('id') || '0'));
		if (!id) return fail(400, { message: 'ID subkon tidak valid.' });

		const hasPayments = (await db.select().from(vendorPayments).where(eq(vendorPayments.projectVendorId, id)).all()).length > 0;
		if (hasPayments) {
			return fail(400, { message: 'Subkon tidak dapat dihapus karena sudah memiliki riwayat pembayaran kasbon aktif.' });
		}

		await db.delete(projectVendors).where(eq(projectVendors.id, id));
		return { success: true, message: 'Subkon pelaksana berhasil dihapus dari proyek.' };
	},

	editKasbon: async ({ request }) => {
		const form = await request.formData();
		const id = parseInt(String(form.get('id') || '0'));
		const nominal = parseFloat(String(form.get('nominal') || '0').replace(/[^0-9.]/g, ''));
		const penerimaNama = String(form.get('penerimaNama') || '').trim();
		const tglBayar = String(form.get('tglBayar') || '').trim();
		const tipe = String(form.get('tipe') || 'KASBON_PROGRES');

		if (!id || nominal <= 0 || !penerimaNama) {
			return fail(400, { message: 'Data kasbon tidak lengkap.' });
		}

		await db.update(vendorPayments).set({
			nominal,
			penerimaNama,
			tglBayar,
			tipe
		}).where(eq(vendorPayments.id, id));

		return { success: true, message: 'Data pembayaran kasbon berhasil diperbarui.' };
	},

	deleteKasbon: async ({ request }) => {
		const form = await request.formData();
		const id = parseInt(String(form.get('id') || '0'));
		if (!id) return fail(400, { message: 'ID kasbon tidak valid.' });

		await db.delete(vendorPayments).where(eq(vendorPayments.id, id));
		return { success: true, message: 'Riwayat pembayaran kasbon berhasil dihapus.' };
	}
};

