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
		const vendors = allVendors.filter(v => v.projectId === p.id);
		const vendorIds = new Set(vendors.map(v => v.id));
		const payments = allPayments.filter(pm => vendorIds.has(pm.projectVendorId));
		const totalBebanSubkon = payments.reduce((acc, pm) => acc + (pm.nominal || 0), 0);

		const cihTxs = allCih.filter(c => c.projectId === p.id && c.tipe === 'OUT');
		const totalCih = cihTxs.reduce((acc, c) => acc + (c.nominal || 0), 0);
		const marginBersih = terminMasuk - (totalBebanSubkon + totalCih);

		return {
			no: idx + 1,
			id: p.id,
			hashId: encodeId(p.id),
			kode: p.kode,
			nama: p.nama,
			lokasi: p.lokasi,
			status: p.status,
			progresFisikPct: p.progresFisikPct,
			rabKontrak: p.rabKontrak,
			terminMasuk,
			totalBebanSubkon,
			marginBersih,
			kapasitasPorsi: 3500 // Standar SPPG MBG
		};
	});

	return {
		projects: projectList,
		totalTitik: projectList.length,
		selesaiCount: projectList.filter(p => p.progresFisikPct === 100).length,
		onProgressCount: projectList.filter(p => p.progresFisikPct > 0 && p.progresFisikPct < 100).length
	};
};
