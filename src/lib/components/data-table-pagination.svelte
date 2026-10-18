<script lang="ts">
	import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-svelte';

	let {
		totalItems = 0,
		pageSize = $bindable(10),
		currentPage = $bindable(1)
	}: {
		totalItems: number;
		pageSize: number;
		currentPage: number;
	} = $props();

	const totalPages = $derived(pageSize <= 0 ? 1 : Math.max(1, Math.ceil(totalItems / pageSize)));
	const startItem = $derived(totalItems === 0 ? 0 : (pageSize <= 0 ? 1 : (currentPage - 1) * pageSize + 1));
	const endItem = $derived(pageSize <= 0 ? totalItems : Math.min(currentPage * pageSize, totalItems));

	function goToPage(page: number) {
		currentPage = Math.max(1, Math.min(page, totalPages));
	}

	// Calculate visible page buttons (window of 5 pages around current)
	let visiblePages = $derived.by(() => {
		if (totalPages <= 5) {
			return Array.from({ length: totalPages }, (_, i) => i + 1);
		}
		let start = Math.max(1, currentPage - 2);
		let end = Math.min(totalPages, start + 4);
		if (end - start < 4) {
			start = Math.max(1, end - 4);
		}
		const pages: number[] = [];
		for (let i = start; i <= end; i++) {
			pages.push(i);
		}
		return pages;
	});
</script>

<div class="px-4 py-3 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
	<!-- Summary & Rows Per Page -->
	<div class="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
		<div class="text-slate-600">
			{#if totalItems > 0}
				Menampilkan <strong class="text-slate-900 tabular-nums">{startItem}</strong>–<strong class="text-slate-900 tabular-nums">{endItem}</strong> dari <strong class="text-slate-900 tabular-nums">{totalItems}</strong> data
			{:else}
				<span class="text-slate-400">Tidak ada data</span>
			{/if}
		</div>

		<div class="flex items-center gap-1.5 pl-2 sm:border-l sm:border-slate-200">
			<span class="text-slate-500 hidden sm:inline">Baris:</span>
			<select
				value={pageSize}
				onchange={(e) => {
					pageSize = Number((e.target as HTMLSelectElement).value);
					currentPage = 1;
				}}
				class="h-7 text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded px-2 py-0.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
			>
				<option value={10}>10</option>
				<option value={25}>25</option>
				<option value={50}>50</option>
				<option value={0}>Semua</option>
			</select>
		</div>
	</div>

	<!-- Pagination Buttons -->
	{#if totalPages > 1}
		<div class="flex items-center gap-1">
			<!-- First Page -->
			<button
				type="button"
				disabled={currentPage <= 1}
				onclick={() => goToPage(1)}
				class="h-7 w-7 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 flex items-center justify-center transition-colors"
				title="Halaman Pertama"
			>
				<ChevronsLeft class="w-3.5 h-3.5" />
			</button>

			<!-- Previous Page -->
			<button
				type="button"
				disabled={currentPage <= 1}
				onclick={() => goToPage(currentPage - 1)}
				class="h-7 px-2 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 flex items-center gap-1 transition-colors font-medium"
				title="Halaman Sebelumnya"
			>
				<ChevronLeft class="w-3.5 h-3.5" />
				<span class="hidden md:inline">Prev</span>
			</button>

			<!-- Page Number Pills (Desktop) -->
			<div class="hidden sm:flex items-center gap-1">
				{#each visiblePages as p}
					<button
						type="button"
						onclick={() => goToPage(p)}
						class="h-7 min-w-7 px-2 rounded text-xs font-semibold transition-colors tabular-nums {currentPage === p ? 'bg-slate-900 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'}"
					>
						{p}
					</button>
				{/each}
			</div>

			<!-- Mobile Page Indicator -->
			<span class="sm:hidden text-xs font-medium text-slate-600 px-2 tabular-nums">
				{currentPage} / {totalPages}
			</span>

			<!-- Next Page -->
			<button
				type="button"
				disabled={currentPage >= totalPages}
				onclick={() => goToPage(currentPage + 1)}
				class="h-7 px-2 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 flex items-center gap-1 transition-colors font-medium"
				title="Halaman Selanjutnya"
			>
				<span class="hidden md:inline">Next</span>
				<ChevronRight class="w-3.5 h-3.5" />
			</button>

			<!-- Last Page -->
			<button
				type="button"
				disabled={currentPage >= totalPages}
				onclick={() => goToPage(totalPages)}
				class="h-7 w-7 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white text-slate-700 flex items-center justify-center transition-colors"
				title="Halaman Terakhir"
			>
				<ChevronsRight class="w-3.5 h-3.5" />
			</button>
		</div>
	{/if}
</div>
