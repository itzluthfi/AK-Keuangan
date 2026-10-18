import { db } from '#lib/server/db';
import { cashTransactions, projects } from '#lib/server/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import ExcelJS from 'exceljs';

export const load: PageServerLoad = async () => {
	// 1. Ambil mutasi Rekening Induk / Holding
	const transactions = await db.select().from(cashTransactions)
		.where(eq(cashTransactions.akunAsal, 'REK_AZKA_POOLING'))
		.orderBy(desc(cashTransactions.tgl), desc(cashTransactions.id))
		.all();

	// 2. Ambil master proyek untuk dropdown
	const allProjects = await db.select().from(projects).orderBy(projects.nama).all();
	const projectMap = new Map(allProjects.map(p => [p.id, p]));

	// 3. Ambil daftar pihak penerima/penyetor unik yang pernah tercatat untuk autocomplete
	const allCihTxs = await db.select({ pic: cashTransactions.penerimaPic }).from(cashTransactions).all();
	const uniquePenerimaSet = new Set<string>();
	allCihTxs.forEach(t => {
		if (t.pic && t.pic.trim()) uniquePenerimaSet.add(t.pic.trim());
	});
	// Default suggestions
	['Bpk. Azka (Pimpinan)', 'Kasir CIH Lapangan', 'Mandor Kohar', 'Mandor Sodin', 'Mandor Shodiq', 'Toko Material Sentral', 'Dinas / Pemilik Proyek'].forEach(p => uniquePenerimaSet.add(p));

	// 4. Perkaya transaksi dengan data proyek
	const enrichedTransactions = transactions.map((t, idx) => {
		const proj = t.projectId ? projectMap.get(t.projectId) : null;
		return {
			...t,
			projectNama: proj ? proj.nama : null,
			projectKode: proj ? proj.kode : null
		};
	});

	// 5. Agregasi Arus Kas Pooling
	const totalInflow = transactions.filter(t => t.tipe === 'IN').reduce((acc, t) => acc + t.nominal, 0);
	const totalDisbursed = transactions.filter(t => t.tipe === 'OUT').reduce((acc, t) => acc + t.nominal, 0);
	const saldoPooling = totalInflow - totalDisbursed;

	// Saldo Kasir CIH Lapangan sebagai info komparasi
	const cihTxs = await db.select().from(cashTransactions).where(eq(cashTransactions.akunAsal, 'KAS_KECIL_CIH')).all();
	const cihIn = cihTxs.filter(t => t.tipe === 'IN').reduce((acc, t) => acc + t.nominal, 0);
	const cihOut = cihTxs.filter(t => t.tipe === 'OUT').reduce((acc, t) => acc + t.nominal, 0);
	const saldoCih = cihIn - cihOut;

	return {
		transactions: enrichedTransactions,
		projects: allProjects,
		penerimaList: Array.from(uniquePenerimaSet).sort(),
		summary: {
			saldoPooling,
			totalInflow,
			totalDisbursed,
			saldoCih,
			totalTransaksi: transactions.length
		}
	};
};

