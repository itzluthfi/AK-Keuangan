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
		const sisaTermin = Math.max(0, p.rabKontrak - terminMasuk);
		const terminPct = p.rabKontrak > 0 ? (terminMasuk / p.rabKontrak) * 100 : 0;

		const vendors = allVendors.filter(v => v.projectId === p.id);
		const vendorIds = new Set(vendors.map(v => v.id));
		const payments = allPayments.filter(pm => vendorIds.has(pm.projectVendorId));
		const totalBebanSubkon = payments.reduce((acc, pm) => acc + (pm.nominal || 0), 0);

		const cihTxs = allCih.filter(c => c.projectId === p.id && c.tipe === 'OUT');
		const totalCih = cihTxs.reduce((acc, c) => acc + (c.nominal || 0), 0);
		const totalPengeluaranRiil = totalBebanSubkon + totalCih;

		// Hitung RAP Vendor dan Estimasi Total Beban Kontrak
		const totalRapVendor = vendors.reduce((acc, v) => acc + (v.rapNilai || 0), 0);
		const totalFeeVendor = vendors.reduce((acc, v) => acc + (v.feeAlokasi || 0), 0);
		const estimasiTotalBeban = totalRapVendor > 0 ? (totalRapVendor + totalFeeVendor + totalCih) : totalPengeluaranRiil;

		// 1. Laba Proyeksi / Realisasi Proyek (Profitability Kontrak Sebenarnya)
		const labaProyek = p.rabKontrak - (p.progresFisikPct === 100 ? totalPengeluaranRiil : estimasiTotalBeban);
		const labaPct = p.rabKontrak > 0 ? (labaProyek / p.rabKontrak) * 100 : 0;

		// 2. Arus Kas Berjalan Saat Ini (Sisa Kas / Dana Talangan Sementara)
		const arusKas = terminMasuk - totalPengeluaranRiil;

		// Kategori pekerjaan riil
		const isDesain = p.nama.toUpperCase().startsWith('DESAIN') || p.nama.toUpperCase().startsWith('D.');
		const kategoriPekerjaan = isDesain ? 'Jasa Desain Arsitektur' : 'Pelaksanaan & Konstruksi';

		return {
			no: idx + 1,
			id: p.id,
			hashId: encodeId(p.id),
			kode: p.kode,
			nama: p.nama,
			lokasi: p.lokasi || 'Jawa Timur',
			status: p.status,
			progresFisikPct: p.progresFisikPct,
			rabKontrak: p.rabKontrak,
			terminMasuk,
			sisaTermin,
			terminPct,
			totalPengeluaran: totalPengeluaranRiil,
			labaProyek,
			labaPct,
			arusKas,
			isTalangan: arusKas < 0,
			kategoriPekerjaan
		};
	});

	return {
		projects: projectList,
		totalTitik: projectList.length,
		selesaiCount: projectList.filter(p => p.progresFisikPct === 100).length,
		onProgressCount: projectList.filter(p => p.progresFisikPct > 0 && p.progresFisikPct < 100).length
	};
};

