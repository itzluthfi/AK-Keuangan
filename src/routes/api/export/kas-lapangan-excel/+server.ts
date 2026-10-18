import { db } from '#lib/server/db';
import { cashTransactions, projects } from '#lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import ExcelJS from 'exceljs';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const transactions = await db.select().from(cashTransactions)
		.where(eq(cashTransactions.akunAsal, 'KAS_KECIL_CIH'))
		.orderBy(desc(cashTransactions.tgl), desc(cashTransactions.id))
		.all();

	const allProjects = await db.select().from(projects).all();
	const projectMap = new Map(allProjects.map(p => [p.id, p.nama]));

	const wb = new ExcelJS.Workbook();
	wb.creator = 'Pantau MBG SPPG';
	wb.created = new Date();

	const ws = wb.addWorksheet('KAS KECIL OPERASIONAL CIH');

	ws.columns = [
		{ header: 'NO', key: 'no', width: 6 },
		{ header: 'TANGGAL', key: 'tgl', width: 14 },
		{ header: 'JENIS ALUR', key: 'tipe', width: 16 },
		{ header: 'KATEGORI', key: 'kategori', width: 24 },
		{ header: 'BEBAN PROYEK SPPG', key: 'proyek', width: 28 },
		{ header: 'PIC / PENERIMA', key: 'pic', width: 22 },
		{ header: 'URAIAN / KETERANGAN', key: 'keterangan', width: 42 },
		{ header: 'MASUK / DROP (RP)', key: 'masuk', width: 20 },
		{ header: 'PENGELUARAN (RP)', key: 'keluar', width: 20 }
	];

	// Style header row
	const headerRow = ws.getRow(1);
	headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
	headerRow.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'FF0F172A' } // Slate-900
	};
	headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
	headerRow.height = 26;

	function formatKategori(kat: string): string {
		const map: Record<string, string> = {
			'BBM_LOGISTIK': 'BBM & Transport Logistik',
			'KONSUMSI': 'Konsumsi & Jamuan Lapangan',
			'OPERASIONAL_LAPANGAN': 'Operasional Taktis Lapangan',
			'ATK_PERLENGKAPAN': 'ATK & Keperluan Kantor',
			'DROP_KAS': 'Drop Kas Masuk (Rek. Pusat)',
			'FEE': 'Fee Manajemen / Operasional',
			'KASBON_SUBKON': 'Pencairan Kasbon Mandor/Subkon',
			'MATERIAL_TAKTIS': 'Material Taktis Proyek'
		};
		return map[kat] || kat.replace(/_/g, ' ');
	}

	let totalMasuk = 0;
	let totalKeluar = 0;

	transactions.forEach((t, idx) => {
		const masuk = t.tipe === 'IN' ? t.nominal : 0;
		const keluar = t.tipe === 'OUT' ? t.nominal : 0;
		totalMasuk += masuk;
		totalKeluar += keluar;

		const row = ws.addRow({
			no: idx + 1,
			tgl: t.tgl,
			tipe: t.tipe === 'IN' ? 'KAS MASUK (DROP)' : 'KAS KELUAR',
			kategori: formatKategori(t.kategori),
			proyek: t.projectId ? projectMap.get(t.projectId) || 'Umum Lapangan' : 'Umum Lapangan',
			pic: t.penerimaPic || '-',
			keterangan: t.keterangan,
			masuk,
			keluar
		});

		row.getCell('no').alignment = { horizontal: 'center' };
		row.getCell('tgl').alignment = { horizontal: 'center' };
		row.getCell('tipe').alignment = { horizontal: 'center' };
		row.getCell('masuk').numFmt = '#,##0';
		row.getCell('keluar').numFmt = '#,##0';
	});

	// Border and zebra styling for all rows
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

	// Summary Row
	const summaryRow = ws.addRow({
		no: '',
		tgl: '',
		tipe: 'TOTAL',
		kategori: '',
		proyek: '',
		pic: '',
		keterangan: 'TOTAL REKAPITULASI KAS OPERASIONAL',
		masuk: totalMasuk,
		keluar: totalKeluar
	});
	summaryRow.font = { bold: true };
	summaryRow.getCell('tipe').alignment = { horizontal: 'center' };
	summaryRow.getCell('masuk').numFmt = '#,##0';
	summaryRow.getCell('keluar').numFmt = '#,##0';
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
	const filename = `KAS_OPERASIONAL_LAPANGAN_${new Date().toISOString().split('T')[0]}.xlsx`;

	return new Response(buffer, {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
};
