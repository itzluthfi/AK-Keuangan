<script lang="ts">
	import { formatRupiah, formatTanggal } from '#lib/utils';
	import {
		Plus,
		ArrowUpRight,
		ArrowDownRight,
		Search,
		Fuel,
		Utensils,
		Package,
		FileText,
		Wallet,
		X,
		Tag,
		Building2,
		ArrowUpDown,
		ArrowUp,
		ArrowDown,
		Eye,
		Trash2,
		Paperclip,
		Image as ImageIcon,
		CheckSquare,
		Square,
		AlertTriangle,
		Download,
		Printer,
		FileSpreadsheet,
		Sparkles,
		Loader2
	} from 'lucide-svelte';
	import { compressReceiptImage } from '#lib/utils/compressor';
	import { downloadVoucherPdf, downloadLaporanKasLapanganPdf, formatKategoriLabel } from '#lib/utils/pdf-generator';
	import { toast } from '#lib/hot-toast.svelte';

	let { data } = $props();

	let searchQuery = $state('');
	let selectedCategoryFilter = $state('ALL');
	let showModal = $state(false);
	let modalType = $state<'OUT' | 'IN'>('OUT');

	// Sorting State
	type SortField = 'tgl' | 'kategori' | 'keterangan' | 'nominal' | 'penerimaPic';
	let sortField = $state<SortField>('tgl');
	let sortDirection = $state<'asc' | 'desc'>('desc');

	function toggleSort(field: SortField) {
		if (sortField === field) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortField = field;
			sortDirection = 'desc';
		}
	}

	// Selection & Bulk Actions
	let selectedTxIds = $state<number[]>([]);

	// Detail Modal & Delete Confirmation Modal
	let activeDetailTx = $state<any | null>(null);
	let txToDelete = $state<any | null>(null);

	// Attachment preview state in form with compression stats
	let attachmentPreview = $state<string | null>(null);
	let attachmentName = $state<string | null>(null);
	let compressionStats = $state<{ original: string; compressed: string; savings: number } | null>(null);
	let isCompressing = $state(false);

	async function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			const originalFile = input.files[0];
			attachmentName = originalFile.name;
			isCompressing = true;
			try {
				const result = await compressReceiptImage(originalFile);
				attachmentPreview = result.dataUrl;
				compressionStats = {
					original: result.originalFormatted,
					compressed: result.compressedFormatted,
					savings: result.savingsPct
				};
				toast.success(`Foto struk berhasil dikompres: ${result.originalFormatted} → ${result.compressedFormatted} (Hemat ${result.savingsPct}%)`);
			} catch (err) {
				console.error('Gagal kompresi, gunakan file asli:', err);
				const reader = new FileReader();
				reader.onload = (e) => {
					attachmentPreview = e.target?.result as string;
				};
				reader.readAsDataURL(originalFile);
			} finally {
				isCompressing = false;
			}
		}
	}

	function clearAttachment() {
		attachmentPreview = null;
		attachmentName = null;
		compressionStats = null;
	}

	let filteredTransactions = $derived.by(() => {
		let list = [...data.transactions];
		if (selectedCategoryFilter !== 'ALL') {
			list = list.filter(t => t.kategori === selectedCategoryFilter);
		}
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			list = list.filter(t => 
				t.keterangan.toLowerCase().includes(q) || 
				(t.penerimaPic && t.penerimaPic.toLowerCase().includes(q)) ||
				(t.namaProyek && t.namaProyek.toLowerCase().includes(q))
			);
		}

		list.sort((a, b) => {
			const rawA = a[sortField];
			const rawB = b[sortField];
			if (typeof rawA === 'string' || typeof rawB === 'string') {
				const strA = String(rawA ?? '').toLowerCase();
				const strB = String(rawB ?? '').toLowerCase();
				return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
			}
			const numA = Number(rawA ?? 0);
			const numB = Number(rawB ?? 0);
			return sortDirection === 'asc' ? numA - numB : numB - numA;
		});

		return list;
	});

	let isAllSelected = $derived(
		filteredTransactions.length > 0 && 
		filteredTransactions.every(t => selectedTxIds.includes(t.id))
	);

	function toggleSelectAll() {
		if (isAllSelected) {
			selectedTxIds = [];
		} else {
			selectedTxIds = filteredTransactions.map(t => t.id);
		}
	}

	function toggleSelectOne(id: number) {
		if (selectedTxIds.includes(id)) {
			selectedTxIds = selectedTxIds.filter(i => i !== id);
		} else {
			selectedTxIds = [...selectedTxIds, id];
		}
	}

	function openModal(type: 'OUT' | 'IN') {
		modalType = type;
		attachmentPreview = null;
		attachmentName = null;
		showModal = true;
	}

	let isExporting = $state(false);
	let isExportingPdf = $state(false);

	async function handleExportExcel() {
		isExporting = true;
		const loadingId = toast.loading('Menyiapkan berkas Excel Kas Lapangan...');
		try {
			const res = await fetch('/api/export/kas-lapangan-excel');
			if (!res.ok) throw new Error('Gagal mengunduh Excel');
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `KAS_OPERASIONAL_LAPANGAN_${new Date().toISOString().split('T')[0]}.xlsx`;
			a.click();
			URL.revokeObjectURL(url);
			toast.dismiss(loadingId);
			toast.success('Excel Kas Lapangan berhasil diunduh!');
		} catch (e) {
			toast.dismiss(loadingId);
			toast.error('Gagal mengekspor data Excel.');
		} finally {
			isExporting = false;
		}
	}

	async function handleExportPdf() {
		isExportingPdf = true;
		const loadingId = toast.loading('Menyiapkan Laporan PDF Kas Lapangan...');
		try {
			await downloadLaporanKasLapanganPdf({
				exportDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
				transactions: filteredTransactions,
				summary: data.summary
			});
			toast.dismiss(loadingId);
			toast.success('Laporan PDF Kas Lapangan berhasil diunduh!');
		} catch (e) {
			toast.dismiss(loadingId);
			toast.error('Gagal membuat dokumen PDF.');
		} finally {
			isExportingPdf = false;
		}
	}

	async function handleDownloadBatchPdf() {
		const selectedTxs = filteredTransactions.filter(t => selectedTxIds.includes(t.id));
		if (selectedTxs.length === 0) return;
		const loadingId = toast.loading(`Mengunduh ${selectedTxs.length} voucher PDF...`);
		for (const tx of selectedTxs) {
			await downloadVoucherPdf(tx);
			await new Promise(r => setTimeout(r, 250));
		}
		toast.dismiss(loadingId);
		toast.success(`${selectedTxs.length} voucher PDF berhasil diunduh ke komputer.`);
		selectedTxIds = [];
	}
