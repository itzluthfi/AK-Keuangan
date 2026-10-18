<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		Building2,
		Layers,
		Search,
		ChevronRight,
		CheckCircle2,
		Clock,
		MapPin,
		Eye,
		Plus,
		Pencil,
		Trash2,
		X,
		AlertTriangle,
		LayoutGrid,
		Table as TableIcon,
		Calendar
	} from 'lucide-svelte';
	import { toast } from 'svelte-french-toast';

	let { data } = $props();

	let searchQuery = $state('');
	let statusFilter = $state('ALL');
	let categoryFilter = $state('ALL');
	let viewMode = $state<'GRID' | 'TABLE'>('GRID');

	// Modals State
	let showAddModal = $state(false);
	let projectToEdit = $state<any>(null);
	let projectToDelete = $state<any>(null);
	let isSubmitting = $state(false);

	function formatRupiah(num: number) {
		return 'Rp ' + Math.round(num).toLocaleString('id-ID');
	}

	function formatPersen(num: number) {
		return Math.round(num) + '%';
	}

	let filteredProjects = $derived(
		data.projects.filter(p => {
			const matchText = p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(p.lokasi || '').toLowerCase().includes(searchQuery.toLowerCase());
			if (!matchText) return false;
			if (statusFilter === 'SELESAI' && p.progresFisikPct < 100) return false;
			if (statusFilter === 'ON_PROGRESS' && (p.progresFisikPct <= 0 || p.progresFisikPct >= 100)) return false;
			if (categoryFilter !== 'ALL' && p.kategoriPekerjaan !== categoryFilter) return false;
			return true;
		})
	);
</script>

<svelte:head>
	<title>Portofolio Proyek & Master Kontrak - Pantau Keuangan</title>
</svelte:head>

