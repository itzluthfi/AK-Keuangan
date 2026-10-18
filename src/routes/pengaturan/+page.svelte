<script lang="ts">
	import { enhance } from '$app/forms';
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
		X
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
	let activeSection = $state<'profil' | 'users' | 'master_vendor' | 'master_account' | 'risiko' | 'database'>('profil');

	// Modal State
	let showAddUserModal = $state(false);
	let showAddVendorModal = $state(false);
	let showAddAccountModal = $state(false);
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
				Kontrol pengguna (RBAC), direktori master subkon, rekening kas holding, dan parameter risiko.
			</p>
		</div>

		<div class="flex items-center gap-2">
			<div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-2xs">
				<ShieldCheck class="w-3.5 h-3.5 text-emerald-400" />
				<span>Otoritas Direktur Aktif</span>
			</div>
		</div>
	</div>

	<!-- Section Selector Tabs (Clean SvelteForge Style) -->
	<div class="flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto pb-px">
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
				<span>Pengguna & Hak Akses ({data.usersList.length})</span>
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
				<div class="overflow-x-auto">
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
										{#if u.role === 'DIREKTUR'}
											<span class="px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-extrabold text-[10px]">DIREKTUR</span>
										{:else if u.role === 'FINANCE'}
											<span class="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-extrabold text-[10px] border border-blue-200">FINANCE</span>
										{:else}
											<span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] border border-emerald-200">SITE MANAGER</span>
										{/if}
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
			</div>
		</div>

	<!-- TAB 3: MASTER SUBKON & MANDOR -->
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
				<div class="overflow-x-auto">
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
			</div>
		</div>

	<!-- TAB 4: MASTER REKENING KAS -->
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
							<option value="SITE_MANAGER">SITE_MANAGER (Mandor Lapangan)</option>
							<option value="FINANCE">FINANCE (Kasir / Pembukuan)</option>
							<option value="DIREKTUR">DIREKTUR (Pimpinan)</option>
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
