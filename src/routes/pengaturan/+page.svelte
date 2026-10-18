<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import {
		Building2,
		ShieldAlert,
		KeyRound,
		Database,
		Save,
		CheckCircle2,
		AlertTriangle,
		Sliders,
		Users,
		UserPlus,
		HardHat,
		Landmark,
		Trash2,
		ShieldCheck,
		Phone,
		Lock,
		Check,
		X,
		Edit3,
		Plus,
		Shield
	} from 'lucide-svelte';
	import { toast } from 'svelte-french-toast';

	let { data, form } = $props();

	let companyName = $state(data.settings.companyName);
	let directorName = $state(data.settings.directorName);
	let operationalArea = $state(data.settings.operationalArea);
	let minMarginWarningPct = $state(data.settings.minMarginWarningPct);
	let kasbonOverprogressPct = $state(data.settings.kasbonOverprogressPct);

	let isSaving = $state(false);

	// Tabs
	let activeSection = $state<'profil' | 'users' | 'roles' | 'master_vendor' | 'master_account' | 'risiko' | 'database'>('profil');

	$effect(() => {
		const paramTab = page.url.searchParams.get('tab');
		if (paramTab && ['profil', 'users', 'roles', 'master_vendor', 'master_account', 'risiko', 'database'].includes(paramTab)) {
			activeSection = paramTab as any;
		}
	});

	// Modal States
	let showAddUserModal = $state(false);
	let showAddVendorModal = $state(false);
	let showAddAccountModal = $state(false);
	let showAddRoleModal = $state(false);
	let showEditRoleModal = $state(false);
	let selectedRoleForEdit = $state<any>(null);
	let editRolePermissions = $state<string[]>([]);

	const ALL_PERMISSIONS = [
		{
			category: '📊 Dashboard & Portofolio',
			items: [
				{ key: 'dashboard.view', label: 'Lihat Kas Besar & Portofolio' },
				{ key: 'dashboard.view_profit', label: 'Lihat Margin Laba Bersih Proyek' }
			]
		},
		{
			category: '🏗️ Titik Proyek SPPG',
			items: [
				{ key: 'proyek.view', label: 'Lihat Daftar & Detail Proyek' },
				{ key: 'proyek.create', label: 'Tambah Titik Proyek Baru' },
				{ key: 'proyek.edit', label: 'Ubah Data Kontrak & Nilai SPK' },
				{ key: 'proyek.delete', label: 'Hapus / Arsipkan Proyek' },
				{ key: 'proyek.update_progres', label: 'Update Progres Fisik (%)' }
			]
		},
		{
			category: '👷 Subkon & Mandor Lapangan',
			items: [
				{ key: 'subkon.view', label: 'Lihat Daftar & Riwayat Subkon' },
				{ key: 'subkon.manage', label: 'Tambah & Kelola Master Subkon' }
			]
		},
		{
			category: '📑 Termin & Kontrak SPK',
			items: [
				{ key: 'termin.view', label: 'Lihat Rencana & Realisasi Termin' },
				{ key: 'termin.create_edit', label: 'Catat Pencairan & Edit Termin' },
				{ key: 'termin.delete', label: 'Hapus Catatan Termin' }
			]
		},
		{
			category: '💳 Kasbon Vendor & Mandor',
			items: [
				{ key: 'kasbon.view', label: 'Lihat Mutasi Kasbon Subkon' },
				{ key: 'kasbon.create', label: 'Catat Pengajuan Kasbon Baru' },
				{ key: 'kasbon.approve', label: 'Approval Pencairan Kasbon' },
				{ key: 'kasbon.delete', label: 'Hapus Mutasi Kasbon' }
			]
		},
		{
			category: '🔄 Cash Pooling & Kasir CIH',
			items: [
				{ key: 'pooling.view', label: 'Lihat Aliran Cash Pooling Holding' },
				{ key: 'pooling.manage', label: 'Tarik Dana / Suntik Talangan Kas' },
				{ key: 'cih.view', label: 'Lihat Buku Kasir Lapangan (CIH)' },
				{ key: 'cih.manage', label: 'Input Pengeluaran Operasional CIH' }
			]
		},
		{
			category: '📄 Faktur & Tagihan Invoice',
			items: [
				{ key: 'invoice.view', label: 'Lihat Daftar Faktur Tagihan' },
				{ key: 'invoice.create', label: 'Buat & Terbitkan Faktur Baru' },
				{ key: 'invoice.print', label: 'Download & Cetak PDF Faktur' }
			]
		},
		{
			category: '📈 Pelaporan Eksekutif',
			items: [
				{ key: 'laporan.view', label: 'Lihat Rekapitulasi Laba Rugi' },
				{ key: 'laporan.export', label: 'Export Rekap Excel & Cetak PDF' }
			]
		},
		{
			category: '⚙️ Master Data & Pengaturan',
			items: [
				{ key: 'master.view', label: 'Akses Halaman Master Data' },
				{ key: 'master.manage', label: 'Kelola Akun Kas & Rekening Bank' },
				{ key: 'pengaturan.view', label: 'Lihat Pengaturan Sistem' },
				{ key: 'pengaturan.roles', label: 'Kelola Peran & Hak Akses (RBAC)' },
				{ key: 'pengaturan.users', label: 'Kelola Pengguna Sistem' },
				{ key: 'pengaturan.system', label: 'Akses Parameter Risiko & Database WAL' }
			]
		}
	];

	function openEditRole(role: any) {
		selectedRoleForEdit = role;
		editRolePermissions = [...role.permissionsList];
		showEditRoleModal = true;
	}

	function togglePermission(key: string) {
		if (editRolePermissions.includes(key)) {
			editRolePermissions = editRolePermissions.filter(k => k !== key);
		} else {
			editRolePermissions = [...editRolePermissions, key];
		}
	}
</script>

<svelte:head>
	<title>Pengaturan Sistem & Master Data - Pantau MBG SPPG</title>
</svelte:head>

