<script lang="ts">
	import { formatRupiah, formatTanggal } from '#lib/utils';
	import { enhance } from '$app/forms';
	import {
		Plus,
		ArrowUpRight,
		ArrowDownRight,
		ArrowRightLeft,
		Search,
		Landmark,
		X,
		FileSpreadsheet,
		Receipt,
		Trash2,
		Eye,
		AlertCircle,
		CheckCircle2,
		ChevronLeft,
		ChevronRight,
		SlidersHorizontal,
		Building2,
		ArrowUpDown,
		ArrowUp,
		ArrowDown,
		Paperclip,
		Image,
		Download,
		CheckSquare
	} from 'lucide-svelte';
	import { downloadVoucherPdf } from '#lib/utils/pdf-generator';
	import { toast } from '#lib/hot-toast.svelte';

	let { data, form } = $props();

	// Search & Filters
	let searchQuery = $state('');
	let filterType = $state<'ALL' | 'IN' | 'OUT' | 'TRANSFER'>('ALL');
	let filterProjectId = $state<string>('ALL');

	// Sorting & Selection State
	let sortCol = $state<'tgl' | 'nominal' | 'keterangan'>('tgl');
	let sortDir = $state<'asc' | 'desc'>('desc');
	let selectedTxIds = $state<Set<number>>(new Set());

	// Pagination
	let currentPage = $state(1);
	let pageSize = $state(10);

	// Modal State
	let showModal = $state(false);
	let modalAksi = $state<'IN' | 'OUT' | 'TRANSFER'>('IN');
	let isSubmitting = $state(false);

	// Modal Detail Kuitansi
	let receiptModalTx = $state<any>(null);

	// Delete Confirmation Modal
	let txToDelete = $state<any>(null);
	let isDeleting = $state(false);

	// Form Inputs State for Real-Time Validation & Formatting
	let inputNominal = $state<string>('');
	let inputKeterangan = $state<string>('');
	let inputTgl = $state<string>(new Date().toISOString().split('T')[0]);
	let inputProjectId = $state<string>('NONE');
	let inputPenerimaPic = $state<string>('');
	let inputAkunTujuan = $state<string>('KAS_KECIL_CIH');
	let inputAttachmentPreview = $state<string | null>(null);

	function handleAttachmentChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (event) => {
				inputAttachmentPreview = event.target?.result as string;
			};
			reader.readAsDataURL(file);
		} else {
			inputAttachmentPreview = null;
		}
	}

	function toggleSort(col: 'tgl' | 'nominal' | 'keterangan') {
		if (sortCol === col) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortCol = col;
			sortDir = 'desc';
		}
	}

	function toggleSelect(id: number) {
		const next = new Set(selectedTxIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selectedTxIds = next;
	}

	function toggleSelectAll() {
		if (paginatedTransactions.length === 0) return;
		const allInPageSelected = paginatedTransactions.every(t => selectedTxIds.has(t.id));
		const next = new Set(selectedTxIds);
		if (allInPageSelected) {
			paginatedTransactions.forEach(t => next.delete(t.id));
		} else {
			paginatedTransactions.forEach(t => next.add(t.id));
		}
		selectedTxIds = next;
	}

	function clearSelection() {
		selectedTxIds = new Set();
	}

	// Real-Time Terbilang / Format Rupiah Preview
	let parsedNominal = $derived.by(() => {
		const clean = inputNominal.replace(/[^0-9]/g, '');
		return clean ? parseInt(clean, 10) : 0;
	});

	let previewRupiah = $derived(parsedNominal > 0 ? formatRupiah(parsedNominal) : '');

	function openModal(aksi: 'IN' | 'OUT' | 'TRANSFER') {
		modalAksi = aksi;
		inputNominal = '';
		inputKeterangan = '';
		inputPenerimaPic = aksi === 'IN' ? 'Bpk. Azka (Penyetor)' : '';
		inputAkunTujuan = 'KAS_KECIL_CIH';
		inputAttachmentPreview = null;
		showModal = true;
	}

	// Filtered & Paginated Transactions
	let filteredTransactions = $derived.by(() => {
		let list = data.transactions;

		if (filterType === 'IN') {
			list = list.filter(t => t.tipe === 'IN');
		} else if (filterType === 'OUT') {
			list = list.filter(t => t.tipe === 'OUT');
		} else if (filterType === 'TRANSFER') {
			list = list.filter(t => t.keterangan.includes('[Pindah Kas]') || t.kategori === 'DROP_KAS');
		}

		if (filterProjectId !== 'ALL') {
			const pid = parseInt(filterProjectId);
			list = list.filter(t => t.projectId === pid);
		}

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			list = list.filter(t =>
				t.keterangan.toLowerCase().includes(q) ||
				(t.penerimaPic && t.penerimaPic.toLowerCase().includes(q)) ||
				(t.projectNama && t.projectNama.toLowerCase().includes(q)) ||
				t.nominal.toString().includes(q)
			);
		}

		return [...list].sort((a, b) => {
			if (sortCol === 'tgl') {
				return sortDir === 'asc' ? a.tgl.localeCompare(b.tgl) : b.tgl.localeCompare(a.tgl);
			} else if (sortCol === 'nominal') {
				return sortDir === 'asc' ? a.nominal - b.nominal : b.nominal - a.nominal;
			} else {
				return sortDir === 'asc' ? a.keterangan.localeCompare(b.keterangan) : b.keterangan.localeCompare(a.keterangan);
			}
		});
	});

	let totalPages = $derived(Math.max(1, Math.ceil(filteredTransactions.length / pageSize)));
	let paginatedTransactions = $derived(
		filteredTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize)
	);

	async function handleExportExcel() {
		const loadingId = toast.loading('Menyiapkan rekap Excel mutasi pooling...');
		try {
			const res = await fetch('/api/export/cash-pooling-excel');
			if (!res.ok) throw new Error('Gagal mengunduh Excel');
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `MUTASI_CASH_POOLING_AZKA_${new Date().toISOString().split('T')[0]}.xlsx`;
			a.click();
			URL.revokeObjectURL(url);
			toast.dismiss(loadingId);
			toast.success('Rekap mutasi berhasil diunduh!');
		} catch (e) {
			toast.dismiss(loadingId);
			toast.error('Gagal mengekspor data.');
		}
	}
