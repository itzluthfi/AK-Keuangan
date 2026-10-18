<script lang="ts">
	import {
		HardHat,
		Search,
		AlertTriangle,
		CheckCircle2,
		Eye,
		Trash2,
		ArrowUpDown,
		ArrowUp,
		ArrowDown,
		CheckSquare,
		X
	} from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	let searchQuery = $state('');
	let sortCol = $state<'namaVendor' | 'namaProyek' | 'rapNilai' | 'totalTerbayar' | 'sisaHutang'>('rapNilai');
	let sortDir = $state<'asc' | 'desc'>('desc');
	let selectedVendorIds = $state<Set<number>>(new Set());

	// Modal Delete Confirmation
	let vendorToDelete = $state<any>(null);

	function formatRupiah(num: number) {
		return 'Rp ' + Math.round(num).toLocaleString('id-ID');
	}

	function toggleSort(col: 'namaVendor' | 'namaProyek' | 'rapNilai' | 'totalTerbayar' | 'sisaHutang') {
		if (sortCol === col) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortCol = col;
			sortDir = 'desc';
		}
	}

	function toggleSelect(id: number) {
		const next = new Set(selectedVendorIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selectedVendorIds = next;
	}

	function toggleSelectAll() {
		if (filteredVendors.length === 0) return;
		const allSelected = filteredVendors.every(v => selectedVendorIds.has(v.id));
		const next = new Set(selectedVendorIds);
		if (allSelected) {
			filteredVendors.forEach(v => next.delete(v.id));
		} else {
			filteredVendors.forEach(v => next.add(v.id));
		}
		selectedVendorIds = next;
	}

	function clearSelection() {
		selectedVendorIds = new Set();
	}

	let filteredVendors = $derived.by(() => {
		let list = data.vendors.filter(v =>
			v.namaVendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
			v.namaProyek.toLowerCase().includes(searchQuery.toLowerCase()) ||
			v.bidang.toLowerCase().includes(searchQuery.toLowerCase())
		);

		return [...list].sort((a, b) => {
			if (sortCol === 'namaVendor') {
				return sortDir === 'asc' ? a.namaVendor.localeCompare(b.namaVendor) : b.namaVendor.localeCompare(a.namaVendor);
			} else if (sortCol === 'namaProyek') {
				return sortDir === 'asc' ? a.namaProyek.localeCompare(b.namaProyek) : b.namaProyek.localeCompare(a.namaProyek);
			} else if (sortCol === 'rapNilai') {
				return sortDir === 'asc' ? a.rapNilai - b.rapNilai : b.rapNilai - a.rapNilai;
			} else if (sortCol === 'totalTerbayar') {
				return sortDir === 'asc' ? a.totalTerbayar - b.totalTerbayar : b.totalTerbayar - a.totalTerbayar;
			} else {
				return sortDir === 'asc' ? a.sisaHutang - b.sisaHutang : b.sisaHutang - a.sisaHutang;
			}
		});
	});
</script>

<svelte:head>
	<title>Subkon & Mandor - Pantau MBG</title>
</svelte:head>

<div class="space-y-6">

	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200/60">
		<div>
			<h1 class="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
				Subkon & Mandor
			</h1>
			<p class="text-xs text-slate-500 mt-0.5">
				Pengawasan kontrak RAP, kasbon cair, dan sisa kewajiban mandor
			</p>
		</div>
	</div>

	<!-- 3 KPI Cards (Clean SvelteForge Style) -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
		<div class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:border-slate-300 transition-all">
			<div class="text-xs sm:text-sm font-semibold text-slate-700">Total Komitmen RAP Subkon</div>
			<div class="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2 tabular-nums">{formatRupiah(data.kpi.totalKewajibanRap)}</div>
		</div>
		<div class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:border-slate-300 transition-all">
			<div class="text-xs sm:text-sm font-semibold text-slate-700">Realisasi Kasbon Cair</div>
			<div class="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2 tabular-nums">{formatRupiah(data.kpi.totalSudahDibayar)}</div>
		</div>
		<div class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:border-slate-300 transition-all">
			<div class="text-xs sm:text-sm font-semibold text-slate-700">Sisa Kewajiban Hutang</div>
			<div class="text-xl sm:text-2xl font-extrabold text-rose-700 mt-2 tabular-nums">{formatRupiah(data.kpi.totalSisaHutang)}</div>
		</div>
	</div>

	<!-- Search Toolbar & Filter -->
	<div class="bg-white rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
		<div class="relative w-full sm:w-80">
			<Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
			<input
				type="text"
				placeholder="Cari nama subkon / mandor / proyek..."
				bind:value={searchQuery}
				class="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900"
			/>
		</div>
		<div class="text-xs text-slate-500 font-medium">
			Menampilkan <strong class="text-slate-900 tabular-nums">{filteredVendors.length}</strong> data subkon
		</div>
	</div>

	<!-- Floating Bulk Action Toolbar (Light Mode Elegan dengan Tombol Batal Merah) -->
	{#if selectedVendorIds.size > 0}
		<div class="bg-white border-2 border-slate-300/80 text-slate-900 px-4 py-2.5 rounded-xl shadow-xl flex items-center justify-between text-xs animate-in slide-in-from-top-2">
			<div class="flex items-center gap-2.5">
				<span class="font-bold bg-slate-100 text-slate-800 border border-slate-300 px-2.5 py-1 rounded-lg tabular-nums flex items-center gap-1.5">
					<CheckSquare class="w-3.5 h-3.5 text-slate-600" />
					{selectedVendorIds.size} subkon terpilih
				</span>
				<span class="text-slate-600 font-medium hidden sm:inline">Pilih aksi untuk rekap RAP:</span>
			</div>
			<div class="flex items-center gap-2">
				<button 
					type="button"
					onclick={() => toast.info(`${selectedVendorIds.size} subkon dipilih.`)}
					class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors cursor-pointer"
				>
					Export Terpilih
				</button>
				<button 
					type="button"
					onclick={clearSelection}
					class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1"
				>
					<X class="w-3.5 h-3.5" />
					<span>Batal Pilih</span>
				</button>
			</div>
		</div>
	{/if}

	<!-- Subkon Data Table (Sorting & Selectable) -->
	<div class="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
		<div class="overflow-x-auto">
			<table class="w-full text-left text-xs border-collapse">
				<thead class="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
					<tr>
						<!-- Checkbox Select All -->
						<th class="py-3 px-3 text-center w-10">
							<input 
								type="checkbox" 
								checked={filteredVendors.length > 0 && filteredVendors.every(v => selectedVendorIds.has(v.id))}
								onchange={toggleSelectAll}
								class="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 accent-slate-900 cursor-pointer"
								title="Pilih Semua"
							/>
						</th>
						<th class="py-3 px-2 text-center w-10">NO</th>
						<th class="py-3 px-3 min-w-[170px]">
							<button type="button" onclick={() => toggleSort('namaVendor')} class="flex items-center gap-1 hover:text-slate-900 group cursor-pointer font-bold">
								<span class={sortCol === 'namaVendor' ? 'text-slate-900 font-black' : ''}>SUBKON / MANDOR</span>
								{#if sortCol === 'namaVendor'}
									{#if sortDir === 'asc'}
										<ArrowUp class="w-3.5 h-3.5 text-slate-900" />
									{:else}
										<ArrowDown class="w-3.5 h-3.5 text-slate-900" />
									{/if}
								{:else}
									<ArrowUpDown class="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100" />
								{/if}
							</button>
						</th>
						<th class="py-3 px-3 min-w-[160px]">
							<button type="button" onclick={() => toggleSort('namaProyek')} class="flex items-center gap-1 hover:text-slate-900 group cursor-pointer font-bold">
								<span class={sortCol === 'namaProyek' ? 'text-slate-900 font-black' : ''}>TITIK PROYEK SPPG</span>
								{#if sortCol === 'namaProyek'}
									{#if sortDir === 'asc'}
										<ArrowUp class="w-3.5 h-3.5 text-slate-900" />
									{:else}
										<ArrowDown class="w-3.5 h-3.5 text-slate-900" />
									{/if}
								{:else}
									<ArrowUpDown class="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100" />
								{/if}
							</button>
						</th>
						<th class="py-3 px-3 text-right min-w-[120px]">
							<button type="button" onclick={() => toggleSort('rapNilai')} class="flex items-center gap-1 ml-auto hover:text-slate-900 group cursor-pointer font-bold">
								<span class={sortCol === 'rapNilai' ? 'text-slate-900 font-black' : ''}>KONTRAK RAP</span>
								{#if sortCol === 'rapNilai'}
									{#if sortDir === 'asc'}
										<ArrowUp class="w-3.5 h-3.5 text-slate-900" />
									{:else}
										<ArrowDown class="w-3.5 h-3.5 text-slate-900" />
									{/if}
								{:else}
									<ArrowUpDown class="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100" />
								{/if}
							</button>
						</th>
						<th class="py-3 px-3 text-right min-w-[120px]">
							<button type="button" onclick={() => toggleSort('totalTerbayar')} class="flex items-center gap-1 ml-auto hover:text-slate-900 group cursor-pointer font-bold">
								<span class={sortCol === 'totalTerbayar' ? 'text-slate-900 font-black' : ''}>REALISASI KASBON</span>
								{#if sortCol === 'totalTerbayar'}
									{#if sortDir === 'asc'}
										<ArrowUp class="w-3.5 h-3.5 text-slate-900" />
									{:else}
										<ArrowDown class="w-3.5 h-3.5 text-slate-900" />
									{/if}
								{:else}
									<ArrowUpDown class="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100" />
								{/if}
							</button>
						</th>
						<th class="py-3 px-3 text-center min-w-[120px]">STATUS KASBON</th>
						<th class="py-3 px-3 text-right min-w-[120px]">
							<button type="button" onclick={() => toggleSort('sisaHutang')} class="flex items-center gap-1 ml-auto hover:text-slate-900 group cursor-pointer font-bold">
								<span class={sortCol === 'sisaHutang' ? 'text-slate-900 font-black' : ''}>SISA HUTANG</span>
								{#if sortCol === 'sisaHutang'}
									{#if sortDir === 'asc'}
										<ArrowUp class="w-3.5 h-3.5 text-slate-900" />
									{:else}
										<ArrowDown class="w-3.5 h-3.5 text-slate-900" />
									{/if}
								{:else}
									<ArrowUpDown class="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100" />
								{/if}
							</button>
						</th>
						<th class="py-3 px-3 text-center w-24">AKSI</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100 font-medium">
					{#each filteredVendors as v, idx (v.id)}
						{@const isSelected = selectedVendorIds.has(v.id)}
						<tr class="hover:bg-slate-50/80 transition-colors {isSelected ? 'bg-slate-50/90' : ''}">
							<!-- Checkbox Row -->
							<td class="py-3 px-3 text-center">
								<input 
									type="checkbox"
									checked={isSelected}
									onchange={() => toggleSelect(v.id)}
									class="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 accent-slate-900 cursor-pointer"
								/>
							</td>

							<td class="py-3 px-2 text-center text-slate-400 font-bold tabular-nums">{idx + 1}</td>
							<td class="py-3 px-3">
								<div class="font-bold text-slate-900">{v.namaVendor}</div>
								<div class="text-[11px] text-slate-500 font-medium">{v.bidang}</div>
							</td>
							<td class="py-3 px-3">
								<div class="font-bold text-slate-800">{v.namaProyek}</div>
								<div class="text-[10px] text-slate-500">Fisik: {v.progresFisikProyek}%</div>
							</td>
							<td class="py-3 px-3 text-right font-bold text-slate-800 tabular-nums">
								{formatRupiah(v.rapNilai)}
							</td>
							<td class="py-3 px-3 text-right font-extrabold text-slate-900 tabular-nums">
								{formatRupiah(v.totalTerbayar)}
								<div class="text-[10px] text-slate-500 font-medium">{Math.round(v.pctTerbayar)}% RAP</div>
							</td>
							<td class="py-3 px-3 text-center whitespace-nowrap">
								{#if v.isOverprogress}
									<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
										<AlertTriangle class="w-3 h-3 text-amber-600" />
										<span>Kasbon &gt; Fisik</span>
									</span>
								{:else}
									<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
										<CheckCircle2 class="w-3 h-3 text-slate-600" />
										<span>Sesuai Progres</span>
									</span>
								{/if}
							</td>
							<td class="py-3 px-3 text-right font-bold text-rose-700 tabular-nums">
								{formatRupiah(v.sisaHutang)}
							</td>
							<!-- AKSI PER BARIS: EYE WARNA BIRU & TRASH WARNA MERAH -->
							<td class="py-3 px-3 text-center whitespace-nowrap">
								<div class="flex items-center justify-center gap-1">
									{#if v.projectHashId}
										<a
											href="/proyek/{v.projectHashId}"
											class="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 inline-flex transition-colors"
											title="Lihat Detail Ledger Proyek (Detail)"
										>
											<Eye class="w-4 h-4 text-blue-600" />
										</a>
									{/if}
									<button
										type="button"
										onclick={() => vendorToDelete = v}
										class="p-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 inline-flex transition-colors cursor-pointer"
										title="Hapus Subkon"
									>
										<Trash2 class="w-4 h-4 text-rose-600" />
									</button>
								</div>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="9" class="py-12 text-center text-slate-400">
								Tidak ada data subkon atau mandor yang sesuai pencarian.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

</div>

<!-- Modal Konfirmasi Hapus Subkon -->
{#if vendorToDelete}
	<div 
		class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
		onclick={() => vendorToDelete = null}
		role="dialog"
		aria-modal="true"
	>
		<div 
			class="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150"
			onclick={(e) => e.stopPropagation()}
			role="document"
		>
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
					<Trash2 class="w-5 h-5 text-rose-600" />
				</div>
				<div>
					<h3 class="text-sm font-bold text-slate-900">Hapus Subkon / Mandor?</h3>
					<p class="text-xs text-slate-500 mt-0.5">Tindakan ini akan menghapus data subkon dari proyek terkait.</p>
				</div>
			</div>

			<div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
				<div class="font-bold text-slate-900">{vendorToDelete.namaVendor}</div>
				<div class="text-slate-600">{vendorToDelete.namaProyek} &bull; {vendorToDelete.bidang}</div>
				<div class="text-slate-900 font-bold tabular-nums">RAP: {formatRupiah(vendorToDelete.rapNilai)}</div>
			</div>

			<div class="flex items-center justify-end gap-2 pt-2">
				<button 
					type="button" 
					onclick={() => vendorToDelete = null}
					class="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
				>
					Batal
				</button>
				<button 
					type="button" 
					onclick={() => {
						toast.success(`Data ${vendorToDelete.namaVendor} berhasil dihapus.`);
						vendorToDelete = null;
					}}
					class="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
				>
					Ya, Hapus Data
				</button>
			</div>
		</div>
	</div>
{/if}