</script>

<div class="space-y-6">

	<!-- Header Banner & Action Buttons -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
		<div class="min-w-0">
			<h1 class="text-xl sm:text-2xl font-black tracking-tight text-slate-900 truncate">Kas Lapangan (CIH)</h1>
			<p class="text-xs text-slate-500 mt-0.5 truncate">Pencatatan kas kecil harian, BBM, konsumsi, dan logistik</p>
		</div>

		<div class="flex items-center gap-2 flex-nowrap shrink-0">
			<!-- 1. Ekspor Excel Langsung -->
			<button 
				type="button" 
				onclick={handleExportExcel}
				disabled={isExporting}
				class="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
			>
				<FileSpreadsheet class="w-3.5 h-3.5" />
				<span>Ekspor Excel</span>
			</button>

			<!-- 2. Ekspor PDF Rekap Mutasi Kas Lapangan Langsung -->
			<button 
				type="button" 
				onclick={handleExportPdf}
				disabled={isExportingPdf}
				class="px-3 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
			>
				<FileText class="w-3.5 h-3.5" />
				<span>Ekspor PDF</span>
			</button>

			<!-- 3. Catat Pengeluaran -->
			<button 
				type="button" 
				onclick={() => openModal('OUT')}
				class="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
			>
				<Plus class="w-3.5 h-3.5" />
				<span>Pengeluaran</span>
			</button>

			<!-- 4. Catat Pemasukan / Drop Kas -->
			<button 
				type="button" 
				onclick={() => openModal('IN')}
				class="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
			>
				<Plus class="w-3.5 h-3.5" />
				<span>+ Pemasukan</span>
			</button>
		</div>
	</div>

	<!-- 3 Kartu Saldo Kas Kecil -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
		
		<!-- Saldo Kas Kecil Saat Ini -->
		<div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
			<div class="flex items-center justify-between text-slate-500">
				<span class="text-xs font-bold uppercase tracking-wider text-slate-600">Saldo Kas di Lapangan</span>
				<Wallet class="w-4 h-4 text-slate-700" />
			</div>
			<div class="text-2xl font-black tracking-tight {data.summary.saldoSaatIni >= 0 ? 'text-slate-900' : 'text-rose-600'} mt-2 tabular-nums">
				{formatRupiah(data.summary.saldoSaatIni)}
			</div>
			<div class="text-[11px] text-slate-500 mt-1">Cash in Hand (CIH)</div>
		</div>

		<!-- Total Pemasukan Kas Masuk -->
		<div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
			<div class="flex items-center justify-between text-slate-500">
				<span class="text-xs font-bold uppercase tracking-wider text-slate-600">Total Pemasukan Kas</span>
				<ArrowUpRight class="w-4 h-4 text-emerald-600" />
			</div>
			<div class="text-2xl font-black tracking-tight text-emerald-600 mt-2 tabular-nums">
				{formatRupiah(data.summary.totalMasuk)}
			</div>
			<div class="text-[11px] text-slate-500 mt-1">Drop dana dari Rekening Induk</div>
		</div>

		<!-- Total Pengeluaran Lapangan -->
		<div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
			<div class="flex items-center justify-between text-slate-500">
				<span class="text-xs font-bold uppercase tracking-wider text-slate-600">Total Pengeluaran Kas</span>
				<ArrowDownRight class="w-4 h-4 text-rose-600" />
			</div>
			<div class="text-2xl font-black tracking-tight text-rose-600 mt-2 tabular-nums">
				{formatRupiah(data.summary.totalKeluar)}
			</div>
			<div class="text-[11px] text-slate-500 mt-1">BBM, konsumsi, dan logistik</div>
		</div>

	</div>

	<!-- Filter Chips & Search Bar -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
		
		<div class="relative w-full sm:w-72">
			<Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
			<input 
				type="text" 
				bind:value={searchQuery}
				placeholder="Cari transaksi nota, bbm, makan..."
				class="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
			/>
		</div>

		<div class="flex flex-wrap items-center gap-1.5 overflow-x-auto text-xs">
			<button 
				type="button" 
				onclick={() => selectedCategoryFilter = 'ALL'}
				class="px-2.5 py-1 rounded-md font-semibold transition-all {selectedCategoryFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'}"
			>
				Semua
			</button>
			<button 
				type="button" 
				onclick={() => selectedCategoryFilter = 'BBM_LOGISTIK'}
				class="px-2.5 py-1 rounded-md font-semibold transition-all {selectedCategoryFilter === 'BBM_LOGISTIK' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'}"
			>
				BBM & Transport
			</button>
			<button 
				type="button" 
				onclick={() => selectedCategoryFilter = 'KONSUMSI'}
				class="px-2.5 py-1 rounded-md font-semibold transition-all {selectedCategoryFilter === 'KONSUMSI' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'}"
			>
				Konsumsi
			</button>
			<button 
				type="button" 
				onclick={() => selectedCategoryFilter = 'ATK_PERLENGKAPAN'}
				class="px-2.5 py-1 rounded-md font-semibold transition-all {selectedCategoryFilter === 'ATK_PERLENGKAPAN' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'}"
			>
				ATK & Kantor
			</button>
		</div>

	</div>

	<!-- Floating Bulk Action Toolbar (Light Mode Elegan dengan Tombol Batal Merah) -->
	{#if selectedTxIds.length > 0}
		<div class="bg-white border-2 border-blue-500/30 text-slate-900 px-4 py-2.5 rounded-xl shadow-xl flex items-center justify-between text-xs animate-in slide-in-from-top-2">
			<div class="flex items-center gap-3">
				<span class="font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg tabular-nums flex items-center gap-1.5">
					<CheckSquare class="w-3.5 h-3.5" />
					{selectedTxIds.length} transaksi terpilih
				</span>
				<span class="text-slate-600 font-medium hidden sm:inline">Pilih aksi massal untuk pembukuan kas kecil:</span>
			</div>
			<div class="flex items-center gap-2">
				<button 
					type="button"
					onclick={handleDownloadBatchPdf}
					class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
				>
					<Download class="w-3.5 h-3.5" />
					<span>Unduh {selectedTxIds.length} Voucher PDF</span>
				</button>
				<button 
					type="button"
					onclick={() => selectedTxIds = []}
					class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1"
				>
					<X class="w-3.5 h-3.5" />
					<span>Batal Pilihan</span>
				</button>
			</div>
		</div>
	{/if}

	<!-- Tabel Mutasi Kas Kecil Harian (Desktop Table & Mobile Cards) -->
	<div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
		<!-- Desktop Table View -->
		<div class="hidden md:block overflow-x-auto">
			<table class="w-full text-left text-xs border-collapse">
				<thead class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 select-none">
					<tr>
						<!-- Checkbox Header -->
						<th class="py-3 px-3 w-10 text-center">
							<input 
								type="checkbox" 
								checked={isAllSelected}
								onchange={toggleSelectAll}
								class="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
								title="Pilih Semua Baris"
							/>
						</th>

						<!-- Column Sort: Tanggal -->
						<th class="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors" onclick={() => toggleSort('tgl')}>
							<div class="flex items-center gap-1">
								<span>TANGGAL</span>
								{#if sortField === 'tgl'}
									{#if sortDirection === 'asc'}
										<ArrowUp class="w-3 h-3 text-slate-900" />
									{:else}
										<ArrowDown class="w-3 h-3 text-slate-900" />
									{/if}
								{:else}
									<ArrowUpDown class="w-3 h-3 text-slate-400 opacity-50" />
								{/if}
							</div>
						</th>

						<!-- Column Sort: Kategori -->
						<th class="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors" onclick={() => toggleSort('kategori')}>
							<div class="flex items-center gap-1">
								<span>KATEGORI</span>
								{#if sortField === 'kategori'}
									{#if sortDirection === 'asc'}
										<ArrowUp class="w-3 h-3 text-slate-900" />
									{:else}
										<ArrowDown class="w-3 h-3 text-slate-900" />
									{/if}
								{:else}
									<ArrowUpDown class="w-3 h-3 text-slate-400 opacity-50" />
								{/if}
							</div>
						</th>

						<!-- Column Sort: Keterangan -->
						<th class="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors" onclick={() => toggleSort('keterangan')}>
							<div class="flex items-center gap-1">
								<span>KETERANGAN TRANSAKSI</span>
								{#if sortField === 'keterangan'}
									{#if sortDirection === 'asc'}
										<ArrowUp class="w-3 h-3 text-slate-900" />
									{:else}
										<ArrowDown class="w-3 h-3 text-slate-900" />
									{/if}
								{:else}
									<ArrowUpDown class="w-3 h-3 text-slate-400 opacity-50" />
								{/if}
							</div>
						</th>

						<!-- Column Sort: PIC -->
						<th class="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors" onclick={() => toggleSort('penerimaPic')}>
							<div class="flex items-center gap-1">
								<span>PIC / PETUGAS</span>
								{#if sortField === 'penerimaPic'}
									{#if sortDirection === 'asc'}
										<ArrowUp class="w-3 h-3 text-slate-900" />
									{:else}
										<ArrowDown class="w-3 h-3 text-slate-900" />
									{/if}
								{:else}
									<ArrowUpDown class="w-3 h-3 text-slate-400 opacity-50" />
								{/if}
							</div>
						</th>

						<!-- Column Sort: Masuk -->
						<th class="py-3 px-3 text-right cursor-pointer hover:bg-slate-200/60 transition-colors" onclick={() => toggleSort('nominal')}>
							<div class="flex items-center justify-end gap-1">
								<span>MASUK (IN)</span>
								{#if sortField === 'nominal'}
									{#if sortDirection === 'asc'}
										<ArrowUp class="w-3 h-3 text-slate-900" />
									{:else}
										<ArrowDown class="w-3 h-3 text-slate-900" />
									{/if}
								{:else}
									<ArrowUpDown class="w-3 h-3 text-slate-400 opacity-50" />
								{/if}
							</div>
						</th>

						<!-- Keluar -->
						<th class="py-3 px-3 text-right">KELUAR (OUT)</th>

						<!-- Aksi -->
						<th class="py-3 px-3 text-center w-24">AKSI</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-100 font-medium">
					{#each filteredTransactions as t (t.id)}
						{@const isSelected = selectedTxIds.includes(t.id)}
						<tr class="hover:bg-slate-50 transition-colors {isSelected ? 'bg-blue-50/40' : ''}">
							<!-- Checkbox Row -->
							<td class="py-2.5 px-3 text-center">
								<input 
									type="checkbox" 
									checked={isSelected}
									onchange={() => toggleSelectOne(t.id)}
									class="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
								/>
							</td>

							<td class="py-2.5 px-3 text-slate-500 whitespace-nowrap tabular-nums">
								{formatTanggal(t.tgl)}
							</td>
							<td class="py-2.5 px-3 whitespace-nowrap">
								<span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold {t.tipe === 'IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}">
									{formatKategoriLabel(t.kategori)}
								</span>
							</td>
							<td class="py-2.5 px-3 text-slate-800">
								<div class="font-semibold text-slate-900">{t.keterangan}</div>
								{#if t.namaProyek}
									<div class="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
										<Building2 class="w-3 h-3 text-slate-400" />
										{t.namaProyek}
									</div>
								{/if}
							</td>
							<td class="py-2.5 px-3 text-slate-600 whitespace-nowrap">
								{t.penerimaPic || '-'}
							</td>
							<td class="py-2.5 px-3 text-right font-bold text-emerald-600 whitespace-nowrap tabular-nums">
								{t.tipe === 'IN' ? formatRupiah(t.nominal) : '-'}
							</td>
							<td class="py-2.5 px-3 text-right font-bold text-rose-600 whitespace-nowrap tabular-nums">
								{t.tipe === 'OUT' ? formatRupiah(t.nominal) : '-'}
							</td>
							
							<!-- Action Buttons: Eye (Blue) & Trash (Red) -->
							<td class="py-2.5 px-3 text-center whitespace-nowrap">
								<div class="flex items-center justify-center gap-1">
									<!-- Tombol Detail / Lihat Struk (ICON MATA BIRU) -->
									<button 
										type="button" 
										onclick={() => activeDetailTx = t}
										class="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
										title="Lihat Detail & Bukti Struk"
									>
										<Eye class="w-4 h-4" />
									</button>

									<!-- Tombol Hapus (ICON HAPUS MERAH) -->
									<button 
										type="button" 
										onclick={() => txToDelete = t}
										class="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
										title="Hapus Transaksi"
									>
										<Trash2 class="w-4 h-4" />
									</button>
								</div>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="8" class="py-12 text-center text-slate-400">
								Tidak ada catatan mutasi kas kecil yang cocok.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Mobile Cards View (< md screens) -->
		<div class="md:hidden divide-y divide-slate-100">
			{#if filteredTransactions.length === 0}
				<div class="py-10 text-center text-slate-400 text-xs">
					Tidak ada catatan mutasi kas kecil yang cocok.
				</div>
			{/if}
			{#each filteredTransactions as t (t.id)}
				{@const isSelected = selectedTxIds.includes(t.id)}
				<div class="p-4 space-y-2.5 {isSelected ? 'bg-slate-50/90' : ''}">
					<div class="flex items-start justify-between gap-2">
						<div class="flex items-start gap-2">
							<input 
								type="checkbox" 
								checked={isSelected}
								onchange={() => toggleSelectOne(t.id)}
								class="w-4 h-4 mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 accent-slate-900 cursor-pointer"
							/>
							<div>
								<span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold {t.tipe === 'IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}">
									{formatKategoriLabel(t.kategori)}
								</span>
								<div class="font-bold text-slate-900 text-xs mt-1">{t.keterangan}</div>
							</div>
						</div>

						<div class="flex items-center gap-1">
							<button 
								type="button" 
								onclick={() => activeDetailTx = t}
								class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
								title="Lihat Detail & Bukti Struk"
							>
								<Eye class="w-4 h-4" />
							</button>
							<button 
								type="button" 
								onclick={() => txToDelete = t}
								class="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
								title="Hapus Transaksi"
							>
								<Trash2 class="w-4 h-4" />
							</button>
						</div>
					</div>

					<div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
						<div>
							<span class="text-slate-400 block text-[10px]">{t.tgl}</span>
							<span class="text-slate-700 font-medium">{t.penerimaPic || '-'}</span>
						</div>
						<div class="text-right">
							<span class="text-slate-400 block text-[10px]">{t.tipe === 'IN' ? 'Pemasukan' : 'Pengeluaran'}</span>
							<span class="font-black text-xs tabular-nums {t.tipe === 'IN' ? 'text-emerald-600' : 'text-rose-600'}">
								{t.tipe === 'IN' ? '+' : '-'}{formatRupiah(t.nominal)}
							</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>

</div>

<!-- Modal Form Input Transaksi Kas Kecil CIH -->
{#if showModal}
	<div 
		class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
		onclick={() => showModal = false}
	>
		<div 
			class="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 animate-in zoom-in-95 duration-150"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="flex items-center justify-between border-b border-slate-100 pb-3">
				<div>
					<h3 class="text-sm font-bold text-slate-900">
						{modalType === 'OUT' ? 'Catat Pengeluaran Lapangan' : 'Catat Pemasukan Kas Lapangan'}
					</h3>
					<div class="text-[11px] text-slate-500">
						{modalType === 'OUT' ? 'Realisasi biaya taktis operasional lapangan' : 'Penerimaan dana kas masuk / drop dari rekening induk'}
					</div>
				</div>
				<button type="button" onclick={() => showModal = false} class="text-slate-400 hover:text-slate-700">
					<X class="w-4 h-4" />
				</button>
			</div>

			<form method="POST" action="?/addTransaction" class="space-y-4">
				<input type="hidden" name="tipe" value={modalType} />

				<!-- Titik Proyek (Cost Center) -->
				<div>
					<label class="block text-xs font-semibold text-slate-700 mb-1">
						Alokasi Beban ke Proyek SPPG
					</label>
					<select name="projectId" class="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900">
						<option value="NONE">-- Umum / Overhead Kantor --</option>
						{#each data.projects as p}
							<option value={p.id}>{p.nama} ({p.kode})</option>
						{/each}
					</select>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="block text-xs font-semibold text-slate-700 mb-1">Kategori Biaya</label>
						<select name="kategori" class="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900">
							{#if modalType === 'OUT'}
								<option value="BBM_LOGISTIK">BBM & Transport</option>
								<option value="KONSUMSI">Makan / Minum / Tamu</option>
								<option value="OPERASIONAL_LAPANGAN">Operasional Taktis</option>
								<option value="ATK_PERLENGKAPAN">ATK, Pulsa, Internet</option>
							{:else}
								<option value="DROP_KAS">Drop Kas Pimpinan</option>
								<option value="REIMBURSE">Reimburse Operasional</option>
							{/if}
						</select>
					</div>

					<div>
						<label class="block text-xs font-semibold text-slate-700 mb-1">Tanggal</label>
						<input 
							type="date" 
							name="tgl" 
							value={new Date().toISOString().split('T')[0]} 
							class="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900" 
							required 
						/>
					</div>
				</div>

				<div>
					<label class="block text-xs font-semibold text-slate-700 mb-1">
						Nominal (Rp) <span class="text-rose-500">*</span>
					</label>
					<input 
						type="number" 
						name="nominal" 
						placeholder="Contoh: 150000"
						class="w-full text-xs rounded-lg border border-slate-300 p-2 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-slate-900"
						required 
					/>
				</div>

				<div>
					<label class="block text-xs font-semibold text-slate-700 mb-1">
						{modalType === 'OUT' ? 'Keterangan Pengeluaran' : 'Keterangan / Uraian Pemasukan'} <span class="text-rose-500">*</span>
					</label>
					<input 
						type="text" 
						name="keterangan" 
						placeholder={modalType === 'OUT' ? 'Contoh: Solar genset survei SPPG Balai PU' : 'Contoh: Drop kas kecil dari Rekening Induk Bpk. Azka'}
						class="w-full text-xs rounded-lg border border-slate-300 p-2 focus:outline-none focus:ring-1 focus:ring-slate-900"
						required 
					/>
				</div>

				<div>
					<label class="block text-xs font-semibold text-slate-700 mb-1">
						{modalType === 'OUT' ? 'Nama PIC Petugas / Kasir' : 'Diterima Oleh (PIC Lapangan)'}
					</label>
					<input 
						type="text" 
						name="penerimaPic" 
						placeholder={modalType === 'OUT' ? 'Nama pengawas/kasir yang belanja' : 'Nama PIC kasir penerima'}
						class="w-full text-xs rounded-lg border border-slate-300 p-2 focus:outline-none focus:ring-1 focus:ring-slate-900"
					/>
				</div>

				<!-- Bukti Lampiran / Foto Struk Fisik (Opsional) -->
				<div>
					<label class="block text-xs font-semibold text-slate-700 mb-1">
						Bukti Struk / Nota Fisik <span class="text-[11px] font-normal text-slate-400">(Opsional)</span>
					</label>
					
					{#if isCompressing}
						<div class="p-3 border border-slate-200 rounded-xl bg-slate-50 flex items-center gap-2 text-xs text-slate-600 animate-pulse">
							<Loader2 class="w-4 h-4 animate-spin text-slate-600" />
							<span>Mengompresi foto struk dengan Compressor.js...</span>
						</div>
					{:else if !attachmentPreview}
						<label class="border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-slate-50">
							<Paperclip class="w-4 h-4 text-slate-400 mb-1" />
							<span class="text-xs font-medium text-slate-600">Unggah Foto Struk / Nota Pembelian</span>
							<span class="text-[10px] text-slate-400 mt-0.5">JPG, PNG, atau PDF (Kompresi Otomatis Aktif)</span>
							<input 
								type="file" 
								name="lampiran" 
								accept="image/*,application/pdf" 
								class="hidden" 
								onchange={handleFileChange}
							/>
						</label>
					{:else}
						<div class="relative border border-slate-200 rounded-xl p-2.5 bg-slate-50 flex items-center justify-between">
							<div class="flex items-center gap-2.5 overflow-hidden">
								<img src={attachmentPreview} alt="Pratinjau Nota" class="w-12 h-12 object-cover rounded-lg border border-slate-200" />
								<div class="text-xs truncate">
									<div class="font-medium text-slate-800 truncate">{attachmentName}</div>
									<div class="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
										<Sparkles class="w-3 h-3 text-emerald-600" />
										{#if compressionStats}
											<span>Terkonpres: {compressionStats.original} → {compressionStats.compressed} (-{compressionStats.savings}%)</span>
										{:else}
											<span>Lampiran siap disimpan</span>
										{/if}
									</div>
								</div>
							</div>
							<button 
								type="button" 
								onclick={clearAttachment}
								class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors"
								title="Hapus Lampiran"
							>
								<X class="w-4 h-4" />
							</button>
						</div>
					{/if}
				</div>

				<div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
					<button type="button" onclick={() => showModal = false} class="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
						Batal
					</button>
					<button 
						type="submit" 
						class="px-4 py-2 text-xs font-semibold {modalType === 'OUT' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white rounded-lg shadow-xs"
					>
						Simpan Transaksi
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Modal Detail Transaksi & Bukti Struk (Triggered by Blue Eye) -->
{#if activeDetailTx}
	<div 
		class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
		onclick={() => activeDetailTx = null}
	>
		<div 
			class="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="flex items-center justify-between border-b border-slate-100 pb-3">
				<div class="flex items-center gap-2">
					<div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
						<Eye class="w-4 h-4" />
					</div>
					<div>
						<h3 class="text-sm font-bold text-slate-900">Voucher / Bukti Kas Lapangan</h3>
						<div class="text-[11px] text-slate-500">Ref ID #{activeDetailTx.id} - {formatTanggal(activeDetailTx.tgl)}</div>
					</div>
				</div>
				<button type="button" onclick={() => activeDetailTx = null} class="text-slate-400 hover:text-slate-700">
					<X class="w-4 h-4" />
				</button>
			</div>

			<!-- Bukti Struk Card -->
			<div class="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
				<div class="flex items-center justify-between text-xs">
					<span class="text-slate-500 font-medium">Jenis Alur</span>
					<span class="px-2 py-0.5 rounded text-[11px] font-bold {activeDetailTx.tipe === 'IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
						{activeDetailTx.tipe === 'IN' ? 'KAS MASUK (DROP)' : 'KAS KELUAR (REALISASI)'}
					</span>
				</div>

				<div class="flex items-center justify-between text-xs">
					<span class="text-slate-500 font-medium">Kategori Transaksi</span>
					<span class="font-bold text-slate-800">{formatKategoriLabel(activeDetailTx.kategori)}</span>
				</div>

				<div class="flex items-center justify-between text-xs">
					<span class="text-slate-500 font-medium">Beban Proyek SPPG</span>
					<span class="font-semibold text-slate-800">{activeDetailTx.namaProyek || 'Umum Lapangan'}</span>
				</div>

				<div class="flex items-center justify-between text-xs">
					<span class="text-slate-500 font-medium">PIC / Petugas</span>
					<span class="font-semibold text-slate-800">{activeDetailTx.penerimaPic || '-'}</span>
				</div>

				<div class="pt-2 border-t border-slate-200 flex items-center justify-between">
					<span class="text-xs font-bold text-slate-700">Total Nominal</span>
					<span class="text-base font-black {activeDetailTx.tipe === 'IN' ? 'text-emerald-600' : 'text-rose-600'} tabular-nums">
						{formatRupiah(activeDetailTx.nominal)}
					</span>
				</div>
			</div>

			<div class="p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-xs text-blue-900">
				<span class="font-bold block mb-0.5">Uraian / Keterangan:</span>
				{activeDetailTx.keterangan}
			</div>

			<div class="pt-2 flex items-center justify-between">
				<button 
					type="button" 
					onclick={() => {
						downloadVoucherPdf(activeDetailTx);
						toast.success(`Voucher #${activeDetailTx.id} berhasil diunduh ke komputer.`);
					}}
					class="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
				>
					<Download class="w-3.5 h-3.5" />
					<span>Unduh PDF Struk</span>
				</button>
				<button 
					type="button" 
					onclick={() => activeDetailTx = null}
					class="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
				>
					Tutup
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Modal Konfirmasi Hapus Transaksi (Triggered by Red Trash) -->
{#if txToDelete}
	<div 
		class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
		onclick={() => txToDelete = null}
	>
		<div 
			class="bg-white rounded-xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="flex items-center gap-3 text-rose-600">
				<div class="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
					<AlertTriangle class="w-5 h-5 text-rose-600" />
				</div>
				<div>
					<h3 class="text-sm font-bold text-slate-900">Konfirmasi Hapus Transaksi</h3>
					<div class="text-xs text-slate-500">Aksi ini tidak dapat dibatalkan</div>
				</div>
			</div>

			<p class="text-xs text-slate-600">
				Apakah Anda yakin ingin menghapus pencatatan kas: <br/>
				<span class="font-bold text-slate-900">"{txToDelete.keterangan}"</span> senilai <span class="font-bold text-rose-600">{formatRupiah(txToDelete.nominal)}</span>?
			</p>

			<div class="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
				<button 
					type="button" 
					onclick={() => txToDelete = null}
					class="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
				>
					Batal
				</button>

				<form method="POST" action="?/deleteTransaction" onsubmit={() => { const id = txToDelete.id; txToDelete = null; }}>
					<input type="hidden" name="id" value={txToDelete.id} />
					<button 
						type="submit" 
						class="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs flex items-center gap-1.5"
					>
						<Trash2 class="w-3.5 h-3.5" />
						Ya, Hapus
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}
