import { db } from '#lib/server/db';
import { projects, projectTermins, projectVendors, vendorPayments, cashTransactions } from '#lib/server/db/schema';
import { encodeId } from '#lib/server/sqids';
import { eq, sql } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import ExcelJS from 'exceljs';

export const load: PageServerLoad = async ({ url }) => {
	// 1. Ambil data semua proyek
	const allProjects = await db.select().from(projects).all();

	// 2. Ambil data termin per proyek
	const allTermins = await db.select().from(projectTermins).all();

	// 3. Ambil data vendor & pembayaran
	const allVendors = await db.select().from(projectVendors).all();
	const allPayments = await db.select().from(vendorPayments).all();

	// 4. Ambil mutasi kas CIH per proyek
	const allCih = await db.select().from(cashTransactions).where(eq(cashTransactions.akunAsal, 'KAS_KECIL_CIH')).all();

	// 5. Agregasi per proyek
	const projectRows = allProjects.map((p, idx) => {
		// Termin masuk
		const termins = allTermins.filter(t => t.projectId === p.id);
		const terminMasuk = termins.reduce((acc, t) => acc + (t.nominalCair || 0), 0);
		const sisaTermin = Math.max(0, p.rabKontrak - terminMasuk);

		// Vendor & Kasbon
		const vendors = allVendors.filter(v => v.projectId === p.id);
		const vendorIds = new Set(vendors.map(v => v.id));
		const totalRapVendor = vendors.reduce((acc, v) => acc + (v.rapNilai || 0), 0);
		const totalFeeVendor = vendors.reduce((acc, v) => acc + (v.feeAlokasi || 0), 0);

		const payments = allPayments.filter(pm => vendorIds.has(pm.projectVendorId));
		const totalBebanVendor = payments.reduce((acc, pm) => acc + (pm.nominal || 0), 0);
		const sisaHutangVendor = Math.max(0, totalRapVendor - totalBebanVendor);

		// Operasional CIH
		const cihTxs = allCih.filter(c => c.projectId === p.id && c.tipe === 'OUT');
		const totalOperasional = cihTxs.reduce((acc, c) => acc + (c.nominal || 0), 0);

		// Total Beban Riil
		const totalPengeluaran = totalBebanVendor + totalOperasional + totalFeeVendor;

		// Margin
		const marginKotor = terminMasuk - totalBebanVendor;
		const marginBersih = terminMasuk - totalPengeluaran;
		const marginPct = terminMasuk > 0 ? (marginBersih / terminMasuk) * 100 : (p.rabKontrak > 0 ? ((p.rabKontrak - (totalRapVendor + totalFeeVendor)) / p.rabKontrak) * 100 : 0);

		// Warning Indicator
		const isOverbudget = totalPengeluaran > (terminMasuk > 0 ? terminMasuk : p.rabKontrak);
		const isKasbonWarning = totalRapVendor > 0 && (totalBebanVendor / totalRapVendor) * 100 > (p.progresFisikPct + 10);

		return {
			no: idx + 1,
			id: p.id,
			hashId: encodeId(p.id), // URL-Safe Obfuscated ID
			kode: p.kode,
			nama: p.nama,
			lokasi: p.lokasi,
			status: p.status,
			progresFisikPct: p.progresFisikPct,
			rabKontrak: p.rabKontrak,
			terminMasuk,
			sisaTermin,
			totalRapVendor,
			totalBebanVendor,
			sisaHutangVendor,
			totalFeeVendor,
			totalOperasional,
			totalPengeluaran,
			marginKotor,
			marginBersih,
			marginPct,
			isOverbudget,
			isKasbonWarning
		};
	});

	// 6. Ringkasan Portofolio Eksekutif & Kas Holding
	const bsiTxs = await db.select().from(cashTransactions).where(eq(cashTransactions.akunAsal, 'BANK_BSI')).all();
	const totalOverheadKantor = bsiTxs.reduce((acc, t) => acc + t.nominal, 0);

	const cihIn = allCih.filter(t => t.tipe === 'IN').reduce((acc, t) => acc + t.nominal, 0);
	const cihOut = allCih.filter(t => t.tipe === 'OUT').reduce((acc, t) => acc + t.nominal, 0);
	const saldoCih = cihIn - cihOut;

	const totalKontrak = projectRows.reduce((acc, r) => acc + r.rabKontrak, 0);
	const totalOmsetMasuk = projectRows.reduce((acc, r) => acc + r.terminMasuk, 0);
	const totalBebanSubkon = projectRows.reduce((acc, r) => acc + r.totalBebanVendor, 0);
	const totalOperasionalAll = projectRows.reduce((acc, r) => acc + r.totalOperasional, 0);
	const totalFeeAll = projectRows.reduce((acc, r) => acc + r.totalFeeVendor, 0);
	const totalPengeluaranAll = totalBebanSubkon + totalOperasionalAll + totalFeeAll;

	const totalMarginKotor = totalOmsetMasuk - totalBebanSubkon;
	const totalMarginBersih = totalOmsetMasuk - totalPengeluaranAll;
	const grossMarginPct = totalOmsetMasuk > 0 ? (totalMarginKotor / totalOmsetMasuk) * 100 : 0;
	const netMarginPct = totalOmsetMasuk > 0 ? (totalMarginBersih / totalOmsetMasuk) * 100 : 0;

	const totalSisaPiutang = projectRows.reduce((acc, r) => acc + r.sisaTermin, 0);
	const totalSisaHutang = projectRows.reduce((acc, r) => acc + r.sisaHutangVendor, 0);
	const saldoBsi = totalOmsetMasuk - (totalBebanSubkon + totalOverheadKantor);

	return {
		projects: projectRows,
		kpi: {
			totalKontrak,
			totalOmsetMasuk,
			totalBebanSubkon,
			totalOperasionalAll,
			totalFeeAll,
			totalPengeluaranAll,
			totalMarginKotor,
			totalMarginBersih,
			grossMarginPct,
			netMarginPct,
			totalSisaPiutang,
			totalSisaHutang,
			totalTitikProyek: projectRows.length,
			totalOverheadKantor,
			saldoCih,
			saldoBsi
		}
	};
};

