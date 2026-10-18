import { db } from '#lib/server/db';
import { projects, projectVendors, vendorPayments } from '#lib/server/db/schema';
import { encodeId } from '#lib/server/sqids';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const allProjects = await db.select().from(projects).all();
	const allVendors = await db.select().from(projectVendors).all();
	const allPayments = await db.select().from(vendorPayments).all();

	const projectMap = new Map(allProjects.map(p => [p.id, p]));

	const vendorList = allVendors.map((v, idx) => {
		const project = projectMap.get(v.projectId);
		const payments = allPayments.filter(pm => pm.projectVendorId === v.id);
		const totalTerbayar = payments.reduce((acc, pm) => acc + (pm.nominal || 0), 0);
		const sisaHutang = Math.max(0, (v.rapNilai || 0) - totalTerbayar);
		const pctTerbayar = v.rapNilai > 0 ? (totalTerbayar / v.rapNilai) * 100 : 0;

		return {
			no: idx + 1,
			id: v.id,
			namaVendor: v.namaVendor,
			bidang: v.pekerjaan || 'Pekerjaan Sipil / MEP Dapur',
			namaProyek: project ? project.nama : 'Titik SPPG',
			progresFisikProyek: project ? project.progresFisikPct : 0,
			rapNilai: v.rapNilai || 0,
			feeAlokasi: v.feeAlokasi || 0,
			totalTerbayar,
			sisaHutang,
			pctTerbayar,
			isOverprogress: project ? (pctTerbayar > (project.progresFisikPct + 10)) : false,
			projectHashId: project ? encodeId(project.id) : ''
		};
	});

	const totalKewajibanRap = vendorList.reduce((acc, v) => acc + v.rapNilai, 0);
	const totalSudahDibayar = vendorList.reduce((acc, v) => acc + v.totalTerbayar, 0);
	const totalSisaHutang = vendorList.reduce((acc, v) => acc + v.sisaHutang, 0);

	return {
		vendors: vendorList,
		kpi: {
			totalKewajibanRap,
			totalSudahDibayar,
			totalSisaHutang,
			totalVendorCount: vendorList.length
		}
	};
};
