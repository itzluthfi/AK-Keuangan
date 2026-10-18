import ExcelJS from 'exceljs';
import { db } from './index';
import { users, projects, projectTermins, projectVendors, vendorPayments, cashTransactions } from './schema';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const mapping: Record<string, string> = {
	'FORD': 'ford',
	'DESAIN SENDI RSAL': 'D. SENDI RSAL',
	'GUDANG JENNY': 'GUDANG JENNY',
	'CANOPY DEWI': 'CANOPY DEWI',
	'JENDELA KORIDOR DEWI': 'JENDELA KORIDOR DEWI',
	'NUR EFENDI': 'NUR EFENDI',
	'DESAIN DEWI K24': 'D. DEWI K24',
	'DESAIN TENNY BEKASI': 'D. TENNY BEKASI',
	'DESAIN IBU DESY': 'D. DESY',
	'DESAIN IBU ERLIS': 'D. ERLIS',
	'BALAI PU': 'balai PU',
	'DESAIN HAMSJAH': 'D. HAMSJAH',
	'DESAIN NANANG': 'D. NANANG',
	'DESAIN ARIEF JOMBANG': 'D. ARIEF JOMBANG',
	'DESAIN IBU LINDA': 'D. LINDA',
	'DESAIN BPK SIGIT GEDANGAN': 'D. SIGIT GEDANGAN',
	'INTERIOR FRIZQI': 'INTERIOR FRIZQI',
	'RICKY': 'RICKY',
	'IPUT': 'IPUT',
	'DESAIN DR MOLIS': 'D. DR MOLIS',
	'DESAIN JONI': 'D. JONI',
	'DESAIN NIKE': 'D. NIKE',
	'DESAIN ANGGA': 'D. ANGGA',
	'DESAIN SAZA': 'D. SAZA',
	'IRSANDI': 'IRSANDI',
	'DESAIN INGE': 'D. INGE',
	'LINTANG': 'LINTANG'
};

function getCellValue(val: any): any {
	if (val === null || val === undefined) return 0;
	if (typeof val === 'object' && 'result' in val) return val.result ?? 0;
	return val;
}

function parseNumber(val: any): number {
	const v = getCellValue(val);
	if (typeof v === 'number') return v;
	if (typeof v === 'string') {
		const parsed = parseFloat(v.replace(/[^0-9.-]+/g, ''));
		return isNaN(parsed) ? 0 : parsed;
	}
	return 0;
}

function formatDate(val: any): string | null {
	if (!val) return null;
	if (val instanceof Date) {
		return val.toISOString().split('T')[0];
	}
	if (typeof val === 'string') {
		if (/^\d{4}-\d{2}-\d{2}/.test(val)) return val.slice(0, 10);
	}
	return null;
}