<div class="space-y-6">

	<!-- Header Page -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200/80">
		<div>
			<h1 class="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
				Pengaturan Sistem & Master Data
			</h1>
			<p class="text-xs text-slate-500 mt-0.5">
				Kontrol peran & izin (Dynamic RBAC), pengguna, master rekening kas, subkon, dan parameter operasional.
			</p>
		</div>

		<div class="flex items-center gap-2">
			<div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-2xs">
				<ShieldCheck class="w-3.5 h-3.5 text-emerald-400" />
				<span>Otoritas Direktur Aktif</span>
			</div>
		</div>
	</div>

	<!-- Section Selector Tabs -->
	<div class="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-px scrollbar-none">
		<button
			type="button"
			onclick={() => activeSection = 'profil'}
			class="px-3.5 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap {activeSection === 'profil' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}"
		>
			<span class="flex items-center gap-1.5">
				<Building2 class="w-3.5 h-3.5" />
				<span>Profil Entitas</span>
			</span>
		</button>

		<button
			type="button"
			onclick={() => activeSection = 'users'}
			class="px-3.5 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap {activeSection === 'users' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}"
		>
			<span class="flex items-center gap-1.5">
				<Users class="w-3.5 h-3.5" />
				<span>Kelola Pengguna ({data.usersList.length})</span>
			</span>
		</button>

		<button
			type="button"
			onclick={() => activeSection = 'roles'}
			class="px-3.5 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap {activeSection === 'roles' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}"
		>
			<span class="flex items-center gap-1.5">
				<KeyRound class="w-3.5 h-3.5" />
				<span>Master Peran & Izin ({data.rolesList.length})</span>
			</span>
		</button>

		<button
			type="button"
			onclick={() => activeSection = 'master_vendor'}
			class="px-3.5 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap {activeSection === 'master_vendor' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}"
		>
			<span class="flex items-center gap-1.5">
				<HardHat class="w-3.5 h-3.5" />
				<span>Master Subkon ({data.masterVendorsList.length})</span>
			</span>
		</button>

		<button
			type="button"
			onclick={() => activeSection = 'master_account'}
			class="px-3.5 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap {activeSection === 'master_account' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}"
		>
			<span class="flex items-center gap-1.5">
				<Landmark class="w-3.5 h-3.5" />
				<span>Master Rekening Kas ({data.masterAccountsList.length})</span>
			</span>
		</button>

		<button
			type="button"
			onclick={() => activeSection = 'risiko'}
			class="px-3.5 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap {activeSection === 'risiko' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}"
		>
			<span class="flex items-center gap-1.5">
				<Sliders class="w-3.5 h-3.5" />
				<span>Parameter Risiko</span>
			</span>
		</button>

		<button
			type="button"
			onclick={() => activeSection = 'database'}
			class="px-3.5 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap {activeSection === 'database' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}"
		>
			<span class="flex items-center gap-1.5">
				<Database class="w-3.5 h-3.5" />
				<span>Database WAL</span>
			</span>
		</button>
	</div>

	<!-- TAB 1: PROFIL ENTITAS -->
	{#if activeSection === 'profil'}
		<form
			method="POST"
			action="?/saveSettings"
			use:enhance={() => {
				isSaving = true;
				return async ({ update, result }) => {
					isSaving = false;
					await update();
					if (result.type === 'success') toast.success('Profil entitas berhasil diperbarui!');
				};
			}}
			class="space-y-6"
		>
			<div class="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-5">
				<div class="flex items-center gap-3 pb-3 border-b border-slate-100">
					<div class="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
						<Building2 class="w-4 h-4 text-slate-700" />
					</div>
					<div>
						<h2 class="text-sm font-bold text-slate-900">Identitas Konsorsium / Instansi Pelaksana</h2>
						<p class="text-xs text-slate-500">Informasi ini dicetak pada kop surat invoice dan voucher kas.</p>
					</div>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<label for="companyName" class="text-xs font-semibold text-slate-700">Nama Perusahaan / Konsorsium</label>
						<input
							id="companyName"
							name="companyName"
							type="text"
							bind:value={companyName}
							class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
						/>
					</div>

					<div class="space-y-1.5">
						<label for="directorName" class="text-xs font-semibold text-slate-700">Nama Pimpinan / Direktur Utama</label>
						<input
							id="directorName"
							name="directorName"
							type="text"
							bind:value={directorName}
							class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
						/>
					</div>

					<div class="space-y-1.5 sm:col-span-2">
						<label for="operationalArea" class="text-xs font-semibold text-slate-700">Wilayah Operasional Portofolio</label>
						<input
							id="operationalArea"
							name="operationalArea"
							type="text"
							bind:value={operationalArea}
							class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
						/>
					</div>
				</div>

				<div class="flex justify-end pt-3">
					<button
						type="submit"
						disabled={isSaving}
						class="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
					>
						<Save class="w-3.5 h-3.5" />
						<span>{isSaving ? 'Menyimpan...' : 'Simpan Profil'}</span>
					</button>
				</div>
			</div>
		</form>

	<!-- TAB 2: PENGGUNA & HAK AKSES (RBAC) -->
	{:else if activeSection === 'users'}
		<div class="space-y-5">
			<!-- Header Sub-Action -->
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div>
					<h2 class="text-sm font-bold text-slate-900">Daftar Pengguna & Otoritas Role</h2>
					<p class="text-xs text-slate-500">Kelola kredensial akun, peran akses (Direktur, Finance, Site Manager), dan status aktifasi.</p>
				</div>
				<button
					type="button"
					onclick={() => showAddUserModal = true}
					class="px-3.5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
				>
					<UserPlus class="w-3.5 h-3.5" />
					<span>+ Tambah Pengguna Baru</span>
				</button>
			</div>

			<!-- Kartu Matriks RBAC Ringkas -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
				<div class="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
					<div class="flex items-center justify-between">
						<span class="text-xs font-black text-slate-900">DIREKTUR</span>
						<span class="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold">Full Access</span>
					</div>
					<p class="text-[11px] text-slate-500">Melihat seluruh margin laba bersih, cash pooling rekening induk, approval kasbon, dan master data.</p>
				</div>

				<div class="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 shadow-2xs space-y-1">
					<div class="flex items-center justify-between">
						<span class="text-xs font-black text-blue-900">FINANCE</span>
						<span class="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">HO & Kas</span>
					</div>
					<p class="text-[11px] text-blue-700">Mengelola Kas Besar, verifikasi termin, cash pooling, input kasbon, dan cetak invoice/laporan.</p>
				</div>

				<div class="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 shadow-2xs space-y-1">
					<div class="flex items-center justify-between">
						<span class="text-xs font-black text-emerald-900">SITE_MANAGER</span>
						<span class="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">Lapangan</span>
					</div>
					<p class="text-[11px] text-emerald-700">Input nota kasir CIH & ajukan kasbon. Margin laba & rekening induk Azka terproteksi aman.</p>
				</div>
			</div>

			<!-- Tabel Pengguna -->
			<div class="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
				<!-- Desktop Table View -->
				<div class="hidden md:block overflow-x-auto">
					<table class="w-full text-left border-collapse text-xs">
						<thead>
							<tr class="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
								<th class="py-3 px-4">PENGGUNA</th>
								<th class="py-3 px-4">ROLE OTORITAS</th>
								<th class="py-3 px-4">KONTAK / WHATSAPP</th>
								<th class="py-3 px-4">STATUS</th>
								<th class="py-3 px-4 text-right">AKSI</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-100">
							{#each data.usersList as u (u.id)}
								<tr class="hover:bg-slate-50/60 transition-colors">
									<td class="py-3 px-4">
										<div class="flex items-center gap-2.5">
											<div class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
												{u.namaLengkap.slice(0, 2).toUpperCase()}
											</div>
											<div>
												<div class="font-bold text-slate-900">{u.namaLengkap}</div>
												<div class="text-[11px] text-slate-500 font-mono">@{u.username} &bull; {u.email || '-'}</div>
											</div>
										</div>
									</td>
									<td class="py-3 px-4">
										<span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide {u.role === 'DIREKTUR' ? 'bg-slate-900 text-white' : u.role === 'FINANCE' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}">
											{u.role}
										</span>
									</td>
									<td class="py-3 px-4 font-mono text-slate-600">
										{u.noHp || '-'}
									</td>
									<td class="py-3 px-4">
										{#if u.isActive}
											<span class="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
												<Check class="w-3 h-3 text-emerald-600" /> Aktif
											</span>
										{:else}
											<span class="inline-flex items-center gap-1 text-slate-400 font-semibold text-[11px]">
												<X class="w-3 h-3 text-slate-400" /> Nonaktif
											</span>
										{/if}
									</td>
									<td class="py-3 px-4 text-right">
										<div class="inline-flex items-center gap-1">
											<!-- Toggle Status Form -->
											<form
												method="POST"
												action="?/toggleUserStatus"
												use:enhance={() => {
													return async ({ update, result }) => {
														await update();
														if (result.type === 'success') toast.success('Status user berhasil diubah.');
													};
												}}
											>
												<input type="hidden" name="id" value={u.id} />
												<input type="hidden" name="isActive" value={u.isActive ? '1' : '0'} />
												<button
													type="submit"
													class="px-2 py-1 text-[11px] font-semibold rounded-lg {u.isActive ? 'text-amber-700 hover:bg-amber-50' : 'text-emerald-700 hover:bg-emerald-50'} transition-colors cursor-pointer"
												>
													{u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
												</button>
											</form>

											<!-- Delete User Form -->
											<form
												method="POST"
												action="?/deleteUser"
												use:enhance={() => {
													if (!confirm(`Hapus pengguna ${u.namaLengkap}?`)) return () => {};
													return async ({ update, result }) => {
														await update();
														if (result.type === 'success') toast.success('User berhasil dihapus.');
													};
												}}
											>
												<input type="hidden" name="id" value={u.id} />
												<button
													type="submit"
													class="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
													title="Hapus Pengguna"
												>
													<Trash2 class="w-3.5 h-3.5" />
												</button>
											</form>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<!-- Mobile Cards View for Users -->
				<div class="md:hidden divide-y divide-slate-100">
					{#each data.usersList as u (u.id)}
						<div class="p-4 space-y-3">
							<div class="flex items-start justify-between gap-2">
								<div class="flex items-center gap-2.5">
									<div class="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
										{u.namaLengkap.slice(0, 2).toUpperCase()}
									</div>
									<div>
										<div class="font-bold text-slate-900 text-xs">{u.namaLengkap}</div>
										<div class="text-[11px] text-slate-500 font-mono">@{u.username} &bull; {u.email || '-'}</div>
									</div>
								</div>
								<span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase {u.role === 'DIREKTUR' ? 'bg-slate-900 text-white' : u.role === 'FINANCE' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}">
									{u.role}
								</span>
							</div>

							<div class="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
								<div>
									<span class="text-slate-400 block text-[10px]">Kontak WhatsApp</span>
									<span class="font-mono text-slate-700">{u.noHp || '-'}</span>
								</div>
								<div>
									<span class="text-slate-400 block text-[10px]">Status Akun</span>
									{#if u.isActive}
										<span class="text-emerald-700 font-bold">Aktif</span>
									{:else}
										<span class="text-slate-400 font-semibold">Nonaktif</span>
									{/if}
								</div>
							</div>

							<div class="flex items-center justify-end gap-2 pt-1">
								<form
									method="POST"
									action="?/toggleUserStatus"
									use:enhance={() => {
										return async ({ update, result }) => {
											await update();
											if (result.type === 'success') toast.success('Status user berhasil diubah.');
										};
									}}
								>
									<input type="hidden" name="id" value={u.id} />
									<input type="hidden" name="isActive" value={u.isActive ? '1' : '0'} />
									<button
										type="submit"
										class="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 {u.isActive ? 'text-amber-700 bg-amber-50/50' : 'text-emerald-700 bg-emerald-50/50'} cursor-pointer"
									>
										{u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
									</button>
								</form>

								<form
									method="POST"
									action="?/deleteUser"
									use:enhance={() => {
										if (!confirm(`Hapus pengguna ${u.namaLengkap}?`)) return () => {};
										return async ({ update, result }) => {
											await update();
											if (result.type === 'success') toast.success('User berhasil dihapus.');
										};
									}}
								>
									<input type="hidden" name="id" value={u.id} />
									<button
										type="submit"
										class="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 cursor-pointer"
										title="Hapus Pengguna"
									>
										<Trash2 class="w-3.5 h-3.5" />
									</button>
								</form>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

	<!-- TAB: MASTER PERAN & HAK AKSES (DYNAMIC RBAC) -->
	{:else if activeSection === 'roles'}
		<div class="space-y-5">
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div>
					<h2 class="text-sm font-bold text-slate-900">Direktori Peran & Matriks Hak Akses (Dynamic RBAC)</h2>
					<p class="text-xs text-slate-500">Konfigurasi hak akses granular per menu, halaman, dan fitur untuk setiap peran sistem.</p>
				</div>
				<button
					type="button"
					onclick={() => showAddRoleModal = true}
					class="px-3.5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
				>
					<Plus class="w-3.5 h-3.5" />
					<span>+ Tambah Peran Baru</span>
				</button>
			</div>

			<!-- Grid Daftar Peran -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				{#each data.rolesList as r (r.id)}
					<div class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4 flex flex-col justify-between">
						<div class="space-y-2.5">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider {r.isSystem ? 'bg-slate-900 text-white' : 'bg-indigo-100 text-indigo-800 border border-indigo-200'}">
										{r.kode}
									</span>
									{#if r.isSystem}
										<span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-[10px] border border-slate-200/60">
											Sistem
										</span>
									{:else}
										<span class="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-[10px] border border-indigo-200/60">
											Kustom
										</span>
									{/if}
								</div>
								<span class="text-xs font-mono font-bold text-slate-500">
									{r.permissionsList.length} Izin Aktif
								</span>
							</div>

							<div>
								<h3 class="text-sm font-bold text-slate-900">{r.nama}</h3>
								<p class="text-xs text-slate-500 mt-1 leading-relaxed">{r.deskripsi || 'Tidak ada deskripsi peran.'}</p>
							</div>

							<!-- Preview Badge Izin Ringkas -->
							<div class="flex flex-wrap gap-1 pt-1">
								{#each r.permissionsList.slice(0, 5) as p}
									<span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[9px]">
										{p}
									</span>
								{/each}
								{#if r.permissionsList.length > 5}
									<span class="px-1.5 py-0.5 rounded bg-slate-50 text-slate-400 font-mono text-[9px]">
										+{r.permissionsList.length - 5} lainnya
									</span>
								{/if}
							</div>
						</div>

						<div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
							<button
								type="button"
								onclick={() => openEditRole(r)}
								class="px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
							>
								<Sliders class="w-3.5 h-3.5 text-slate-600" />
								<span>Atur Matriks Izin</span>
							</button>

							{#if !r.isSystem}
								<form
									method="POST"
									action="?/deleteRole"
									use:enhance={() => {
										if (!confirm(`Hapus peran "${r.nama}"? Pengguna dengan peran ini akan kehilangan akses.`)) return () => {};
										return async ({ update, result }) => {
											await update();
											if (result.type === 'success') toast.success('Peran berhasil dihapus.');
											else if (result.type === 'failure') toast.error(String((result.data as any)?.error || 'Gagal menghapus peran.'));
										};
									}}
								>
									<input type="hidden" name="id" value={r.id} />
									<button
										type="submit"
										class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
										title="Hapus Peran"
									>
										<Trash2 class="w-4 h-4" />
									</button>
								</form>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>

	<!-- TAB 4: MASTER SUBKON & MANDOR -->
	{:else if activeSection === 'master_vendor'}
		<div class="space-y-5">
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div>
					<h2 class="text-sm font-bold text-slate-900">Direktori Master Subkon & Mandor Lapangan</h2>
					<p class="text-xs text-slate-500">Pusat data vendor pelaksana, nomor rekening tujuan transfer kasbon, dan spesialisasi keahlian.</p>
				</div>
				<button
					type="button"
					onclick={() => showAddVendorModal = true}
					class="px-3.5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
				>
					<HardHat class="w-3.5 h-3.5" />
					<span>+ Tambah Subkon Baru</span>
				</button>
			</div>

			<div class="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
				<!-- Desktop Table View -->
				<div class="hidden md:block overflow-x-auto">
					<table class="w-full text-left border-collapse text-xs">
						<thead>
							<tr class="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
								<th class="py-3 px-4">NAMA SUBKON / MANDOR</th>
								<th class="py-3 px-4">SPESIALISASI / BIDANG</th>
								<th class="py-3 px-4">NO. REKENING & BANK</th>
								<th class="py-3 px-4">CATATAN</th>
								<th class="py-3 px-4 text-right">AKSI</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-100">
							{#each data.masterVendorsList as v (v.id)}
								<tr class="hover:bg-slate-50/60 transition-colors">
									<td class="py-3 px-4 font-bold text-slate-900">
										{v.nama}
									</td>
									<td class="py-3 px-4">
										<span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200/70">
											{v.bidang}
										</span>
									</td>
									<td class="py-3 px-4 text-slate-600 font-mono text-[11px]">
										{#if v.bankRekening}
											<div>{v.bankNama}: <span class="font-bold">{v.bankRekening}</span></div>
											<div class="text-[10px] text-slate-400">a/n {v.bankAtasNama || v.nama}</div>
										{:else}
											<span class="text-slate-400 italic">Belum diset</span>
										{/if}
									</td>
									<td class="py-3 px-4 text-slate-500 text-[11px]">
										{v.catatan || '-'}
									</td>
									<td class="py-3 px-4 text-right">
										<form
											method="POST"
											action="?/deleteMasterVendor"
											use:enhance={() => {
												if (!confirm(`Hapus subkon ${v.nama}?`)) return () => {};
												return async ({ update, result }) => {
													await update();
													if (result.type === 'success') toast.success('Subkon berhasil dihapus.');
												};
											}}
										>
											<input type="hidden" name="id" value={v.id} />
											<button
												type="submit"
												class="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
												title="Hapus Subkon"
											>
												<Trash2 class="w-3.5 h-3.5" />
											</button>
										</form>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				<!-- Mobile Cards View for Subkon -->
				<div class="md:hidden divide-y divide-slate-100">
					{#each data.masterVendorsList as v (v.id)}
						<div class="p-4 space-y-3">
							<div class="flex items-start justify-between gap-2">
								<div>
									<div class="font-bold text-slate-900 text-xs">{v.nama}</div>
									<span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px] border border-slate-200/70 inline-block mt-1">
										{v.bidang}
									</span>
								</div>
								<form
									method="POST"
									action="?/deleteMasterVendor"
									use:enhance={() => {
										if (!confirm(`Hapus subkon ${v.nama}?`)) return () => {};
										return async ({ update, result }) => {
											await update();
											if (result.type === 'success') toast.success('Subkon berhasil dihapus.');
										};
									}}
								>
									<input type="hidden" name="id" value={v.id} />
									<button
										type="submit"
										class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
										title="Hapus Subkon"
									>
										<Trash2 class="w-3.5 h-3.5" />
									</button>
								</form>
							</div>

							<div class="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1 text-[11px]">
								<div class="text-slate-600 font-mono">
									{#if v.bankRekening}
										<div><span class="font-bold">{v.bankNama}:</span> {v.bankRekening}</div>
										<div class="text-[10px] text-slate-400">a/n {v.bankAtasNama || v.nama}</div>
									{:else}
										<span class="text-slate-400 italic">Rekening belum diset</span>
									{/if}
								</div>
								{#if v.catatan}
									<div class="text-slate-500 pt-1 border-t border-slate-200/50 text-[10px]">{v.catatan}</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

	<!-- TAB 5: MASTER REKENING KAS -->
	{:else if activeSection === 'master_account'}
		<div class="space-y-5">
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div>
					<h2 class="text-sm font-bold text-slate-900">Master Rekening Bank & Akun Kas</h2>
					<p class="text-xs text-slate-500">Konfigurasi rekening penampung cash pooling, kas kecil operasional lapangan (CIH), dan rekening holding BSI.</p>
				</div>
				<button
					type="button"
					onclick={() => showAddAccountModal = true}
					class="px-3.5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
				>
					<Landmark class="w-3.5 h-3.5" />
					<span>+ Tambah Akun Rekening</span>
				</button>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				{#each data.masterAccountsList as acc (acc.id)}
					<div class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3 flex flex-col justify-between">
						<div>
							<div class="flex items-center justify-between">
								<span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase {acc.tipe === 'POOLING' ? 'bg-purple-100 text-purple-800 border border-purple-200' : acc.tipe === 'BANK' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-teal-100 text-teal-800 border border-teal-200'}">
									{acc.tipe}
								</span>
								<span class="text-[10px] font-mono font-bold text-slate-400">{acc.kode}</span>
							</div>
							<h3 class="text-sm font-bold text-slate-900 mt-2">{acc.nama}</h3>
							<p class="text-xs text-slate-500 font-mono mt-0.5">{acc.bankNama} &bull; {acc.noRekening || '-'}</p>
							{#if acc.atasNama}
								<p class="text-[11px] text-slate-600 mt-1 font-semibold">a/n {acc.atasNama}</p>
							{/if}
						</div>

						<div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
							<span class="text-slate-500 text-[11px]">Status</span>
							<span class="text-emerald-700 font-bold text-[11px]">Aktif Digunakan</span>
						</div>
					</div>
				{/each}
			</div>
		</div>

	<!-- TAB 5: PARAMETER RISIKO -->
	{:else if activeSection === 'risiko'}
		<form
			method="POST"
			action="?/saveSettings"
			use:enhance={() => {
				isSaving = true;
				return async ({ update, result }) => {
					isSaving = false;
					await update();
					if (result.type === 'success') toast.success('Parameter risiko berhasil disimpan!');
				};
			}}
			class="space-y-6"
		>
			<div class="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-5">
				<div class="flex items-center gap-3 pb-3 border-b border-slate-100">
					<div class="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
						<Sliders class="w-4 h-4 text-amber-600" />
					</div>
					<div>
						<h2 class="text-sm font-bold text-slate-900">Ambang Batas Proteksi Margin & Kasbon</h2>
						<p class="text-xs text-slate-500">Parameter otomatisasi sinyal peringatan (warning alert) pada sistem.</p>
					</div>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<label for="minMarginWarningPct" class="text-xs font-semibold text-slate-700">Ambang Batas Margin Minimum (%)</label>
						<input
							id="minMarginWarningPct"
							name="minMarginWarningPct"
							type="number"
							bind:value={minMarginWarningPct}
							class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
						/>
						<p class="text-[11px] text-slate-400">Jika margin proyek turun di bawah angka ini, baris tabel akan berkedip kuning.</p>
					</div>

					<div class="space-y-1.5">
						<label for="kasbonOverprogressPct" class="text-xs font-semibold text-slate-700">Toleransi Kasbon vs Progres Fisik (%)</label>
						<input
							id="kasbonOverprogressPct"
							name="kasbonOverprogressPct"
							type="number"
							bind:value={kasbonOverprogressPct}
							class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
						/>
						<p class="text-[11px] text-slate-400">Batas maksimal pengeluaran kasbon melebihi persentase progres fisik lapangan.</p>
					</div>
				</div>

				<div class="flex justify-end pt-3">
					<button
						type="submit"
						disabled={isSaving}
						class="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
					>
						<Save class="w-3.5 h-3.5" />
						<span>Simpan Parameter</span>
					</button>
				</div>
			</div>
		</form>

	<!-- TAB 6: DATABASE WAL -->
	{:else if activeSection === 'database'}
		<div class="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
			<div class="flex items-center gap-3 pb-3 border-b border-slate-100">
				<div class="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
					<Database class="w-4 h-4 text-slate-700" />
				</div>
				<div>
					<h2 class="text-sm font-bold text-slate-900">Status Database & Konkurensi WAL</h2>
					<p class="text-xs text-slate-500">Penyimpanan lokal SQLite berkecepatan tinggi dengan mode Write-Ahead Logging.</p>
				</div>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
				<div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
					<span class="text-[11px] text-slate-500 font-semibold">Tipe Engine</span>
					<div class="text-xs font-bold text-slate-900 font-mono">SQLite (better-sqlite3)</div>
				</div>
				<div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
					<span class="text-[11px] text-slate-500 font-semibold">Journal Mode</span>
					<div class="text-xs font-bold text-emerald-700 font-mono">WAL (Write-Ahead Logging)</div>
				</div>
				<div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
					<span class="text-[11px] text-slate-500 font-semibold">Total Titik Terdata</span>
					<div class="text-xs font-bold text-slate-900">{data.settings.totalTitik} Proyek Aktif</div>
				</div>
			</div>
		</div>
	{/if}

</div>

<!-- MODAL: TAMBAH PENGGUNA BARU (RBAC) -->
{#if showAddUserModal}
	<div 
		class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
		role="dialog"
		aria-modal="true"
	>
		<div class="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
			<div class="flex items-center justify-between pb-3 border-b border-slate-100">
				<div class="flex items-center gap-2.5">
					<div class="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
						<UserPlus class="w-4 h-4 text-white" />
					</div>
					<div>
						<h3 class="text-sm font-bold text-slate-900">Tambah Pengguna Baru</h3>
						<p class="text-[11px] text-slate-500">Tentukan otoritas peran & kredensial login.</p>
					</div>
				</div>
				<button 
					type="button" 
					onclick={() => showAddUserModal = false}
					class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
				>
					<X class="w-4 h-4" />
				</button>
			</div>

			<form
				method="POST"
				action="?/addUser"
				use:enhance={() => {
					return async ({ update, result }) => {
						await update();
						if (result.type === 'success') {
							showAddUserModal = false;
							toast.success('Pengguna baru berhasil dibuat!');
						} else if (result.type === 'failure') {
							toast.error(String((result.data as any)?.error || 'Gagal membuat user.'));
						}
					};
				}}
				class="space-y-3.5"
			>
				<div class="space-y-1">
					<label for="namaLengkap" class="text-xs font-semibold text-slate-700">Nama Lengkap</label>
					<input id="namaLengkap" name="namaLengkap" required type="text" placeholder="Contoh: Bpk. Bambang" class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900" />
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div class="space-y-1">
						<label for="username" class="text-xs font-semibold text-slate-700">Username Login</label>
						<input id="username" name="username" required type="text" placeholder="bambang" class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-mono" />
					</div>
					<div class="space-y-1">
						<label for="role" class="text-xs font-semibold text-slate-700">Otoritas Role</label>
						<select id="role" name="role" class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-semibold bg-white">
							{#each data.rolesList as r}
								<option value={r.kode}>{r.kode} ({r.nama})</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div class="space-y-1">
						<label for="email" class="text-xs font-semibold text-slate-700">Email (Opsional)</label>
						<input id="email" name="email" type="email" placeholder="bambang@sppg.id" class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900" />
					</div>
					<div class="space-y-1">
						<label for="noHp" class="text-xs font-semibold text-slate-700">WhatsApp / HP</label>
						<input id="noHp" name="noHp" type="text" placeholder="08123456789" class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-mono" />
					</div>
				</div>

				<div class="space-y-1">
					<label for="password" class="text-xs font-semibold text-slate-700">Kata Sandi (Password Akun)</label>
					<input id="password" name="password" type="text" value="demo123" placeholder="Minimal 6 karakter" class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-mono" />
				</div>

				<div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
					<button 
						type="button" 
						onclick={() => showAddUserModal = false}
						class="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
					>
						Batal
					</button>
					<button 
						type="submit" 
						class="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
					>
						Simpan Pengguna
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- MODAL: TAMBAH MASTER VENDOR -->
{#if showAddVendorModal}
	<div 
		class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
		role="dialog"
		aria-modal="true"
	>
		<div class="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
			<div class="flex items-center justify-between pb-3 border-b border-slate-100">
				<div class="flex items-center gap-2.5">
					<div class="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
						<HardHat class="w-4 h-4 text-white" />
					</div>
					<div>
						<h3 class="text-sm font-bold text-slate-900">Tambah Master Subkon / Mandor</h3>
						<p class="text-[11px] text-slate-500">Pusat data vendor & info rekening transfer.</p>
					</div>
				</div>
				<button 
					type="button" 
					onclick={() => showAddVendorModal = false}
					class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
				>
					<X class="w-4 h-4" />
				</button>
			</div>

			<form
				method="POST"
				action="?/addMasterVendor"
				use:enhance={() => {
					return async ({ update, result }) => {
						await update();
						if (result.type === 'success') {
							showAddVendorModal = false;
							toast.success('Subkon berhasil ditambahkan!');
						} else if (result.type === 'failure') {
							toast.error(String((result.data as any)?.error || 'Gagal menambah subkon.'));
						}
					};
				}}
				class="space-y-3.5"
			>
				<div class="space-y-1">
					<label for="nama" class="text-xs font-semibold text-slate-700">Nama Subkon / Mandor</label>
					<input id="nama" name="nama" required type="text" placeholder="Contoh: Mandor Rohman" class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900" />
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div class="space-y-1">
						<label for="bidang" class="text-xs font-semibold text-slate-700">Spesialisasi Bidang</label>
						<input id="bidang" name="bidang" required type="text" placeholder="Sipil / Dapur / MEP" class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900" />
					</div>
					<div class="space-y-1">
						<label for="noHp" class="text-xs font-semibold text-slate-700">No. WhatsApp</label>
						<input id="noHp" name="noHp" type="text" placeholder="08123456789" class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-mono" />
					</div>
				</div>

				<div class="grid grid-cols-3 gap-2">
					<div class="space-y-1">
						<label for="bankNama" class="text-xs font-semibold text-slate-700">Bank</label>
						<input id="bankNama" name="bankNama" type="text" placeholder="BCA/BSI/BRI" class="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900" />
					</div>
					<div class="space-y-1 col-span-2">
						<label for="bankRekening" class="text-xs font-semibold text-slate-700">No. Rekening</label>
						<input id="bankRekening" name="bankRekening" type="text" placeholder="1234567890" class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-mono" />
					</div>
				</div>

				<div class="space-y-1">
					<label for="catatan" class="text-xs font-semibold text-slate-700">Catatan / Wilayah</label>
					<input id="catatan" name="catatan" type="text" placeholder="Contoh: Spesialis stainless dapur higienis" class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900" />
				</div>

				<div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
					<button 
						type="button" 
						onclick={() => showAddVendorModal = false}
						class="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
					>
						Batal
					</button>
					<button 
						type="submit" 
						class="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
					>
						Simpan Subkon
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- MODAL: TAMBAH MASTER REKENING -->
{#if showAddAccountModal}
	<div 
		class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
		role="dialog"
		aria-modal="true"
	>
		<div class="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
			<div class="flex items-center justify-between pb-3 border-b border-slate-100">
				<div class="flex items-center gap-2.5">
					<div class="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
						<Landmark class="w-4 h-4 text-white" />
					</div>
					<div>
						<h3 class="text-sm font-bold text-slate-900">Tambah Akun Rekening Kas</h3>
						<p class="text-[11px] text-slate-500">Konfigurasi rekening perbankan atau kas kecil.</p>
					</div>
				</div>
				<button 
					type="button" 
					onclick={() => showAddAccountModal = false}
					class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
				>
					<X class="w-4 h-4" />
				</button>
			</div>

			<form
				method="POST"
				action="?/addMasterAccount"
				use:enhance={() => {
					return async ({ update, result }) => {
						await update();
						if (result.type === 'success') {
							showAddAccountModal = false;
							toast.success('Rekening berhasil ditambahkan!');
						} else if (result.type === 'failure') {
							toast.error(String((result.data as any)?.error || 'Gagal menambah rekening.'));
						}
					};
				}}
				class="space-y-3.5"
			>
				<div class="grid grid-cols-2 gap-3">
					<div class="space-y-1">
						<label for="kode" class="text-xs font-semibold text-slate-700">Kode Unik</label>
						<input id="kode" name="kode" required type="text" placeholder="BANK_MANDIRI" class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-mono uppercase" />
					</div>
					<div class="space-y-1">
						<label for="tipe" class="text-xs font-semibold text-slate-700">Tipe Akun</label>
						<select id="tipe" name="tipe" class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-semibold bg-white">
							<option value="BANK">BANK (Operasional)</option>
							<option value="POOLING">POOLING (Induk Holding)</option>
							<option value="KAS_KECIL">KAS_KECIL (Petty Cash)</option>
						</select>
					</div>
				</div>

				<div class="space-y-1">
					<label for="accNama" class="text-xs font-semibold text-slate-700">Nama Akun Rekening</label>
					<input id="accNama" name="nama" required type="text" placeholder="Contoh: Rekening Mandiri Operasional" class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900" />
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div class="space-y-1">
						<label for="accBank" class="text-xs font-semibold text-slate-700">Nama Bank</label>
						<input id="accBank" name="bankNama" type="text" placeholder="Bank Mandiri" class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900" />
					</div>
					<div class="space-y-1">
						<label for="noRekening" class="text-xs font-semibold text-slate-700">No. Rekening</label>
						<input id="noRekening" name="noRekening" type="text" placeholder="142-00-xxxx" class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-mono" />
					</div>
				</div>

				<div class="space-y-1">
					<label for="atasNama" class="text-xs font-semibold text-slate-700">Atas Nama Rekening</label>
					<input id="atasNama" name="atasNama" type="text" placeholder="PT Sentra Gizi Indonesia" class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900" />
				</div>

				<div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
					<button 
						type="button" 
						onclick={() => showAddAccountModal = false}
						class="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
					>
						Batal
					</button>
					<button 
						type="submit" 
						class="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
					>
						Simpan Rekening
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- MODAL: TAMBAH PERAN BARU -->
{#if showAddRoleModal}
	<div 
		class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
		role="dialog"
		aria-modal="true"
	>
		<div class="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
			<div class="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
				<div class="flex items-center gap-2.5">
					<div class="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
						<KeyRound class="w-4 h-4 text-white" />
					</div>
					<div>
						<h3 class="text-sm font-bold text-slate-900">Tambah Peran & Hak Akses Baru</h3>
						<p class="text-[11px] text-slate-500">Definisikan peran kustom dan pilih izin akses per modul.</p>
					</div>
				</div>
				<button 
					type="button" 
					onclick={() => showAddRoleModal = false}
					class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
				>
					<X class="w-4 h-4" />
				</button>
			</div>

			<form
				method="POST"
				action="?/addRole"
				use:enhance={() => {
					return async ({ update, result }) => {
						await update();
						if (result.type === 'success') {
							showAddRoleModal = false;
							toast.success('Peran baru berhasil ditambahkan!');
						} else if (result.type === 'failure') {
							toast.error(String((result.data as any)?.error || 'Gagal menambah peran.'));
						}
					};
				}}
				class="space-y-4 overflow-y-auto pr-1 flex-1"
			>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div class="space-y-1">
						<label for="new_role_kode" class="text-xs font-semibold text-slate-700">Kode Peran (Huruf Kapital)</label>
						<input id="new_role_kode" name="kode" required type="text" placeholder="QC_LAPANGAN" class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-mono uppercase" />
					</div>
					<div class="space-y-1">
						<label for="new_role_nama" class="text-xs font-semibold text-slate-700">Nama Peran Lengkap</label>
						<input id="new_role_nama" name="nama" required type="text" placeholder="Quality Control & Pengawas Mutu" class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900" />
					</div>
				</div>

				<div class="space-y-1">
					<label for="new_role_desc" class="text-xs font-semibold text-slate-700">Deskripsi Cakupan Tugas</label>
					<input id="new_role_desc" name="deskripsi" type="text" placeholder="Bertanggung jawab memverifikasi progres fisik dan kualitas titik SPPG." class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900" />
				</div>

				<!-- Permissions Matrix Checklist -->
				<div class="space-y-3 pt-2 border-t border-slate-100">
					<div class="flex items-center justify-between">
						<div class="text-xs font-bold text-slate-900">Matriks Hak Akses & Fitur</div>
						<span class="text-[11px] text-slate-400">Centang fitur yang diperbolehkan</span>
					</div>

					<div class="space-y-4">
						{#each ALL_PERMISSIONS as cat}
							<div class="bg-slate-50/80 rounded-xl p-3 border border-slate-200/80 space-y-2">
								<div class="text-xs font-bold text-slate-800">{cat.category}</div>
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
									{#each cat.items as item}
										<label class="flex items-center gap-2 p-1.5 rounded-lg bg-white border border-slate-200/60 hover:border-slate-300 text-xs cursor-pointer transition-colors">
											<input type="checkbox" name="permissions" value={item.key} class="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-3.5 h-3.5" />
											<span class="text-slate-700 text-[11px] select-none">{item.label}</span>
										</label>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				</div>

				<div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 shrink-0 sticky bottom-0 bg-white">
					<button 
						type="button" 
						onclick={() => showAddRoleModal = false}
						class="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
					>
						Batal
					</button>
					<button 
						type="submit" 
						class="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
					>
						Simpan Peran Baru
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- MODAL: ATUR MATRIKS IZIN PERAN (EDIT ROLE) -->
{#if showEditRoleModal && selectedRoleForEdit}
	<div 
		class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
		role="dialog"
		aria-modal="true"
	>
		<div class="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
			<div class="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
				<div class="flex items-center gap-2.5">
					<div class="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
						<Sliders class="w-4 h-4 text-white" />
					</div>
					<div>
						<h3 class="text-sm font-bold text-slate-900">
							Atur Matriks Izin: {selectedRoleForEdit.nama}
						</h3>
						<p class="text-[11px] text-slate-500 font-mono">
							Kode: {selectedRoleForEdit.kode} {selectedRoleForEdit.isSystem ? '• (Peran Sistem Bawaan)' : '• (Peran Kustom)'}
						</p>
					</div>
				</div>
				<button 
					type="button" 
					onclick={() => showEditRoleModal = false}
					class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
				>
					<X class="w-4 h-4" />
				</button>
			</div>

			<form
				method="POST"
				action="?/editRole"
				use:enhance={() => {
					return async ({ update, result }) => {
						await update();
						if (result.type === 'success') {
							showEditRoleModal = false;
							toast.success(`Hak akses peran ${selectedRoleForEdit.nama} berhasil diperbarui!`);
						} else if (result.type === 'failure') {
							toast.error(String((result.data as any)?.error || 'Gagal memperbarui izin peran.'));
						}
					};
				}}
				class="space-y-4 overflow-y-auto pr-1 flex-1"
			>
				<input type="hidden" name="id" value={selectedRoleForEdit.id} />

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div class="space-y-1">
						<label for="edit_role_nama" class="text-xs font-semibold text-slate-700">Nama Peran</label>
						<input id="edit_role_nama" name="nama" required type="text" value={selectedRoleForEdit.nama} class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900" />
					</div>
					<div class="space-y-1">
						<label for="edit_role_desc" class="text-xs font-semibold text-slate-700">Deskripsi Singkat</label>
						<input id="edit_role_desc" name="deskripsi" type="text" value={selectedRoleForEdit.deskripsi || ''} class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900" />
					</div>
				</div>

				<!-- Permissions Matrix Checklist -->
				<div class="space-y-3 pt-2 border-t border-slate-100">
					<div class="flex items-center justify-between">
						<div class="text-xs font-bold text-slate-900">
							Matriks Hak Akses ({editRolePermissions.length} Izin Dipilih)
						</div>
						<div class="flex items-center gap-2">
							<button
								type="button"
								onclick={() => {
									const allKeys: string[] = [];
									ALL_PERMISSIONS.forEach(cat => cat.items.forEach(i => allKeys.push(i.key)));
									editRolePermissions = allKeys;
								}}
								class="text-[11px] font-semibold text-slate-600 hover:text-slate-900 underline"
							>
								Pilih Semua
							</button>
							<span class="text-slate-300">&bull;</span>
							<button
								type="button"
								onclick={() => { editRolePermissions = []; }}
								class="text-[11px] font-semibold text-slate-600 hover:text-slate-900 underline"
							>
								Kosongkan
							</button>
						</div>
					</div>

					<div class="space-y-4">
						{#each ALL_PERMISSIONS as cat}
							<div class="bg-slate-50/80 rounded-xl p-3 border border-slate-200/80 space-y-2">
								<div class="text-xs font-bold text-slate-800">{cat.category}</div>
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
									{#each cat.items as item}
										{@const isChecked = editRolePermissions.includes(item.key)}
										<label class="flex items-center gap-2 p-1.5 rounded-lg border text-xs cursor-pointer transition-colors {isChecked ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200/60 hover:border-slate-300 text-slate-700'}">
											<input
												type="checkbox"
												name="permissions"
												value={item.key}
												checked={isChecked}
												onchange={() => togglePermission(item.key)}
												class="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-3.5 h-3.5"
											/>
											<span class="text-[11px] select-none font-medium truncate">{item.label}</span>
										</label>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				</div>

				<div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 shrink-0 sticky bottom-0 bg-white">
					<button 
						type="button" 
						onclick={() => showEditRoleModal = false}
						class="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
					>
						Batal
					</button>
					<button 
						type="submit" 
						class="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
					>
						Simpan Perubahan Izin
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

