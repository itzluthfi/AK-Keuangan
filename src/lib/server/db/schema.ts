import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// 1. Users & Authentication
export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	username: text('username').notNull().unique(),
	email: text('email'),
	namaLengkap: text('nama_lengkap').notNull(),
	passwordHash: text('password_hash').notNull(),
	pinPasscodeHash: text('pin_hash'), // PIN 6 digit untuk akses cepat mobile
	role: text('role').default('SITE_MANAGER').notNull(),
	roleId: integer('role_id'), // Link ke tabel roles
	noHp: text('no_hp'),
	isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
	createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull()
});

// 2. Master Proyek
export const projects = sqliteTable('projects', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	kode: text('kode').notNull().unique(), // Contoh: SPPG-BALAI-PU, FORD
	nama: text('nama').notNull(),
	kategori: text('kategori').default('Pelaksanaan Konstruksi'), // Pelaksanaan Konstruksi, Jasa Desain Arsitektur, Renovasi
	lokasi: text('lokasi'),
	rabKontrak: real('rab_kontrak').default(0).notNull(), // Nilai SPK/RAB
	progresFisikPct: real('progres_fisik_pct').default(0).notNull(), // 0 - 100%
	status: text('status', { enum: ['PERENCANAAN', 'BERJALAN', 'SELESAI', 'RETENSI'] }).default('BERJALAN').notNull(),
	picPengawas: text('pic_pengawas'),
	targetSelesai: text('target_selesai'),
	catatan: text('catatan'),
	isArchived: integer('is_archived', { mode: 'boolean' }).default(false).notNull(),
	createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: text('updated_at').default('CURRENT_TIMESTAMP').notNull()
});

// 3. Termin Klien (Cash Inflow)
export const projectTermins = sqliteTable('project_termins', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
	terminKe: text('termin_ke').notNull(), // DP, Termin I, Termin II, Retensi
	nominalRencana: real('nominal_rencana').default(0).notNull(),
	nominalCair: real('nominal_cair').default(0).notNull(),
	tglCair: text('tgl_cair'),
	isLunas: integer('is_lunas', { mode: 'boolean' }).default(false).notNull(),
	buktiTransferUrl: text('bukti_transfer_url'),
	createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull()
});

// 4. Subkon & Job Costing per Proyek (RAP)
export const projectVendors = sqliteTable('project_vendors', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
	namaVendor: text('nama_vendor').notNull(), // Kohar, Sodin, Shodiq, dll
	pekerjaan: text('pekerjaan').notNull(), // Sipil, Dapur, MEP, Landscape
	rapNilai: real('rap_nilai').default(0).notNull(),
	feeAlokasi: real('fee_alokasi').default(0).notNull(),
	createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull()
});

// 5. Kasbon & Pembayaran Vendor
export const vendorPayments = sqliteTable('vendor_payments', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	projectVendorId: integer('project_vendor_id').references(() => projectVendors.id, { onDelete: 'cascade' }).notNull(),
	tipe: text('tipe').notNull(), // DP, KASBON_PROGRES, PELUNASAN, RETENSI, SALARY_PENGAWAS, FEE
	nominal: real('nominal').notNull(),
	progresKlaimPct: real('progres_klaim_pct').default(0),
	tglBayar: text('tgl_bayar').notNull(),
	penerimaNama: text('penerima_nama').notNull(),
	buktiBayarUrl: text('bukti_bayar_url'),
	isApproved: integer('is_approved', { mode: 'boolean' }).default(true).notNull(),
	idempotencyKey: text('idempotency_key').unique(),
	createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull()
});

// 6. Mutasi Kas Operasional Lapangan (CIH), Rekening Induk (TF AZKA), & BANK BSI
export const cashTransactions = sqliteTable('cash_transactions', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	akunAsal: text('akun_asal', { enum: ['KAS_KECIL_CIH', 'REK_AZKA_POOLING', 'BANK_BSI'] }).notNull(),
	tipe: text('tipe', { enum: ['IN', 'OUT', 'TRANSFER_INTERNAL'] }).notNull(),
	kategori: text('kategori').notNull(), // BBM_LOGISTIK, KONSUMSI, MATERIAL_TAKTIS, ATK, DROP_KAS, FEE, OVERHEAD_KANTOR
	nominal: real('nominal').notNull(),
	tgl: text('tgl').notNull(),
	keterangan: text('keterangan').notNull(),
	projectId: integer('project_id').references(() => projects.id), // Nullable jika overhead kantor
	penerimaPic: text('penerima_pic'),
	lampiranNotaUrl: text('lampiran_nota_url'),
	idempotencyKey: text('idempotency_key').unique(),
	createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull()
});

// 7. Master Direktori Subkon & Mandor Terpusat
export const masterVendors = sqliteTable('master_vendors', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	nama: text('nama').notNull().unique(),
	bidang: text('bidang').notNull(), // Sipil, MEP, Interior, Drafter, Landscape, dll
	noHp: text('no_hp'),
	bankNama: text('bank_nama'),
	bankRekening: text('bank_rekening'),
	bankAtasNama: text('bank_atas_nama'),
	catatan: text('catatan'),
	isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
	createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull()
});

// 8. Master Rekening Bank & Akun Kas
export const masterAccounts = sqliteTable('master_accounts', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	kode: text('kode').notNull().unique(), // REK_AZKA_POOLING, KAS_KECIL_CIH, BANK_BSI
	nama: text('nama').notNull(),
	tipe: text('tipe', { enum: ['BANK', 'KAS_KECIL', 'POOLING'] }).notNull(),
	bankNama: text('bank_nama'),
	noRekening: text('no_rekening'),
	atasNama: text('atas_nama'),
	saldoAwal: real('saldo_awal').default(0).notNull(),
	catatan: text('catatan'),
	isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
	createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull()
});

// 9. Master Roles & Permissions (Dynamic RBAC)
export const roles = sqliteTable('roles', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	kode: text('kode').notNull().unique(), // DIREKTUR, FINANCE, SITE_MANAGER, AUDITOR, LOGISTIK
	nama: text('nama').notNull(),
	deskripsi: text('deskripsi'),
	permissions: text('permissions').default('[]').notNull(), // JSON Array of permission keys: ['dashboard.view', 'proyek.create', ...]
	isSystem: integer('is_system', { mode: 'boolean' }).default(false).notNull(),
	createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull()
});

// 10. Dokumen Faktur Penagihan Resmi (Invoices)
export const invoices = sqliteTable('invoices', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	invoiceNo: text('invoice_no').notNull().unique(), // e.g. INV-202610-001
	projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
	terminKe: text('termin_ke'),
	tglInvoice: text('tgl_invoice').notNull(),
	jatuhTempo: text('jatuh_tempo').notNull(),
	subtotal: real('subtotal').default(0).notNull(),
	ppnNominal: real('ppn_nominal').default(0).notNull(),
	pphNominal: real('pph_nominal').default(0).notNull(),
	grandTotal: real('grand_total').default(0).notNull(),
	status: text('status', { enum: ['DRAFT', 'TERKIRIM', 'LUNAS', 'BATAL'] }).default('TERKIRIM').notNull(),
	itemsJson: text('items_json').notNull(), // JSON line items [{id, desc, qty, unit, price}]
	bankNama: text('bank_nama'),
	bankRekening: text('bank_rekening'),
	bankAtasNama: text('bank_atas_nama'),
	recipientName: text('recipient_name'),
	recipientAddress: text('recipient_address'),
	catatan: text('catatan'),
	createdBy: text('created_by'),
	createdAt: text('created_at').default('CURRENT_TIMESTAMP').notNull()
});
