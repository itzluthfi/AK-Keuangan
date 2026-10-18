<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		Users,
		UserPlus,
		Check,
		X,
		Trash2,
		Search,
		ShieldCheck
	} from 'lucide-svelte';
	import { toast } from 'svelte-french-toast';

	let { data } = $props();

	let searchQuery = $state('');
	let showAddUserModal = $state(false);

	let filteredUsers = $derived(
		data.usersList.filter(u => {
			const q = searchQuery.toLowerCase().trim();
			if (!q) return true;
			return (
				u.namaLengkap.toLowerCase().includes(q) ||
				u.username.toLowerCase().includes(q) ||
				(u.email || '').toLowerCase().includes(q) ||
				(u.role || '').toLowerCase().includes(q) ||
				(u.noHp || '').includes(q)
			);
		})
	);
</script>

<svelte:head>
	<title>Pengguna & Akun Sistem - Pantau MBG SPPG</title>
</svelte:head>

<div class="space-y-6">

	<!-- Header Page (Clean, No AI-slop badges) -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200/80">
		<div>
			<h1 class="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
				Pengguna & Akun Sistem
			</h1>
			<p class="text-xs text-slate-500 mt-0.5">
				Kelola akun personel pelaksana, pembagian peran kerja, dan status akses masuk ke sistem.
			</p>
		</div>

		<button
			type="button"
			onclick={() => showAddUserModal = true}
			class="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
		>
			<UserPlus class="w-4 h-4" />
			<span>Tambah Pengguna</span>
		</button>
	</div>

	<!-- Kartu Ringkasan Peran Kerja -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-3">
		<div class="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
			<div class="flex items-center justify-between">
				<span class="text-xs font-black text-slate-900">DIREKTUR</span>
				<span class="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-bold">Akses Penuh</span>
			</div>
			<p class="text-[11px] text-slate-500">Melihat seluruh margin laba bersih, cash pooling rekening induk, persetujuan kasbon, dan master data.</p>
		</div>

		<div class="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 shadow-2xs space-y-1">
			<div class="flex items-center justify-between">
				<span class="text-xs font-black text-blue-900">FINANCE</span>
				<span class="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">Kantor & Kas</span>
			</div>
			<p class="text-[11px] text-blue-700">Mengelola Kas Besar, verifikasi termin, mutasi kas, pencatatan kasbon vendor, dan cetak invoice/laporan.</p>
		</div>

		<div class="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 shadow-2xs space-y-1">
			<div class="flex items-center justify-between">
				<span class="text-xs font-black text-emerald-900">PENGAWAS LAPANGAN</span>
				<span class="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">Lapangan</span>
			</div>
			<p class="text-[11px] text-emerald-700">Input nota kasir CIH proyek & pengajuan kasbon. Margin laba bersih dan rekening induk terlindungi aman.</p>
		</div>
	</div>

	<!-- Search & Table Container -->
	<div class="space-y-3">
		<div class="flex items-center justify-between gap-3">
			<div class="relative w-full max-w-xs">
				<Search class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Cari nama, username, email..."
					class="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
				/>
			</div>
			<div class="text-xs text-slate-500 font-medium whitespace-nowrap">
				Total: <span class="font-bold text-slate-900">{filteredUsers.length}</span> akun
			</div>
		</div>

		<div class="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
			<!-- Desktop Table View -->
			<div class="hidden md:block overflow-x-auto">
				<table class="w-full text-left border-collapse text-xs">
					<thead>
						<tr class="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[11px]">
							<th class="py-3 px-4">PENGGUNA</th>
							<th class="py-3 px-4">PERAN AKSES</th>
							<th class="py-3 px-4">KONTAK / WHATSAPP</th>
							<th class="py-3 px-4">STATUS</th>
							<th class="py-3 px-4 text-right">AKSI</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-100">
						{#if filteredUsers.length === 0}
							<tr>
								<td colspan="5" class="py-8 text-center text-slate-400 text-xs">
									Tidak ada pengguna yang cocok dengan pencarian "{searchQuery}".
								</td>
							</tr>
						{/if}
						{#each filteredUsers as u (u.id)}
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
													if (result.type === 'success') toast.success('Status pengguna berhasil diubah.');
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
													if (result.type === 'success') toast.success('Pengguna berhasil dihapus.');
													else if (result.type === 'failure') toast.error(String((result.data as any)?.error || 'Gagal menghapus user.'));
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
				{#if filteredUsers.length === 0}
					<div class="p-6 text-center text-slate-400 text-xs">
						Tidak ada pengguna yang cocok.
					</div>
				{/if}
				{#each filteredUsers as u (u.id)}
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
										if (result.type === 'success') toast.success('Status pengguna berhasil diubah.');
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
										if (result.type === 'success') toast.success('Pengguna berhasil dihapus.');
										else if (result.type === 'failure') toast.error(String((result.data as any)?.error || 'Gagal menghapus user.'));
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

</div>

<!-- MODAL: TAMBAH PENGGUNA BARU -->
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
						<p class="text-[11px] text-slate-500">Tentukan nama, username, peran kerja, dan password login.</p>
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
							toast.success('Pengguna baru berhasil ditambahkan!');
						} else if (result.type === 'failure') {
							toast.error(String((result.data as any)?.error || 'Gagal membuat pengguna.'));
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
						<label for="role" class="text-xs font-semibold text-slate-700">Peran Akses</label>
						<select id="role" name="role" class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-semibold bg-white">
							{#each data.rolesList as r}
								<option value={r.kode}>{r.nama} ({r.kode})</option>
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
