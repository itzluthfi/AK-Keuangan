import { db } from '#lib/server/db';
import { projects, projectTermins, projectVendors, vendorPayments, cashTransactions } from '#lib/server/db/schema';
import { eq } from 'drizzle-orm';
import ExcelJS from 'exceljs';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const selectedIdsParam = url.searchParams.get('selectedIds') || '';
	const selectedIdSet = selectedIdsParam ? new Set(selectedIdsParam.split(',').map(Number).filter(Boolean)) : null;

	const allProjects = await db.select().from(projects).all();
	const exportProjects = selectedIdSet && selectedIdSet.size > 0
		? allProjects.filter(p => selectedIdSet.has(p.id))
		: allProjects;

	const allTermins = await db.select().from(projectTermins).all();
	const allVendors = await db.select().from(projectVendors).all();
	const allPayments = await db.select().from(vendorPayments).all();
	const allCih = await db.select().from(cashTransactions).where(eq(cashTransactions.akunAsal, 'KAS_KECIL_CIH')).all();

	const wb = new ExcelJS.Workbook();
	wb.creator = 'Pantau MBG SPPG';
	wb.created = new Date();

	const ws = wb.addWorksheet('REKAP KAS SPPG MBG');

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

	const headerRow = ws.getRow(1);
	headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
	headerRow.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'FF0F172A' }
	};
	headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
	headerRow.height = 26;

	let totalKontrak = 0;
	let totalTermin = 0;
	let totalSisa = 0;
	let totalSubkon = 0;
	let totalOps = 0;
	let totalMargin = 0;

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

		totalKontrak += p.rabKontrak;
		totalTermin += terminMasuk;
		totalSisa += sisaTermin;
		totalSubkon += totalBebanVendor;
		totalOps += totalOperasional;
		totalMargin += marginBersih;

		const row = ws.addRow({
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

		row.getCell('no').alignment = { horizontal: 'center' };
		row.getCell('kode').alignment = { horizontal: 'center' };
		row.getCell('progres').alignment = { horizontal: 'center' };
		row.getCell('kontrak').numFmt = '#,##0';
		row.getCell('terminMasuk').numFmt = '#,##0';
		row.getCell('sisaTermin').numFmt = '#,##0';
		row.getCell('bebanVendor').numFmt = '#,##0';
		row.getCell('operasional').numFmt = '#,##0';
		row.getCell('marginBersih').numFmt = '#,##0';
	});

	ws.eachRow((row, rowNumber) => {
		if (rowNumber > 1) {
			row.eachCell({ includeEmpty: true }, (cell) => {
				cell.border = {
					top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
					left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
					bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
					right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
				};
			});
		}
	});

	const summaryRow = ws.addRow({
		no: '',
		kode: '',
		nama: 'TOTAL REKAPITULASI',
		progres: '',
		kontrak: totalKontrak,
		terminMasuk: totalTermin,
		sisaTermin: totalSisa,
		bebanVendor: totalSubkon,
		operasional: totalOps,
		marginBersih: totalMargin
	});
	summaryRow.font = { bold: true };
	summaryRow.getCell('kontrak').numFmt = '#,##0';
	summaryRow.getCell('terminMasuk').numFmt = '#,##0';
	summaryRow.getCell('sisaTermin').numFmt = '#,##0';
	summaryRow.getCell('bebanVendor').numFmt = '#,##0';
	summaryRow.getCell('operasional').numFmt = '#,##0';
	summaryRow.getCell('marginBersih').numFmt = '#,##0';

	summaryRow.eachCell((cell) => {
		cell.border = {
			top: { style: 'thin', color: { argb: 'FF0F172A' } },
			bottom: { style: 'double', color: { argb: 'FF0F172A' } }
		};
		cell.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'FFF1F5F9' }
		};
	});

	const buffer = await wb.xlsx.writeBuffer();
	const suffix = selectedIdSet && selectedIdSet.size > 0 ? `TERPILIH_${selectedIdSet.size}_TITIK` : 'SEMUA_TITIK';
	const filename = `REKAP_KAS_SPPG_${suffix}_${new Date().toISOString().split('T')[0]}.xlsx`;

	return new Response(buffer, {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
};