export const actions: Actions = {
	exportExcel: async ({ request }) => {
		// Server Action to generate and export official .xlsx report
		const formData = await request.formData();
		const selectedIdsStr = String(formData.get('selectedIds') || '').trim();
		const selectedIdSet = selectedIdsStr ? new Set(selectedIdsStr.split(',').map(Number)) : null;

		const allProjects = await db.select().from(projects).all();
		const exportProjects = selectedIdSet 
			? allProjects.filter(p => selectedIdSet.has(p.id))
			: allProjects;
		const allTermins = await db.select().from(projectTermins).all();
		const allVendors = await db.select().from(projectVendors).all();
		const allPayments = await db.select().from(vendorPayments).all();
		const allCih = await db.select().from(cashTransactions).where(eq(cashTransactions.akunAsal, 'KAS_KECIL_CIH')).all();

		const wb = new ExcelJS.Workbook();
		const ws = wb.addWorksheet('REKAP KAS SPPG MBG');

		// Header styling
		ws.columns = [
			{ header: 'NO', key: 'no', width: 6 },
			{ header: 'KODE', key: 'kode', width: 18 },
			{ header: 'TITIK SPPG', key: 'nama', width: 28 },
			{ header: 'PROGRES (%)', key: 'progres', width: 14 },
			{ header: 'KONTRAK (RAB)', key: 'kontrak', width: 20 },
			{ header: 'TERMIN MASUK', key: 'terminMasuk', width: 20 },
			{ header: 'SISA TERMIN', key: 'sisaTermin', width: 20 },
			{ header: 'BEBAN SUBKON', key: 'bebanVendor', width: 20 },
			{ header: 'OPERASIONAL', key: 'operasional', width: 18 },
			{ header: 'MARGIN BERSIH', key: 'marginBersih', width: 20 }
		];

		exportProjects.forEach((p, idx) => {
			const termins = allTermins.filter(t => t.projectId === p.id);
			const terminMasuk = termins.reduce((acc, t) => acc + (t.nominalCair || 0), 0);
			const sisaTermin = Math.max(0, p.rabKontrak - terminMasuk);

			const vendors = allVendors.filter(v => v.projectId === p.id);
			const vendorIds = new Set(vendors.map(v => v.id));
			const payments = allPayments.filter(pm => vendorIds.has(pm.projectVendorId));
			const totalBebanVendor = payments.reduce((acc, pm) => acc + (pm.nominal || 0), 0);

			const cihTxs = allCih.filter(c => c.projectId === p.id && c.tipe === 'OUT');
			const totalOperasional = cihTxs.reduce((acc, c) => acc + (c.nominal || 0), 0);
			const marginBersih = terminMasuk - (totalBebanVendor + totalOperasional);

			ws.addRow({
				no: idx + 1,
				kode: p.kode,
				nama: p.nama,
				progres: p.progresFisikPct + '%',
				kontrak: p.rabKontrak,
				terminMasuk,
				sisaTermin,
				bebanVendor: totalBebanVendor,
				operasional: totalOperasional,
				marginBersih
			});
		});

		const buffer = await wb.xlsx.writeBuffer();
		return { success: true, base64: Buffer.from(buffer).toString('base64') };
	}
};