export const actions: Actions = {
	addTransaction: async ({ request }) => {
		const form = await request.formData();
		const jenisAksi = String(form.get('jenisAksi') || 'IN'); // 'IN' | 'OUT' | 'TRANSFER'
		const nominal = parseFloat(String(form.get('nominal') || '0').replace(/[^0-9.]/g, ''));
		const tgl = String(form.get('tgl') || '').trim();
		const keterangan = String(form.get('keterangan') || '').trim();
		const projectIdRaw = form.get('projectId');
		const projectId = projectIdRaw && String(projectIdRaw) !== 'NONE' ? parseInt(String(projectIdRaw)) : null;
		const penerimaPic = String(form.get('penerimaPic') || '').trim();
		const kategori = String(form.get('kategori') || '').trim();
		const akunTujuan = String(form.get('akunTujuan') || 'KAS_KECIL_CIH');

		// Validasi Backend Standar
		if (isNaN(nominal) || nominal <= 0) {
			return fail(400, { success: false, error: 'Nominal transaksi harus berupa angka lebih besar dari Rp 0.' });
		}

		if (!tgl || !/^\d{4}-\d{2}-\d{2}$/.test(tgl)) {
			return fail(400, { success: false, error: 'Tanggal transaksi wajib diisi dengan format yang benar (YYYY-MM-DD).' });
		}

		if (!keterangan || keterangan.length < 3) {
			return fail(400, { success: false, error: 'Keterangan transaksi wajib diisi minimal 3 karakter.' });
		}

		const batchId = `TRX-${Date.now()}`;

		if (jenisAksi === 'TRANSFER') {
			// Validasi transfer
			if (akunTujuan === 'REK_AZKA_POOLING') {
				return fail(400, { success: false, error: 'Rekening tujuan transfer tidak boleh sama dengan rekening asal (Rekening Induk).' });
			}

			const namaAkunTujuan = akunTujuan === 'KAS_KECIL_CIH' ? 'Kasir Lapangan (CIH)' : 'Rekening Operasional / BSI';

			// 1. Catat OUT di Rekening Induk Pooling
			await db.insert(cashTransactions).values({
				akunAsal: 'REK_AZKA_POOLING',
				tipe: 'OUT',
				kategori: 'DROP_KAS',
				nominal,
				tgl,
				keterangan: `[Pindah Kas] Transfer ke ${namaAkunTujuan} - ${keterangan}`,
				projectId,
				penerimaPic: penerimaPic || namaAkunTujuan,
				idempotencyKey: `${batchId}-OUT`
			});

			// 2. Catat IN di Rekening / Kas Tujuan
			await db.insert(cashTransactions).values({
				akunAsal: akunTujuan as any,
				tipe: 'IN',
				kategori: 'DROP_KAS',
				nominal,
				tgl,
				keterangan: `[Terima Kas] Drop dana dari Rekening Induk Azka - ${keterangan}`,
				projectId,
				penerimaPic: penerimaPic || 'Kasir',
				idempotencyKey: `${batchId}-IN`
			});

			return { success: true, message: `Transfer kas sebesar Rp ${nominal.toLocaleString('id-ID')} ke ${namaAkunTujuan} berhasil dibukukan.` };
		}

		// Transaksi Biasa (IN atau OUT)
		const tipeDb = jenisAksi === 'IN' ? 'IN' : 'OUT';
		const defaultKategori = tipeDb === 'IN' ? 'TERMIN_MASUK' : 'OPERASIONAL_LAPANGAN';

		await db.insert(cashTransactions).values({
			akunAsal: 'REK_AZKA_POOLING',
			tipe: tipeDb,
			kategori: kategori || defaultKategori,
			nominal,
			tgl,
			keterangan,
			projectId,
			penerimaPic: penerimaPic || (tipeDb === 'IN' ? 'Bpk. Azka (Penyetor)' : 'Penerima Pembayaran')
		});

		return {
			success: true,
			message: `${tipeDb === 'IN' ? 'Pemasukan kas' : 'Pengeluaran kas'} sebesar Rp ${nominal.toLocaleString('id-ID')} berhasil dicatat.`
		};
	},

	deleteTransaction: async ({ request }) => {
		const form = await request.formData();
		const id = parseInt(String(form.get('id') || '0'));

		if (!id) {
			return fail(400, { success: false, error: 'ID transaksi tidak valid.' });
		}

		await db.delete(cashTransactions).where(eq(cashTransactions.id, id));
		return { success: true, message: 'Transaksi berhasil dihapus dari pembukuan.' };
	},

	exportExcel: async () => {
		const transactions = await db.select().from(cashTransactions)
			.where(eq(cashTransactions.akunAsal, 'REK_AZKA_POOLING'))
			.orderBy(desc(cashTransactions.tgl), desc(cashTransactions.id))
			.all();

		const allProjects = await db.select().from(projects).all();
		const projectMap = new Map(allProjects.map(p => [p.id, p.nama]));

		const wb = new ExcelJS.Workbook();
		const ws = wb.addWorksheet('MUTASI REKENING INDUK POOLING');

		ws.columns = [
			{ header: 'NO', key: 'no', width: 6 },
			{ header: 'TANGGAL', key: 'tgl', width: 14 },
			{ header: 'JENIS', key: 'tipe', width: 12 },
			{ header: 'KETERANGAN', key: 'keterangan', width: 35 },
			{ header: 'PROYEK TERKAIT', key: 'proyek', width: 25 },
			{ header: 'PIHAK / PIC', key: 'pic', width: 20 },
			{ header: 'MASUK (INFLOW)', key: 'masuk', width: 18 },
			{ header: 'KELUAR (DISBURSE)', key: 'keluar', width: 18 }
		];

		transactions.forEach((t, idx) => {
			ws.addRow({
				no: idx + 1,
				tgl: t.tgl,
				tipe: t.tipe === 'IN' ? 'KAS MASUK' : 'KAS KELUAR',
				keterangan: t.keterangan,
				proyek: t.projectId ? projectMap.get(t.projectId) || '-' : 'Holding / Overhead',
				pic: t.penerimaPic || '-',
				masuk: t.tipe === 'IN' ? t.nominal : 0,
				keluar: t.tipe === 'OUT' ? t.nominal : 0
			});
		});

		const buffer = await wb.xlsx.writeBuffer();
		return { success: true, base64: Buffer.from(buffer).toString('base64') };
	}
};
