import { db } from '#lib/server/db';
import { projects, projectVendors, projectTermins, masterAccounts, invoices } from '#lib/server/db/schema';
import type { PageServerLoad, Actions } from './$types';
import { eq, desc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const allProjects = await db.select().from(projects).orderBy(projects.nama).all();
	const allVendors = await db.select().from(projectVendors).all();
	const allTermins = await db.select().from(projectTermins).all();
	const accounts = await db.select().from(masterAccounts).all();

	const allInvoices = await db
		.select({
			id: invoices.id,
			invoiceNo: invoices.invoiceNo,
			projectId: invoices.projectId,
			projectName: projects.nama,
			projectKode: projects.kode,
			terminKe: invoices.terminKe,
			tglInvoice: invoices.tglInvoice,
			jatuhTempo: invoices.jatuhTempo,
			subtotal: invoices.subtotal,
			ppnNominal: invoices.ppnNominal,
			pphNominal: invoices.pphNominal,
			grandTotal: invoices.grandTotal,
			status: invoices.status,
			itemsJson: invoices.itemsJson,
			bankNama: invoices.bankNama,
			bankRekening: invoices.bankRekening,
			bankAtasNama: invoices.bankAtasNama,
			recipientName: invoices.recipientName,
			recipientAddress: invoices.recipientAddress,
			catatan: invoices.catatan,
			createdAt: invoices.createdAt
		})
		.from(invoices)
		.leftJoin(projects, eq(invoices.projectId, projects.id))
		.orderBy(desc(invoices.id))
		.all();

	return {
		projects: allProjects,
		vendors: allVendors,
		termins: allTermins,
		accounts,
		invoices: allInvoices
	};
};

export const actions: Actions = {
	createInvoice: async ({ request, locals }) => {
		const form = await request.formData();
		const invoiceNo = String(form.get('invoiceNo') || '').trim();
		const projectId = parseInt(String(form.get('projectId') || '0'));
		const terminKe = String(form.get('terminKe') || '').trim();
		const tglInvoice = String(form.get('tglInvoice') || '').trim();
		const jatuhTempo = String(form.get('jatuhTempo') || '').trim();
		const subtotal = parseFloat(String(form.get('subtotal') || '0'));
		const ppnNominal = parseFloat(String(form.get('ppnNominal') || '0'));
		const pphNominal = parseFloat(String(form.get('pphNominal') || '0'));
		const grandTotal = parseFloat(String(form.get('grandTotal') || '0'));
		const itemsJson = String(form.get('itemsJson') || '[]');
		const bankNama = String(form.get('bankNama') || '').trim();
		const bankRekening = String(form.get('bankRekening') || '').trim();
		const bankAtasNama = String(form.get('bankAtasNama') || '').trim();
		const recipientName = String(form.get('recipientName') || '').trim();
		const recipientAddress = String(form.get('recipientAddress') || '').trim();
		const catatan = String(form.get('catatan') || '').trim();

		if (!invoiceNo || !projectId || !tglInvoice) {
			return fail(400, { success: false, error: 'Nomor invoice, proyek, dan tanggal wajib diisi.' });
		}

		try {
			await db.insert(invoices).values({
				invoiceNo,
				projectId,
				terminKe,
				tglInvoice,
				jatuhTempo,
				subtotal,
				ppnNominal,
				pphNominal,
				grandTotal,
				status: 'TERKIRIM',
				itemsJson,
				bankNama,
				bankRekening,
				bankAtasNama,
				recipientName,
				recipientAddress,
				catatan: catatan || null,
				createdBy: (locals.user as any)?.namaLengkap || locals.user?.name || 'Sistem'
			});

			return { success: true, message: `Invoice #${invoiceNo} berhasil disimpan dan dicatat dalam database!` };
		} catch (e: any) {
			return fail(400, { success: false, error: 'Gagal menyimpan invoice: Nomor invoice mungkin sudah pernah digunakan.' });
		}
	},

	updateStatus: async ({ request }) => {
		const form = await request.formData();
		const id = parseInt(String(form.get('id') || '0'));
		const status = String(form.get('status') || 'TERKIRIM') as 'TERKIRIM' | 'LUNAS' | 'BATAL';

		if (!id) return fail(400, { success: false, error: 'ID invoice tidak valid.' });

		await db.update(invoices).set({ status }).where(eq(invoices.id, id));
		return { success: true, message: `Status faktur tagihan berhasil diubah menjadi ${status}.` };
	},

	deleteInvoice: async ({ request }) => {
		const form = await request.formData();
		const id = parseInt(String(form.get('id') || '0'));

		if (!id) return fail(400, { success: false, error: 'ID invoice tidak valid.' });

		await db.delete(invoices).where(eq(invoices.id, id));
		return { success: true, message: 'Faktur tagihan berhasil dihapus dari arsip database.' };
	}
};

