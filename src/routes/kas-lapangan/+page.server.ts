import { db } from '#lib/server/db';
import { cashTransactions, projects } from '#lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import ExcelJS from 'exceljs';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	// Ambil semua transaksi Kas Kecil CIH
	const transactions = await db.select().from(cashTransactions)
		.where(eq(cashTransactions.akunAsal, 'KAS_KECIL_CIH'))
		.orderBy(desc(cashTransactions.tgl), desc(cashTransactions.id))
		.all();

	// Ambil daftar proyek untuk dropdown cost center
	const allProjects = await db.select().from(projects).orderBy(projects.nama).all();

	// Hitung Saldo Kas Kecil Berjalan
	const totalMasuk = transactions.filter(t => t.tipe === 'IN').reduce((acc, t) => acc + t.nominal, 0);
	const totalKeluar = transactions.filter(t => t.tipe === 'OUT').reduce((acc, t) => acc + t.nominal, 0);
	const saldoSaatIni = totalMasuk - totalKeluar;

	// Total per kategori pengeluaran
	const kategoriTotals = transactions.filter(t => t.tipe === 'OUT').reduce((acc, t) => {
		acc[t.kategori] = (acc[t.kategori] || 0) + t.nominal;
		return acc;
	}, {} as Record<string, number>);

	// Map projects untuk lookup nama proyek
	const projectMap = new Map(allProjects.map(p => [p.id, p.nama]));
	const enrichedTransactions = transactions.map(t => ({
		...t,
		namaProyek: t.projectId ? projectMap.get(t.projectId) || 'Umum Lapangan' : 'Umum Lapangan'
	}));

	return {
		transactions: enrichedTransactions,
		projects: allProjects,
		summary: {
			saldoSaatIni,
			totalMasuk,
			totalKeluar,
			kategoriTotals
		}
	};
};

export const actions: Actions = {
	addTransaction: async ({ request }) => {
		const form = await request.formData();
		const tipe = String(form.get('tipe') || 'OUT') as 'IN' | 'OUT';
		const kategori = String(form.get('kategori') || 'OPERASIONAL_LAPANGAN');
		const nominal = parseFloat(String(form.get('nominal') || '0'));
		const tgl = String(form.get('tgl') || '').trim();
		const keterangan = String(form.get('keterangan') || '').trim();
		const projectIdRaw = form.get('projectId');
		const projectId = projectIdRaw && String(projectIdRaw) !== 'NONE' ? parseInt(String(projectIdRaw)) : null;
		const penerimaPic = String(form.get('penerimaPic') || '').trim();

		if (nominal <= 0 || !keterangan) {
			return fail(400, { message: 'Nominal harus lebih dari 0 dan keterangan wajib diisi.' });
		}

		await db.insert(cashTransactions).values({
			akunAsal: 'KAS_KECIL_CIH',
			tipe,
			kategori,
			nominal,
			tgl: tgl || new Date().toISOString().split('T')[0],
			keterangan,
			projectId,
			penerimaPic: penerimaPic || 'Kasir CIH'
		});

		return { success: true, message: 'Transaksi kas lapangan berhasil dicatat.' };
	},

	deleteTransaction: async ({ request }) => {
		const form = await request.formData();
		const id = parseInt(String(form.get('id') || '0'));

		if (!id) {
			return fail(400, { message: 'ID transaksi tidak valid.' });
		}

		await db.delete(cashTransactions).where(eq(cashTransactions.id, id));
		return { success: true, message: 'Transaksi kas kecil berhasil dihapus.' };
	},

	exportExcel: async () => {
		const transactions = await db.select().from(cashTransactions)
			.where(eq(cashTransactions.akunAsal, 'KAS_KECIL_CIH'))
			.orderBy(desc(cashTransactions.tgl), desc(cashTransactions.id))
			.all();

		const allProjects = await db.select().from(projects).all();
		const projectMap = new Map(allProjects.map(p => [p.id, p.nama]));

		const wb = new ExcelJS.Workbook();
		const ws = wb.addWorksheet('KAS KECIL OPERASIONAL CIH');

		ws.columns = [
			{ header: 'NO', key: 'no', width: 6 },
			{ header: 'TANGGAL', key: 'tgl', width: 14 },
			{ header: 'JENIS ALUR', key: 'tipe', width: 16 },
			{ header: 'KATEGORI', key: 'kategori', width: 22 },
			{ header: 'BEBAN PROYEK SPPG', key: 'proyek', width: 26 },
			{ header: 'PIC / PENERIMA', key: 'pic', width: 22 },
			{ header: 'URAIAN / KETERANGAN', key: 'keterangan', width: 40 },
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
				kategori: t.kategori,
				proyek: t.projectId ? projectMap.get(t.projectId) || 'Umum Lapangan' : 'Umum Lapangan',
				pic: t.penerimaPic || '-',
				keterangan: t.keterangan,
				masuk,
				keluar
			});

			row.getCell('masuk').numFmt = '#,##0';
			row.getCell('keluar').numFmt = '#,##0';
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
		summaryRow.getCell('masuk').numFmt = '#,##0';
		summaryRow.getCell('keluar').numFmt = '#,##0';

		const buffer = await wb.xlsx.writeBuffer();
		return { success: true, base64: Buffer.from(buffer).toString('base64') };
	}
};