</script>

<svelte:head>
	<title>Cash Pooling & Rekening Induk - Pantau MBG</title>
</svelte:head>

<div class="space-y-6">

	<!-- Header Page & 3 Action Buttons (Pemasukan, Pengeluaran, Transfer) -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
		<div class="min-w-0">
			<h1 class="text-xl sm:text-2xl font-black tracking-tight text-slate-900 truncate">
				Cash Pooling & Rekening Induk
			</h1>
			<p class="text-xs text-slate-500 mt-0.5 truncate">
				Penampungan modal pimpinan (TF AZKA) & penyaluran dana proyek
			</p>
		</div>

		<!-- 3 Tombol Aksi Transaksi Kas - Sejajar 1 Baris Horizontal -->
		<div class="flex items-center gap-2 flex-nowrap shrink-0">
			<!-- 1. Pemasukan Kas -->
			<button 
				type="button" 
				onclick={() => openModal('IN')}
				class="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
			>
				<Plus class="w-3.5 h-3.5" />
				<span>+ Pemasukan</span>
			</button>

			<!-- 2. Pengeluaran Kas -->
			<button 
				type="button" 
				onclick={() => openModal('OUT')}
				class="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
			>
				<ArrowDownRight class="w-3.5 h-3.5 text-amber-400" />
				<span>Pengeluaran</span>
			</button>

			<!-- 3. Transfer Kas (Pindah Saldo) -->
			<button 
				type="button" 
				onclick={() => openModal('TRANSFER')}
				class="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
			>
				<ArrowRightLeft class="w-3.5 h-3.5 text-slate-700" />
				<span>Transfer Saldo</span>
			</button>
		</div>
	</div>

	<!-- 3 Kartu Metrik Saldo Cash Pooling (Clean SvelteForge Style) -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
		
		<!-- Kartu 1: Saldo Kas Rekening Induk -->
		<div class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
			<div class="flex items-center justify-between">
				<span class="text-xs sm:text-sm font-semibold text-slate-700">Saldo Rekening Induk Pooling</span>
				<Landmark class="w-4 h-4 text-slate-400" />
			</div>
			<div class="my-2.5">
				<div class="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight {data.summary.saldoPooling >= 0 ? 'text-slate-900' : 'text-rose-700'} tabular-nums">
					{formatRupiah(data.summary.saldoPooling)}
				</div>
			</div>
			<div class="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-600">
				<span>Akun:</span>
				<span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200/80">BCA Penampung Azka</span>
			</div>
		</div>

		<!-- Kartu 2: Total Modal Masuk -->
		<div class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
			<div class="flex items-center justify-between">
				<span class="text-xs sm:text-sm font-semibold text-slate-700">Total Pemasukan Kas</span>
				<ArrowUpRight class="w-4 h-4 text-emerald-600" />
			</div>
			<div class="my-2.5">
				<div class="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-emerald-700 tabular-nums">
					{formatRupiah(data.summary.totalInflow)}
				</div>
			</div>
			<div class="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-600">
				<span>Inflow:</span>
				<span class="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">Modal & Termin</span>
			</div>
		</div>

		<!-- Kartu 3: Total Dana Disalurkan / Keluar -->
		<div class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
			<div class="flex items-center justify-between">
				<span class="text-xs sm:text-sm font-semibold text-slate-700">Total Pengeluaran Kas</span>
				<ArrowDownRight class="w-4 h-4 text-amber-500" />
			</div>
			<div class="my-2.5">
				<div class="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums">
					{formatRupiah(data.summary.totalDisbursed)}
				</div>
			</div>
			<div class="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-600">
				<span>Outflow:</span>
				<span class="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60">Vendor & Kasbon</span>
			</div>
		</div>

	</div>

	<!-- Controls & Actions Toolbar (DataTable Filters) -->
	<div class="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
		
		<!-- Search Bar & Filters -->
		<div class="flex flex-wrap items-center gap-2.5 flex-1">
			<!-- Search -->
			<div class="relative w-full sm:w-64">
				<Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
				<input 
					type="text" 
					bind:value={searchQuery}
					oninput={() => currentPage = 1}
					placeholder="Cari transaksi / pihak / nominal..."
					class="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
				/>
				{#if searchQuery}
					<button 
						type="button" 
						onclick={() => searchQuery = ''}
						class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
					>
						<X class="w-3.5 h-3.5" />
					</button>
				{/if}
			</div>

			<!-- Filter Jenis Transaksi -->
			<select 
				bind:value={filterType}
				onchange={() => currentPage = 1}
				class="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-700 font-semibold focus:outline-none"
			>
				<option value="ALL">Semua Jenis Transaksi</option>
				<option value="IN">Hanya Pemasukan Kas (IN)</option>
				<option value="OUT">Hanya Pengeluaran Kas (OUT)</option>
				<option value="TRANSFER">Hanya Transfer (Pindah Kas)</option>
			</select>

			<!-- Filter Proyek SPPG -->
			<select 
				bind:value={filterProjectId}
				onchange={() => currentPage = 1}
				class="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-700 font-semibold focus:outline-none max-w-xs truncate"
			>
				<option value="ALL">Semua Titik Proyek ({data.projects.length})</option>
				{#each data.projects as p}
					<option value={p.id.toString()}>{p.nama}</option>
				{/each}
			</select>
		</div>

		<!-- Action: Ekspor Excel -->
		<div class="flex items-center gap-2">
			<button 
				type="button" 
				onclick={handleExportExcel}
				class="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
			>
				<FileSpreadsheet class="w-4 h-4 text-slate-600" />
				<span>Ekspor Excel Mutasi</span>
			</button>
		</div>

	</div>

	<!-- Bulk Selection Bar (Light Mode Elegan dengan Tombol Batal Merah) -->
	{#if selectedTxIds.size > 0}
		<div class="bg-white border-2 border-emerald-500/30 text-slate-900 px-4 py-2.5 rounded-xl shadow-xl flex items-center justify-between text-xs animate-in slide-in-from-top-2">
			<div class="flex items-center gap-2.5">
				<span class="font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg tabular-nums flex items-center gap-1.5">
					<CheckSquare class="w-3.5 h-3.5" />
					{selectedTxIds.size} transaksi terpilih
				</span>
				<span class="text-slate-600 font-medium hidden sm:inline">Aksi massal pencatatan kas pooling</span>
			</div>
			<div class="flex items-center gap-2">
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

	<!-- TABEL MUTASI CASH POOLING (LENGKAP DENGAN AKSI, SORTING & SELECT) -->
	<div class="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-left text-xs border-collapse">
				<thead class="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider">
					<tr>
						<!-- Checkbox Select All -->
						<th class="py-3 px-3 text-center w-10">
							<input 
								type="checkbox" 
								checked={paginatedTransactions.length > 0 && paginatedTransactions.every(t => selectedTxIds.has(t.id))}
								onchange={toggleSelectAll}
								class="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 accent-slate-900 cursor-pointer"
								title="Pilih Semua di Halaman Ini"
							/>
						</th>
						<th class="py-3 px-2 text-center w-10">NO</th>
						<th class="py-3 px-3 min-w-[110px]">
							<button type="button" onclick={() => toggleSort('tgl')} class="flex items-center gap-1 hover:text-slate-900 group cursor-pointer font-bold">
								<span class={sortCol === 'tgl' ? 'text-slate-900 font-black' : ''}>TANGGAL</span>
								{#if sortCol === 'tgl'}
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
						<th class="py-3 px-3 min-w-[130px]">JENIS TRANSAKSI</th>
						<th class="py-3 px-3 min-w-[220px]">
							<button type="button" onclick={() => toggleSort('keterangan')} class="flex items-center gap-1 hover:text-slate-900 group cursor-pointer font-bold">
								<span class={sortCol === 'keterangan' ? 'text-slate-900 font-black' : ''}>KETERANGAN ALIRAN DANA</span>
								{#if sortCol === 'keterangan'}
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
						<th class="py-3 px-3 min-w-[160px]">PROYEK SPPG</th>
						<th class="py-3 px-3 min-w-[140px]">PIHAK / PIC</th>
						<th class="py-3 px-3 text-right min-w-[130px]">
							<button type="button" onclick={() => toggleSort('nominal')} class="flex items-center gap-1 ml-auto hover:text-slate-900 group cursor-pointer font-bold">
								<span class={sortCol === 'nominal' ? 'text-slate-900 font-black' : ''}>MASUK (INFLOW)</span>
								{#if sortCol === 'nominal'}
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
						<th class="py-3 px-3 text-right min-w-[130px]">KELUAR (DISBURSE)</th>
						<th class="py-3 px-3 text-center w-24">AKSI</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100 font-medium">
					{#each paginatedTransactions as t, idx (t.id)}
						{@const isSelected = selectedTxIds.has(t.id)}
						<tr class="hover:bg-slate-50/80 transition-colors {isSelected ? 'bg-slate-50/90' : ''}">
							<!-- Checkbox Row -->
							<td class="py-3 px-3 text-center">
								<input 
									type="checkbox"
									checked={isSelected}
									onchange={() => toggleSelect(t.id)}
									class="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 accent-slate-900 cursor-pointer"
								/>
							</td>

							<!-- NO -->
							<td class="py-3 px-2 text-center text-slate-400 font-bold tabular-nums">
								{(currentPage - 1) * pageSize + idx + 1}
							</td>

							<!-- TANGGAL -->
							<td class="py-3 px-3 text-slate-800 font-bold whitespace-nowrap tabular-nums">
								{formatTanggal(t.tgl)}
							</td>

							<!-- JENIS TRANSAKSI -->
							<td class="py-3 px-3 whitespace-nowrap">
								{#if t.keterangan.includes('[Pindah Kas]') || t.kategori === 'TRANSFER_KELUAR'}
									<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
										<ArrowRightLeft class="w-3 h-3 text-purple-600" />
										<span>Transfer Kas</span>
									</span>
								{:else if t.tipe === 'IN'}
									<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
										<ArrowUpRight class="w-3 h-3 text-emerald-600" />
										<span>Pemasukan</span>
									</span>
								{:else}
									<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
										<ArrowDownRight class="w-3 h-3 text-amber-600" />
										<span>Pengeluaran</span>
									</span>
								{/if}
							</td>

							<!-- KETERANGAN ALIRAN DANA -->
							<td class="py-3 px-3 text-slate-900 font-bold">
								{t.keterangan}
							</td>

							<!-- PROYEK SPPG -->
							<td class="py-3 px-3 text-slate-700 whitespace-nowrap">
								{#if t.projectNama}
									<span class="font-bold text-slate-900">{t.projectNama}</span>
								{:else}
									<span class="text-slate-400 font-medium">Holding / Overhead</span>
								{/if}
							</td>

							<!-- PIHAK / PIC -->
							<td class="py-3 px-3 text-slate-700 font-semibold whitespace-nowrap">
								{t.penerimaPic || '-'}
							</td>

							<!-- MASUK (INFLOW) -->
							<td class="py-3 px-3 text-right font-extrabold text-emerald-700 whitespace-nowrap tabular-nums">
								{t.tipe === 'IN' ? formatRupiah(t.nominal) : '-'}
							</td>

							<!-- KELUAR (DISBURSE) -->
							<td class="py-3 px-3 text-right font-extrabold text-slate-900 whitespace-nowrap tabular-nums">
								{t.tipe === 'OUT' ? formatRupiah(t.nominal) : '-'}
							</td>

							<!-- AKSI PER BARIS: EYE WARNA BIRU & TRASH WARNA MERAH -->
							<td class="py-3 px-3 text-center whitespace-nowrap">
								<div class="flex items-center justify-center gap-1">
									<!-- Tombol Detail / Kuitansi (ICON MATA WARNA BIRU) -->
									<button 
										type="button" 
										onclick={() => receiptModalTx = t}
										class="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
										title="Lihat Detail Kuitansi / Bukti Kas"
									>
										<Eye class="w-4 h-4 text-blue-600" />
									</button>

									<!-- Tombol Hapus Transaksi (ICON HAPUS WARNA MERAH) -->
									<button 
										type="button" 
										onclick={() => txToDelete = t}
										class="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
										title="Hapus Transaksi"
									>
										<Trash2 class="w-4 h-4 text-rose-600" />
									</button>
								</div>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="10" class="py-12 text-center text-slate-500 text-xs">
								Tidak ada data transaksi yang sesuai filter pencarian.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Pagination Bar -->
		<div class="p-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
			<div class="text-slate-600 font-medium">
				Menampilkan <strong class="text-slate-900 tabular-nums">{paginatedTransactions.length}</strong> dari <strong class="text-slate-900 tabular-nums">{filteredTransactions.length}</strong> transaksi
			</div>

			<div class="flex items-center gap-2 self-center sm:self-auto">
				<button 
					type="button"
					disabled={currentPage <= 1}
					onclick={() => currentPage--}
					class="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
					title="Halaman Sebelumnya"
				>
					<ChevronLeft class="w-4 h-4" />
				</button>
				<span class="font-bold text-slate-900 px-2 tabular-nums">
					{currentPage} / {totalPages}
				</span>
				<button 
					type="button"
					disabled={currentPage >= totalPages}
					onclick={() => currentPage++}
					class="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
					title="Halaman Selanjutnya"
				>
					<ChevronRight class="w-4 h-4" />
				</button>
			</div>
		</div>
	</div>

</div>

<!-- MODAL FORM TRANSAKSI PINTAR (PEMASUKAN, PENGELUARAN, TRANSFER) -->
{#if showModal}
	<div 
		class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
		onclick={() => showModal = false}
		role="dialog"
		aria-modal="true"
	>
		<div 
			class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150 my-8"
			onclick={(e) => e.stopPropagation()}
			role="document"
		>
			<!-- Modal Header & Tabs Transaksi -->
			<div>
				<div class="flex items-center justify-between pb-3 border-b border-slate-100">
					<div>
						<h3 class="text-base font-extrabold text-slate-900">
							{modalAksi === 'IN' ? 'Entri Pemasukan Kas' : modalAksi === 'OUT' ? 'Entri Pengeluaran Kas' : 'Transfer Kas (Pemindahbukuan Asset)'}
						</h3>
						<p class="text-xs text-slate-500 mt-0.5">
							{modalAksi === 'TRANSFER' ? 'Pindah saldo antar rekening induk dan kas operasional' : 'Pembukuan mutasi Rekening Induk Pooling Bpk. Azka'}
						</p>
					</div>
					<button type="button" onclick={() => showModal = false} class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700">
						<X class="w-5 h-5" />
					</button>
				</div>

				<!-- Quick Mode Tabs -->
				<div class="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl mt-3">
					<button
						type="button"
						onclick={() => openModal('IN')}
						class="py-1.5 text-xs font-bold rounded-lg transition-all {modalAksi === 'IN' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
					>
						+ Pemasukan
					</button>
					<button
						type="button"
						onclick={() => openModal('OUT')}
						class="py-1.5 text-xs font-bold rounded-lg transition-all {modalAksi === 'OUT' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
					>
						- Pengeluaran
					</button>
					<button
						type="button"
						onclick={() => openModal('TRANSFER')}
						class="py-1.5 text-xs font-bold rounded-lg transition-all {modalAksi === 'TRANSFER' ? 'bg-white text-purple-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
					>
						⇄ Transfer Kas
					</button>
				</div>
			</div>

			<!-- Form Body dengan Validasi Frontend & Backend -->
			<form 
				method="POST" 
				action="?/addTransaction"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ result, update }) => {
						isSubmitting = false;
						if (result.type === 'success') {
							showModal = false;
							const msg = (result as any).data?.message || 'Transaksi berhasil disimpan!';
							toast.success(String(msg));
							await update();
						} else if (result.type === 'failure') {
							const err = (result as any).data?.error || 'Gagal menyimpan transaksi. Periksa kembali inputan.';
							toast.error(String(err));
						}
					};
				}}
				class="space-y-4"
			>
				<input type="hidden" name="jenisAksi" value={modalAksi} />

				<!-- JIKA MODE TRANSFER: PILIH REKENING ASAL & TUJUAN -->
				{#if modalAksi === 'TRANSFER'}
					<div class="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-purple-50/60 border border-purple-200">
						<div>
							<label class="block text-xs font-bold text-slate-700 mb-1">
								Dari Kas / Rekening <span class="text-rose-500">*</span>
							</label>
							<select class="w-full text-xs font-semibold rounded-lg border border-slate-300 p-2 bg-white" disabled>
								<option value="REK_AZKA_POOLING">BCA Azka Pooling (Induk)</option>
							</select>
						</div>
						<div>
							<label class="block text-xs font-bold text-slate-700 mb-1">
								Ke Kas / Rekening Tujuan <span class="text-rose-500">*</span>
							</label>
							<select 
								name="akunTujuan" 
								bind:value={inputAkunTujuan}
								class="w-full text-xs font-semibold rounded-lg border border-purple-300 p-2 bg-white focus:outline-none focus:ring-1 focus:ring-purple-700"
							>
								<option value="KAS_KECIL_CIH">Kasir Lapangan (CIH)</option>
								<option value="BANK_BSI">Rekening Operasional / BSI</option>
							</select>
						</div>
					</div>
				{/if}

				<!-- Tanggal Transaksi -->
				<div>
					<label for="tgl" class="block text-xs font-bold text-slate-700 mb-1">
						Tanggal Transaksi <span class="text-rose-500">* Wajib</span>
					</label>
					<input 
						id="tgl"
						type="date" 
						name="tgl" 
						bind:value={inputTgl}
						required 
						class="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
					/>
				</div>

				<!-- Nominal dengan Format Rupiah Live Preview -->
				<div>
					<div class="flex items-center justify-between mb-1">
						<label for="nominal" class="block text-xs font-bold text-slate-700">
							Nominal Transaksi (Rp) <span class="text-rose-500">* Wajib</span>
						</label>
						{#if previewRupiah}
							<span class="text-xs font-extrabold text-emerald-700 tabular-nums">
								{previewRupiah}
							</span>
						{/if}
					</div>
					<input 
						id="nominal"
						type="number" 
						name="nominal" 
						bind:value={inputNominal}
						placeholder="Contoh: 50000000"
						min="1"
						step="1"
						required 
						class="w-full text-sm rounded-xl border border-slate-300 p-2.5 font-mono font-bold bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
					/>
				</div>

				<!-- Keterangan Transaksi -->
				<div>
					<label for="keterangan" class="block text-xs font-bold text-slate-700 mb-1">
						Keterangan Aliran Dana <span class="text-rose-500">* Wajib</span>
					</label>
					<input 
						id="keterangan"
						type="text" 
						name="keterangan" 
						bind:value={inputKeterangan}
						placeholder={modalAksi === 'IN' ? 'Contoh: Suntikan modal Pak Azka (100jt TF, 60jt Cash)' : modalAksi === 'OUT' ? 'Contoh: Pelunasan DP Vendor Landscape PU' : 'Contoh: Drop kas operasional kasir minggu ke-3'}
						required 
						minlength="3"
						class="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
					/>
				</div>

				<!-- Dropdown Autocomplete Pihak Penerima / Penyetor -->
				<div>
					<div class="flex items-center justify-between mb-1">
						<label for="penerimaPic" class="block text-xs font-bold text-slate-700">
							{modalAksi === 'IN' ? 'Penyetor / Sumber Dana' : 'Pihak Penerima / PIC'} <span class="text-slate-400 font-normal">(Opsional)</span>
						</label>
						<span class="text-[10px] text-slate-500">Bisa ketik baru atau pilih dari daftar</span>
					</div>
					<input 
						id="penerimaPic"
						type="text" 
						name="penerimaPic" 
						bind:value={inputPenerimaPic}
						list="penerimaList"
						placeholder="Pilih atau ketik nama pihak..."
						class="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
					/>
					<!-- Datalist Autocomplete -->
					<datalist id="penerimaList">
						{#each data.penerimaList as pic}
							<option value={pic}></option>
						{/each}
					</datalist>
				</div>

				<!-- Alokasi ke Titik Proyek SPPG -->
				<div>
					<label for="projectId" class="block text-xs font-bold text-slate-700 mb-1">
						Alokasi ke Titik Proyek SPPG <span class="text-slate-400 font-normal">(Opsional)</span>
					</label>
					<select 
						id="projectId"
						name="projectId" 
						bind:value={inputProjectId}
						class="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
					>
						<option value="NONE">-- Bukan Proyek Tertentu (Overhead Holding / Kas Pusat) --</option>
						{#each data.projects as p}
							<option value={p.id}>{p.nama} ({p.kode})</option>
						{/each}
					</select>
				</div>

				<!-- Upload Bukti Lampiran / Nota Fisik (Opsional) -->
				<div>
					<div class="flex items-center justify-between mb-1">
						<label for="lampiran" class="block text-xs font-bold text-slate-700">
							Lampiran Bukti Struk / Slip Transfer <span class="text-slate-400 font-normal">(Opsional)</span>
						</label>
						{#if inputAttachmentPreview}
							<button 
								type="button" 
								onclick={() => inputAttachmentPreview = null}
								class="text-[10px] text-rose-600 font-semibold hover:underline"
							>
								Hapus Foto
							</button>
						{/if}
					</div>
					<div class="border border-dashed border-slate-300 rounded-xl p-3 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center gap-1.5 text-center">
						{#if inputAttachmentPreview}
							<img src={inputAttachmentPreview} alt="Preview Bukti" class="max-h-28 rounded-lg border border-slate-200 shadow-2xs object-contain" />
						{:else}
							<Paperclip class="w-5 h-5 text-slate-400" />
							<div class="text-[11px] text-slate-600 font-medium">Klik untuk melampirkan foto struk / slip transfer bank</div>
							<div class="text-[9px] text-slate-400">JPG, PNG, atau PDF hingga 5 MB</div>
						{/if}
						<input 
							id="lampiran" 
							type="file" 
							accept="image/*,.pdf" 
							onchange={handleAttachmentChange}
							class="text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-white file:text-slate-700 file:border-slate-200 file:shadow-2xs cursor-pointer w-full text-slate-500 mt-1" 
						/>
					</div>
				</div>

				<!-- Modal Action Buttons -->
				<div class="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
					<button 
						type="button" 
						onclick={() => showModal = false} 
						class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
					>
						Batal
					</button>
					<button 
						type="submit" 
						disabled={isSubmitting || parsedNominal <= 0 || !inputKeterangan.trim()}
						class="px-5 py-2.5 text-xs font-bold rounded-xl text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50 {modalAksi === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700' : modalAksi === 'OUT' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-purple-700 hover:bg-purple-800'}"
					>
						{#if isSubmitting}
							<span>Menyimpan...</span>
						{:else}
							<span>Simpan Transaksi</span>
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- MODAL LIHAT KUITANSI / BUKTI TRANSAKSI RESMI -->
{#if receiptModalTx}
	<div 
		class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
		onclick={() => receiptModalTx = null}
		role="dialog"
		aria-modal="true"
	>
		<div 
			class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150"
			onclick={(e) => e.stopPropagation()}
			role="document"
		>
			<!-- Kop Kuitansi -->
			<div class="flex items-center justify-between pb-3 border-b-2 border-slate-900">
				<div class="flex items-center gap-2.5">
					<div class="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shrink-0">
						<Building2 class="w-4 h-4 text-white" />
					</div>
					<div>
						<div class="text-xs font-extrabold text-slate-900 uppercase tracking-wider">KUITANSI KAS POOLING</div>
						<div class="text-[10px] text-slate-500 font-mono">NO: BKT-{receiptModalTx.id.toString().padStart(5, '0')}</div>
					</div>
				</div>
				<button type="button" onclick={() => receiptModalTx = null} class="text-slate-400 hover:text-slate-700">
					<X class="w-4 h-4" />
				</button>
			</div>

			<!-- Detail Data Kuitansi -->
			<div class="space-y-3 text-xs">
				<div class="flex justify-between py-1 border-b border-slate-100">
					<span class="text-slate-500">Tanggal:</span>
					<span class="font-bold text-slate-900 tabular-nums">{formatTanggal(receiptModalTx.tgl)}</span>
				</div>
				<div class="flex justify-between py-1 border-b border-slate-100">
					<span class="text-slate-500">Jenis Mutasi:</span>
					<span class="font-bold {receiptModalTx.tipe === 'IN' ? 'text-emerald-700' : 'text-slate-900'}">
						{receiptModalTx.tipe === 'IN' ? 'KAS MASUK (INFLOW)' : 'KAS KELUAR (DISBURSE)'}
					</span>
				</div>
				<div class="flex justify-between py-1 border-b border-slate-100">
					<span class="text-slate-500">Pihak Terkait:</span>
					<span class="font-bold text-slate-900">{receiptModalTx.penerimaPic || '-'}</span>
				</div>
				<div class="flex justify-between py-1 border-b border-slate-100">
					<span class="text-slate-500">Proyek SPPG:</span>
					<span class="font-bold text-slate-900">{receiptModalTx.projectNama || 'Kas Sentral Holding'}</span>
				</div>
				<div class="py-1">
					<span class="text-slate-500 block mb-0.5">Uraian / Keterangan:</span>
					<div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-medium">
						{receiptModalTx.keterangan}
					</div>
				</div>
				<div class="p-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between">
					<span class="text-xs font-bold text-slate-700">JUMLAH NOMINAL:</span>
					<span class="text-base font-extrabold text-slate-900 tabular-nums">{formatRupiah(receiptModalTx.nominal)}</span>
				</div>
			</div>

			<!-- Footer Modal Kuitansi -->
			<div class="pt-2 flex items-center justify-end gap-2">
				<button 
					type="button" 
					onclick={() => {
						downloadVoucherPdf(receiptModalTx);
						toast.success(`Voucher Kas #${receiptModalTx.id} berhasil diunduh ke komputer.`);
					}}
					class="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1.5"
				>
					<Download class="w-3.5 h-3.5" />
					<span>Unduh PDF Bukti Kas</span>
				</button>
				<button 
					type="button" 
					onclick={() => receiptModalTx = null}
					class="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
				>
					Tutup
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- MODAL KONFIRMASI HAPUS TRANSAKSI -->
{#if txToDelete}
	<div 
		class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
		onclick={() => txToDelete = null}
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
					<Trash2 class="w-5 h-5" />
				</div>
				<div>
					<h3 class="text-sm font-bold text-slate-900">Hapus Transaksi?</h3>
					<p class="text-xs text-slate-500 mt-0.5">Tindakan ini akan menghapus mutasi kas dari pembukuan.</p>
				</div>
			</div>

			<div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
				<div class="font-bold text-slate-900">{txToDelete.keterangan}</div>
				<div class="text-slate-600 font-bold tabular-nums">{formatRupiah(txToDelete.nominal)}</div>
			</div>

			<form 
				method="POST" 
				action="?/deleteTransaction"
				use:enhance={() => {
					isDeleting = true;
					return async ({ result, update }) => {
						isDeleting = false;
						txToDelete = null;
						if (result.type === 'success') {
							toast.success('Transaksi berhasil dihapus.');
							await update();
						} else {
							toast.error('Gagal menghapus transaksi.');
						}
					};
				}}
				class="flex items-center justify-end gap-2 pt-2"
			>
				<input type="hidden" name="id" value={txToDelete.id} />
				<button 
					type="button" 
					onclick={() => txToDelete = null}
					class="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
				>
					Batal
				</button>
				<button 
					type="submit" 
					disabled={isDeleting}
					class="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-50"
				>
					{isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
				</button>
			</form>
		</div>
	</div>
{/if}
