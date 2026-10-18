<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { appState } from '#lib/app-state.svelte';
	import {
		Search,
		X,
		Layers,
		HardHat,
		FileText,
		LayoutDashboard,
		ArrowRightLeft,
		Receipt,
		FileSpreadsheet,
		Landmark,
		Users,
		KeyRound,
		Settings,
		ChevronRight
	} from 'lucide-svelte';

	let query = $state('');
	let inputEl = $state<HTMLInputElement | null>(null);

	// Quick Navigation links
	const NAV_ITEMS = [
		{ title: 'Kas Besar (Dashboard)', url: '/', icon: LayoutDashboard, category: 'Menu Utama' },
		{ title: 'Cash Pooling', url: '/cash-pooling', icon: ArrowRightLeft, category: 'Menu Utama' },
		{ title: 'Kasir CIH Lapangan', url: '/kas-lapangan', icon: Receipt, category: 'Operasional' },
		{ title: 'Generator Invoice', url: '/invoice', icon: FileText, category: 'Operasional' },
		{ title: 'Laporan Rekapitulasi Cetak', url: '/cetak/laporan', icon: FileSpreadsheet, category: 'Laporan' },
		{ title: 'Titik Proyek SPPG', url: '/proyek', icon: Layers, category: 'Master Data' },
		{ title: 'Subkon & Mandor', url: '/subkon', icon: HardHat, category: 'Master Data' },
		{ title: 'Rekening Bank & Kas', url: '/rekening', icon: Landmark, category: 'Master Data' },
		{ title: 'Pengguna Sistem', url: '/pengguna', icon: Users, category: 'Master Data' },
		{ title: 'Peran & Hak Akses', url: '/peran', icon: KeyRound, category: 'Master Data' },
		{ title: 'Pengaturan Sistem', url: '/pengaturan', icon: Settings, category: 'Sistem' }
	];

	let projectsList = $derived(page.data.searchData?.projects || []);
	let vendorsList = $derived(page.data.searchData?.vendors || []);

	let filteredNav = $derived(
		query.trim() === ''
			? NAV_ITEMS
			: NAV_ITEMS.filter(n => n.title.toLowerCase().includes(query.toLowerCase()) || n.category.toLowerCase().includes(query.toLowerCase()))
	);

	let filteredProjects = $derived(
		query.trim() === ''
			? projectsList.slice(0, 4)
			: projectsList.filter((p: any) =>
					p.nama.toLowerCase().includes(query.toLowerCase()) ||
					p.kode.toLowerCase().includes(query.toLowerCase()) ||
					(p.lokasi || '').toLowerCase().includes(query.toLowerCase())
			  ).slice(0, 6)
	);

	let filteredVendors = $derived(
		query.trim() === ''
			? vendorsList.slice(0, 3)
			: vendorsList.filter((v: any) =>
					v.nama.toLowerCase().includes(query.toLowerCase()) ||
					(v.bidang || '').toLowerCase().includes(query.toLowerCase())
			  ).slice(0, 5)
	);

	function navigateTo(url: string) {
		appState.closeSearch();
		query = '';
		goto(url);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
			e.preventDefault();
			if (appState.isSearchOpen) appState.closeSearch();
			else appState.openSearch();
		}
		if (e.key === 'Escape' && appState.isSearchOpen) {
			appState.closeSearch();
		}
	}

	$effect(() => {
		if (appState.isSearchOpen) {
			setTimeout(() => inputEl?.focus(), 50);
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if appState.isSearchOpen}
	<div
		class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 pt-16 sm:pt-24 animate-in fade-in duration-150"
		onclick={() => appState.closeSearch()}
		role="dialog"
		aria-modal="true"
	>
		<div
			class="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
			onclick={(e) => e.stopPropagation()}
			role="document"
		>
			<!-- Search Input Box -->
			<div class="h-14 border-b border-slate-200 px-4 flex items-center gap-3">
				<Search class="w-5 h-5 text-slate-400 shrink-0" />
				<input
					bind:this={inputEl}
					bind:value={query}
					type="text"
					placeholder="Cari proyek, subkon, halaman, faktur..."
					class="w-full text-sm font-medium bg-transparent border-none outline-hidden focus:ring-0 text-slate-900 placeholder:text-slate-400"
				/>
				{#if query}
					<button
						type="button"
						onclick={() => query = ''}
						class="p-1 rounded-md text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
					>
						<X class="w-4 h-4" />
					</button>
				{/if}
				<kbd class="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-200 rounded bg-slate-50">ESC</kbd>
			</div>

			<!-- Search Results List -->
			<div class="flex-1 overflow-y-auto p-3 space-y-4">
				
				<!-- Titik Proyek Results -->
				{#if filteredProjects.length > 0}
					<div>
						<div class="px-2.5 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
							Titik Proyek SPPG
						</div>
						<div class="space-y-1">
							{#each filteredProjects as p}
								<button
									type="button"
									onclick={() => navigateTo('/proyek')}
									class="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between group transition-colors cursor-pointer"
								>
									<div class="flex items-center gap-3 min-w-0">
										<div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
											<Layers class="w-4 h-4" />
										</div>
										<div class="truncate">
											<div class="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
												{p.nama}
											</div>
											<div class="text-[11px] text-slate-400 font-mono">
												{p.kode} &bull; {p.lokasi || 'Jawa Timur'} &bull; Progres {Math.round(p.progresFisikPct || 0)}%
											</div>
										</div>
									</div>
									<ChevronRight class="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors shrink-0" />
								</button>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Subkon Results -->
				{#if filteredVendors.length > 0}
					<div>
						<div class="px-2.5 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
							Subkon & Mandor
						</div>
						<div class="space-y-1">
							{#each filteredVendors as v}
								<button
									type="button"
									onclick={() => navigateTo('/subkon')}
									class="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between group transition-colors cursor-pointer"
								>
									<div class="flex items-center gap-3 min-w-0">
										<div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-100">
											<HardHat class="w-4 h-4" />
										</div>
										<div class="truncate">
											<div class="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors truncate">
												{v.nama}
											</div>
											<div class="text-[11px] text-slate-400">
												Bidang: {v.bidang || 'Pelaksana Lapangan'} {v.bankNama ? `• ${v.bankNama}` : ''}
											</div>
										</div>
									</div>
									<ChevronRight class="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors shrink-0" />
								</button>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Navigasi Cepat -->
				<div>
					<div class="px-2.5 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
						Halaman & Navigasi
					</div>
					<div class="space-y-1">
						{#each filteredNav as item}
							<button
								type="button"
								onclick={() => navigateTo(item.url)}
								class="w-full text-left p-2 rounded-xl hover:bg-slate-50 flex items-center justify-between group transition-colors cursor-pointer"
							>
								<div class="flex items-center gap-2.5 min-w-0">
									<div class="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
										<item.icon class="w-3.5 h-3.5" />
									</div>
									<span class="text-xs font-medium text-slate-700 group-hover:text-slate-900 truncate">
										{item.title}
									</span>
								</div>
								<span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
									{item.category}
								</span>
							</button>
						{/each}
					</div>
				</div>

			</div>

			<!-- Footer Tips -->
			<div class="border-t border-slate-100 px-4 py-2.5 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-400">
				<div class="flex items-center gap-2">
					<span>Gunakan</span>
					<kbd class="px-1.5 py-0.5 rounded border border-slate-200 bg-white font-mono text-[10px] text-slate-600 font-bold">Ctrl + K</kbd>
					<span>untuk membuka kapan saja</span>
				</div>
				<div>{filteredProjects.length + filteredVendors.length + filteredNav.length} hasil</div>
			</div>
		</div>
	</div>
{/if}
