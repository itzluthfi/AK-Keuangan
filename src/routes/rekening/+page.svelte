<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		Landmark,
		Plus,
		Trash2,
		X,
		Wallet,
		Building,
		Eye,
		Pencil,
		CreditCard,
		CheckCircle2
	} from 'lucide-svelte';
	import { toast } from 'svelte-french-toast';

	let { data } = $props();

	let showAddModal = $state(false);
	let accountToDetail = $state<any>(null);
	let accountToEdit = $state<any>(null);

	function formatRupiah(num: number) {
		return 'Rp ' + Math.round(num || 0).toLocaleString('id-ID');
	}
</script>

<svelte:head>
	<title>Rekening Bank & Kas - Pantau MBG SPPG</title>
</svelte:head>

<div class="space-y-6">

	<!-- Header Page -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200/80">
		<div>
			<h1 class="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
				Rekening Bank & Kas
			</h1>
			<p class="text-xs text-slate-500 mt-0.5">
				Daftar rekening bank operasional, penampung cash pooling holding, dan akun kas kecil (CIH) lapangan.
			</p>
		</div>

		<button
			type="button"
			onclick={() => showAddModal = true}
			class="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
		>
			<Plus class="w-4 h-4" />
			<span>Tambah Rekening</span>
		</button>
	</div>

	<!-- Grid Rekening -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each data.accountsList as acc (acc.id)}
			<div class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4 flex flex-col justify-between hover:border-slate-300 transition-colors">
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider {acc.tipe === 'POOLING' ? 'bg-purple-100 text-purple-800 border border-purple-200' : acc.tipe === 'BANK' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-teal-100 text-teal-800 border border-teal-200'}">
							{acc.tipe === 'POOLING' ? 'Holding Pooling' : acc.tipe === 'BANK' ? 'Bank Operasional' : 'Kas Kecil (CIH)'}
						</span>
						<span class="text-[11px] font-mono font-bold text-slate-400">{acc.kode}</span>
					</div>

					<div>
						<div class="flex items-center gap-2">
							{#if acc.tipe === 'POOLING'}
								<Building class="w-4 h-4 text-purple-600 shrink-0" />
							{:else if acc.tipe === 'BANK'}
								<Landmark class="w-4 h-4 text-blue-600 shrink-0" />
							{:else}
								<Wallet class="w-4 h-4 text-teal-600 shrink-0" />
							{/if}
							<h3 class="text-sm font-bold text-slate-900 truncate">{acc.nama}</h3>
						</div>
						<div class="text-xs text-slate-500 font-mono mt-1">
							{acc.bankNama} &bull; {acc.noRekening || 'Kas Tunai / Fisik'}
						</div>
						{#if acc.atasNama}
							<div class="text-[11px] text-slate-600 mt-1">
								Atas Nama: <span class="font-semibold text-slate-800">{acc.atasNama}</span>
							</div>
						{/if}
					</div>
				</div>

				<div class="pt-3 border-t border-slate-100 flex items-center justify-between">
					<div class="flex items-center gap-1.5">
						<span class="w-2 h-2 rounded-full bg-emerald-500"></span>
						<span class="text-[11px] text-slate-500 font-medium">Aktif</span>
					</div>

					<!-- Action Buttons: Detail (Eye Blue), Edit (Pencil Slate), Delete (Trash Red) -->
					<div class="flex items-center gap-1">
						<!-- Lihat Detail Button -->
						<button
							type="button"
							onclick={() => accountToDetail = acc}
							class="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
							title="Lihat Detail Rekening"
						>
							<Eye class="w-4 h-4" />
						</button>

						<!-- Edit Rekening Button -->
						<button
							type="button"
							onclick={() => accountToEdit = { ...acc }}
							class="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
							title="Edit Data Rekening"
						>
							<Pencil class="w-3.5 h-3.5" />
						</button>

						<!-- Delete Rekening Form -->
						<form
							method="POST"
							action="?/deleteMasterAccount"
							use:enhance={() => {
								if (!confirm(`Hapus rekening "${acc.nama}"?`)) return () => {};
								return async ({ update, result }) => {
									await update();
									if (result.type === 'success') toast.success('Rekening berhasil dihapus.');
									else if (result.type === 'failure') toast.error(String((result.data as any)?.error || 'Gagal menghapus rekening.'));
								};
							}}
						>
							<input type="hidden" name="id" value={acc.id} />
							<button
								type="submit"
								class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
								title="Hapus Rekening"
							>
								<Trash2 class="w-4 h-4" />
							</button>
						</form>
					</div>
				</div>
			</div>
		{/each}
	</div>

</div>

<!-- MODAL: LIHAT DETAIL REKENING -->
{#if accountToDetail}
	<div 
		class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
		role="dialog"
		aria-modal="true"
	>
		<div class="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
			<div class="flex items-center justify-between pb-3 border-b border-slate-100">
				<div class="flex items-center gap-2.5">
					<div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
						<Eye class="w-4 h-4" />
					</div>
					<div>
						<h3 class="text-sm font-bold text-slate-900">Detail Rekening Kas / Bank</h3>
						<p class="text-[11px] text-slate-500 font-mono">Kode: {accountToDetail.kode}</p>
					</div>
				</div>
				<button 
					type="button" 
					onclick={() => accountToDetail = null}
					class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
				>
					<X class="w-4 h-4" />
				</button>
			</div>

			<div class="space-y-3 text-xs">
				<div class="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-slate-400 text-[11px]">Tipe Rekening:</span>
						<span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase {accountToDetail.tipe === 'POOLING' ? 'bg-purple-100 text-purple-800' : accountToDetail.tipe === 'BANK' ? 'bg-blue-100 text-blue-800' : 'bg-teal-100 text-teal-800'}">
							{accountToDetail.tipe}
						</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-slate-400 text-[11px]">Nama Akun:</span>
						<span class="font-bold text-slate-900">{accountToDetail.nama}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-slate-400 text-[11px]">Nama Bank / Institusi:</span>
						<span class="font-bold text-slate-800">{accountToDetail.bankNama || '-'}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-slate-400 text-[11px]">Nomor Rekening:</span>
						<span class="font-mono font-bold text-slate-900">{accountToDetail.noRekening || 'Kas Tunai Lapangan'}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-slate-400 text-[11px]">Atas Nama Rekening:</span>
						<span class="font-semibold text-slate-800">{accountToDetail.atasNama || '-'}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-slate-400 text-[11px]">Saldo Awal Pembukuan:</span>
						<span class="font-mono font-bold text-emerald-700">{formatRupiah(accountToDetail.saldoAwal)}</span>
					</div>
				</div>

				<div class="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50">
					<span class="text-slate-500 text-[11px]">Status Operasional:</span>
					<span class="inline-flex items-center gap-1 font-bold text-emerald-700 text-xs">
						<CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" />
						Aktif Digunakan Sistem
					</span>
				</div>
			</div>

			<div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
				<button 
					type="button" 
					onclick={() => {
						accountToEdit = { ...accountToDetail };
						accountToDetail = null;
					}}
					class="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
				>
					<Pencil class="w-3.5 h-3.5" />
					<span>Edit Rekening Ini</span>
				</button>
				<button 
					type="button" 
					onclick={() => accountToDetail = null}
					class="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
				>
					Tutup
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- MODAL: TAMBAH MASTER REKENING -->
{#if showAddModal}
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
					onclick={() => showAddModal = false}
					class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
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
							showAddModal = false;
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
						<label for="kode" class="text-xs font-semibold text-slate-700">Kode Akun</label>
						<input id="kode" name="kode" required type="text" placeholder="BANK_MANDIRI" class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-mono uppercase" />
					</div>
					<div class="space-y-1">
						<label for="tipe" class="text-xs font-semibold text-slate-700">Tipe Rekening</label>
						<select id="tipe" name="tipe" class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-semibold bg-white">
							<option value="BANK">Bank Operasional</option>
							<option value="POOLING">Holding Cash Pooling</option>
							<option value="KAS_KECIL">Kas Kecil Lapangan (CIH)</option>
						</select>
					</div>
				</div>

				<div class="space-y-1">
					<label for="accNama" class="text-xs font-semibold text-slate-700">Nama Rekening / Akun</label>
					<input id="accNama" name="nama" required type="text" placeholder="Contoh: Rekening Mandiri Operasional" class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900" />
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div class="space-y-1">
						<label for="accBank" class="text-xs font-semibold text-slate-700">Nama Bank / Institusi</label>
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

				<div class="space-y-1">
					<label for="saldoAwal" class="text-xs font-semibold text-slate-700">Saldo Awal (Opsional)</label>
					<input id="saldoAwal" name="saldoAwal" type="number" value="0" class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-mono" />
				</div>

				<div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
					<button 
						type="button" 
						onclick={() => showAddModal = false}
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

<!-- MODAL: EDIT MASTER REKENING -->
{#if accountToEdit}
	<div 
		class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
		role="dialog"
		aria-modal="true"
	>
		<div class="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
			<div class="flex items-center justify-between pb-3 border-b border-slate-100">
				<div class="flex items-center gap-2.5">
					<div class="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
						<Pencil class="w-4 h-4 text-white" />
					</div>
					<div>
						<h3 class="text-sm font-bold text-slate-900">Edit Data Rekening Kas</h3>
						<p class="text-[11px] text-slate-500 font-mono">Kode: {accountToEdit.kode}</p>
					</div>
				</div>
				<button 
					type="button" 
					onclick={() => accountToEdit = null}
					class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
				>
					<X class="w-4 h-4" />
				</button>
			</div>

			<form
				method="POST"
				action="?/editMasterAccount"
				use:enhance={() => {
					return async ({ update, result }) => {
						await update();
						if (result.type === 'success') {
							accountToEdit = null;
							toast.success('Rekening berhasil diperbarui!');
						} else if (result.type === 'failure') {
							toast.error(String((result.data as any)?.error || 'Gagal mengubah rekening.'));
						}
					};
				}}
				class="space-y-3.5"
			>
				<input type="hidden" name="id" value={accountToEdit.id} />

				<div class="grid grid-cols-2 gap-3">
					<div class="space-y-1">
						<label for="edit_kode" class="text-xs font-semibold text-slate-700">Kode Akun</label>
						<input id="edit_kode" name="kode" required type="text" bind:value={accountToEdit.kode} class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-mono uppercase" />
					</div>
					<div class="space-y-1">
						<label for="edit_tipe" class="text-xs font-semibold text-slate-700">Tipe Rekening</label>
						<select id="edit_tipe" name="tipe" bind:value={accountToEdit.tipe} class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-semibold bg-white">
							<option value="BANK">Bank Operasional</option>
							<option value="POOLING">Holding Cash Pooling</option>
							<option value="KAS_KECIL">Kas Kecil Lapangan (CIH)</option>
						</select>
					</div>
				</div>

				<div class="space-y-1">
					<label for="edit_accNama" class="text-xs font-semibold text-slate-700">Nama Rekening / Akun</label>
					<input id="edit_accNama" name="nama" required type="text" bind:value={accountToEdit.nama} class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900" />
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div class="space-y-1">
						<label for="edit_accBank" class="text-xs font-semibold text-slate-700">Nama Bank / Institusi</label>
						<input id="edit_accBank" name="bankNama" type="text" bind:value={accountToEdit.bankNama} class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900" />
					</div>
					<div class="space-y-1">
						<label for="edit_noRekening" class="text-xs font-semibold text-slate-700">No. Rekening</label>
						<input id="edit_noRekening" name="noRekening" type="text" bind:value={accountToEdit.noRekening} class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-mono" />
					</div>
				</div>

				<div class="space-y-1">
					<label for="edit_atasNama" class="text-xs font-semibold text-slate-700">Atas Nama Rekening</label>
					<input id="edit_atasNama" name="atasNama" type="text" bind:value={accountToEdit.atasNama} class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900" />
				</div>

				<div class="space-y-1">
					<label for="edit_saldoAwal" class="text-xs font-semibold text-slate-700">Saldo Awal</label>
					<input id="edit_saldoAwal" name="saldoAwal" type="number" bind:value={accountToEdit.saldoAwal} class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-mono" />
				</div>

				<div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
					<button 
						type="button" 
						onclick={() => accountToEdit = null}
						class="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
					>
						Batal
					</button>
					<button 
						type="submit" 
						class="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
					>
						Simpan Perubahan
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
