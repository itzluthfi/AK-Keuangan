<script lang="ts">
	import {
		Building2,
		Layers,
		Search,
		ExternalLink,
		ChevronRight,
		CheckCircle2,
		Clock,
		MapPin,
		UtensilsCrossed,
		Eye
	} from 'lucide-svelte';

	let { data } = $props();

	let searchQuery = $state('');
	let statusFilter = $state('ALL');

	function formatRupiah(num: number) {
		return 'Rp ' + Math.round(num).toLocaleString('id-ID');
	}

	let filteredProjects = $derived(
		data.projects.filter(p => {
			const matchText = p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.kode.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(p.lokasi || '').toLowerCase().includes(searchQuery.toLowerCase());
			if (!matchText) return false;
			if (statusFilter === 'SELESAI') return p.progresFisikPct === 100;
			if (statusFilter === 'ON_PROGRESS') return p.progresFisikPct > 0 && p.progresFisikPct < 100;
			return true;
		})
	);
</script>

<svelte:head>
	<title>Portofolio Proyek & Kontrak - Pantau Keuangan</title>
</svelte:head>

<div class="space-y-6">

	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
		<div>
			<h1 class="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
				Portofolio Proyek & Kontrak Fisik
			</h1>
			<p class="text-xs text-slate-500 mt-0.5">
				Monitoring 27 proyek pelaksanaan fisik borongan, renovasi, dan perencanaan desain
			</p>
		</div>

		<!-- Mini Stats -->
		<div class="flex items-center gap-2">
			<div class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs">
				<span class="text-slate-500">Total Proyek:</span>
				<span class="font-bold text-slate-900 ml-1 tabular-nums">{data.totalTitik}</span>
			</div>
			<div class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs">
				<span class="text-slate-500">Selesai (100%):</span>
				<span class="font-bold text-slate-900 ml-1 tabular-nums">{data.selesaiCount}</span>
			</div>
			<div class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs">
				<span class="text-slate-500">Konstruksi:</span>
				<span class="font-bold text-slate-900 ml-1 tabular-nums">{data.onProgressCount}</span>
			</div>
		</div>
	</div>

	<!-- Filter & Search Toolbar -->
	<div class="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-2xs">
		<div class="relative w-full sm:w-80">
			<Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
			<input
				type="text"
				placeholder="Cari nama proyek, kode, atau lokasi..."
				bind:value={searchQuery}
				class="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
			/>
		</div>

		<div class="flex items-center gap-2 w-full sm:w-auto">
			<select
				bind:value={statusFilter}
				class="w-full sm:w-auto text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none"
			>
				<option value="ALL">Semua Status Proyek ({data.projects.length})</option>
				<option value="SELESAI">Fisik 100% Selesai ({data.selesaiCount})</option>
				<option value="ON_PROGRESS">Dalam Konstruksi ({data.onProgressCount})</option>
			</select>
		</div>
	</div>

	<!-- Project Cards Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
		{#each filteredProjects as p (p.id)}
			<div class="bg-white rounded-xl border border-slate-200 p-4.5 hover:border-slate-300 transition-all shadow-2xs flex flex-col justify-between">
				<div>
					<div class="flex items-start justify-between gap-2 mb-1.5">
						<div>
							<div class="flex items-center gap-1.5">
								<span class="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{p.kode}</span>
								<span class="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">{p.kategoriPekerjaan}</span>
							</div>
							<h2 class="text-sm font-bold text-slate-900 mt-0.5 line-clamp-1">{p.nama}</h2>
						</div>
						<span class="px-2 py-0.5 rounded text-[10px] font-bold {p.progresFisikPct === 100 ? 'bg-slate-100 text-slate-800' : 'bg-blue-50 text-blue-700'} border border-slate-200/80">
							{p.progresFisikPct}%
						</span>
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
								<div class="font-bold text-amber-700 mt-0.5 tabular-nums" title="Dana talangan sementara. Sisa termin yang belum ditarik: {formatRupiah(p.sisaTermin)}">
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

</div>
