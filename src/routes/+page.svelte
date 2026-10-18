<script lang="ts">
	import { formatRupiah, formatRupiahRingkas, formatPersen } from '#lib/utils';
	import { toast } from 'svelte-sonner';
	import DataTablePagination from '#lib/components/data-table-pagination.svelte';
	import {
		Search,
		Filter,
		ArrowUpDown,
		ArrowUp,
		ArrowDown,
		FileSpreadsheet,
		Eye,
		AlertTriangle,
		CheckCircle2,
		TrendingUp,
		ArrowUpRight,
		ArrowDownRight,
		X,
		Layers,
		Calendar,
		Building2,
		CheckSquare,
		ExternalLink,
		SlidersHorizontal,
		Check,
		BarChart3,
		PieChart,
		Activity,
		Lock,
		Landmark,
		Wallet
	} from 'lucide-svelte';
	import { page } from '$app/state';

	let { data } = $props();

	let isSiteManager = $derived(page.data.user?.role === 'SITE_MANAGER');

	// State Filter Periode
	let activePeriod = $state('SEMUA'); // HARI_INI, 7_HARI, BULAN_INI, TAHUN_INI, SEMUA
	let searchQuery = $state('');
	let statusFilter = $state('ALL'); // ALL, BERJALAN, SELESAI, PERENCANAAN
	let sortColumn = $state<'nama' | 'rabKontrak' | 'progresFisikPct' | 'terminMasuk' | 'marginBersih' | 'labaProyek' | 'totalBebanVendor' | 'totalOperasional' | 'sisaTermin'>('labaProyek');
	let sortDirection = $state<'asc' | 'desc'>('desc');

	// Multi-Row Selection State (Set of project IDs)
	let selectedIds = $state(new Set<number>());

	// Pagination State
	let pageSize = $state<number>(10); // 10, 25, 50, 0 (Semua)
	let currentPage = $state<number>(1);

	// Slide-over Drawer State
	let selectedProject = $state<any>(null);

	// Toggle section analitik grafik
	let showAnalytics = $state(true);

	// Visual Analytics Calculations
	let topProjectsForChart = $derived.by(() => {
		const sorted = [...data.projects].sort((a, b) => b.rabKontrak - a.rabKontrak).slice(0, 6);
		const maxVal = Math.max(...sorted.map(p => Math.max(p.terminMasuk, p.totalPengeluaran)), 1);
		return sorted.map(p => ({
			...p,
			terminHeightPct: Math.round((p.terminMasuk / maxVal) * 100),
			bebanHeightPct: Math.round((p.totalPengeluaran / maxVal) * 100)
		}));
	});

	// Donut Chart State & Precision Math
	let hoveredDonutSegment = $state<'ALL' | 'SUBKON' | 'CIH' | 'FEE'>('ALL');

	let totalSubkon = $derived(data.kpi.totalBebanSubkon || 0);
	let totalCIH = $derived(data.kpi.totalOperasionalAll || 0);
	let totalFee = $derived(data.kpi.totalFeeAll || 0);
	let totalExp = $derived(totalSubkon + totalCIH + totalFee || 1);

	let rawPctSubkon = $derived((totalSubkon / totalExp) * 100);
	let rawPctCIH = $derived((totalCIH / totalExp) * 100);
	let rawPctFee = $derived((totalFee / totalExp) * 100);

	let pctSubkon = $derived(rawPctSubkon.toFixed(1));
	let pctCIHDisplay = $derived(rawPctCIH > 0 && rawPctCIH < 0.1 ? '< 0.1%' : `${rawPctCIH.toFixed(1)}%`);
	let pctFee = $derived(rawPctFee.toFixed(1));

	const C = 251.327; // 2 * PI * 40
	let strokeSubkon = $derived((rawPctSubkon / 100) * C);
	// Pastikan segmen kecil (Kasir CIH) tetap memiliki irisan visual minimal 6px (~2.4%) agar terlihat dan bisa di-hover
	let strokeCIH = $derived(totalCIH > 0 ? Math.max((rawPctCIH / 100) * C, 6) : 0);
	let strokeFee = $derived(Math.max(0, C - strokeSubkon - strokeCIH));

	let offsetSubkon = $derived(0);
	let offsetCIH = $derived(-strokeSubkon);
	let offsetFee = $derived(-(strokeSubkon + strokeCIH));

	// Project Health Counts
	let selesaiCount = $derived(data.projects.filter(p => p.progresFisikPct === 100).length);
	let onProgressCount = $derived(data.projects.filter(p => p.progresFisikPct > 0 && p.progresFisikPct < 100).length);
	let deficitMarginCount = $derived(data.projects.filter(p => p.marginBersih < 0).length);
	let surplusMarginCount = $derived(data.projects.filter(p => p.marginBersih >= 0).length);

	// Column Visibility
	let showSubkonCol = $state(true);
	let showOperasionalCol = $state(true);
	let showSisaPiutangCol = $state(true);

	// Filter & Sort Logic (Reactive via Svelte 5 $derived)
	let filteredProjects = $derived.by(() => {
		let list = data.projects;

		if (statusFilter !== 'ALL') {
			list = list.filter(p => p.status === statusFilter);
		}

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			list = list.filter(p => p.nama.toLowerCase().includes(q) || p.kode.toLowerCase().includes(q));
		}

		return [...list].sort((a, b) => {
			let valA = a[sortColumn];
			let valB = b[sortColumn];

			if (typeof valA === 'string') {
				return sortDirection === 'asc' 
					? (valA as string).localeCompare(valB as string) 
					: (valB as string).localeCompare(valA as string);
			}

			return sortDirection === 'asc' 
				? (valA as number) - (valB as number) 
				: (valB as number) - (valA as number);
		});
	});

	// Totals Derivations for Table Footer Summary
	let totalRab = $derived(filteredProjects.reduce((sum, p) => sum + p.rabKontrak, 0));
	let totalTermin = $derived(filteredProjects.reduce((sum, p) => sum + p.terminMasuk, 0));
	let totalBebanVendor = $derived(filteredProjects.reduce((sum, p) => sum + p.totalBebanVendor, 0));
	let totalOperasional = $derived(filteredProjects.reduce((sum, p) => sum + p.totalOperasional, 0));
	let totalMarginBersih = $derived(filteredProjects.reduce((sum, p) => sum + p.marginBersih, 0));
	let totalSisaTermin = $derived(filteredProjects.reduce((sum, p) => sum + p.sisaTermin, 0));
	let totalMarginPct = $derived(totalTermin > 0 ? (totalMarginBersih / totalTermin) * 100 : 0);

	// Pagination Derivations
	let paginatedProjects = $derived.by(() => {
		if (pageSize <= 0) return filteredProjects;
		const start = (currentPage - 1) * pageSize;
		return filteredProjects.slice(start, start + pageSize);
	});

	function toggleSort(col: 'nama' | 'rabKontrak' | 'progresFisikPct' | 'terminMasuk' | 'marginBersih' | 'labaProyek' | 'totalBebanVendor' | 'totalOperasional' | 'sisaTermin') {
		if (sortColumn === col) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = col;
			sortDirection = 'desc';
		}
	}

	function toggleSelect(id: number) {
		const next = new Set(selectedIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selectedIds = next;
	}

	function toggleSelectAll() {
		if (paginatedProjects.length === 0) return;
		const allInPageSelected = paginatedProjects.every(p => selectedIds.has(p.id));
		const next = new Set(selectedIds);
		if (allInPageSelected) {
			paginatedProjects.forEach(p => next.delete(p.id));
		} else {
			paginatedProjects.forEach(p => next.add(p.id));
		}
		selectedIds = next;
	}

	function clearSelection() {
		selectedIds = new Set();
	}

	function compareSelected() {
		if (selectedIds.size < 2) {
			toast.info('Pilih minimal 2 proyek untuk perbandingan margin.');
			return;
		}
		const chosen = data.projects.filter(p => selectedIds.has(p.id));
		const names = chosen.map(p => `${p.nama} (${formatPersen(p.marginPct)})`).join(', ');
		toast.success(`Membandingkan ${chosen.length} proyek: ${names}`);
	}

	async function handleExportExcel(selectedOnly = false) {
		const count = selectedOnly ? selectedIds.size : filteredProjects.length;
		toast.loading(`Menyiapkan file Excel (${count} proyek)...`, { id: 'export-excel' });
		try {
			const query = selectedOnly && selectedIds.size > 0 
				? `?selectedIds=${[...selectedIds].join(',')}` 
				: '';
			const res = await fetch(`/api/export/dashboard-excel${query}`);
			if (!res.ok) throw new Error('Gagal mengunduh Excel');
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			const suffix = selectedOnly ? `TERPILIH_${selectedIds.size}_TITIK` : 'SEMUA_TITIK';
			a.download = `REKAP_KAS_SPPG_${suffix}_${new Date().toISOString().split('T')[0]}.xlsx`;
			a.click();
			URL.revokeObjectURL(url);
			toast.success('File Excel berhasil diunduh!', { id: 'export-excel' });
		} catch (e) {
			toast.error('Terjadi kesalahan saat export.', { id: 'export-excel' });
		}
	}
</script>

<div class="space-y-6">

	<!-- Page Header (Clean SvelteForge Style with Date on Right) -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
		<div>
			<h1 class="text-xl sm:text-2xl font-black tracking-tight text-slate-900">Monitoring Kas SPPG</h1>
			<p class="text-xs text-slate-500 mt-0.5">{data.kpi.totalTitikProyek} Proyek Aktif &bull; TA 2026</p>
		</div>

		<!-- Date & Quick Period Selector -->
		<div class="flex flex-wrap items-center gap-2 self-start sm:self-auto">
			<div class="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white text-xs font-semibold text-slate-700 shadow-2xs">
				<Calendar class="w-3.5 h-3.5 text-slate-500" />
				<span>Minggu, 18 Oktober 2026</span>
			</div>
			
			<div class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
				{#each [
					{ id: 'BULAN_INI', label: 'Bulan Ini' },
					{ id: 'TAHUN_INI', label: 'Tahun 2026' },
					{ id: 'SEMUA', label: 'Semua' }
				] as p}
					<button 
						type="button" 
						onclick={() => activePeriod = p.id}
						class="px-3 py-1 text-xs font-bold rounded-lg transition-all {activePeriod === p.id ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}"
					>
						{p.label}
					</button>
				{/each}
			</div>
		</div>
	</div>

	<!-- 4 Kartu Metrik Keuangan Eksekutif (Format Bersih SvelteForge: Label, Big Number, 1 Pill Badge) -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
		
		<!-- Kartu 1: OMSET TERMIN CAIR -->
		<div class="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
			<div class="flex items-center justify-between gap-1">
				<span class="text-xs sm:text-sm font-semibold text-slate-700 truncate">Omset Termin Cair</span>
				<ArrowUpRight class="w-4 h-4 text-emerald-600 shrink-0" />
			</div>
			<div class="my-2 sm:my-3">
				<div class="text-base sm:text-lg lg:text-[20px] xl:text-[22px] font-extrabold tracking-tight text-slate-900 tabular-nums whitespace-nowrap">
					{formatRupiah(data.kpi.totalOmsetMasuk)}
				</div>
			</div>
			<div class="pt-2 border-t border-slate-100 flex items-center justify-between">
				<span class="text-[11px] font-semibold text-slate-600">Kontrak SPK:</span>
				<span class="text-[11px] font-bold text-slate-900 tabular-nums px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200/80">{formatRupiahRingkas(data.kpi.totalKontrak)}</span>
			</div>
		</div>

		<!-- Kartu 2: BEBAN REALISASI SUBKON -->
		<div class="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
			<div class="flex items-center justify-between gap-1">
				<span class="text-xs sm:text-sm font-semibold text-slate-700 truncate">Beban Subkon (RAP)</span>
				<ArrowDownRight class="w-4 h-4 text-rose-600 shrink-0" />
			</div>
			<div class="my-2 sm:my-3">
				<div class="text-base sm:text-lg lg:text-[20px] xl:text-[22px] font-extrabold tracking-tight text-slate-900 tabular-nums whitespace-nowrap">
					{formatRupiah(data.kpi.totalBebanSubkon)}
				</div>
			</div>
			<div class="pt-2 border-t border-slate-100 flex items-center justify-between">
				<span class="text-[11px] font-semibold text-slate-600">Sisa Hutang:</span>
				<span class="text-[11px] font-bold text-rose-700 tabular-nums px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200/60">{formatRupiahRingkas(data.kpi.totalSisaHutang)}</span>
			</div>
		</div>

		<!-- Kartu 3: MARGIN KOTOR -->
		<div class="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
			<div class="flex items-center justify-between gap-1">
				<span class="text-xs sm:text-sm font-semibold text-slate-700 truncate">Margin Kotor</span>
				<Activity class="w-4 h-4 text-teal-600 shrink-0" />
			</div>
			<div class="my-2 sm:my-3">
				{#if isSiteManager}
					<div class="text-sm font-bold text-slate-400 flex items-center gap-1.5 py-1">
						<Lock class="w-3.5 h-3.5 text-slate-400" />
						<span>Terproteksi Direktur</span>
					</div>
				{:else}
					<div class="text-base sm:text-lg lg:text-[20px] xl:text-[22px] font-extrabold tracking-tight {data.kpi.totalMarginKotor >= 0 ? 'text-slate-900' : 'text-rose-700'} tabular-nums whitespace-nowrap">
						{formatRupiah(data.kpi.totalMarginKotor)}
					</div>
				{/if}
			</div>
			<div class="pt-2 border-t border-slate-100 flex items-center justify-between">
				<span class="text-[11px] font-semibold text-slate-600">Gross Margin:</span>
				<span class="text-[11px] font-bold text-teal-800 tabular-nums px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200/80">{isSiteManager ? '🔒 Otoritas HO' : formatPersen(data.kpi.grossMarginPct)}</span>
			</div>
		</div>

		<!-- Kartu 4: MARGIN BERSIH -->
		<div class="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
			<div class="flex items-center justify-between gap-1">
				<span class="text-xs sm:text-sm font-semibold text-slate-700 truncate">Margin Bersih</span>
				<TrendingUp class="w-4 h-4 {data.kpi.totalMarginBersih >= 0 ? 'text-emerald-600' : 'text-rose-600'} shrink-0" />
			</div>
			<div class="my-2 sm:my-3">
				{#if isSiteManager}
					<div class="text-sm font-bold text-slate-400 flex items-center gap-1.5 py-1">
						<Lock class="w-3.5 h-3.5 text-slate-400" />
						<span>Terproteksi Direktur</span>
					</div>
				{:else}
					<div class="text-base sm:text-lg lg:text-[20px] xl:text-[22px] font-extrabold tracking-tight {data.kpi.totalMarginBersih >= 0 ? 'text-emerald-700' : 'text-rose-700'} tabular-nums whitespace-nowrap">
						{formatRupiah(data.kpi.totalMarginBersih)}
					</div>
				{/if}
			</div>
			<div class="pt-2 border-t border-slate-100 flex items-center justify-between">
				<span class="text-[11px] font-semibold text-slate-600">Sisa Piutang:</span>
				<span class="text-[11px] font-bold text-slate-800 tabular-nums px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200/80">{formatRupiahRingkas(data.kpi.totalSisaPiutang)}</span>
			</div>
		</div>
	</div>

	<!-- Ringkasan Saldo Rekening Operasional & Kas (Clean Light Mode) -->
	<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
		<!-- 1. Rekening BSI Operasional -->
		<div class="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 flex items-center justify-center shrink-0">
					<Landmark class="w-4 h-4 text-slate-600" />
				</div>
				<div>
					<div class="text-xs text-slate-500 font-medium">Rekening Operasional (BSI)</div>
					{#if isSiteManager}
						<div class="text-xs font-bold text-slate-400 flex items-center gap-1 mt-0.5">
							<Lock class="w-3 h-3" />
							<span>Terproteksi Direktur</span>
						</div>
					{:else}
						<div class="text-base sm:text-lg font-extrabold text-slate-900 tabular-nums tracking-tight mt-0.5">{formatRupiah(data.kpi.saldoBsi)}</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- 2. Kas Kecil Lapangan (CIH) -->
		<div class="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 flex items-center justify-center shrink-0">
					<Wallet class="w-4 h-4 text-slate-600" />
				</div>
				<div>
					<div class="text-xs text-slate-500 font-medium">Kas Operasional Lapangan (CIH)</div>
					<div class="text-base sm:text-lg font-extrabold text-slate-900 tabular-nums tracking-tight mt-0.5">{formatRupiah(data.kpi.saldoCih)}</div>
				</div>
			</div>
		</div>

		<!-- 3. Biaya Overhead Kantor -->
		<div class="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 flex items-center justify-center shrink-0">
					<Building2 class="w-4 h-4 text-slate-600" />
				</div>
				<div>
					<div class="text-xs text-slate-500 font-medium">Biaya Overhead Kantor</div>
					{#if isSiteManager}
						<div class="text-xs font-bold text-slate-400 flex items-center gap-1 mt-0.5">
							<Lock class="w-3 h-3" />
							<span>Terproteksi Direktur</span>
						</div>
					{:else}
						<div class="text-base sm:text-lg font-extrabold text-slate-900 tabular-nums tracking-tight mt-0.5">{formatRupiah(data.kpi.totalOverheadKantor)}</div>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- SECTION ANALITIK VISUAL (2 KARTU BESAR SEIMBANG 50% - 50% PERSIS SVELTEFORGE) -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
		
		<!-- KARTU KIRI (50%): REALISASI KAS DAPUR MBG (BAR CHART) -->
		<div class="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
			<div class="flex items-start justify-between pb-4 border-b border-slate-100 mb-4">
				<div>
					<h2 class="text-sm sm:text-base font-bold text-slate-900">Realisasi Kas Dapur MBG</h2>
					<p class="text-xs text-slate-500 mt-0.5">Termin Cair vs Pengeluaran (6 Titik Terbesar)</p>
				</div>
				<!-- Legend Kontras Tinggi dengan Aturan Keuangan: Naik Hijau, Turun Merah -->
				<div class="flex items-center gap-3 text-xs font-semibold text-slate-700">
					<div class="flex items-center gap-1.5">
						<span class="w-3 h-3 rounded-xs bg-emerald-600"></span>
						<span>Termin Cair</span>
					</div>
					<div class="flex items-center gap-1.5">
						<span class="w-3 h-3 rounded-xs bg-rose-500"></span>
						<span>Pengeluaran</span>
					</div>
				</div>
			</div>

			<!-- Bars Container dengan Teks Kontras Tinggi -->
			<div class="space-y-3.5 pt-1">
				{#each topProjectsForChart as p}
					<div class="space-y-1.5">
						<div class="flex items-center justify-between text-xs sm:text-sm">
							<span class="font-bold text-slate-900 truncate max-w-[200px] sm:max-w-xs">{p.nama}</span>
							<div class="flex items-center gap-2 text-xs font-bold tabular-nums">
								<span class="text-emerald-700">{formatRupiahRingkas(p.terminMasuk)}</span>
								<span class="text-slate-400 font-normal">/</span>
								<span class="text-rose-700">{formatRupiahRingkas(p.totalPengeluaran)}</span>
							</div>
						</div>
						<div class="grid grid-cols-1 gap-1">
							<!-- Bar Termin Cair (Hijau Keuangan / Emerald) -->
							<div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex items-center">
								<div
									class="bg-emerald-600 h-full rounded-full transition-all duration-300"
									style="width: {p.terminHeightPct}%"
									title="Termin Masuk: {formatRupiah(p.terminMasuk)}"
								></div>
							</div>
							<!-- Bar Pengeluaran (Merah Keuangan / Rose) -->
							<div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex items-center">
								<div
									class="bg-rose-500 h-full rounded-full transition-all duration-300"
									style="width: {p.bebanHeightPct}%"
									title="Pengeluaran: {formatRupiah(p.totalPengeluaran)}"
								></div>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<div class="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
				<span>Portofolio Dapur Berjalan</span>
				<span class="text-slate-800 font-bold">29 Titik Terdaftar</span>
			</div>
		</div>

		<!-- KARTU KANAN (50%): DISTRIBUSI ALOKASI BEBAN PORTOFOLIO (DONUT CHART INTERAKTIF) -->
		<div class="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
			<div class="pb-4 border-b border-slate-100 mb-3 flex items-start justify-between">
				<div>
					<h2 class="text-sm sm:text-base font-bold text-slate-900">Alokasi Beban Portofolio</h2>
					<p class="text-xs font-semibold text-slate-600 mt-0.5">Komposisi penyerapan anggaran • Arahkan kursor untuk detail</p>
				</div>
				<!-- Reset Hover Trigger / Indikator Mode -->
				{#if hoveredDonutSegment !== 'ALL'}
					<button 
						type="button" 
						onclick={() => hoveredDonutSegment = 'ALL'} 
						class="text-[11px] font-bold text-slate-500 hover:text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md transition-colors"
					>
						Reset Tampilan
					</button>
				{/if}
			</div>

			<!-- Donut & Legend Container -->
			<div class="flex flex-col sm:flex-row items-center justify-between gap-5 py-2">
				
				<!-- SVG Donut Chart dengan Warna Triad Kontras Tinggi & Hover Interaktif -->
				<div class="relative w-40 h-40 shrink-0 flex items-center justify-center">
					<svg class="w-40 h-40 -rotate-90 transform" viewBox="0 0 100 100">
						<!-- Track Circle Dasar -->
						<circle
							cx="50"
							cy="50"
							r="40"
							fill="transparent"
							stroke="#f1f5f9"
							stroke-width="12"
						/>

						<!-- Segment 1: Subkon RAP (Royal Blue #2563eb) -->
						<circle
							cx="50"
							cy="50"
							r="40"
							fill="transparent"
							stroke="#2563eb"
							stroke-width={hoveredDonutSegment === 'SUBKON' ? 14 : 11}
							stroke-dasharray="{strokeSubkon} {C}"
							stroke-dashoffset="{offsetSubkon}"
							class="cursor-pointer transition-all duration-200 {hoveredDonutSegment !== 'ALL' && hoveredDonutSegment !== 'SUBKON' ? 'opacity-35' : 'opacity-100'}"
							onmouseenter={() => hoveredDonutSegment = 'SUBKON'}
							onmouseleave={() => hoveredDonutSegment = 'ALL'}
							onclick={() => hoveredDonutSegment = hoveredDonutSegment === 'SUBKON' ? 'ALL' : 'SUBKON'}
							role="button"
							tabindex="0"
						/>

						<!-- Segment 2: Kasir CIH Lapangan (Teal Hijau Toska #0d9488) -->
						{#if strokeCIH > 0}
							<circle
								cx="50"
								cy="50"
								r="40"
								fill="transparent"
								stroke="#0d9488"
								stroke-width={hoveredDonutSegment === 'CIH' ? 14 : 11}
								stroke-dasharray="{strokeCIH} {C}"
								stroke-dashoffset="{offsetCIH}"
								class="cursor-pointer transition-all duration-200 {hoveredDonutSegment !== 'ALL' && hoveredDonutSegment !== 'CIH' ? 'opacity-35' : 'opacity-100'}"
								onmouseenter={() => hoveredDonutSegment = 'CIH'}
								onmouseleave={() => hoveredDonutSegment = 'ALL'}
								onclick={() => hoveredDonutSegment = hoveredDonutSegment === 'CIH' ? 'ALL' : 'CIH'}
								role="button"
								tabindex="0"
							/>
						{/if}

						<!-- Segment 3: Fee Pengawas & Overhead (Kuning Emas / Amber #f59e0b) -->
						{#if strokeFee > 0}
							<circle
								cx="50"
								cy="50"
								r="40"
								fill="transparent"
								stroke="#f59e0b"
								stroke-width={hoveredDonutSegment === 'FEE' ? 14 : 11}
								stroke-dasharray="{strokeFee} {C}"
								stroke-dashoffset="{offsetFee}"
								class="cursor-pointer transition-all duration-200 {hoveredDonutSegment !== 'ALL' && hoveredDonutSegment !== 'FEE' ? 'opacity-35' : 'opacity-100'}"
								onmouseenter={() => hoveredDonutSegment = 'FEE'}
								onmouseleave={() => hoveredDonutSegment = 'ALL'}
								onclick={() => hoveredDonutSegment = hoveredDonutSegment === 'FEE' ? 'ALL' : 'FEE'}
								role="button"
								tabindex="0"
							/>
						{/if}
					</svg>

					<!-- Dynamic Center Summary inside Donut (Berganti Otomatis saat Di-hover) -->
					<div class="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
						{#if hoveredDonutSegment === 'SUBKON'}
							<span class="text-[9px] uppercase tracking-wider text-blue-600 font-extrabold animate-in fade-in duration-150">SUBKON RAP</span>
							<span class="text-xs sm:text-sm font-black text-slate-900 tabular-nums animate-in fade-in duration-150">{formatRupiahRingkas(totalSubkon)}</span>
							<span class="text-[9px] font-bold text-blue-700 tabular-nums">{pctSubkon}% Alokasi</span>
						{:else if hoveredDonutSegment === 'CIH'}
							<span class="text-[9px] uppercase tracking-wider text-teal-600 font-extrabold animate-in fade-in duration-150">KASIR CIH</span>
							<span class="text-xs font-black text-slate-900 tabular-nums animate-in fade-in duration-150">{formatRupiah(totalCIH)}</span>
							<span class="text-[9px] font-bold text-teal-700 tabular-nums">{pctCIHDisplay} Alokasi</span>
						{:else if hoveredDonutSegment === 'FEE'}
							<span class="text-[9px] uppercase tracking-wider text-amber-600 font-extrabold animate-in fade-in duration-150">FEE & OVERHEAD</span>
							<span class="text-xs sm:text-sm font-black text-slate-900 tabular-nums animate-in fade-in duration-150">{formatRupiahRingkas(totalFee)}</span>
							<span class="text-[9px] font-bold text-amber-700 tabular-nums">{pctFee}% Alokasi</span>
						{:else}
							<span class="text-[9px] uppercase tracking-wider text-slate-500 font-bold">TOTAL BEBAN</span>
							<span class="text-sm font-black text-slate-900 tabular-nums">{formatRupiahRingkas(totalExp)}</span>
							<span class="text-[9px] text-slate-400 font-medium">Total Beban</span>
						{/if}
					</div>
				</div>

				<!-- Donut Legend Cards (Lengkap dengan Nominal Rupiah Riil & Hover Interaktif) -->
				<div class="flex-1 space-y-2 w-full sm:w-auto">
					
					<!-- 1. Subkon (RAP) -->
					<div 
						class="flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all cursor-pointer {hoveredDonutSegment === 'SUBKON' ? 'bg-blue-50/80 border-blue-200 ring-1 ring-blue-300' : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-50'}"
						onmouseenter={() => hoveredDonutSegment = 'SUBKON'}
						onmouseleave={() => hoveredDonutSegment = 'ALL'}
						onclick={() => hoveredDonutSegment = hoveredDonutSegment === 'SUBKON' ? 'ALL' : 'SUBKON'}
						role="button"
						tabindex="0"
					>
						<div class="flex items-center gap-2.5 min-w-0">
							<span class="w-3.5 h-3.5 rounded-full bg-blue-600 shrink-0 shadow-2xs"></span>
							<div class="min-w-0">
								<div class="text-xs font-bold text-slate-900 truncate">Subkon (RAP)</div>
								<div class="text-[10px] text-slate-500 font-medium truncate">Borongan mandor & vendor</div>
							</div>
						</div>
						<div class="text-right shrink-0">
							<div class="text-xs font-extrabold text-slate-900 tabular-nums">{pctSubkon}%</div>
							<div class="text-[11px] font-bold text-blue-700 tabular-nums" title={formatRupiah(totalSubkon)}>{formatRupiahRingkas(totalSubkon)}</div>
						</div>
					</div>

					<!-- 2. Kasir CIH Lapangan -->
					<div 
						class="flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all cursor-pointer {hoveredDonutSegment === 'CIH' ? 'bg-teal-50/80 border-teal-200 ring-1 ring-teal-300' : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-50'}"
						onmouseenter={() => hoveredDonutSegment = 'CIH'}
						onmouseleave={() => hoveredDonutSegment = 'ALL'}
						onclick={() => hoveredDonutSegment = hoveredDonutSegment === 'CIH' ? 'ALL' : 'CIH'}
						role="button"
						tabindex="0"
					>
						<div class="flex items-center gap-2.5 min-w-0">
							<span class="w-3.5 h-3.5 rounded-full bg-teal-600 shrink-0 shadow-2xs"></span>
							<div class="min-w-0">
								<div class="text-xs font-bold text-slate-900 truncate">Kasir CIH Lapangan</div>
								<div class="text-[10px] text-slate-500 font-medium truncate">Kas kecil harian & belanja cepat</div>
							</div>
						</div>
						<div class="text-right shrink-0">
							<div class="text-xs font-extrabold text-slate-900 tabular-nums">{pctCIHDisplay}</div>
							<div class="text-[11px] font-bold text-teal-700 tabular-nums" title={formatRupiah(totalCIH)}>{formatRupiah(totalCIH)}</div>
						</div>
					</div>

					<!-- 3. Fee Pengawas & Lain-lain -->
					<div 
						class="flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all cursor-pointer {hoveredDonutSegment === 'FEE' ? 'bg-amber-50/80 border-amber-200 ring-1 ring-amber-300' : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-50'}"
						onmouseenter={() => hoveredDonutSegment = 'FEE'}
						onmouseleave={() => hoveredDonutSegment = 'ALL'}
						onclick={() => hoveredDonutSegment = hoveredDonutSegment === 'FEE' ? 'ALL' : 'FEE'}
						role="button"
						tabindex="0"
					>
						<div class="flex items-center gap-2.5 min-w-0">
							<span class="w-3.5 h-3.5 rounded-full bg-amber-500 shrink-0 shadow-2xs"></span>
							<div class="min-w-0">
								<div class="text-xs font-bold text-slate-900 truncate">Fee & Lain-lain</div>
								<div class="text-[10px] text-slate-500 font-medium truncate">Fee pengawas & cadangan</div>
							</div>
						</div>
						<div class="text-right shrink-0">
							<div class="text-xs font-extrabold text-slate-900 tabular-nums">{pctFee}%</div>
							<div class="text-[11px] font-bold text-amber-700 tabular-nums" title={formatRupiah(totalFee)}>{formatRupiahRingkas(totalFee)}</div>
						</div>
					</div>

				</div>
			</div>

			<!-- Status Kesehatan Portofolio (Kontras Tinggi: Hijau untuk Surplus, Merah untuk Defisit) -->
			<div class="pt-4 mt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-center">
				<div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
					<div class="text-xs font-semibold text-slate-700">Margin Surplus</div>
					<div class="text-base font-extrabold text-emerald-700 mt-0.5 tabular-nums">{surplusMarginCount} Titik</div>
				</div>
				<div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
					<div class="text-xs font-semibold text-slate-700">Perhatian Defisit</div>
					<div class="text-base font-extrabold {deficitMarginCount > 0 ? 'text-rose-700' : 'text-slate-900'} mt-0.5 tabular-nums">{deficitMarginCount} Titik</div>
				</div>
			</div>
		</div>

	</div>


	<!-- Floating/Sticky Bulk Actions Bar when rows are selected (Light Mode Elegan & Tombol Batal Merah) -->
	{#if selectedIds.size > 0}
		<div class="sticky top-20 z-20 bg-white border-2 border-blue-500/30 text-slate-900 rounded-xl p-3 shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
			<div class="flex items-center gap-2">
				<span class="font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg tabular-nums flex items-center gap-1.5 text-xs">
					<Check class="w-3.5 h-3.5" />
					{selectedIds.size} proyek dipilih
				</span>
				<span class="text-xs text-slate-600 font-medium hidden sm:inline">Pilih aksi perbandingan atau ekspor portofolio</span>
			</div>

			<div class="flex items-center gap-2">
				<button
					type="button"
					onclick={() => handleExportExcel(true)}
					class="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
				>
					<FileSpreadsheet class="w-3.5 h-3.5" />
					<span>Ekspor ({selectedIds.size})</span>
				</button>

				<button
					type="button"
					onclick={compareSelected}
					class="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
				>
					<SlidersHorizontal class="w-3.5 h-3.5 text-slate-500" />
					<span class="hidden sm:inline">Bandingkan</span>
				</button>

				<button
					type="button"
					onclick={clearSelection}
					class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
					title="Batal Pilihan"
				>
					<X class="w-3.5 h-3.5" />
					<span>Batal</span>
				</button>
			</div>
		</div>
	{/if}

	<!-- Controls & Actions Toolbar -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
		<!-- Search & Status Filter -->
		<div class="flex flex-wrap items-center gap-2 flex-1">
			<div class="relative w-full sm:w-64">
				<Search class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
				<input 
					type="text" 
					bind:value={searchQuery}
					oninput={() => currentPage = 1}
					placeholder="Cari titik proyek..."
					class="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
				/>
				{#if searchQuery}
					<button
						type="button"
						onclick={() => { searchQuery = ''; currentPage = 1; }}
						class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
						title="Hapus pencarian"
					>
						<X class="w-3.5 h-3.5" />
					</button>
				{/if}
			</div>

			<select 
				bind:value={statusFilter}
				onchange={() => currentPage = 1}
				class="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none cursor-pointer"
			>
				<option value="ALL">Semua Status</option>
				<option value="BERJALAN">Sedang Berjalan</option>
				<option value="SELESAI">Selesai (100%)</option>
				<option value="PERENCANAAN">Perencanaan</option>
			</select>
		</div>

		<!-- Action Buttons: Column Toggles & Export -->
		<div class="flex items-center gap-2">
			<!-- Column Visibility Toggles (Desktop) -->
			<div class="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50">
				<Layers class="w-3.5 h-3.5 text-slate-400" />
				<label class="flex items-center gap-1 cursor-pointer select-none">
					<input type="checkbox" bind:checked={showSubkonCol} class="rounded text-slate-900 w-3.5 h-3.5 accent-slate-900" />
					<span>Subkon</span>
				</label>
				<span class="text-slate-300">|</span>
				<label class="flex items-center gap-1 cursor-pointer select-none">
					<input type="checkbox" bind:checked={showOperasionalCol} class="rounded text-slate-900 w-3.5 h-3.5 accent-slate-900" />
					<span>CIH</span>
				</label>
				<span class="text-slate-300">|</span>
				<label class="flex items-center gap-1 cursor-pointer select-none">
					<input type="checkbox" bind:checked={showSisaPiutangCol} class="rounded text-slate-900 w-3.5 h-3.5 accent-slate-900" />
					<span>Piutang</span>
				</label>
			</div>

			<!-- Export Excel Button -->
			<button 
				type="button" 
				onclick={() => handleExportExcel(false)}
				class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
			>
				<FileSpreadsheet class="w-3.5 h-3.5 text-slate-500" />
				<span>Ekspor Excel</span>
			</button>
		</div>
	</div>

	<!-- DESKTOP DATATABLE VIEW (Hidden on mobile < 768px) -->
	<div class="hidden md:block bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-left text-xs border-collapse">
				
				<!-- Table Header with Active Sort Indicators & Checkbox All -->
				<thead class="bg-slate-50/80 text-slate-500 font-semibold text-[11px] uppercase tracking-wider border-b border-slate-200 sticky top-0 z-20">
					<tr>
						<!-- Checkbox Select All Column -->
						<th class="py-3 px-3 text-center w-10 sticky left-0 bg-slate-50 z-30 border-r border-slate-200">
							<input
								type="checkbox"
								checked={paginatedProjects.length > 0 && paginatedProjects.every(p => selectedIds.has(p.id))}
								onchange={toggleSelectAll}
								class="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 accent-slate-900 cursor-pointer"
								title="Pilih Semua di Halaman Ini"
							/>
						</th>

						<!-- Frozen Left Columns -->
						<th class="py-3 px-3 text-center w-12 sticky left-10 bg-slate-50 z-30 border-r border-slate-200">NO</th>
						<th class="py-3 px-3 sticky left-22 bg-slate-50 z-30 border-r border-slate-200 min-w-[200px]">
							<button type="button" onclick={() => toggleSort('nama')} class="flex items-center gap-1 hover:text-slate-900 group cursor-pointer">
								<span class={sortColumn === 'nama' ? 'text-slate-900 font-extrabold' : ''}>TITIK PROYEK SPPG</span>
								{#if sortColumn === 'nama'}
									{#if sortDirection === 'asc'}
										<ArrowUp class="w-3.5 h-3.5 text-slate-900" />
									{:else}
										<ArrowDown class="w-3.5 h-3.5 text-slate-900" />
									{/if}
								{:else}
									<ArrowUpDown class="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100" />
								{/if}
							</button>
						</th>

						<!-- Scrollable Columns -->
						<th class="py-3 px-3 text-center min-w-[90px]">
							<button type="button" onclick={() => toggleSort('progresFisikPct')} class="flex items-center gap-1 mx-auto hover:text-slate-900 group cursor-pointer">
								<span class={sortColumn === 'progresFisikPct' ? 'text-slate-900 font-extrabold' : ''}>PROGRES</span>
								{#if sortColumn === 'progresFisikPct'}
									{#if sortDirection === 'asc'}
										<ArrowUp class="w-3.5 h-3.5 text-slate-900" />
									{:else}
										<ArrowDown class="w-3.5 h-3.5 text-slate-900" />
									{/if}
								{:else}
									<ArrowUpDown class="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100" />
								{/if}
							</button>
						</th>
						<th class="py-3 px-3 text-right min-w-[130px]">
							<button type="button" onclick={() => toggleSort('rabKontrak')} class="flex items-center gap-1 ml-auto hover:text-slate-900 group cursor-pointer">
								<span class={sortColumn === 'rabKontrak' ? 'text-slate-900 font-extrabold' : ''}>KONTRAK (RAB)</span>
								{#if sortColumn === 'rabKontrak'}
									{#if sortDirection === 'asc'}
										<ArrowUp class="w-3.5 h-3.5 text-slate-900" />
									{:else}
										<ArrowDown class="w-3.5 h-3.5 text-slate-900" />
									{/if}
								{:else}
									<ArrowUpDown class="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100" />
								{/if}
							</button>
						</th>
						<th class="py-3 px-3 text-right min-w-[130px]">
							<button type="button" onclick={() => toggleSort('terminMasuk')} class="flex items-center gap-1 ml-auto hover:text-slate-900 group cursor-pointer">
								<span class={sortColumn === 'terminMasuk' ? 'text-slate-900 font-extrabold' : ''}>TERMIN MASUK</span>
								{#if sortColumn === 'terminMasuk'}
									{#if sortDirection === 'asc'}
										<ArrowUp class="w-3.5 h-3.5 text-slate-900" />
									{:else}
										<ArrowDown class="w-3.5 h-3.5 text-slate-900" />
									{/if}
								{:else}
									<ArrowUpDown class="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100" />
								{/if}
							</button>
						</th>

						{#if showSubkonCol}
							<th class="py-3 px-3 text-right min-w-[120px]">
								<button type="button" onclick={() => toggleSort('totalBebanVendor')} class="flex items-center gap-1 ml-auto hover:text-slate-900 group cursor-pointer">
									<span class={sortColumn === 'totalBebanVendor' ? 'text-slate-900 font-extrabold' : ''}>BEBAN SUBKON</span>
									{#if sortColumn === 'totalBebanVendor'}
										{#if sortDirection === 'asc'}
											<ArrowUp class="w-3.5 h-3.5 text-slate-900" />
										{:else}
											<ArrowDown class="w-3.5 h-3.5 text-slate-900" />
										{/if}
									{:else}
										<ArrowUpDown class="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100" />
									{/if}
								</button>
							</th>
						{/if}

						{#if showOperasionalCol}
							<th class="py-3 px-3 text-right min-w-[110px]">
								<button type="button" onclick={() => toggleSort('totalOperasional')} class="flex items-center gap-1 ml-auto hover:text-slate-900 group cursor-pointer">
									<span class={sortColumn === 'totalOperasional' ? 'text-slate-900 font-extrabold' : ''}>OPERASIONAL</span>
									{#if sortColumn === 'totalOperasional'}
										{#if sortDirection === 'asc'}
											<ArrowUp class="w-3.5 h-3.5 text-slate-900" />
										{:else}
											<ArrowDown class="w-3.5 h-3.5 text-slate-900" />
										{/if}
									{:else}
										<ArrowUpDown class="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100" />
									{/if}
								</button>
							</th>
						{/if}

						<th class="py-3 px-3 text-right min-w-[130px]">
							<button type="button" onclick={() => toggleSort('labaProyek')} class="flex items-center gap-1 ml-auto hover:text-slate-900 group cursor-pointer">
								<span class={sortColumn === 'labaProyek' ? 'text-slate-900 font-extrabold' : ''}>LABA PROYEK</span>
								{#if sortColumn === 'labaProyek'}
									{#if sortDirection === 'asc'}
										<ArrowUp class="w-3.5 h-3.5 text-slate-900" />
									{:else}
										<ArrowDown class="w-3.5 h-3.5 text-slate-900" />
									{/if}
								{:else}
									<ArrowUpDown class="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100" />
								{/if}
							</button>
						</th>

						{#if showSisaPiutangCol}
							<th class="py-3 px-3 text-right min-w-[120px]">
								<button type="button" onclick={() => toggleSort('sisaTermin')} class="flex items-center gap-1 ml-auto hover:text-slate-900 group cursor-pointer">
									<span class={sortColumn === 'sisaTermin' ? 'text-slate-900 font-extrabold' : ''}>SISA PIUTANG</span>
									{#if sortColumn === 'sisaTermin'}
										{#if sortDirection === 'asc'}
											<ArrowUp class="w-3.5 h-3.5 text-slate-900" />
										{:else}
											<ArrowDown class="w-3.5 h-3.5 text-slate-900" />
										{/if}
									{:else}
										<ArrowUpDown class="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100" />
									{/if}
								</button>
							</th>
						{/if}

						<th class="py-3 px-3 text-center w-24">AKSI</th>
					</tr>
				</thead>

				<!-- Table Body (Paginated) -->
				<tbody class="divide-y divide-slate-100 font-medium">
					{#each paginatedProjects as p, index (p.id)}
						{@const isSelected = selectedIds.has(p.id)}
						<tr 
							class="transition-colors group cursor-pointer {isSelected ? 'bg-slate-100/70' : p.isOverbudget ? 'bg-rose-50/25 hover:bg-rose-50/50' : 'hover:bg-slate-50/80'}"
							onclick={() => selectedProject = p}
						>
							<!-- Checkbox Column -->
							<td class="py-2.5 px-3 text-center sticky left-0 {isSelected ? 'bg-slate-100' : 'bg-white group-hover:bg-slate-50'} z-10 border-r border-slate-100" onclick={(e) => e.stopPropagation()}>
								<input
									type="checkbox"
									checked={isSelected}
									onchange={() => toggleSelect(p.id)}
									class="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 accent-slate-900 cursor-pointer"
								/>
							</td>

							<!-- Frozen Left Columns -->
							<td class="py-2.5 px-3 text-center text-slate-400 font-medium sticky left-10 {isSelected ? 'bg-slate-100' : 'bg-white group-hover:bg-slate-50'} z-10 border-r border-slate-100">
								{p.no}
							</td>
							<td class="py-2.5 px-3 sticky left-22 {isSelected ? 'bg-slate-100' : 'bg-white group-hover:bg-slate-50'} z-10 border-r border-slate-100">
								<div class="font-bold text-slate-900 flex items-center gap-1.5">
									<span>{p.nama}</span>
									{#if p.isKasbonWarning}
										<span title="Peringatan Kasbon Subkon melebihi progres fisik" class="inline-flex">
											<AlertTriangle class="w-3.5 h-3.5 text-amber-500 shrink-0" />
										</span>
									{/if}
								</div>
								<div class="text-[10px] text-slate-400">{p.kode}</div>
							</td>

							<!-- Progres Fisik Badge -->
							<td class="py-2.5 px-3 text-center">
								<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 tabular-nums">
									{p.progresFisikPct}%
								</span>
							</td>

							<!-- Nilai Kontrak RAB -->
							<td class="py-2.5 px-3 text-right tabular-nums text-slate-900 font-bold">
								{formatRupiah(p.rabKontrak)}
							</td>

							<!-- Termin Masuk -->
							<td class="py-2.5 px-3 text-right tabular-nums text-slate-900 font-bold">
								{formatRupiah(p.terminMasuk)}
							</td>

							<!-- Beban Subkon -->
							{#if showSubkonCol}
								<td class="py-2.5 px-3 text-right tabular-nums text-slate-700 font-semibold">
									{formatRupiah(p.totalBebanVendor)}
								</td>
							{/if}

							<!-- Operasional CIH -->
							{#if showOperasionalCol}
								<td class="py-2.5 px-3 text-right tabular-nums text-slate-700 font-semibold">
									{formatRupiah(p.totalOperasional)}
								</td>
							{/if}

							<!-- Laba Proyek & Status Kas Berjalan -->
							<td class="py-2.5 px-3 text-right tabular-nums">
								<div class="font-extrabold text-slate-900">{formatRupiah(p.labaProyek ?? p.marginBersih)}</div>
								{#if p.marginBersih < 0}
									<div class="text-[10px] font-bold text-amber-700" title="Dana talangan sementara. Belum dicairkan owner: {formatRupiah(p.sisaTermin)}">
										Kas: -{formatRupiahRingkas(Math.abs(p.marginBersih))} (Talangan)
									</div>
								{:else}
									<div class="text-[10px] font-semibold text-emerald-700">
										+{formatPersen(p.labaPct ?? p.marginPct)} Laba
									</div>
								{/if}
							</td>

							<!-- Sisa Piutang Klien -->
							{#if showSisaPiutangCol}
								<td class="py-2.5 px-3 text-right tabular-nums text-slate-800 font-semibold">
									{formatRupiah(p.sisaTermin)}
								</td>
							{/if}

							<!-- Tombol Aksi Detail & Sub-Ledger -->
							<td class="py-2.5 px-3 text-center" onclick={(e) => e.stopPropagation()}>
								<div class="flex items-center justify-center gap-1">
									<button
										type="button"
										onclick={() => selectedProject = p}
										class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
										title="Buka Ringkasan Drawer"
									>
										<Eye class="w-4 h-4" />
									</button>
									<a 
										href="/proyek/{p.hashId}"
										class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
										title="Buka Halaman Sub-Ledger Proyek"
									>
										<ExternalLink class="w-4 h-4" />
									</a>
								</div>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="11" class="py-12 text-center text-slate-400">
								Tidak ada titik proyek yang cocok dengan pencarian atau filter.
							</td>
						</tr>
					{/each}
				</tbody>

				<!-- Sticky Table Footer: Rekapitulasi Total Finansial -->
				<tfoot class="bg-slate-50 font-bold border-t border-slate-200 text-xs">
					<tr>
						<td class="py-3 px-3 text-center sticky left-0 bg-slate-50 z-10 border-r border-slate-200 text-slate-400 font-medium">
							-
						</td>
						<td class="py-3 px-3 text-center sticky left-10 bg-slate-50 z-10 border-r border-slate-200 text-slate-400 font-medium">
							Σ
						</td>
						<td class="py-3 px-3 sticky left-22 bg-slate-50 z-10 border-r border-slate-200 text-slate-900 font-bold uppercase">
							TOTAL ({filteredProjects.length} TITIK)
						</td>
						<td class="py-3 px-3 text-center text-slate-400">-</td>
						<td class="py-3 px-3 text-right tabular-nums text-slate-900 font-bold">
							{formatRupiah(totalRab)}
						</td>
						<td class="py-3 px-3 text-right tabular-nums text-slate-800 font-bold">
							{formatRupiah(totalTermin)}
						</td>
						{#if showSubkonCol}
							<td class="py-3 px-3 text-right tabular-nums text-slate-700 font-bold">
								{formatRupiah(totalBebanVendor)}
							</td>
						{/if}
						{#if showOperasionalCol}
							<td class="py-3 px-3 text-right tabular-nums text-slate-700 font-bold">
								{formatRupiah(totalOperasional)}
							</td>
						{/if}
						<td class="py-3 px-3 text-right tabular-nums font-bold {totalMarginBersih < 0 ? 'text-rose-600' : 'text-slate-900'}">
							<div>{formatRupiah(totalMarginBersih)}</div>
							<div class="text-[10px] font-normal {totalMarginBersih < 0 ? 'text-rose-500' : 'text-slate-400'}">{formatPersen(totalMarginPct)}</div>
						</td>
						{#if showSisaPiutangCol}
							<td class="py-3 px-3 text-right tabular-nums text-slate-700 font-bold">
								{formatRupiah(totalSisaTermin)}
							</td>
						{/if}
						<td class="py-3 px-3 text-center text-slate-400">-</td>
					</tr>
				</tfoot>

			</table>
		</div>
	</div>

	<!-- MOBILE DATA CARDS VIEW (Displayed on screens < 768px) -->
	<div class="md:hidden space-y-3">
		<!-- Mobile Header Summary & Select All -->
		<div class="flex items-center justify-between px-1 text-xs text-slate-600">
			<span>Daftar Proyek ({filteredProjects.length})</span>
			<button
				type="button"
				onclick={toggleSelectAll}
				class="font-semibold text-slate-900 hover:underline flex items-center gap-1"
			>
				<CheckSquare class="w-3.5 h-3.5" />
				<span>{paginatedProjects.every(p => selectedIds.has(p.id)) ? 'Batal Semua' : 'Pilih Semua'}</span>
			</button>
		</div>

		{#each paginatedProjects as p (p.id)}
			{@const isSelected = selectedIds.has(p.id)}
			<div 
				class="bg-white rounded-xl border p-4 shadow-xs transition-all {isSelected ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50/50' : p.isOverbudget ? 'border-rose-300 bg-rose-50/15' : 'border-slate-200'}"
			>
				<!-- Top Bar: Checkbox, Name, Status Badge -->
				<div class="flex items-start justify-between gap-2">
					<div class="flex items-start gap-2.5 flex-1 min-w-0">
						<!-- Mobile Checkbox with large touch target -->
						<label class="min-w-[32px] min-h-[32px] flex items-center justify-center cursor-pointer -mt-1 -ml-1">
							<input
								type="checkbox"
								checked={isSelected}
								onchange={() => toggleSelect(p.id)}
								class="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 accent-slate-900 cursor-pointer"
							/>
						</label>

						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-1.5 flex-wrap">
								<span class="font-bold text-sm text-slate-900 leading-snug">{p.nama}</span>
								{#if p.isKasbonWarning}
									<span title="Kasbon subkon melebihi progres fisik" class="inline-flex text-amber-500">
										<AlertTriangle class="w-3.5 h-3.5" />
									</span>
								{/if}
							</div>
							<div class="text-[11px] text-slate-400 font-medium">{p.kode} &bull; {p.lokasi}</div>
						</div>
					</div>

					<span class="text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600 shrink-0">
						{p.status}
					</span>
				</div>

				<!-- Progres Fisik Bar -->
				<div class="mt-3">
					<div class="flex items-center justify-between text-xs mb-1">
						<span class="text-slate-500 font-medium">Progres Fisik:</span>
						<span class="font-bold text-slate-900 tabular-nums">{p.progresFisikPct}%</span>
					</div>
					<div class="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
						<div 
							class="h-full rounded-full transition-all duration-300 bg-slate-800"
							style="width: {Math.min(100, p.progresFisikPct)}%"
						></div>
					</div>
				</div>

				<!-- Financial 2x2 Grid (High Contrast for Senior Eyes) -->
				<div class="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
					<div class="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
						<div class="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Kontrak RAB</div>
						<div class="font-extrabold text-slate-900 tabular-nums mt-0.5">{formatRupiah(p.rabKontrak)}</div>
					</div>
					<div class="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
						<div class="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Termin Masuk</div>
						<div class="font-extrabold text-slate-900 tabular-nums mt-0.5">{formatRupiah(p.terminMasuk)}</div>
					</div>
					<div class="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
						<div class="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Beban Subkon</div>
						<div class="font-bold text-slate-800 tabular-nums mt-0.5">{formatRupiah(p.totalBebanVendor)}</div>
					</div>
					<div class="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
						<div class="text-[10px] text-slate-700 font-bold uppercase tracking-wider">Margin Bersih</div>
						<div class="font-extrabold tabular-nums mt-0.5 {p.marginBersih < 0 ? 'text-rose-700' : 'text-slate-900'}">
							{formatRupiah(p.marginBersih)}
						</div>
					</div>
				</div>

				<!-- Mobile Action Buttons (Touch target >= 44px) -->
				<div class="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100">
					<button
						type="button"
						onclick={() => selectedProject = p}
						class="min-h-[44px] px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
					>
						<Eye class="w-4 h-4 text-slate-400" />
						<span>Ringkasan</span>
					</button>

					<a
						href="/proyek/{p.hashId}"
						class="min-h-[44px] px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
					>
						<span>Sub-Ledger</span>
						<ExternalLink class="w-3.5 h-3.5 text-slate-400" />
					</a>
				</div>
			</div>
		{:else}
			<div class="py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 p-6">
				Tidak ada titik proyek yang cocok dengan filter.
			</div>
		{/each}
	</div>

	<!-- Pagination Component (Shared for desktop & mobile) -->
	<div class="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
		<DataTablePagination
			bind:pageSize
			bind:currentPage
			totalItems={filteredProjects.length}
		/>
	</div>

</div>

<!-- Slide-Over Drawer: Ringkasan Cepat Proyek (Tanpa Reload Halaman) -->
{#if selectedProject}
	<div 
		class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end"
		onclick={() => selectedProject = null}
		role="dialog"
		aria-modal="true"
	>
		<div 
			class="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
			onclick={(e) => e.stopPropagation()}
			role="document"
		>
			<div class="space-y-6">
				<!-- Drawer Header -->
				<div class="flex items-start justify-between border-b border-slate-100 pb-4">
					<div>
						<div class="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{selectedProject.kode}</div>
						<h2 class="text-lg font-bold text-slate-900 leading-snug">{selectedProject.nama}</h2>
						<div class="text-xs text-slate-500 mt-0.5">Status: <span class="font-semibold text-slate-800">{selectedProject.status}</span></div>
					</div>
					<button 
						type="button" 
						onclick={() => selectedProject = null}
						class="min-w-[40px] min-h-[40px] rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
						aria-label="Tutup Panel"
					>
						<X class="w-5 h-5" />
					</button>
				</div>

				<!-- Metrik Utama Drawer -->
				<div class="grid grid-cols-2 gap-3">
					<div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
						<div class="text-[10px] text-slate-500 font-semibold uppercase">Nilai Kontrak (RAB)</div>
						<div class="text-sm font-bold text-slate-900 mt-1 tabular-nums">{formatRupiah(selectedProject.rabKontrak)}</div>
					</div>
					<div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
						<div class="text-[10px] text-slate-500 font-semibold uppercase">Progres Fisik</div>
						<div class="text-sm font-bold text-blue-600 mt-1 tabular-nums">{selectedProject.progresFisikPct}%</div>
					</div>
					<div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
						<div class="text-[10px] text-slate-500 font-semibold uppercase">Termin Cair</div>
						<div class="text-sm font-bold text-emerald-600 mt-1 tabular-nums">{formatRupiah(selectedProject.terminMasuk)}</div>
					</div>
					<div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
						<div class="text-[10px] text-slate-500 font-semibold uppercase">Sisa Piutang Klien</div>
						<div class="text-sm font-bold text-slate-700 mt-1 tabular-nums">{formatRupiah(selectedProject.sisaTermin)}</div>
					</div>
				</div>

				<!-- Breakdown Pengeluaran Proyek -->
				<div class="border border-slate-200 rounded-lg p-4 space-y-2.5">
					<div class="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2">Rincian Realisasi Pengeluaran</div>
					
					<div class="flex items-center justify-between text-xs">
						<span class="text-slate-500">Beban Subkon / Tukang:</span>
						<span class="font-semibold text-slate-800 tabular-nums">{formatRupiah(selectedProject.totalBebanVendor)}</span>
					</div>

					<div class="flex items-center justify-between text-xs">
						<span class="text-slate-500">Biaya Operasional Lapangan (CIH):</span>
						<span class="font-semibold text-slate-800 tabular-nums">{formatRupiah(selectedProject.totalOperasional)}</span>
					</div>

					{#if selectedProject.totalFeeVendor > 0}
						<div class="flex items-center justify-between text-xs">
							<span class="text-slate-500">Alokasi Fee Pengawas:</span>
							<span class="font-semibold text-slate-800 tabular-nums">{formatRupiah(selectedProject.totalFeeVendor)}</span>
						</div>
					{/if}

					<div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
						<span class="text-slate-900">Total Pengeluaran:</span>
						<span class="text-rose-600 tabular-nums">{formatRupiah(selectedProject.totalPengeluaran)}</span>
					</div>

					<div class="pt-2 border-t border-slate-200 flex items-center justify-between text-xs font-bold">
						<span class="text-slate-900">Margin Bersih Saat Ini:</span>
						<span class="tabular-nums {selectedProject.marginBersih >= 0 ? 'text-emerald-700' : 'text-rose-600'}">
							{formatRupiah(selectedProject.marginBersih)} ({formatPersen(selectedProject.marginPct)})
						</span>
					</div>
				</div>

				<!-- Warning Card if Any -->
				{#if selectedProject.isKasbonWarning}
					<div class="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-800">
						<AlertTriangle class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
						<div>
							<div class="font-bold">Peringatan Plafon Kasbon</div>
							<div>Pembayaran ke subkon telah mencapai bobot lebih tinggi dari progres fisik ({selectedProject.progresFisikPct}%). Harap cek opname fisik lapangan.</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Drawer Footer Action -->
			<div class="pt-4 border-t border-slate-100 flex items-center gap-2">
				<a 
					href="/proyek/{selectedProject.hashId}"
					class="w-full min-h-[44px] py-2 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
				>
					<span>Buka Detail Lengkap Subkon & Termin</span>
					<ExternalLink class="w-4 h-4 text-emerald-400" />
				</a>
			</div>
		</div>
	</div>
{/if}
