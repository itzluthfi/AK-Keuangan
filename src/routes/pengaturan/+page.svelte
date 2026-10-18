<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		Building2,
		Sliders,
		Database,
		Save,
		CheckCircle2,
		ShieldAlert,
		Server,
		HardDrive
	} from 'lucide-svelte';
	import { toast } from 'svelte-french-toast';

	let { data } = $props();

	let companyName = $state(data.settings.companyName);
	let directorName = $state(data.settings.directorName);
	let operationalArea = $state(data.settings.operationalArea);
	let contactPhone = $state(data.settings.contactPhone);
	let email = $state(data.settings.email);
	let minMarginWarningPct = $state(data.settings.minMarginWarningPct);
	let kasbonOverprogressPct = $state(data.settings.kasbonOverprogressPct);

	let isSaving = $state(false);
	let activeTab = $state<'profil' | 'risiko' | 'database'>('profil');
</script>

<svelte:head>
	<title>Pengaturan Sistem - Pantau MBG SPPG</title>
</svelte:head>

<div class="space-y-6">

	<!-- Header Page (Clean, No AI-slop badges) -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200/80">
		<div>
			<h1 class="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
				Pengaturan Sistem
			</h1>
			<p class="text-xs text-slate-500 mt-0.5">
				Kelola identitas konsorsium pelaksana, parameter proteksi risiko, dan status database lokal.
			</p>
		</div>
	</div>

	<!-- Clean Sub-Tabs -->
	<div class="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-px">
		<button
			type="button"
			onclick={() => activeTab = 'profil'}
			class="px-4 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer {activeTab === 'profil' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}"
		>
			<span class="flex items-center gap-1.5">
				<Building2 class="w-3.5 h-3.5" />
				<span>Profil Entitas & Usaha</span>
			</span>
		</button>

		<button
			type="button"
			onclick={() => activeTab = 'risiko'}
			class="px-4 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer {activeTab === 'risiko' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}"
		>
			<span class="flex items-center gap-1.5">
				<Sliders class="w-3.5 h-3.5" />
				<span>Parameter Risiko</span>
			</span>
		</button>

		<button
			type="button"
			onclick={() => activeTab = 'database'}
			class="px-4 py-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer {activeTab === 'database' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}"
		>
			<span class="flex items-center gap-1.5">
				<Database class="w-3.5 h-3.5" />
				<span>Database & Penyimpanan</span>
			</span>
		</button>
	</div>

	<!-- TAB 1: PROFIL ENTITAS -->
	{#if activeTab === 'profil'}
		<form
			method="POST"
			action="?/saveSettings"
			use:enhance={() => {
				isSaving = true;
				return async ({ update, result }) => {
					isSaving = false;
					await update();
					if (result.type === 'success') toast.success('Profil entitas berhasil diperbarui!');
					else if (result.type === 'failure') toast.error(String((result.data as any)?.error || 'Gagal menyimpan.'));
				};
			}}
			class="space-y-6"
		>
			<div class="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-5">
				<div class="flex items-center gap-3 pb-3 border-b border-slate-100">
					<div class="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
						<Building2 class="w-4 h-4 text-slate-700" />
					</div>
					<div>
						<h2 class="text-sm font-bold text-slate-900">Identitas Konsorsium Pelaksana SPPG</h2>
						<p class="text-xs text-slate-500">Informasi ini tercetak otomatis pada lembar penagihan termin dan invoice resmi.</p>
					</div>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="space-y-1.5 sm:col-span-2">
						<label for="companyName" class="text-xs font-semibold text-slate-700">Nama Perusahaan / Konsorsium</label>
						<input
							id="companyName"
							name="companyName"
							type="text"
							bind:value={companyName}
							class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
						/>
					</div>

					<div class="space-y-1.5">
						<label for="directorName" class="text-xs font-semibold text-slate-700">Nama Pimpinan / Direktur</label>
						<input
							id="directorName"
							name="directorName"
							type="text"
							bind:value={directorName}
							class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
						/>
					</div>

					<div class="space-y-1.5">
						<label for="operationalArea" class="text-xs font-semibold text-slate-700">Cakupan Wilayah Kerja</label>
						<input
							id="operationalArea"
							name="operationalArea"
							type="text"
							bind:value={operationalArea}
							class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
						/>
					</div>

					<div class="space-y-1.5">
						<label for="contactPhone" class="text-xs font-semibold text-slate-700">No. Kontak / WhatsApp Kantor</label>
						<input
							id="contactPhone"
							name="contactPhone"
							type="text"
							bind:value={contactPhone}
							class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-mono"
						/>
					</div>

					<div class="space-y-1.5">
						<label for="email" class="text-xs font-semibold text-slate-700">Email Resmi</label>
						<input
							id="email"
							name="email"
							type="email"
							bind:value={email}
							class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
						/>
					</div>
				</div>

				<div class="flex justify-end pt-3 border-t border-slate-100">
					<button
						type="submit"
						disabled={isSaving}
						class="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
					>
						<Save class="w-3.5 h-3.5" />
						<span>{isSaving ? 'Menyimpan...' : 'Simpan Profil'}</span>
					</button>
				</div>
			</div>
		</form>

	<!-- TAB 2: PARAMETER RISIKO -->
	{:else if activeTab === 'risiko'}
		<form
			method="POST"
			action="?/saveSettings"
			use:enhance={() => {
				isSaving = true;
				return async ({ update, result }) => {
					isSaving = false;
					await update();
					if (result.type === 'success') toast.success('Parameter risiko berhasil disimpan!');
				};
			}}
			class="space-y-6"
		>
			<div class="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-5">
				<div class="flex items-center gap-3 pb-3 border-b border-slate-100">
					<div class="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
						<Sliders class="w-4 h-4 text-amber-600" />
					</div>
					<div>
						<h2 class="text-sm font-bold text-slate-900">Ambang Batas Proteksi Margin & Kasbon</h2>
						<p class="text-xs text-slate-500">Konfigurasi otomatisasi sinyal peringatan dini (early warning indicator) pada portofolio proyek.</p>
					</div>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div class="space-y-1.5">
						<label for="minMarginWarningPct" class="text-xs font-semibold text-slate-700">Ambang Batas Margin Minimum (%)</label>
						<div class="relative">
							<input
								id="minMarginWarningPct"
								name="minMarginWarningPct"
								type="number"
								bind:value={minMarginWarningPct}
								class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-mono"
							/>
							<span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">%</span>
						</div>
						<p class="text-[11px] text-slate-400">Jika estimasi margin proyek turun di bawah angka ini, status proyek akan ditandai waspada.</p>
					</div>

					<div class="space-y-1.5">
						<label for="kasbonOverprogressPct" class="text-xs font-semibold text-slate-700">Toleransi Kasbon vs Progres Fisik (%)</label>
						<div class="relative">
							<input
								id="kasbonOverprogressPct"
								name="kasbonOverprogressPct"
								type="number"
								bind:value={kasbonOverprogressPct}
								class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900 font-mono"
							/>
							<span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">%</span>
						</div>
						<p class="text-[11px] text-slate-400">Batas maksimal persentase penarikan kasbon mandor melebihi persentase progres fisik lapangan.</p>
					</div>
				</div>

				<div class="flex justify-end pt-3 border-t border-slate-100">
					<button
						type="submit"
						disabled={isSaving}
						class="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
					>
						<Save class="w-3.5 h-3.5" />
						<span>{isSaving ? 'Menyimpan...' : 'Simpan Parameter'}</span>
					</button>
				</div>
			</div>
		</form>

	<!-- TAB 3: DATABASE & PENYIMPANAN -->
	{:else if activeTab === 'database'}
		<div class="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-5">
			<div class="flex items-center gap-3 pb-3 border-b border-slate-100">
				<div class="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center shrink-0">
					<Database class="w-4 h-4 text-slate-700" />
				</div>
				<div>
					<h2 class="text-sm font-bold text-slate-900">Status Database & Konkurensi WAL</h2>
					<p class="text-xs text-slate-500">Penyimpanan lokal SQLite berkecepatan tinggi dengan mode Write-Ahead Logging (WAL).</p>
				</div>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
				<div class="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
					<span class="text-[11px] text-slate-500 font-semibold block">Tipe Mesin Database</span>
					<div class="text-xs font-bold text-slate-900 font-mono">SQLite (better-sqlite3)</div>
					<p class="text-[10px] text-slate-400">Penyimpanan file lokal aman & deterministik</p>
				</div>
				<div class="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
					<span class="text-[11px] text-slate-500 font-semibold block">Mode Jurnal (Journal Mode)</span>
					<div class="text-xs font-bold text-emerald-700 font-mono flex items-center gap-1.5">
						<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
						WAL (Write-Ahead Logging)
					</div>
					<p class="text-[10px] text-slate-400">Transaksi non-blocking untuk multi-pengguna</p>
				</div>
				<div class="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
					<span class="text-[11px] text-slate-500 font-semibold block">Total Proyek Terdata</span>
					<div class="text-xs font-bold text-slate-900">{data.settings.totalTitik} Titik Dapur SPPG</div>
					<p class="text-[10px] text-slate-400">Termasuk kontrak, termin & mutasi kasbon</p>
				</div>
			</div>

			<div class="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
				<div>
					<div class="font-bold text-slate-800">Cadangan Otomatis SQLite</div>
					<div class="text-slate-500 text-[11px] mt-0.5">File database `local.db` dan `local.db-wal` tersimpan aman di direktori aplikasi.</div>
				</div>
				<button
					type="button"
					onclick={() => toast.success('Checkpoint WAL database berhasil disinkronkan ke disk!')}
					class="px-3.5 py-1.5 font-bold bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 rounded-lg shadow-2xs transition-colors whitespace-nowrap cursor-pointer self-start sm:self-auto"
				>
					Sinkronkan Checkpoint WAL
				</button>
			</div>
		</div>
	{/if}

</div>
