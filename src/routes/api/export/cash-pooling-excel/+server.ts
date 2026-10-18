import { db } from '#lib/server/db';
import { cashTransactions, projects } from '#lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import ExcelJS from 'exceljs';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const transactions = await db.select().from(cashTransactions)
		.where(eq(cashTransactions.akunAsal, 'REK_AZKA_POOLING'))
		.orderBy(desc(cashTransactions.tgl), desc(cashTransactions.id))
		.all();

	const allProjects = await db.select().from(projects).all();
	const projectMap = new Map(allProjects.map(p => [p.id, p.nama]));

	const wb = new ExcelJS.Workbook();
	wb.creator = 'Pantau MBG SPPG';
	wb.created = new Date();

	const ws = wb.addWorksheet('MUTASI REKENING INDUK POOLING');

	ws.columns = [
		{ header: 'NO', key: 'no', width: 6 },
		{ header: 'TANGGAL', key: 'tgl', width: 14 },
		{ header: 'JENIS', key: 'tipe', width: 14 },
		{ header: 'KETERANGAN ALIRAN DANA', key: 'keterangan', width: 40 },
		{ header: 'PROYEK TERKAIT', key: 'proyek', width: 28 },
		{ header: 'PIHAK / PIC', key: 'pic', width: 22 },
		{ header: 'MASUK / INFLOW (RP)', key: 'masuk', width: 20 },
		{ header: 'KELUAR / DISBURSE (RP)', key: 'keluar', width: 22 }
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
			tipe: t.tipe === 'IN' ? 'KAS MASUK' : 'KAS KELUAR',
			keterangan: t.keterangan,
			proyek: t.projectId ? projectMap.get(t.projectId) || 'Holding / Overhead' : 'Holding / Overhead',
			pic: t.penerimaPic || '-',
			masuk,
			keluar
		});

		row.getCell('masuk').numFmt = '#,##0';
		row.getCell('keluar').numFmt = '#,##0';
	});

	const summaryRow = ws.addRow({
		no: '',
		tgl: '',
		tipe: 'TOTAL',
		keterangan: 'TOTAL REKAPITULASI CASH POOLING',
		proyek: '',
		pic: '',
		masuk: totalMasuk,
		keluar: totalKeluar
	});
	summaryRow.font = { bold: true };
	summaryRow.getCell('masuk').numFmt = '#,##0';
	summaryRow.getCell('keluar').numFmt = '#,##0';

	const buffer = await wb.xlsx.writeBuffer();
	const filename = `MUTASI_CASH_POOLING_AZKA_${new Date().toISOString().split('T')[0]}.xlsx`;

	return new Response(buffer, {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
};
