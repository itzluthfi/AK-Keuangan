<script lang="ts">
	import { formatRupiah, formatPersen, formatTanggal } from '#lib/utils';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-french-toast';
	import {
		ArrowLeft,
		Plus,
		AlertTriangle,
		CheckCircle2,
		Receipt,
		Building2,
		Users,
		Calendar,
		FileSpreadsheet,
		X,
		ShieldAlert,
		Lock,
		Trash2,
		Edit3
	} from 'lucide-svelte';
	import { page } from '$app/state';

	let { data } = $props();

	let isSiteManager = $derived(page.data.user?.role === 'SITE_MANAGER');

	let activeTab = $state<'SUBKON' | 'TERMIN' | 'OPERASIONAL'>('SUBKON');

	// Modal States
	let showModalKasbon = $state(false);
	let showModalTermin = $state(false);
	let showModalVendor = $state(false);

	// Editing States
	let editingTermin = $state<any>(null);
	let showModalEditTermin = $state(false);

	let editingVendor = $state<any>(null);
	let showModalEditVendor = $state(false);

	let editingKasbon = $state<any>(null);
	let showModalEditKasbon = $state(false);

	// Kasbon Form Reactive Values
	let selectedVendorId = $state<number>(data.vendors[0]?.id || 0);
	let inputKasbonNominal = $state<number>(0);
	let inputPenerimaNama = $state<string>('');

	// Over-budget validation computation
	let selectedVendorObj = $derived(data.vendors.find((v: any) => v.id === selectedVendorId));
	let isKasbonOverbudget = $derived.by(() => {
		if (!selectedVendorObj) return false;
		const totalAfter = selectedVendorObj.totalTerbayar + (inputKasbonNominal || 0);
		return totalAfter > selectedVendorObj.plafonWajar;
	});
	let overbudgetDiff = $derived.by(() => {
		if (!selectedVendorObj) return 0;
		const totalAfter = selectedVendorObj.totalTerbayar + (inputKasbonNominal || 0);
		return Math.max(0, totalAfter - selectedVendorObj.plafonWajar);
	});
</script>

