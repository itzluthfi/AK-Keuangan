import { sqlite } from './index';

export function runMigrations() {
	sqlite.exec(`
		CREATE TABLE IF NOT EXISTS roles (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			kode TEXT NOT NULL UNIQUE,
			nama TEXT NOT NULL,
			deskripsi TEXT,
			permissions TEXT DEFAULT '[]' NOT NULL,
			is_system INTEGER DEFAULT 0 NOT NULL,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
		);

		CREATE TABLE IF NOT EXISTS invoices (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			invoice_no TEXT NOT NULL UNIQUE,
			project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
			termin_ke TEXT,
			tgl_invoice TEXT NOT NULL,
			jatuh_tempo TEXT NOT NULL,
			subtotal REAL DEFAULT 0 NOT NULL,
			ppn_nominal REAL DEFAULT 0 NOT NULL,
			pph_nominal REAL DEFAULT 0 NOT NULL,
			grand_total REAL DEFAULT 0 NOT NULL,
			status TEXT DEFAULT 'TERKIRIM' NOT NULL,
			items_json TEXT NOT NULL,
			bank_nama TEXT,
			bank_rekening TEXT,
			bank_atas_nama TEXT,
			recipient_name TEXT,
			recipient_address TEXT,
			catatan TEXT,
			created_by TEXT,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
		);
	`);

	// Check projects columns
	const projectCols = (sqlite.pragma('table_info(projects)') as Array<{ name: string }>).map(c => c.name);
	if (!projectCols.includes('kategori')) {
		sqlite.exec("ALTER TABLE projects ADD COLUMN kategori TEXT DEFAULT 'Pelaksanaan Konstruksi'");
	}
	if (!projectCols.includes('is_archived')) {
		sqlite.exec('ALTER TABLE projects ADD COLUMN is_archived INTEGER DEFAULT 0');
	}

	// Check users columns
	const userCols = (sqlite.pragma('table_info(users)') as Array<{ name: string }>).map(c => c.name);
	if (!userCols.includes('role_id')) {
		sqlite.exec('ALTER TABLE users ADD COLUMN role_id INTEGER');
	}

	// Seed default system roles if empty
	const roleCount = (sqlite.prepare('SELECT COUNT(*) as count FROM roles').get() as { count: number }).count;
	if (roleCount === 0) {
		const defaultRoles = [
			{
				kode: 'DIREKTUR',
				nama: 'Direktur Utama / Pimpinan',
				deskripsi: 'Akses penuh tanpa batas ke seluruh data keuangan, pembukuan, margin laba, dan pengaturan sistem.',
				permissions: JSON.stringify([
					'dashboard.view',
					'dashboard.view_profit',
					'proyek.view',
					'proyek.create',
					'proyek.edit',
					'proyek.delete',
					'proyek.update_progres',
					'subkon.view',
					'subkon.manage',
					'termin.view',
					'termin.create_edit',
					'termin.delete',
					'kasbon.view',
					'kasbon.create',
					'kasbon.approve',
					'kasbon.delete',
					'pooling.view',
					'pooling.manage',
					'cih.view',
					'cih.manage',
					'invoice.view',
					'invoice.create',
					'invoice.print',
					'laporan.view',
					'laporan.export',
					'master.view',
					'master.manage',
					'pengaturan.view',
					'pengaturan.roles',
					'pengaturan.users',
					'pengaturan.system'
				]),
				is_system: 1
			},
			{
				kode: 'FINANCE',
				nama: 'Finance & Kasir Holding',
				deskripsi: 'Akses operasional keuangan, pencatatan termin, drop kas pooling, approval kasbon, dan cetak faktur.',
				permissions: JSON.stringify([
					'dashboard.view',
					'dashboard.view_profit',
					'proyek.view',
					'proyek.create',
					'proyek.edit',
					'proyek.update_progres',
					'subkon.view',
					'subkon.manage',
					'termin.view',
					'termin.create_edit',
					'kasbon.view',
					'kasbon.create',
					'kasbon.approve',
					'pooling.view',
					'pooling.manage',
					'cih.view',
					'cih.manage',
					'invoice.view',
					'invoice.create',
					'invoice.print',
					'laporan.view',
					'laporan.export',
					'master.view'
				]),
				is_system: 1
			},
			{
				kode: 'SITE_MANAGER',
				nama: 'Pengawas Lapangan (Site Manager)',
				deskripsi: 'Akses lapangan untuk pelaporan progres fisik, kasir CIH harian, dan pengajuan kasbon mandor.',
				permissions: JSON.stringify([
					'dashboard.view',
					'proyek.view',
					'proyek.update_progres',
					'subkon.view',
					'kasbon.view',
					'kasbon.create',
					'cih.view',
					'cih.manage',
					'laporan.view'
				]),
				is_system: 1
			},
			{
				kode: 'AUDITOR',
				nama: 'Auditor Eksternal / Pengawas',
				deskripsi: 'Akses peninjauan laporan (Read Only) untuk verifikasi ledger tanpa hak mutasi atau hapus data.',
				permissions: JSON.stringify([
					'dashboard.view',
					'dashboard.view_profit',
					'proyek.view',
					'subkon.view',
					'termin.view',
					'kasbon.view',
					'pooling.view',
					'cih.view',
					'invoice.view',
					'laporan.view',
					'laporan.export'
				]),
				is_system: 1
			}
		];

		const insertRole = sqlite.prepare(`
			INSERT INTO roles (kode, nama, deskripsi, permissions, is_system)
			VALUES (?, ?, ?, ?, ?)
		`);

		for (const r of defaultRoles) {
			insertRole.run(r.kode, r.nama, r.deskripsi, r.permissions, r.is_system);
		}
	}
}