export const actions = {
	addProject: async ({ request }) => {
		const form = await request.formData();
		const nama = String(form.get('nama') || '').trim();
		const kodeRaw = String(form.get('kode') || '').trim();
		const kategori = String(form.get('kategori') || 'Pelaksanaan Konstruksi').trim();
		const lokasi = String(form.get('lokasi') || 'Jawa Timur').trim();
		const rabKontrak = parseFloat(String(form.get('rabKontrak') || '0').replace(/[^0-9.]/g, ''));
		const picPengawas = String(form.get('picPengawas') || '').trim();
		const targetSelesai = String(form.get('targetSelesai') || '').trim();
		const catatan = String(form.get('catatan') || '').trim();

		if (!nama || nama.length < 3) {
			return { success: false, error: 'Nama proyek wajib diisi minimal 3 karakter.' };
		}

		// Auto generate kode if empty
		const kode = (kodeRaw || nama.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '')).toUpperCase();

		// Check duplicate kode
		const existing = await db.select({ id: projects.id }).from(projects).where(eq(projects.kode, kode)).get();
		if (existing) {
			return { success: false, error: `Kode proyek "${kode}" sudah digunakan oleh proyek lain. Gunakan kode yang unik.` };
		}

		try {
			const [inserted] = await db.insert(projects).values({
				kode,
				nama,
				kategori,
				lokasi,
				rabKontrak: isNaN(rabKontrak) ? 0 : rabKontrak,
				progresFisikPct: 0,
				status: 'BERJALAN',
				picPengawas,
				targetSelesai: targetSelesai || null,
				catatan: catatan || null
			}).returning({ id: projects.id });

			return {
				success: true,
				message: `Proyek "${nama}" (${kode}) berhasil didaftarkan.`,
				projectId: inserted.id
			};
		} catch (e: any) {
			console.error('Error inserting project:', e);
			return { success: false, error: 'Gagal menyimpan proyek baru: ' + (e?.message || 'Database error') };
		}
	},

	editProject: async ({ request }) => {
		const form = await request.formData();
		const id = parseInt(String(form.get('id') || '0'));
		const nama = String(form.get('nama') || '').trim();
		const kode = String(form.get('kode') || '').trim().toUpperCase();
		const kategori = String(form.get('kategori') || 'Pelaksanaan Konstruksi').trim();
		const lokasi = String(form.get('lokasi') || '').trim();
		const rabKontrak = parseFloat(String(form.get('rabKontrak') || '0').replace(/[^0-9.]/g, ''));
		const progresFisikPct = parseFloat(String(form.get('progresFisikPct') || '0'));
		const status = String(form.get('status') || 'BERJALAN') as 'PERENCANAAN' | 'BERJALAN' | 'SELESAI' | 'RETENSI';
		const picPengawas = String(form.get('picPengawas') || '').trim();
		const targetSelesai = String(form.get('targetSelesai') || '').trim();
		const catatan = String(form.get('catatan') || '').trim();

		if (!id) return { success: false, error: 'ID proyek tidak valid.' };
		if (!nama || !kode) return { success: false, error: 'Nama dan kode proyek wajib diisi.' };

		// Check if kode taken by another project
		const conflict = await db.select({ id: projects.id }).from(projects).where(eq(projects.kode, kode)).get();
		if (conflict && conflict.id !== id) {
			return { success: false, error: `Kode "${kode}" sudah dipakai proyek lain.` };
		}

		try {
			await db.update(projects).set({
				kode,
				nama,
				kategori,
				lokasi,
				rabKontrak: isNaN(rabKontrak) ? 0 : rabKontrak,
				progresFisikPct: Math.min(100, Math.max(0, progresFisikPct)),
				status,
				picPengawas: picPengawas || null,
				targetSelesai: targetSelesai || null,
				catatan: catatan || null
			}).where(eq(projects.id, id));

			return { success: true, message: `Data proyek "${nama}" berhasil diperbarui.` };
		} catch (e: any) {
			console.error('Error updating project:', e);
			return { success: false, error: 'Gagal memperbarui proyek: ' + (e?.message || 'Database error') };
		}
	},

	deleteProject: async ({ request }) => {
		const form = await request.formData();
		const id = parseInt(String(form.get('id') || '0'));
		const forceDelete = form.get('forceDelete') === 'true';

		if (!id) return { success: false, error: 'ID proyek tidak valid.' };

		const project = await db.select().from(projects).where(eq(projects.id, id)).get();
		if (!project) return { success: false, error: 'Proyek tidak ditemukan.' };

		// Cek apakah ada riwayat transaksi
		const hasTermin = (await db.select({ id: projectTermins.id }).from(projectTermins).where(eq(projectTermins.projectId, id)).all()).length > 0;
		const hasCih = (await db.select({ id: cashTransactions.id }).from(cashTransactions).where(eq(cashTransactions.projectId, id)).all()).length > 0;

		if ((hasTermin || hasCih) && !forceDelete) {
			// Soft-archive agar integritas ledger aman
			await db.update(projects).set({ isArchived: true, status: 'SELESAI' }).where(eq(projects.id, id));
			return {
				success: true,
				message: `Proyek "${project.nama}" memiliki riwayat transaksi keuangan aktif. Proyek dialihkan ke status ARSIP untuk menjaga integritas buku kas.`
			};
		}

		try {
			await db.delete(projects).where(eq(projects.id, id));
			return { success: true, message: `Proyek "${project.nama}" berhasil dihapus dari sistem.` };
		} catch (e: any) {
			return { success: false, error: 'Gagal menghapus proyek: ' + (e?.message || 'Database foreign key constraint') };
		}
	}
};
