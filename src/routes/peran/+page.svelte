<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		KeyRound,
		Plus,
		Sliders,
		Trash2,
		X
	} from 'lucide-svelte';
	import { toast } from 'svelte-french-toast';

	let { data } = $props();

	// Modal States
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
				{ key: 'kasbon.approve', label: 'Persetujuan Pencairan Kasbon' },
				{ key: 'kasbon.delete', label: 'Hapus Mutasi Kasbon' }
			]
		},
		{
			category: '🧾 Kas Operasional Lapangan (CIH)',
			items: [
				{ key: 'kasir.view', label: 'Akses Kasir CIH Lapangan' },
				{ key: 'kasir.input_nota', label: 'Catat Nota & Pengeluaran Lapangan' },
				{ key: 'kasir.verify', label: 'Verifikasi & Audit Nota Lapangan' }
			]
		},
		{
			category: '💼 Cash Pooling & Rekening Induk',
			items: [
				{ key: 'pooling.view', label: 'Lihat Ringkasan Pooling' },
				{ key: 'pooling.transfer', label: 'Eksekusi Transfer Cash Pooling' }
			]
		},
		{
			category: '📄 Generator Invoice & SPK',
			items: [
				{ key: 'invoice.create', label: 'Buat Draft Invoice Baru' },
				{ key: 'invoice.print', label: 'Cetak Tagihan Resmi & Faktur' }
			]
		},
		{
			category: '📈 Laporan & Rekapitulasi',
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
				{ key: 'pengaturan.roles', label: 'Kelola Peran & Hak Akses' },
				{ key: 'pengaturan.users', label: 'Kelola Pengguna Sistem' },
				{ key: 'pengaturan.system', label: 'Akses Parameter Risiko & Database' }
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
	<title>Peran & Hak Akses - Pantau MBG SPPG</title>
</svelte:head>

<div class="space-y-6">

	<!-- Header Page (No AI Slop Badges, Clean Typography) -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200/80">
		<div>
			<h1 class="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
				Peran & Hak Akses
			</h1>
			<p class="text-xs text-slate-500 mt-0.5">
				Konfigurasi pembagian wewenang dan izin akses modul untuk setiap peran pengguna sistem.
			</p>
		</div>

		<button
			type="button"
			onclick={() => showAddRoleModal = true}
			class="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
		>
			<Plus class="w-4 h-4" />
			<span>Tambah Peran Baru</span>
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
									Bawaan Sistem
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
						<p class="text-xs text-slate-500 mt-1 leading-relaxed">{r.deskripsi || 'Tidak ada deskripsi khusus.'}</p>
					</div>

					<!-- Preview Badge Izin Ringkas -->
					<div class="flex flex-wrap gap-1 pt-1">
						{#each r.permissionsList.slice(0, 6) as p}
							<span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[9px]">
								{p}
							</span>
						{/each}
						{#if r.permissionsList.length > 6}
							<span class="px-1.5 py-0.5 rounded bg-slate-50 text-slate-400 font-mono text-[9px]">
								+{r.permissionsList.length - 6} lainnya
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
						<p class="text-[11px] text-slate-500">Definisikan peran baru dan pilih wewenang modul.</p>
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
						<input id="new_role_nama" name="nama" required type="text" placeholder="Quality Control / Pengawas" class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900" />
					</div>
				</div>

				<div class="space-y-1">
					<label for="new_role_desc" class="text-xs font-semibold text-slate-700">Deskripsi Cakupan Tugas</label>
					<input id="new_role_desc" name="deskripsi" type="text" placeholder="Bertanggung jawab memverifikasi progres fisik dan mutu pekerjaan titik SPPG." class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900" />
				</div>

				<!-- Permissions Matrix Checklist -->
				<div class="space-y-3 pt-2 border-t border-slate-100">
					<div class="flex items-center justify-between">
						<div class="text-xs font-bold text-slate-900">Matriks Hak Akses & Fitur</div>
						<span class="text-[11px] text-slate-400">Centang modul yang diizinkan</span>
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
							Atur Hak Akses: {selectedRoleForEdit.nama}
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
								class="text-[11px] font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer"
							>
								Pilih Semua
							</button>
							<span class="text-slate-300">&bull;</span>
							<button
								type="button"
								onclick={() => { editRolePermissions = []; }}
								class="text-[11px] font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer"
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
