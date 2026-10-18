import { db } from '#lib/server/db';
import { projects, projectTermins, projectVendors, vendorPayments, cashTransactions } from '#lib/server/db/schema';
import { encodeId } from '#lib/server/sqids';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allProjects = await db.select().from(projects).all();
	const allTermins = await db.select().from(projectTermins).all();
	const allVendors = await db.select().from(projectVendors).all();
	const allPayments = await db.select().from(vendorPayments).all();
	const allCih = await db.select().from(cashTransactions).where(eq(cashTransactions.akunAsal, 'KAS_KECIL_CIH')).all();

	const projectList = allProjects.map((p, idx) => {
		const termins = allTermins.filter(t => t.projectId === p.id);
		const terminMasuk = termins.reduce((acc, t) => acc + (t.nominalCair || 0), 0);
		const sisaTermin = Math.max(0, p.rabKontrak - terminMasuk);
		const terminPct = p.rabKontrak > 0 ? (terminMasuk / p.rabKontrak) * 100 : 0;

		const vendors = allVendors.filter(v => v.projectId === p.id);
		const vendorIds = new Set(vendors.map(v => v.id));
		const payments = allPayments.filter(pm => vendorIds.has(pm.projectVendorId));
		const totalBebanSubkon = payments.reduce((acc, pm) => acc + (pm.nominal || 0), 0);

		const cihTxs = allCih.filter(c => c.projectId === p.id && c.tipe === 'OUT');
		const totalCih = cihTxs.reduce((acc, c) => acc + (c.nominal || 0), 0);
		const totalPengeluaranRiil = totalBebanSubkon + totalCih;

		// Hitung RAP Vendor dan Estimasi Total Beban Kontrak
		const totalRapVendor = vendors.reduce((acc, v) => acc + (v.rapNilai || 0), 0);
		const totalFeeVendor = vendors.reduce((acc, v) => acc + (v.feeAlokasi || 0), 0);
		const estimasiTotalBeban = totalRapVendor > 0 ? (totalRapVendor + totalFeeVendor + totalCih) : totalPengeluaranRiil;

		// 1. Laba Proyeksi / Realisasi Proyek (Profitability Kontrak Sebenarnya)
		const labaProyek = p.rabKontrak - (p.progresFisikPct === 100 ? totalPengeluaranRiil : estimasiTotalBeban);
		const labaPct = p.rabKontrak > 0 ? (labaProyek / p.rabKontrak) * 100 : 0;

		// 2. Arus Kas Berjalan Saat Ini (Sisa Kas / Dana Talangan Sementara)
		const arusKas = terminMasuk - totalPengeluaranRiil;

		// Kategori pekerjaan riil
		const isDesain = p.nama.toUpperCase().startsWith('DESAIN') || p.nama.toUpperCase().startsWith('D.');
		const kategoriPekerjaan = isDesain ? 'Jasa Desain Arsitektur' : 'Pelaksanaan & Konstruksi';

		return {
			no: idx + 1,
			id: p.id,
			hashId: encodeId(p.id),
			kode: p.kode,
			nama: p.nama,
			lokasi: p.lokasi || 'Jawa Timur',
			status: p.status,
			progresFisikPct: p.progresFisikPct,
			rabKontrak: p.rabKontrak,
			terminMasuk,
			sisaTermin,
			terminPct,
			totalPengeluaran: totalPengeluaranRiil,
			labaProyek,
			labaPct,
			arusKas,
			isTalangan: arusKas < 0,
			kategoriPekerjaan
		};
	});

	return {
		projects: projectList,
		totalTitik: projectList.length,
		selesaiCount: projectList.filter(p => p.progresFisikPct === 100).length,
		onProgressCount: projectList.filter(p => p.progresFisikPct > 0 && p.progresFisikPct < 100).length
	};
};
