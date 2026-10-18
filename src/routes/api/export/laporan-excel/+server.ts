import { db } from '#lib/server/db';
import { projects, projectTermins, projectVendors, vendorPayments, cashTransactions } from '#lib/server/db/schema';
import { eq } from 'drizzle-orm';
import ExcelJS from 'exceljs';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const allProjects = await db.select().from(projects).all();
	const allTermins = await db.select().from(projectTermins).all();
	const allVendors = await db.select().from(projectVendors).all();
	const allPayments = await db.select().from(vendorPayments).all();
	const allCih = await db.select().from(cashTransactions).where(eq(cashTransactions.akunAsal, 'KAS_KECIL_CIH')).all();

	const wb = new ExcelJS.Workbook();
	wb.creator = 'PT AK Karya Bersama Indonesia';
	wb.created = new Date();

	const ws = wb.addWorksheet('REKAPITULASI RESMI SPPG', {
		pageSetup: { orientation: 'landscape', paperSize: 9 }
	});

	// 1. Title Banner Rows
	ws.mergeCells('A1:J1');
	const titleCell = ws.getCell('A1');
	titleCell.value = 'PT. AK KARYA BERSAMA INDONESIA - LAPORAN REKAPITULASI KAS PROYEK SPPG MBG';
	titleCell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
	titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
	titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
	ws.getRow(1).height = 30;

	ws.mergeCells('A2:J2');
	const subCell = ws.getCell('A2');
	subCell.value = `Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} | Status: Dokumen Keuangan Eksekutif`;
	subCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF475569' } };
	subCell.alignment = { horizontal: 'center', vertical: 'middle' };
	ws.getRow(2).height = 18;

	ws.addRow([]); // Blank line 3

	// 2. Table Column Headers
	const headers = [
		'NO',
		'KODE PROYEK',
		'TITIK DAPUR SPPG',
		'PROGRES FISIK',
		'KONTRAK SPK (RAB)',
		'TERMIN MASUK (IN)',
		'SISA TERMIN',
		'BEBAN SUBKON (RAP)',
		'OPERASIONAL CIH',
		'MARGIN BERSIH (NET)'
	];

	const headerRow = ws.addRow(headers);
	headerRow.height = 24;
	headerRow.eachCell((cell) => {
		cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
		cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
		cell.alignment = { horizontal: 'center', vertical: 'middle' };
		cell.border = {
			top: { style: 'thin', color: { argb: 'FF94A3B8' } },
			bottom: { style: 'medium', color: { argb: 'FF0F172A' } }
		};
	});

	// 3. Populate Data Rows
	let sumKontrak = 0;
	let sumTermin = 0;
	let sumSisaTermin = 0;
	let sumSubkon = 0;
	let sumCIH = 0;
	let sumMargin = 0;

	allProjects.forEach((p, idx) => {
		const termins = allTermins.filter(t => t.projectId === p.id);
		const terminMasuk = termins.reduce((acc, t) => acc + (t.nominalCair || 0), 0);
		const sisaTermin = Math.max(0, p.rabKontrak - terminMasuk);

		const vendors = allVendors.filter(v => v.projectId === p.id);
		const vendorIds = new Set(vendors.map(v => v.id));
		const payments = allPayments.filter(pm => vendorIds.has(pm.projectVendorId));
		const totalBebanVendor = payments.reduce((acc, pm) => acc + (pm.nominal || 0), 0);

		const cihTxs = allCih.filter(c => c.projectId === p.id && c.tipe === 'OUT');
		const totalOperasional = cihTxs.reduce((acc, c) => acc + (c.nominal || 0), 0);
		const totalPengeluaran = totalBebanVendor + totalOperasional;

		const marginBersih = terminMasuk - totalPengeluaran;

		sumKontrak += p.rabKontrak;
		sumTermin += terminMasuk;
		sumSisaTermin += sisaTermin;
		sumSubkon += totalBebanVendor;
		sumCIH += totalOperasional;
		sumMargin += marginBersih;

		const row = ws.addRow([
			idx + 1,
			p.kode,
			p.nama,
			`${p.progresFisikPct}%`,
			p.rabKontrak,
			terminMasuk,
			sisaTermin,
			totalBebanVendor,
			totalOperasional,
			marginBersih
		]);

		row.height = 20;

		if (idx % 2 === 1) {
			row.eachCell((cell) => {
				cell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: 'FFF8FAFC' }
				};
			});
		}

		row.eachCell((cell, colNumber) => {
			cell.font = { name: 'Arial', size: 9 };
			cell.border = {
				top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
				left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
				bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
				right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
			};

			if (colNumber === 1 || colNumber === 2 || colNumber === 4) {
				cell.alignment = { horizontal: 'center', vertical: 'middle' };
			} else if (colNumber === 3) {
				cell.alignment = { horizontal: 'left', vertical: 'middle' };
			} else {
				cell.alignment = { horizontal: 'right', vertical: 'middle' };
				cell.numFmt = '"Rp "#,##0;[Red]("-Rp "#,##0);"-"';
			}
		});
	});

	// 4. Summary Totals Row
	const totalRow = ws.addRow([
		'',
		'TOTAL',
		`TOTAL PORTOFOLIO SPPG (${allProjects.length} TITIK)`,
		'',
		sumKontrak,
		sumTermin,
		sumSisaTermin,
		sumSubkon,
		sumCIH,
		sumMargin
	]);

	totalRow.height = 24;
	totalRow.eachCell((cell, colNumber) => {
		cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
		cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
		cell.border = {
			top: { style: 'thin', color: { argb: 'FF0F172A' } },
			bottom: { style: 'double', color: { argb: 'FF0F172A' } }
		};

		if (colNumber >= 5) {
			cell.alignment = { horizontal: 'right' };
			cell.numFmt = '"Rp "#,##0;[Red]("-Rp "#,##0);"-"';
		} else {
			cell.alignment = { horizontal: 'center' };
		}
	});

	// 5. Auto-fit Column Widths
	const minWidths = [6, 16, 30, 14, 20, 20, 20, 20, 18, 22];
	ws.columns.forEach((col, idx) => {
		col.width = minWidths[idx] || 16;
	});

	const buffer = await wb.xlsx.writeBuffer();
	const filename = `REKAPITULASI_KAS_SPPG_MBG_${new Date().toISOString().split('T')[0]}.xlsx`;

	return new Response(buffer, {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
};