<div class="space-y-6">

	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200/80">
		<div>
			<h1 class="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
				Master Portofolio Proyek
			</h1>
			<p class="text-xs text-slate-500 mt-0.5">
				Kelola seluruh data kontrak fisik, addendum SPK, sub-ledger termin, dan status operasional
			</p>
		</div>

		<!-- Action & Stats -->
		<div class="flex flex-wrap items-center gap-2">
			<div class="hidden sm:flex items-center gap-2">
				<div class="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs">
					<span class="text-slate-500">Total:</span>
					<span class="font-bold text-slate-900 ml-1 tabular-nums">{data.totalTitik} Proyek</span>
				</div>
				<div class="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs">
					<span class="text-slate-500">Selesai:</span>
					<span class="font-bold text-slate-900 ml-1 tabular-nums">{data.selesaiCount}</span>
				</div>
			</div>

			<button
				type="button"
				onclick={() => showAddModal = true}
				class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
			>
				<Plus class="w-4 h-4" />
				<span>Tambah Proyek Baru</span>
			</button>
		</div>
	</div>

	<!-- Filter & Search Toolbar -->
	<div class="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-2xs">
		<div class="relative w-full md:w-80">
			<Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
			<input
				type="text"
				placeholder="Cari nama proyek, kode SPK, lokasi..."
				bind:value={searchQuery}
				class="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
			/>
		</div>

		<div class="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
			<select
				bind:value={categoryFilter}
				class="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none cursor-pointer"
			>
				<option value="ALL">Semua Kategori</option>
				<option value="Pelaksanaan & Konstruksi">Pelaksanaan & Konstruksi</option>
				<option value="Jasa Desain Arsitektur">Jasa Desain Arsitektur</option>
			</select>

			<select
				bind:value={statusFilter}
				class="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none cursor-pointer"
			>
				<option value="ALL">Semua Status Fisik ({data.projects.length})</option>
				<option value="SELESAI">Fisik 100% Selesai ({data.selesaiCount})</option>
				<option value="ON_PROGRESS">Dalam Konstruksi ({data.onProgressCount})</option>
			</select>

			<!-- Toggle View Mode -->
			<div class="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
				<button
					type="button"
					onclick={() => viewMode = 'GRID'}
					class="p-1.5 rounded-md transition-colors {viewMode === 'GRID' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-400 hover:text-slate-700'}"
					title="Tampilan Grid Kartu"
				>
					<LayoutGrid class="w-4 h-4" />
				</button>
				<button
					type="button"
					onclick={() => viewMode = 'TABLE'}
					class="p-1.5 rounded-md transition-colors {viewMode === 'TABLE' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-400 hover:text-slate-700'}"
					title="Tampilan Tabel Komparasi"
				>
					<TableIcon class="w-4 h-4" />
				</button>
			</div>
		</div>
	</div>

	<!-- VIEW MODE 1: GRID KARTU (Visual Rich View) -->
	{#if viewMode === 'GRID'}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
			{#each filteredProjects as p (p.id)}
				<div class="bg-white rounded-xl border border-slate-200 p-4.5 hover:border-slate-300 transition-all shadow-2xs flex flex-col justify-between group">
					<div>
						<!-- Top Row: Kode & Action Dropdown -->
						<div class="flex items-start justify-between gap-2 mb-1.5">
							<div>
								<div class="flex items-center gap-1.5">
									<span class="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{p.kode}</span>
									<span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">{p.kategoriPekerjaan}</span>
								</div>
								<h2 class="text-sm font-bold text-slate-900 mt-0.5 line-clamp-1">{p.nama}</h2>
							</div>

							<div class="flex items-center gap-1">
								<span class="px-2 py-0.5 rounded text-[10px] font-bold {p.progresFisikPct === 100 ? 'bg-slate-100 text-slate-800' : 'bg-blue-50 text-blue-700'} border border-slate-200/80">
									{p.progresFisikPct}%
								</span>

								<!-- Quick Actions -->
								<button
									type="button"
									onclick={() => projectToEdit = { ...p }}
									class="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
									title="Edit Data Proyek"
								>
									<Pencil class="w-3.5 h-3.5" />
								</button>
								<button
									type="button"
									onclick={() => projectToDelete = { ...p }}
									class="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
									title="Hapus / Arsipkan Proyek"
								>
									<Trash2 class="w-3.5 h-3.5" />
								</button>
							</div>
						</div>

						<div class="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
							<MapPin class="w-3.5 h-3.5 shrink-0 text-slate-400" />
							<span class="truncate">{p.lokasi}</span>
						</div>

						<!-- Progress Bar -->
						<div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3.5">
							<div class="bg-slate-800 h-full rounded-full transition-all" style="width: {p.progresFisikPct}%"></div>
						</div>

						<!-- 4 Key Numbers Grid -->
						<div class="grid grid-cols-2 gap-2 text-xs pt-2.5 border-t border-slate-100">
							<div>
								<div class="text-[10px] text-slate-400 font-medium">Nilai Kontrak (SPK)</div>
								<div class="font-bold text-slate-900 mt-0.5 tabular-nums">{formatRupiah(p.rabKontrak)}</div>
							</div>
							<div>
								<div class="text-[10px] text-slate-400 font-medium">Termin Cair ({Math.round(p.terminPct)}%)</div>
								<div class="font-bold text-slate-900 mt-0.5 tabular-nums">{formatRupiah(p.terminMasuk)}</div>
							</div>
							<div>
								<div class="text-[10px] text-slate-400 font-medium">Laba Proyek</div>
								<div class="font-bold text-emerald-700 mt-0.5 tabular-nums">
									{formatRupiah(p.labaProyek)}
									<span class="text-[10px] font-semibold text-emerald-600">({Math.round(p.labaPct)}%)</span>
								</div>
							</div>
							<div>
								<div class="text-[10px] text-slate-400 font-medium">Arus Kas Saat Ini</div>
								{#if p.arusKas >= 0}
									<div class="font-bold text-slate-800 mt-0.5 tabular-nums">
										+{formatRupiah(p.arusKas)}
										<span class="text-[10px] font-normal text-slate-500">(Surplus)</span>
									</div>
								{:else}
									<div class="font-bold text-amber-700 mt-0.5 tabular-nums" title="Dana talangan sementara. Sisa termin: {formatRupiah(p.sisaTermin)}">
										-{formatRupiah(Math.abs(p.arusKas))}
										<span class="text-[10px] font-semibold text-amber-600">(Talangan)</span>
									</div>
								{/if}
							</div>
						</div>
					</div>

					<!-- Action Footer -->
					<div class="pt-3 mt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
						<div class="text-[11px] text-slate-500 font-medium">
							{#if p.sisaTermin > 0}
								Sisa Tagihan: <span class="font-bold text-slate-700 tabular-nums">{formatRupiah(p.sisaTermin)}</span>
							{:else}
								<span class="text-emerald-700 font-bold flex items-center gap-1">
									<CheckCircle2 class="w-3.5 h-3.5" />
									Termin Lunas
								</span>
							{/if}
						</div>
						<a
							href="/proyek/{p.hashId}"
							class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
						>
							<Eye class="w-3.5 h-3.5 text-slate-600" />
							<span>Buka Ledger</span>
							<ChevronRight class="w-3.5 h-3.5 text-slate-400" />
						</a>
					</div>
				</div>
			{/each}
		</div>

	<!-- VIEW MODE 2: TABLE RESPONSIVE VIEW (Desktop Table + Mobile Cards) -->
	{:else}
		<!-- Desktop View (Tabel Lengkap) -->
		<div class="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
			<table class="w-full text-left text-xs border-collapse">
				<thead class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px]">
					<tr>
						<th class="py-3 px-3 text-center w-10">NO</th>
						<th class="py-3 px-3">KODE & NAMA PROYEK</th>
						<th class="py-3 px-3 text-center">STATUS & FISIK</th>
						<th class="py-3 px-3 text-right">KONTRAK SPK</th>
						<th class="py-3 px-3 text-right">TERMIN MASUK</th>
						<th class="py-3 px-3 text-right">LABA PROYEK</th>
						<th class="py-3 px-3 text-right">ARUS KAS</th>
						<th class="py-3 px-3 text-right">SISA PIUTANG</th>
						<th class="py-3 px-3 text-center w-28">AKSI</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100 font-medium">
					{#each filteredProjects as p, idx (p.id)}
						<tr class="hover:bg-slate-50/70 transition-colors">
							<td class="py-3 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
							<td class="py-3 px-3">
								<div class="font-bold text-slate-900">{p.nama}</div>
								<div class="text-[10px] text-slate-500 font-mono mt-0.5">{p.kode} &bull; {p.lokasi}</div>
							</td>
							<td class="py-3 px-3 text-center">
								<span class="px-2 py-0.5 rounded text-[10px] font-bold {p.progresFisikPct === 100 ? 'bg-slate-100 text-slate-800' : 'bg-blue-50 text-blue-700'}">
									{p.progresFisikPct}%
								</span>
							</td>
							<td class="py-3 px-3 text-right font-bold text-slate-900 tabular-nums">{formatRupiah(p.rabKontrak)}</td>
							<td class="py-3 px-3 text-right text-slate-800 tabular-nums">{formatRupiah(p.terminMasuk)}</td>
							<td class="py-3 px-3 text-right tabular-nums font-bold text-emerald-700">
								{formatRupiah(p.labaProyek)}
								<span class="text-[10px] font-normal text-emerald-600 block">+{Math.round(p.labaPct)}%</span>
							</td>
							<td class="py-3 px-3 text-right tabular-nums font-bold {p.arusKas >= 0 ? 'text-slate-800' : 'text-amber-700'}">
								{p.arusKas >= 0 ? '+' : ''}{formatRupiah(p.arusKas)}
								<span class="text-[10px] font-normal text-slate-500 block">{p.arusKas >= 0 ? 'Surplus' : 'Talangan'}</span>
							</td>
							<td class="py-3 px-3 text-right text-slate-600 tabular-nums">{formatRupiah(p.sisaTermin)}</td>
							<td class="py-3 px-3 text-center">
								<div class="flex items-center justify-center gap-1">
									<a
										href="/proyek/{p.hashId}"
										class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
										title="Buka Sub-Ledger"
									>
										<Eye class="w-4 h-4" />
									</a>
									<button
										type="button"
										onclick={() => projectToEdit = { ...p }}
										class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
										title="Edit Proyek"
									>
										<Pencil class="w-4 h-4" />
									</button>
									<button
										type="button"
										onclick={() => projectToDelete = { ...p }}
										class="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
										title="Hapus Proyek"
									>
										<Trash2 class="w-4 h-4" />
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Mobile Table-to-Card Responsive View (Layar HP) -->
		<div class="md:hidden space-y-3">
			{#each filteredProjects as p (p.id)}
				<div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
					<div class="flex items-start justify-between gap-2">
						<div>
							<div class="text-[10px] font-mono text-slate-400 uppercase">{p.kode}</div>
							<div class="font-bold text-slate-900 text-sm">{p.nama}</div>
							<div class="text-[11px] text-slate-500">{p.lokasi}</div>
						</div>
						<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
							{p.progresFisikPct}%
						</span>
					</div>

					<div class="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
						<div>
							<span class="text-[10px] text-slate-400">Kontrak:</span>
							<div class="font-bold text-slate-900">{formatRupiah(p.rabKontrak)}</div>
						</div>
						<div>
							<span class="text-[10px] text-slate-400">Termin Cair:</span>
							<div class="font-bold text-slate-800">{formatRupiah(p.terminMasuk)}</div>
						</div>
						<div>
							<span class="text-[10px] text-slate-400">Laba Proyek:</span>
							<div class="font-bold text-emerald-700">{formatRupiah(p.labaProyek)} ({Math.round(p.labaPct)}%)</div>
						</div>
						<div>
							<span class="text-[10px] text-slate-400">Arus Kas:</span>
							<div class="font-bold {p.arusKas >= 0 ? 'text-slate-800' : 'text-amber-700'}">
								{p.arusKas >= 0 ? '+' : ''}{formatRupiah(p.arusKas)}
							</div>
						</div>
					</div>

					<div class="pt-2.5 border-t border-slate-100 flex items-center justify-between">
						<div class="flex items-center gap-1">
							<button
								type="button"
								onclick={() => projectToEdit = { ...p }}
								class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1"
							>
								<Pencil class="w-3.5 h-3.5" />
								<span>Edit</span>
							</button>
							<button
								type="button"
								onclick={() => projectToDelete = { ...p }}
								class="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1"
							>
								<Trash2 class="w-3.5 h-3.5" />
							</button>
						</div>

						<a
							href="/proyek/{p.hashId}"
							class="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center gap-1"
						>
							<span>Ledger</span>
							<ChevronRight class="w-3.5 h-3.5" />
						</a>
					</div>
				</div>
			{/each}
		</div>
	{/if}

</div>

<!-- ========================================================================= -->
<!-- MODAL 1: TAMBAH PROYEK BARU -->
<!-- ========================================================================= -->
{#if showAddModal}
	<div class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
		<div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between border-b border-slate-100 pb-3">
				<div>
					<h3 class="text-base font-bold text-slate-900">Tambah Proyek Baru</h3>
					<p class="text-xs text-slate-500 mt-0.5">Daftarkan kontrak fisik pekerjaan atau jasa desain baru.</p>
				</div>
				<button
					type="button"
					onclick={() => showAddModal = false}
					class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<form
				method="POST"
				action="?/addProject"
				use:enhance={() => {
					isSubmitting = true;
					const toastId = toast.loading('Mendaftarkan proyek baru...');
					return async ({ result, update }) => {
						isSubmitting = false;
						const resData = (result as any).data;
						if (result.type === 'success' && resData?.success) {
							toast.success(resData?.message || 'Proyek berhasil didaftarkan.', { id: toastId });
							showAddModal = false;
							await update();
						} else {
							const msg = resData?.error || 'Gagal menyimpan proyek.';
							toast.error(msg, { id: toastId });
						}
					};
				}}
				class="space-y-3.5 text-xs"
			>
				<div>
					<label class="block font-semibold text-slate-700 mb-1">Nama Proyek / Pekerjaan *</label>
					<input
						type="text"
						name="nama"
						required
						placeholder="Contoh: Renovasi Gudang Jenny, Desain Rumah RSAL..."
						class="w-full rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
					/>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="block font-semibold text-slate-700 mb-1">Kode Proyek (Opsional)</label>
						<input
							type="text"
							name="kode"
							placeholder="Otomatis jika kosong (cth: GUDANG-JENNY)"
							class="w-full rounded-lg border border-slate-300 p-2.5 bg-white font-mono uppercase focus:ring-1 focus:ring-slate-900"
						/>
					</div>
					<div>
						<label class="block font-semibold text-slate-700 mb-1">Kategori Pekerjaan</label>
						<select
							name="kategori"
							class="w-full rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 focus:ring-1 focus:ring-slate-900"
						>
							<option value="Pelaksanaan Konstruksi">Pelaksanaan Konstruksi</option>
							<option value="Jasa Desain Arsitektur">Jasa Desain Arsitektur</option>
							<option value="Pekerjaan Renovasi & Interior">Pekerjaan Renovasi & Interior</option>
						</select>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="block font-semibold text-slate-700 mb-1">Nilai Kontrak SPK (Rp) *</label>
						<input
							type="text"
							name="rabKontrak"
							required
							placeholder="Contoh: 106955750"
							class="w-full rounded-lg border border-slate-300 p-2.5 bg-white font-mono font-bold focus:ring-1 focus:ring-slate-900"
						/>
					</div>
					<div>
						<label class="block font-semibold text-slate-700 mb-1">Lokasi Proyek</label>
						<input
							type="text"
							name="lokasi"
							placeholder="Contoh: Surabaya, Jawa Timur"
							class="w-full rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-1 focus:ring-slate-900"
						/>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="block font-semibold text-slate-700 mb-1">PIC Pengawas Lapangan</label>
						<input
							type="text"
							name="picPengawas"
							placeholder="Contoh: Kohar / Sodin / Tim Lapangan"
							class="w-full rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-1 focus:ring-slate-900"
						/>
					</div>
					<div>
						<label class="block font-semibold text-slate-700 mb-1">Target Selesai (Opsional)</label>
						<input
							type="date"
							name="targetSelesai"
							class="w-full rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-1 focus:ring-slate-900"
						/>
					</div>
				</div>

				<div>
					<label class="block font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
					<textarea
						name="catatan"
						rows="2"
						placeholder="Nomor SPK, spesifikasi khusus, atau catatan owner..."
						class="w-full rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-1 focus:ring-slate-900"
					></textarea>
				</div>

				<div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
					<button
						type="button"
						onclick={() => showAddModal = false}
						class="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
					>
						Batal
					</button>
					<button
						type="submit"
						disabled={isSubmitting}
						class="px-5 py-2 font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
					>
						{isSubmitting ? 'Menyimpan...' : 'Simpan Proyek Baru'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- ========================================================================= -->
<!-- MODAL 2: EDIT PROYEK -->
<!-- ========================================================================= -->
{#if projectToEdit}
	<div class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
		<div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between border-b border-slate-100 pb-3">
				<div>
					<h3 class="text-base font-bold text-slate-900">Edit Data Proyek</h3>
					<p class="text-xs text-slate-500 mt-0.5">Ubah kontrak SPK, addendum nilai, atau progres fisik.</p>
				</div>
				<button
					type="button"
					onclick={() => projectToEdit = null}
					class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<form
				method="POST"
				action="?/editProject"
				use:enhance={() => {
					isSubmitting = true;
					const toastId = toast.loading('Menyimpan perubahan proyek...');
					return async ({ result, update }) => {
						isSubmitting = false;
						const resData = (result as any).data;
						if (result.type === 'success' && resData?.success) {
							toast.success(resData?.message || 'Perubahan proyek berhasil disimpan.', { id: toastId });
							projectToEdit = null;
							await update();
						} else {
							const msg = resData?.error || 'Gagal menyimpan perubahan.';
							toast.error(msg, { id: toastId });
						}
					};
				}}
				class="space-y-3.5 text-xs"
			>
				<input type="hidden" name="id" value={projectToEdit.id} />

				<div>
					<label class="block font-semibold text-slate-700 mb-1">Nama Proyek / Pekerjaan *</label>
					<input
						type="text"
						name="nama"
						required
						bind:value={projectToEdit.nama}
						class="w-full rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 font-bold focus:ring-1 focus:ring-slate-900"
					/>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="block font-semibold text-slate-700 mb-1">Kode Proyek *</label>
						<input
							type="text"
							name="kode"
							required
							bind:value={projectToEdit.kode}
							class="w-full rounded-lg border border-slate-300 p-2.5 bg-white font-mono uppercase focus:ring-1 focus:ring-slate-900"
						/>
					</div>
					<div>
						<label class="block font-semibold text-slate-700 mb-1">Kategori Pekerjaan</label>
						<select
							name="kategori"
							bind:value={projectToEdit.kategoriPekerjaan}
							class="w-full rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 focus:ring-1 focus:ring-slate-900"
						>
							<option value="Pelaksanaan & Konstruksi">Pelaksanaan & Konstruksi</option>
							<option value="Jasa Desain Arsitektur">Jasa Desain Arsitektur</option>
							<option value="Pekerjaan Renovasi & Interior">Pekerjaan Renovasi & Interior</option>
						</select>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="block font-semibold text-slate-700 mb-1">Nilai Kontrak SPK (Rp) *</label>
						<input
							type="text"
							name="rabKontrak"
							required
							bind:value={projectToEdit.rabKontrak}
							class="w-full rounded-lg border border-slate-300 p-2.5 bg-white font-mono font-bold focus:ring-1 focus:ring-slate-900"
						/>
					</div>
					<div>
						<label class="block font-semibold text-slate-700 mb-1">Status Proyek</label>
						<select
							name="status"
							bind:value={projectToEdit.status}
							class="w-full rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 focus:ring-1 focus:ring-slate-900"
						>
							<option value="BERJALAN">BERJALAN (Sedang Berjalan)</option>
							<option value="SELESAI">SELESAI (100% Selesai)</option>
							<option value="PERENCANAAN">PERENCANAAN (Tahap Awal)</option>
							<option value="RETENSI">RETENSI (Masa Pemeliharaan)</option>
						</select>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="block font-semibold text-slate-700 mb-1">Progres Fisik Lapangan (%)</label>
						<input
							type="number"
							name="progresFisikPct"
							min="0"
							max="100"
							bind:value={projectToEdit.progresFisikPct}
							class="w-full rounded-lg border border-slate-300 p-2.5 bg-white font-mono font-bold focus:ring-1 focus:ring-slate-900"
						/>
					</div>
					<div>
						<label class="block font-semibold text-slate-700 mb-1">Lokasi Proyek</label>
						<input
							type="text"
							name="lokasi"
							bind:value={projectToEdit.lokasi}
							class="w-full rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-1 focus:ring-slate-900"
						/>
					</div>
				</div>

				<div>
					<label class="block font-semibold text-slate-700 mb-1">PIC Pengawas Lapangan</label>
					<input
						type="text"
						name="picPengawas"
						bind:value={projectToEdit.picPengawas}
						class="w-full rounded-lg border border-slate-300 p-2.5 bg-white focus:ring-1 focus:ring-slate-900"
					/>
				</div>

				<div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
					<button
						type="button"
						onclick={() => projectToEdit = null}
						class="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
					>
						Batal
					</button>
					<button
						type="submit"
						disabled={isSubmitting}
						class="px-5 py-2 font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
					>
						{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- ========================================================================= -->
<!-- MODAL 3: KONFIRMASI HAPUS / ARSIP PROYEK -->
<!-- ========================================================================= -->
{#if projectToDelete}
	<div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
		<div class="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
					<AlertTriangle class="w-5 h-5 text-rose-600" />
				</div>
				<div>
					<h3 class="text-sm font-bold text-slate-900">Hapus / Arsipkan Proyek?</h3>
					<p class="text-xs text-slate-500 mt-0.5">Tindakan ini akan memengaruhi buku besar proyek terkait.</p>
				</div>
			</div>

			<div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
				<div class="font-bold text-slate-900">{projectToDelete.nama}</div>
				<div class="text-slate-600 font-mono text-[11px]">{projectToDelete.kode} &bull; SPK: {formatRupiah(projectToDelete.rabKontrak)}</div>
				<div class="text-slate-500 text-[11px] mt-1">
					Jika proyek ini memiliki riwayat termin atau kasbon aktif, sistem akan mengalihkannya ke status <strong>ARSIP</strong> agar ledger tetap seimbang.
				</div>
			</div>

			<form
				method="POST"
				action="?/deleteProject"
				use:enhance={() => {
					isSubmitting = true;
					const toastId = toast.loading('Memproses penghapusan...');
					return async ({ result, update }) => {
						isSubmitting = false;
						const resData = (result as any).data;
						if (result.type === 'success' && resData?.success) {
							toast.success(resData?.message || 'Proyek berhasil diproses.', { id: toastId });
							projectToDelete = null;
							await update();
						} else {
							const msg = resData?.error || 'Gagal menghapus proyek.';
							toast.error(msg, { id: toastId });
						}
					};
				}}
				class="space-y-3"
			>
				<input type="hidden" name="id" value={projectToDelete.id} />

				<label class="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
					<input type="checkbox" name="forceDelete" value="true" class="rounded border-slate-300 text-rose-600 focus:ring-0" />
					<span>Paksa Hapus Permanen (Termasuk riwayat termin & subkon)</span>
				</label>

				<div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
					<button
						type="button"
						onclick={() => projectToDelete = null}
						class="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
					>
						Batal
					</button>
					<button
						type="submit"
						disabled={isSubmitting}
						class="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
					>
						{isSubmitting ? 'Memproses...' : 'Ya, Hapus / Arsipkan'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