export async function runSeed() {
	console.log('--- Starting Database Seeder for Pantau MBG ---');

	// 1. Seed Default Users
	console.log('Seeding users...');
	await db.delete(users);
	await db.insert(users).values([
		{
			username: 'azka',
			namaLengkap: 'Bpk. Azka (Pimpinan/Direktur)',
			passwordHash: 'argon2_dummy_hash_azka',
			pinPasscodeHash: '123456',
			role: 'DIREKTUR',
			isActive: true
		},
		{
			username: 'admin',
			namaLengkap: 'Finance & Kasir Kas Besar',
			passwordHash: 'argon2_dummy_hash_admin',
			pinPasscodeHash: '123456',
			role: 'FINANCE',
			isActive: true
		},
		{
			username: 'mandor',
			namaLengkap: 'Pengawas Lapangan SPPG',
			passwordHash: 'argon2_dummy_hash_mandor',
			pinPasscodeHash: '123456',
			role: 'SITE_MANAGER',
			isActive: true
		}
	]);

	// 2. Read Excel File
	let excelPath = resolve('KAS PROYEK AK BSI 12102026.xlsx');
	if (!existsSync(excelPath)) {
		excelPath = 'C:/laragon/www/Freelance-pakRossy/pantau-mbg/KAS PROYEK AK BSI 12102026.xlsx';
	}
	if (!existsSync(excelPath)) {
		excelPath = 'C:/Users/luthf/Downloads/KAS PROYEK AK BSI 12102026 (1).xlsx';
	}

	console.log('Reading Excel from:', excelPath);
	const wb = new ExcelJS.Workbook();
	await wb.xlsx.readFile(excelPath);

	// Clear old data
	await db.delete(cashTransactions);
	await db.delete(vendorPayments);
	await db.delete(projectVendors);
	await db.delete(projectTermins);
	await db.delete(projects);

	// 3. Import 27 Projects from KAS BESAR PROYEK
	console.log('Seeding 27 Projects from KAS BESAR PROYEK...');
	const kasBesarSheet = wb.getWorksheet('KAS BESAR PROYEK');
	if (!kasBesarSheet) throw new Error('Sheet KAS BESAR PROYEK tidak ditemukan!');

	const projectMap = new Map<string, number>();
	const projectCodeMap = new Map<string, number>();
	const projectRapMap = new Map<number, { rapNilai: number; feeAlokasi: number }>();

	for (let r = 6; r <= 32; r++) {
		const row = kasBesarSheet.getRow(r);
		const namaRaw = row.getCell(2).value;
		if (!namaRaw) continue;

		const nama = String(getCellValue(namaRaw)).trim();
		if (
			!nama ||
			nama.toUpperCase() === 'TOTAL' ||
			nama.toUpperCase().startsWith('OPERASIONAL') ||
			nama.toUpperCase().startsWith('SALLARY')
		) {
			continue;
		}

		const kode = nama.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');
		const kontrak = parseNumber(row.getCell(10).value);
		let progres = parseNumber(row.getCell(9).value);
		if (progres <= 1 && progres > 0) progres = Math.round(progres * 100);

		const status = progres >= 100 ? 'SELESAI' : progres > 0 ? 'BERJALAN' : 'PERENCANAAN';

		const [inserted] = await db
			.insert(projects)
			.values({
				kode,
				nama,
				lokasi: 'Jawa Timur / Indonesia',
				rabKontrak: kontrak,
				progresFisikPct: progres,
				status: status as any,
				picPengawas: 'Kohar / Sodin / Tim Lapangan',
				catatan: `Imported from Excel KAS BESAR PROYEK baris ${r}`
			})
			.returning({ id: projects.id });

		projectMap.set(nama, inserted.id);
		projectCodeMap.set(kode, inserted.id);
		projectCodeMap.set(nama.toUpperCase(), inserted.id);

		const bebanVendor = parseNumber(row.getCell(13).value);
		const addVendor = parseNumber(row.getCell(14).value);
		const fee = parseNumber(row.getCell(15).value);
		projectRapMap.set(inserted.id, { rapNilai: bebanVendor + addVendor, feeAlokasi: fee });

		// Alias lookup untuk kecocokan kode di transaksi CIH
		if (nama === 'BALAI PU') {
			projectCodeMap.set('PU', inserted.id);
			projectCodeMap.set('BALAI', inserted.id);
			projectCodeMap.set('BALAI BESAR PU', inserted.id);
		} else if (nama.includes('DEWI')) {
			projectCodeMap.set('DEWI', inserted.id);
		} else if (nama.includes('YURIS')) {
			projectCodeMap.set('YURIS', inserted.id);
			projectCodeMap.set('DESAIN YURIS', inserted.id);
		}
	}

	console.log(`Seeded ${projectMap.size} projects.`);

	// 4. Import Granular Data from 27 Dedicated Project Sheets
	console.log('Seeding granular Termins & Vendor Payments from 27 Project Sheets...');
	for (const [projName, sheetName] of Object.entries(mapping)) {
		const projectId = projectMap.get(projName);
		if (!projectId) continue;

		const ws = wb.getWorksheet(sheetName);
		if (!ws) continue;

		let headerRow = -1;
		let defaultVendor = 'Subkon Lapangan';

		for (let r = 1; r <= ws.rowCount; r++) {
			const row = ws.getRow(r);
			for (let c = 1; c <= 10; c++) {
				const text = String(row.getCell(c).value || '').toUpperCase();
				if (text.includes('PENERIMAAN')) {
					headerRow = r;
				}
				if (text.includes('PENGELUARAN')) {
					const sub = text.replace('PENGELUARAN', '').trim();
					if (sub) defaultVendor = sub;
				}
			}
			if (headerRow > 0) break;
		}

		let jumlahRow = ws.rowCount;
		for (let r = headerRow + 2; r <= ws.rowCount; r++) {
			const v2 = String(ws.getRow(r).getCell(2).value || '').toUpperCase();
			const v3 = String(ws.getRow(r).getCell(3).value || '').toUpperCase();
			if (v2.includes('JUMLAH') || v3.includes('JUMLAH') || (v2.includes('TOTAL') && r > 10)) {
				jumlahRow = r;
				break;
			}
		}

		const currentProjectId = projectId as number;
		const rapInfo = projectRapMap.get(currentProjectId) || { rapNilai: 0, feeAlokasi: 0 };
		const vendorIdCache = new Map<string, number>();

		async function getOrCreateVendor(vName: string, pekerjaan = 'Pekerjaan Pelaksana & Konstruksi'): Promise<number> {
			const cleanName = vName || defaultVendor;
			if (vendorIdCache.has(cleanName)) return vendorIdCache.get(cleanName)!;

			const isFirst = vendorIdCache.size === 0;
			const rapToAssign = isFirst ? rapInfo.rapNilai : 0;
			const feeToAssign = isFirst ? rapInfo.feeAlokasi : 0;

			const [res] = await db
				.insert(projectVendors)
				.values({
					projectId: currentProjectId,
					namaVendor: cleanName,
					pekerjaan,
					rapNilai: rapToAssign,
					feeAlokasi: feeToAssign
				})
				.returning({ id: projectVendors.id });

			vendorIdCache.set(cleanName, res.id);
			return res.id;
		}

		let hasAnyPayment = false;

		for (let r = headerRow + 2; r < jumlahRow; r++) {
			const row = ws.getRow(r);
			const ket = String(getCellValue(row.getCell(2).value) || '').trim();
			const tglMasuk = formatDate(row.getCell(3).value);
			const nomMasuk = parseNumber(row.getCell(4).value);
			const tglKeluar = formatDate(row.getCell(5).value);
			const nomKeluar = parseNumber(row.getCell(6).value);
			const pic = String(getCellValue(row.getCell(7).value) || '').trim();

			// Penerimaan Termin Klien
			if (nomMasuk > 0) {
				await db.insert(projectTermins).values({
					projectId: currentProjectId,
					terminKe: ket || 'Termin Pencairan',
					nominalRencana: nomMasuk,
					nominalCair: nomMasuk,
					tglCair: tglMasuk || '2026-10-12',
					isLunas: true
				});
			}

			// Pengeluaran Kasbon/Vendor
			if (nomKeluar > 0) {
				hasAnyPayment = true;
				const vName = pic || defaultVendor;
				const vId = await getOrCreateVendor(vName);

				let tipe = 'KASBON_PROGRES';
				const ketUp = ket.toUpperCase();
				if (ketUp.includes('DP')) tipe = 'DP';
				else if (ketUp.includes('LUNAS')) tipe = 'PELUNASAN';
				else if (ketUp.includes('RETENSI')) tipe = 'RETENSI';
				else if (ketUp.includes('SALARY') || ketUp.includes('SALLARY')) tipe = 'SALARY_PENGAWAS';
				else if (ketUp.includes('FEE')) tipe = 'FEE';

				await db.insert(vendorPayments).values({
					projectVendorId: vId,
					tipe,
					nominal: nomKeluar,
					progresKlaimPct: 0,
					tglBayar: tglKeluar || '2026-10-12',
					penerimaNama: vName,
					isApproved: true
				});
			}
		}

		if (!hasAnyPayment && (rapInfo.rapNilai > 0 || rapInfo.feeAlokasi > 0)) {
			await getOrCreateVendor(defaultVendor);
		}
	}

	// 5. Import CIH (Cash In Hand - 207 Real Transactions)
	console.log('Seeding CIH transactions...');
	const cihSheet = wb.getWorksheet('CIH');
	if (cihSheet) {
		for (let r = 7; r <= cihSheet.rowCount; r++) {
			const row = cihSheet.getRow(r);
			const tglRaw = formatDate(row.getCell(2).value);
			const ketRaw = row.getCell(3).value;
			const ketStr = String(getCellValue(ketRaw) || '').trim();
			if (ketStr.toUpperCase().includes('JUMLAH') || ketStr.toUpperCase().includes('TOTAL')) continue;

			const kodeProyekRaw = row.getCell(4).value;
			const masuk = parseNumber(row.getCell(5).value);
			const keluar = parseNumber(row.getCell(6).value);
			const note = row.getCell(7).value;

			if (!ketRaw && masuk === 0 && keluar === 0) continue;

			const keterangan = ketStr || 'Biaya Operasional';
			const kodeStr = kodeProyekRaw ? String(getCellValue(kodeProyekRaw)).trim().toUpperCase() : null;
			const matchedProjectId = kodeStr ? (projectCodeMap.get(kodeStr) ?? null) : null;

			let kategori = 'OPERASIONAL_LAPANGAN';
			const ketLower = keterangan.toLowerCase();
			if (ketLower.includes('bbm')) kategori = 'BBM_LOGISTIK';
			else if (ketLower.includes('makan') || ketLower.includes('minum') || ketLower.includes('aqua')) kategori = 'KONSUMSI';
			else if (ketLower.includes('pulsa') || ketLower.includes('internet') || ketLower.includes('jilid') || ketLower.includes('buku')) kategori = 'ATK_PERLENGKAPAN';
			else if (ketLower.includes('material') || ketLower.includes('semen') || ketLower.includes('cat') || ketLower.includes('baut')) kategori = 'MATERIAL_TAKTIS';
			else if (masuk > 0) kategori = 'DROP_KAS';

			await db.insert(cashTransactions).values({
				akunAsal: 'KAS_KECIL_CIH',
				tipe: masuk > 0 ? 'IN' : 'OUT',
				kategori,
				nominal: masuk > 0 ? masuk : keluar,
				tgl: tglRaw || '2026-10-12',
				keterangan: note ? `${keterangan} (${note})` : keterangan,
				projectId: matchedProjectId,
				penerimaPic: 'Ainun / Tim Lapangan'
			});
		}
	}

	// 6. Import TF AZKA (Cash Pooling)
	console.log('Seeding TF AZKA transactions...');
	const azkaSheet = wb.getWorksheet('TF AZKA');
	if (azkaSheet) {
		for (let r = 7; r <= 35; r++) {
			const row = azkaSheet.getRow(r);
			const tglRaw = formatDate(row.getCell(2).value);
			const ketRaw = row.getCell(3).value;
			const kodeProyekRaw = row.getCell(4).value;
			const masuk = parseNumber(row.getCell(5).value);
			const keluar = parseNumber(row.getCell(6).value);
			const pic = row.getCell(7).value;

			if (!ketRaw && masuk === 0 && keluar === 0) continue;

			const keterangan = String(getCellValue(ketRaw) || 'Mutasi Rekening Induk');
			const kodeStr = kodeProyekRaw ? String(getCellValue(kodeProyekRaw)).trim().toUpperCase() : null;
			const matchedProjectId = kodeStr ? (projectCodeMap.get(kodeStr) ?? null) : null;

			await db.insert(cashTransactions).values({
				akunAsal: 'REK_AZKA_POOLING',
				tipe: masuk > 0 ? 'IN' : 'OUT',
				kategori: masuk > 0 ? 'DROP_KAS' : 'OPERASIONAL_LAPANGAN',
				nominal: masuk > 0 ? masuk : keluar,
				tgl: tglRaw || '2026-10-12',
				keterangan,
				projectId: matchedProjectId,
				penerimaPic: pic ? String(pic) : (masuk > 0 ? 'Bpk. Azka' : 'Penerima Pembayaran')
			});
		}
	}

	// 7. Import Overhead Kantor Group B dari KAS BESAR PROYEK
	console.log('Seeding Overhead Kantor Group B into BANK_BSI...');
	const overheadItems = [
		{ row: 35, nama: 'SALLARY', kategori: 'GAJI_KARYAWAN', pic: 'Karyawan & Staff Kantor' },
		{ row: 36, nama: 'TAGIHAN KANTOR', kategori: 'TAGIHAN_KANTOR', pic: 'Pengelola Gedung / Vendor' },
		{ row: 37, nama: 'OPERASIONAL KANTOR', kategori: 'OPERASIONAL_KANTOR', pic: 'Operasional Kantor Pusat' },
		{ row: 38, nama: 'OPERASIONAL PROYEK NON BSI', kategori: 'OPERASIONAL_NON_BSI', pic: 'Operasional Lapangan Non BSI' },
		{ row: 39, nama: 'IKLAN SOSMED', kategori: 'MARKETING_SOSMED', pic: 'Digital Marketing & Ads' }
	];

	for (const item of overheadItems) {
		const row = kasBesarSheet.getRow(item.row);
		const nominal = parseNumber(row.getCell(4).value);
		if (nominal > 0) {
			await db.insert(cashTransactions).values({
				akunAsal: 'BANK_BSI',
				tipe: 'OUT',
				kategori: item.kategori,
				nominal,
				tgl: '2026-10-12',
				keterangan: `${item.nama} 2026 (Overhead Holding)`,
				projectId: null,
				penerimaPic: item.pic
			});
		}
	}

	console.log('--- Database Seeder Completed Successfully! ---');
}

runSeed().catch(console.error);