<div class="space-y-6">

	<!-- Breadcrumb & Navigation Back -->
	<div class="flex items-center justify-between">
		<a 
			href="/"
			class="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
		>
			<ArrowLeft class="w-4 h-4" />
			<span>Kembali ke Kas Besar</span>
		</a>

		<div class="flex items-center gap-2">
			<a 
				href="/cetak/laporan"
				class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
			>
				<FileSpreadsheet class="w-3.5 h-3.5" />
				Cetak Dokumen
			</a>
		</div>
	</div>

	<!-- Project Header Banner -->
	<div class="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
		<div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
			<div>
				<div class="flex items-center gap-2">
					<span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
						{data.project.kode}
					</span>
					<span class="px-2 py-0.5 rounded text-[10px] font-bold {data.project.status === 'SELESAI' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}">
						{data.project.status}
					</span>
				</div>
				<h1 class="text-2xl font-black text-slate-900 tracking-tight mt-1">{data.project.nama}</h1>
				<div class="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
					<span>Lokasi: {data.project.lokasi || 'Jawa Timur'}</span>
					<span>&bull;</span>
					<span>Pengawas: {data.project.picPengawas || '-'}</span>
				</div>
			</div>

			<!-- Quick Update Progres Fisik Form -->
			<form method="POST" action="?/updateProgres" class="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
				<div class="text-xs font-semibold text-slate-700">Progres Fisik:</div>
				<input 
					type="number" 
					name="progresFisikPct" 
					min="0" 
					max="100" 
					value={data.project.progresFisikPct}
					class="w-16 px-2 py-1 text-xs font-mono font-bold rounded border border-slate-300 bg-white text-center focus:ring-1 focus:ring-slate-900"
				/>
				<span class="text-xs font-mono text-slate-500">%</span>
				<button 
					type="submit" 
					class="px-2.5 py-1 text-xs font-semibold rounded bg-slate-900 text-white hover:bg-slate-800 transition-colors"
				>
					Update
				</button>
			</form>
		</div>

		<!-- 4 KPI Cards Project Specific -->
		<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
			<div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
				<div class="text-[10px] font-bold text-slate-500 uppercase">Nilai Kontrak (RAB)</div>
				<div class="text-base font-black text-slate-900 mt-0.5 tabular-nums">{formatRupiah(data.project.rabKontrak)}</div>
				<div class="text-[10px] text-slate-500 mt-1 tabular-nums">Sisa Piutang: {formatRupiah(data.project.sisaTermin)}</div>
			</div>

			<div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
				<div class="text-[10px] font-bold text-slate-500 uppercase">Termin Cair (Inflow)</div>
				<div class="text-base font-black text-emerald-600 mt-0.5 tabular-nums">{formatRupiah(data.project.totalTerminMasuk)}</div>
				<div class="text-[10px] text-slate-500 mt-1">{data.termins.length} kali pencairan</div>
			</div>

			<div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
				<div class="text-[10px] font-bold text-slate-500 uppercase">Total Realisasi Keluar</div>
				<div class="text-base font-black text-rose-600 mt-0.5 tabular-nums">{formatRupiah(data.project.totalPengeluaran)}</div>
				<div class="text-[10px] text-slate-500 mt-1">Subkon + CIH + Fee</div>
			</div>

			<div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
				<div class="text-[10px] font-bold text-slate-500 uppercase">Laba Proyek (Estimasi)</div>
				{#if isSiteManager}
					<div class="text-xs font-bold text-slate-400 mt-2 flex items-center gap-1.5">
						<Lock class="w-3.5 h-3.5 text-slate-400" />
						<span>Terproteksi Direktur</span>
					</div>
				{:else}
					<div class="text-base font-black text-emerald-700 mt-0.5 tabular-nums">
						{formatRupiah(data.project.labaProyek)}
					</div>
					<div class="text-[10px] font-medium text-slate-500 mt-1 flex items-center justify-between">
						<span class="font-bold text-emerald-600">{formatPersen(data.project.labaPct)} Laba</span>
						{#if data.project.arusKas < 0}
							<span class="text-amber-700 font-bold" title="Dana talangan kas berjalan sebelum termin berikutnya dicairkan owner">
								Kas: -{formatRupiah(Math.abs(data.project.arusKas))} (Talangan)
							</span>
						{:else}
							<span class="text-slate-600 font-medium">
								Kas: +{formatRupiah(data.project.arusKas)}
							</span>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		<!-- Dual Progress Bar: Fisik vs Keuangan -->
		<div class="space-y-1.5 pt-1">
			<div class="flex items-center justify-between text-xs font-semibold text-slate-600">
				<span>Perbandingan Progres Fisik vs Beban Keuangan Terbayar</span>
				<span class="text-slate-800 tabular-nums">Fisik: {data.project.progresFisikPct}% | Biaya: {data.project.rabKontrak > 0 ? formatPersen((data.project.totalPengeluaran / data.project.rabKontrak) * 100) : '0%'}</span>
			</div>
			<div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
				<div class="bg-blue-600 h-full" style="width: {Math.min(100, data.project.progresFisikPct)}%" title="Progres Fisik Lapangan"></div>
			</div>
		</div>
	</div>

	<!-- Navigation Tabs -->
	<div class="border-b border-slate-200 flex items-center justify-between">
		<div class="flex items-center gap-4">
			<button 
				type="button" 
				onclick={() => activeTab = 'SUBKON'}
				class="pb-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors {activeTab === 'SUBKON' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}"
			>
				<Users class="w-4 h-4" />
				Subkon & RAP Pekerjaan ({data.vendors.length})
			</button>

			<button 
				type="button" 
				onclick={() => activeTab = 'TERMIN'}
				class="pb-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors {activeTab === 'TERMIN' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}"
			>
				<CheckCircle2 class="w-4 h-4" />
				Termin Klien ({data.termins.length})
			</button>

			<button 
				type="button" 
				onclick={() => activeTab = 'OPERASIONAL'}
				class="pb-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors {activeTab === 'OPERASIONAL' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}"
			>
				<Receipt class="w-4 h-4" />
				Beban Kas Kecil CIH ({data.cihTransactions.length})
			</button>
		</div>

		<!-- Action Add Buttons -->
		<div class="pb-2 flex items-center gap-2">
			{#if activeTab === 'SUBKON'}
				<button 
					type="button" 
					onclick={() => showModalKasbon = true}
					class="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold flex items-center gap-1 shadow-xs"
				>
					<Plus class="w-3.5 h-3.5" />
					Catat Kasbon Vendor
				</button>
				<button 
					type="button" 
					onclick={() => showModalVendor = true}
					class="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 shadow-xs"
				>
					<Plus class="w-3.5 h-3.5" />
					Tambah Subkon
				</button>
			{:else if activeTab === 'TERMIN'}
				<button 
					type="button" 
					onclick={() => showModalTermin = true}
					class="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1 shadow-xs"
				>
					<Plus class="w-3.5 h-3.5" />
					Catat Termin Cair
				</button>
			{/if}
		</div>
	</div>

	<!-- Tab 1: Subkon & RAP Pekerjaan Content -->
	{#if activeTab === 'SUBKON'}
		<div class="space-y-4">
			{#each data.vendors as v (v.id)}
				<div class="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
					<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
						<div>
							<div class="text-sm font-bold text-slate-900 flex items-center gap-2">
								<span>{v.namaVendor}</span>
								<span class="text-xs font-normal text-slate-500">({v.pekerjaan})</span>
								{#if v.isOverPlafon}
									<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
										<AlertTriangle class="w-3 h-3 text-amber-600" />
										Kasbon Melebihi Progres Fisik ({data.project.progresFisikPct}%)
									</span>
								{/if}
							</div>
						</div>

						<div class="flex flex-wrap items-center gap-3">
							<div class="flex items-center gap-4 text-xs font-mono">
								<div>
									<span class="text-slate-400">RAP:</span> 
									<span class="font-bold text-slate-900">{formatRupiah(v.rapNilai)}</span>
								</div>
								<div>
									<span class="text-slate-400">Terbayar:</span> 
									<span class="font-bold text-rose-600">{formatRupiah(v.totalTerbayar)}</span>
								</div>
								<div>
									<span class="text-slate-400">Sisa:</span> 
									<span class="font-bold text-slate-700">{formatRupiah(v.sisaHutang)}</span>
								</div>
							</div>

							<div class="flex items-center gap-1 border-l border-slate-200 pl-2">
								<button
									type="button"
									onclick={() => {
										editingVendor = { ...v };
										showModalEditVendor = true;
									}}
									class="p-1 text-slate-400 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
									title="Edit Subkon"
								>
									<Edit3 class="w-3.5 h-3.5" />
								</button>

								{#if v.payments.length === 0}
									<form
										method="POST"
										action="?/deleteVendor"
										use:enhance={() => {
											if (!confirm(`Hapus subkon ${v.namaVendor}?`)) return () => {};
											return async ({ update, result }) => {
												await update();
												if (result.type === 'success') toast.success('Subkon berhasil dihapus.');
												else if (result.type === 'failure') toast.error(String((result.data as any)?.error || 'Gagal menghapus subkon.'));
											};
										}}
									>
										<input type="hidden" name="id" value={v.id} />
										<button
											type="submit"
											class="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
											title="Hapus Subkon"
										>
											<Trash2 class="w-3.5 h-3.5" />
										</button>
									</form>
								{/if}
							</div>
						</div>
					</div>

					<!-- Desktop Table: Riwayat Pembayaran Subkon -->
					<div class="hidden md:block overflow-x-auto">
						<table class="w-full text-left text-xs border-collapse">
							<thead class="bg-slate-50 text-slate-600 border-b border-slate-100">
								<tr>
									<th class="py-2 px-3">TANGGAL</th>
									<th class="py-2 px-3">TIPE</th>
									<th class="py-2 px-3">PENERIMA</th>
									<th class="py-2 px-3 text-right">NOMINAL</th>
									<th class="py-2 px-3 text-center">STATUS</th>
									<th class="py-2 px-3 text-right">AKSI</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-slate-100">
								{#each v.payments as pm (pm.id)}
									<tr class="hover:bg-slate-50">
										<td class="py-2 px-3 text-slate-600 tabular-nums">{formatTanggal(pm.tglBayar)}</td>
										<td class="py-2 px-3 text-slate-800 font-medium">{pm.tipe}</td>
										<td class="py-2 px-3 text-slate-700">{pm.penerimaNama}</td>
										<td class="py-2 px-3 text-right font-bold text-slate-900 tabular-nums">{formatRupiah(pm.nominal)}</td>
										<td class="py-2 px-3 text-center">
											<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
												Tercairkan
											</span>
										</td>
										<td class="py-2 px-3 text-right">
											<div class="inline-flex items-center gap-1">
												<button
													type="button"
													onclick={() => {
														editingKasbon = { ...pm };
														showModalEditKasbon = true;
													}}
													class="p-1 text-slate-400 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
													title="Edit Kasbon"
												>
													<Edit3 class="w-3 h-3" />
												</button>
												<form
													method="POST"
													action="?/deleteKasbon"
													use:enhance={() => {
														if (!confirm(`Hapus kasbon sebesar ${formatRupiah(pm.nominal)}?`)) return () => {};
														return async ({ update, result }) => {
															await update();
															if (result.type === 'success') toast.success('Kasbon berhasil dihapus.');
															else if (result.type === 'failure') toast.error(String((result.data as any)?.error || 'Gagal menghapus kasbon.'));
														};
													}}
												>
													<input type="hidden" name="id" value={pm.id} />
													<button
														type="submit"
														class="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
														title="Hapus Kasbon"
													>
														<Trash2 class="w-3 h-3" />
													</button>
												</form>
											</div>
										</td>
									</tr>
								{:else}
									<tr>
										<td colspan="6" class="py-4 text-center text-slate-400">
											Belum ada riwayat kasbon/pembayaran untuk vendor ini.
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>

					<!-- Mobile Cards View for Payments -->
					<div class="md:hidden space-y-2">
						{#each v.payments as pm (pm.id)}
							<div class="p-3 bg-slate-50/70 rounded-xl border border-slate-100 text-xs space-y-2">
								<div class="flex items-center justify-between">
									<span class="font-bold text-slate-900">{pm.penerimaNama}</span>
									<span class="font-mono font-bold text-rose-600">{formatRupiah(pm.nominal)}</span>
								</div>
								<div class="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/50">
									<span>{formatTanggal(pm.tglBayar)} &bull; {pm.tipe}</span>
									<div class="flex items-center gap-1.5">
										<button
											type="button"
											onclick={() => {
												editingKasbon = { ...pm };
												showModalEditKasbon = true;
											}}
											class="p-1 text-slate-600 hover:text-slate-900"
											title="Edit Kasbon"
										>
											<Edit3 class="w-3.5 h-3.5" />
										</button>
										<form
											method="POST"
											action="?/deleteKasbon"
											use:enhance={() => {
												if (!confirm(`Hapus kasbon sebesar ${formatRupiah(pm.nominal)}?`)) return () => {};
												return async ({ update, result }) => {
													await update();
													if (result.type === 'success') toast.success('Kasbon berhasil dihapus.');
												};
											}}
										>
											<input type="hidden" name="id" value={pm.id} />
											<button type="submit" class="p-1 text-rose-600 cursor-pointer" title="Hapus Kasbon">
												<Trash2 class="w-3.5 h-3.5" />
											</button>
										</form>
									</div>
								</div>
							</div>
						{:else}
							<div class="py-4 text-center text-slate-400 text-xs">
								Belum ada riwayat kasbon untuk vendor ini.
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div class="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
					Belum ada subkon terdaftar di proyek ini. Klik "Tambah Subkon" untuk menambahkan.
				</div>
			{/each}
		</div>
	{/if}

	<!-- Tab 2: Termin Klien Content -->
	{#if activeTab === 'TERMIN'}
		<div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
			<!-- Desktop Table for Termin -->
			<div class="hidden md:block overflow-x-auto">
				<table class="w-full text-left text-xs border-collapse">
					<thead class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
						<tr>
							<th class="py-3 px-3">TAHAP TERMIN</th>
							<th class="py-3 px-3 text-right">NOMINAL RENCANA</th>
							<th class="py-3 px-3 text-right">NOMINAL CAIR</th>
							<th class="py-3 px-3 text-center">TANGGAL CAIR</th>
							<th class="py-3 px-3 text-center">STATUS</th>
							<th class="py-3 px-3 text-right">AKSI</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-100">
						{#each data.termins as t (t.id)}
							<tr class="hover:bg-slate-50">
								<td class="py-2.5 px-3 font-bold text-slate-900">{t.terminKe}</td>
								<td class="py-2.5 px-3 text-right text-slate-600 tabular-nums">{formatRupiah(t.nominalRencana)}</td>
								<td class="py-2.5 px-3 text-right font-bold text-emerald-600 tabular-nums">{formatRupiah(t.nominalCair)}</td>
								<td class="py-2.5 px-3 text-center text-slate-600 tabular-nums">{formatTanggal(t.tglCair)}</td>
								<td class="py-2.5 px-3 text-center">
									<span class="px-2 py-0.5 rounded text-[10px] font-bold {t.isLunas ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
										{t.isLunas ? 'Lunas' : 'Menunggu'}
									</span>
								</td>
								<td class="py-2.5 px-3 text-right">
									<div class="inline-flex items-center gap-1">
										<button
											type="button"
											onclick={() => {
												editingTermin = { ...t };
												showModalEditTermin = true;
											}}
											class="p-1 text-slate-400 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
											title="Edit Termin"
										>
											<Edit3 class="w-3.5 h-3.5" />
										</button>
										<form
											method="POST"
											action="?/deleteTermin"
											use:enhance={() => {
												if (!confirm(`Hapus catatan ${t.terminKe}?`)) return () => {};
												return async ({ update, result }) => {
													await update();
													if (result.type === 'success') toast.success('Termin berhasil dihapus.');
													else if (result.type === 'failure') toast.error(String((result.data as any)?.error || 'Gagal menghapus termin.'));
												};
											}}
										>
											<input type="hidden" name="id" value={t.id} />
											<button
												type="submit"
												class="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
												title="Hapus Termin"
											>
												<Trash2 class="w-3.5 h-3.5" />
											</button>
										</form>
									</div>
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="6" class="py-8 text-center text-slate-400">
									Belum ada catatan pencairan termin.
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Mobile Cards View for Termin -->
			<div class="md:hidden divide-y divide-slate-100">
				{#each data.termins as t (t.id)}
					<div class="p-4 space-y-2.5">
						<div class="flex items-center justify-between">
							<span class="font-bold text-slate-900 text-xs">{t.terminKe}</span>
							<span class="px-2 py-0.5 rounded text-[10px] font-bold {t.isLunas ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
								{t.isLunas ? 'Lunas' : 'Menunggu'}
							</span>
						</div>
						<div class="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
							<div>
								<span class="text-[10px] text-slate-400 block">Rencana</span>
								<span class="font-mono font-bold text-slate-700">{formatRupiah(t.nominalRencana)}</span>
							</div>
							<div>
								<span class="text-[10px] text-slate-400 block">Cair</span>
								<span class="font-mono font-bold text-emerald-600">{formatRupiah(t.nominalCair)}</span>
							</div>
						</div>
						<div class="flex items-center justify-between text-[11px] pt-1">
							<span class="text-slate-500">Tgl Cair: {formatTanggal(t.tglCair)}</span>
							<div class="flex items-center gap-2">
								<button
									type="button"
									onclick={() => {
										editingTermin = { ...t };
										showModalEditTermin = true;
									}}
									class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
								>
									Edit
								</button>
								<form
									method="POST"
									action="?/deleteTermin"
									use:enhance={() => {
										if (!confirm(`Hapus ${t.terminKe}?`)) return () => {};
										return async ({ update, result }) => {
											await update();
											if (result.type === 'success') toast.success('Termin berhasil dihapus.');
										};
									}}
								>
									<input type="hidden" name="id" value={t.id} />
									<button type="submit" class="p-1 text-rose-600 cursor-pointer" title="Hapus Termin">
										<Trash2 class="w-3.5 h-3.5" />
									</button>
								</form>
							</div>
						</div>
					</div>
				{:else}
					<div class="py-8 text-center text-slate-400 text-xs">
						Belum ada catatan pencairan termin.
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Tab 3: Kas Kecil CIH Content -->
	{#if activeTab === 'OPERASIONAL'}
		<div class="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
			<!-- Desktop Table for CIH -->
			<div class="hidden md:block overflow-x-auto">
				<table class="w-full text-left text-xs border-collapse">
					<thead class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
						<tr>
							<th class="py-3 px-3">TANGGAL</th>
							<th class="py-3 px-3">KATEGORI</th>
							<th class="py-3 px-3">KETERANGAN</th>
							<th class="py-3 px-3">PIC LAPANGAN</th>
							<th class="py-3 px-3 text-right">PENGELUARAN</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-100">
						{#each data.cihTransactions as c (c.id)}
							<tr class="hover:bg-slate-50">
								<td class="py-2.5 px-3 text-slate-600 tabular-nums">{formatTanggal(c.tgl)}</td>
								<td class="py-2.5 px-3">
									<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
										{c.kategori}
									</span>
								</td>
								<td class="py-2.5 px-3 text-slate-800">{c.keterangan}</td>
								<td class="py-2.5 px-3 text-slate-600">{c.penerimaPic || '-'}</td>
								<td class="py-2.5 px-3 text-right font-bold text-rose-600 tabular-nums">{formatRupiah(c.nominal)}</td>
							</tr>
						{:else}
							<tr>
								<td colspan="5" class="py-8 text-center text-slate-400">
									Belum ada mutasi operasional kas kecil untuk titik proyek ini.
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Mobile Cards View for CIH -->
			<div class="md:hidden divide-y divide-slate-100">
				{#each data.cihTransactions as c (c.id)}
					<div class="p-3.5 space-y-1.5 text-xs">
						<div class="flex items-center justify-between">
							<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">{c.kategori}</span>
							<span class="font-mono font-bold text-rose-600">{formatRupiah(c.nominal)}</span>
						</div>
						<div class="text-slate-800 font-medium">{c.keterangan}</div>
						<div class="flex items-center justify-between text-[11px] text-slate-400 pt-1">
							<span>{formatTanggal(c.tgl)}</span>
							<span>PIC: {c.penerimaPic || '-'}</span>
						</div>
					</div>
				{:else}
					<div class="py-8 text-center text-slate-400 text-xs">
						Belum ada mutasi operasional kas kecil untuk titik proyek ini.
					</div>
				{/each}
			</div>
		</div>
	{/if}

</div>

<!-- Modal 1: Catat Kasbon Vendor (With Over-Budget Guard) -->
{#if showModalKasbon}
	<div 
		class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
		onclick={() => showModalKasbon = false}
	>
		<div 
			class="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="flex items-center justify-between border-b border-slate-100 pb-3">
				<div>
					<h3 class="text-sm font-bold text-slate-900">Catat Kasbon / Pembayaran Vendor</h3>
					<div class="text-[11px] text-slate-500">Input pencairan dana ke mandor atau subkon</div>
				</div>
				<button type="button" onclick={() => showModalKasbon = false} class="text-slate-400 hover:text-slate-700">
					<X class="w-4 h-4" />
				</button>
			</div>

			<form method="POST" action="?/addKasbon" class="space-y-4">
				<div>
					<label class="block text-xs font-semibold text-slate-700 mb-1">
						Pilih Subkon / Vendor <span class="text-rose-500">*</span>
					</label>
					<select 
						name="projectVendorId" 
						bind:value={selectedVendorId}
						class="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white focus:ring-1 focus:ring-slate-900"
						required
					>
						{#each data.vendors as v}
							<option value={v.id}>{v.namaVendor} - {v.pekerjaan} (RAP: {formatRupiah(v.rapNilai)})</option>
						{/each}
					</select>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="block text-xs font-semibold text-slate-700 mb-1">Tipe Pembayaran</label>
						<select name="tipe" class="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white">
							<option value="KASBON_PROGRES">Kasbon Progres</option>
							<option value="DP_VENDOR">DP Vendor</option>
							<option value="PELUNASAN">Pelunasan</option>
						</select>
					</div>
					<div>
						<label class="block text-xs font-semibold text-slate-700 mb-1">Tanggal Bayar</label>
						<input type="date" name="tglBayar" value={new Date().toISOString().split('T')[0]} class="w-full text-xs rounded-lg border border-slate-300 p-2" required />
					</div>
				</div>

				<div>
					<label class="block text-xs font-semibold text-slate-700 mb-1">
						Nominal Kasbon (Rp) <span class="text-rose-500">*</span>
					</label>
					<input 
						type="number" 
						name="nominal" 
						bind:value={inputKasbonNominal}
						placeholder="Contoh: 15000000"
						class="w-full text-xs rounded-lg border border-slate-300 p-2 font-mono font-bold"
						required 
					/>
				</div>

				<div>
					<label class="block text-xs font-semibold text-slate-700 mb-1">
						Nama PIC Penerima Uang <span class="text-rose-500">*</span>
					</label>
					<input 
						type="text" 
						name="penerimaNama" 
						placeholder="Nama mandor/tukang penerima"
						class="w-full text-xs rounded-lg border border-slate-300 p-2"
						required 
					/>
				</div>

				<!-- Over-Budget Guard Alert Box -->
				{#if isKasbonOverbudget}
					<div class="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800">
						<ShieldAlert class="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
						<div>
							<div class="font-bold">Peringatan: Kasbon Melampaui Plafon Wajar!</div>
							<div class="text-[11px] mt-0.5">
								Progres fisik proyek saat ini adalah <b>{data.project.progresFisikPct}%</b>. Plafon kasbon wajar: <b>{formatRupiah(selectedVendorObj?.plafonWajar)}</b>. 
								Pengajuan ini melebihi plafon sebesar <b>{formatRupiah(overbudgetDiff)}</b>.
							</div>
							<label class="flex items-center gap-2 mt-2 pt-2 border-t border-rose-200 cursor-pointer font-bold text-rose-900">
								<input type="checkbox" name="isApproved" required class="rounded text-rose-600 w-3.5 h-3.5" />
								<span>Saya telah mengonfirmasi opname fisik lapangan dan menyetujui override kasbon ini.</span>
							</label>
						</div>
					</div>
				{/if}

				<div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
					<button 
						type="button" 
						onclick={() => showModalKasbon = false}
						class="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
					>
						Batal
					</button>
					<button 
						type="submit" 
						class="px-4 py-2 text-xs font-semibold bg-rose-700 hover:bg-rose-800 text-white rounded-lg shadow-xs"
					>
						Simpan Pembayaran
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Modal 2: Catat Termin Masuk Klien -->
{#if showModalTermin}
	<div 
		class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
		onclick={() => showModalTermin = false}
	>
		<div 
			class="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="flex items-center justify-between border-b border-slate-100 pb-3">
				<h3 class="text-sm font-bold text-slate-900">Catat Pencairan Termin Klien</h3>
				<button type="button" onclick={() => showModalTermin = false} class="text-slate-400 hover:text-slate-700">
					<X class="w-4 h-4" />
				</button>
			</div>

			<form method="POST" action="?/addTermin" class="space-y-4">
				<div>
					<label class="block text-xs font-semibold text-slate-700 mb-1">Tahap Termin</label>
					<input type="text" name="terminKe" placeholder="Contoh: Termin II (40%)" class="w-full text-xs rounded-lg border border-slate-300 p-2" required />
				</div>

				<div>
					<label class="block text-xs font-semibold text-slate-700 mb-1">Nominal Cair (Rp)</label>
					<input type="number" name="nominalCair" placeholder="Contoh: 50000000" class="w-full text-xs rounded-lg border border-slate-300 p-2 font-mono font-bold" required />
				</div>

				<div>
					<label class="block text-xs font-semibold text-slate-700 mb-1">Tanggal Cair</label>
					<input type="date" name="tglCair" value={new Date().toISOString().split('T')[0]} class="w-full text-xs rounded-lg border border-slate-300 p-2" required />
				</div>

				<div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
					<button type="button" onclick={() => showModalTermin = false} class="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
					<button type="submit" class="px-4 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-xs">Simpan Termin Masuk</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Modal 3: Tambah Subkon Baru -->
{#if showModalVendor}
	<div 
		class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
		onclick={() => showModalVendor = false}
	>
		<div 
			class="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="flex items-center justify-between border-b border-slate-100 pb-3">
				<h3 class="text-sm font-bold text-slate-900">Tambah Subkon / Mandor Pelaksana</h3>
				<button type="button" onclick={() => showModalVendor = false} class="text-slate-400 hover:text-slate-700">
					<X class="w-4 h-4" />
				</button>
			</div>

			<form method="POST" action="?/addVendor" class="space-y-4">
				<div>
					<label class="block text-xs font-semibold text-slate-700 mb-1">Nama Subkon / Mandor</label>
					<input type="text" name="namaVendor" placeholder="Contoh: Mandor Kohar" class="w-full text-xs rounded-lg border border-slate-300 p-2" required />
				</div>

				<div>
					<label class="block text-xs font-semibold text-slate-700 mb-1">Bidang Pekerjaan</label>
					<input type="text" name="pekerjaan" placeholder="Contoh: Landscape / Dapur Higienis" class="w-full text-xs rounded-lg border border-slate-300 p-2" required />
				</div>

				<div>
					<label class="block text-xs font-semibold text-slate-700 mb-1">Nilai RAP Subkon (Rp)</label>
					<input type="number" name="rapNilai" placeholder="Contoh: 80000000" class="w-full text-xs rounded-lg border border-slate-300 p-2 font-mono font-bold" required />
				</div>

				<div>
					<label class="block text-xs font-semibold text-slate-700 mb-1">Alokasi Fee Pengawas (Rp)</label>
					<input type="number" name="feeAlokasi" placeholder="0" class="w-full text-xs rounded-lg border border-slate-300 p-2 font-mono" />
				</div>

				<div class="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
					<button type="button" onclick={() => showModalVendor = false} class="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
					<button type="submit" class="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-xs">Simpan Subkon</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Modal Edit Termin -->
{#if showModalEditTermin && editingTermin}
	<div 
		class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
		role="dialog"
		aria-modal="true"
	>
		<div class="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
			<div class="flex items-center justify-between pb-3 border-b border-slate-100">
				<h3 class="text-sm font-bold text-slate-900">Ubah Data Termin SPK</h3>
				<button type="button" onclick={() => showModalEditTermin = false} class="p-1 rounded-lg text-slate-400 hover:text-slate-600">
					<X class="w-4 h-4" />
				</button>
			</div>

			<form
				method="POST"
				action="?/editTermin"
				use:enhance={() => {
					return async ({ update, result }) => {
						await update();
						if (result.type === 'success') {
							showModalEditTermin = false;
							toast.success('Data termin berhasil diperbarui!');
						} else if (result.type === 'failure') {
							toast.error(String((result.data as any)?.error || 'Gagal mengubah termin.'));
						}
					};
				}}
				class="space-y-3.5 text-xs"
			>
				<input type="hidden" name="id" value={editingTermin.id} />

				<div>
					<label class="block font-semibold text-slate-700 mb-1">Tahap Termin</label>
					<input type="text" name="terminKe" bind:value={editingTermin.terminKe} required class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900" />
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="block font-semibold text-slate-700 mb-1">Nominal Rencana (Rp)</label>
						<input type="number" name="nominalRencana" bind:value={editingTermin.nominalRencana} class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-mono" />
					</div>
					<div>
						<label class="block font-semibold text-slate-700 mb-1">Nominal Cair (Rp)</label>
						<input type="number" name="nominalCair" bind:value={editingTermin.nominalCair} required class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-mono font-bold text-emerald-700" />
					</div>
				</div>

				<div>
					<label class="block font-semibold text-slate-700 mb-1">Tanggal Cair</label>
					<input type="date" name="tglCair" bind:value={editingTermin.tglCair} required class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900" />
				</div>

				<label class="flex items-center gap-2 pt-1 cursor-pointer">
					<input type="checkbox" name="isLunas" checked={editingTermin.isLunas} class="rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
					<span class="font-semibold text-slate-700">Tandai status termin telah lunas cair</span>
				</label>

				<div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
					<button type="button" onclick={() => showModalEditTermin = false} class="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">Batal</button>
					<button type="submit" class="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer">Simpan Perubahan</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Modal Edit Vendor -->
{#if showModalEditVendor && editingVendor}
	<div 
		class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
		role="dialog"
		aria-modal="true"
	>
		<div class="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
			<div class="flex items-center justify-between pb-3 border-b border-slate-100">
				<h3 class="text-sm font-bold text-slate-900">Ubah Data Subkon / Mandor</h3>
				<button type="button" onclick={() => showModalEditVendor = false} class="p-1 rounded-lg text-slate-400 hover:text-slate-600">
					<X class="w-4 h-4" />
				</button>
			</div>

			<form
				method="POST"
				action="?/editVendor"
				use:enhance={() => {
					return async ({ update, result }) => {
						await update();
						if (result.type === 'success') {
							showModalEditVendor = false;
							toast.success('Data subkon berhasil diperbarui!');
						} else if (result.type === 'failure') {
							toast.error(String((result.data as any)?.error || 'Gagal mengubah subkon.'));
						}
					};
				}}
				class="space-y-3.5 text-xs"
			>
				<input type="hidden" name="id" value={editingVendor.id} />

				<div>
					<label class="block font-semibold text-slate-700 mb-1">Nama Subkon / Mandor</label>
					<input type="text" name="namaVendor" bind:value={editingVendor.namaVendor} required class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900" />
				</div>

				<div>
					<label class="block font-semibold text-slate-700 mb-1">Bidang Pekerjaan</label>
					<input type="text" name="pekerjaan" bind:value={editingVendor.pekerjaan} required class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900" />
				</div>

				<div>
					<label class="block font-semibold text-slate-700 mb-1">Nilai RAP Subkon (Rp)</label>
					<input type="number" name="rapNilai" bind:value={editingVendor.rapNilai} required class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-mono font-bold" />
				</div>

				<div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
					<button type="button" onclick={() => showModalEditVendor = false} class="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">Batal</button>
					<button type="submit" class="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer">Simpan Perubahan</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Modal Edit Kasbon -->
{#if showModalEditKasbon && editingKasbon}
	<div 
		class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
		role="dialog"
		aria-modal="true"
	>
		<div class="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
			<div class="flex items-center justify-between pb-3 border-b border-slate-100">
				<h3 class="text-sm font-bold text-slate-900">Ubah Data Kasbon Subkon</h3>
				<button type="button" onclick={() => showModalEditKasbon = false} class="p-1 rounded-lg text-slate-400 hover:text-slate-600">
					<X class="w-4 h-4" />
				</button>
			</div>

			<form
				method="POST"
				action="?/editKasbon"
				use:enhance={() => {
					return async ({ update, result }) => {
						await update();
						if (result.type === 'success') {
							showModalEditKasbon = false;
							toast.success('Data kasbon berhasil diperbarui!');
						} else if (result.type === 'failure') {
							toast.error(String((result.data as any)?.error || 'Gagal mengubah kasbon.'));
						}
					};
				}}
				class="space-y-3.5 text-xs"
			>
				<input type="hidden" name="id" value={editingKasbon.id} />

				<div>
					<label class="block font-semibold text-slate-700 mb-1">Nama PIC Penerima Uang</label>
					<input type="text" name="penerimaNama" bind:value={editingKasbon.penerimaNama} required class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900" />
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label class="block font-semibold text-slate-700 mb-1">Nominal Kasbon (Rp)</label>
						<input type="number" name="nominal" bind:value={editingKasbon.nominal} required class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-mono font-bold text-rose-600" />
					</div>
					<div>
						<label class="block font-semibold text-slate-700 mb-1">Tanggal Bayar</label>
						<input type="date" name="tglBayar" bind:value={editingKasbon.tglBayar} required class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900" />
					</div>
				</div>

				<div>
					<label class="block font-semibold text-slate-700 mb-1">Keterangan / Keperluan</label>
					<input type="text" name="keterangan" bind:value={editingKasbon.keterangan} placeholder="Contoh: Pembelian semen & upah tukang" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900" />
				</div>

				<div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
					<button type="button" onclick={() => showModalEditKasbon = false} class="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">Batal</button>
					<button type="submit" class="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer">Simpan Perubahan</button>
				</div>
			</form>
		</div>
	</div>
{/if}

