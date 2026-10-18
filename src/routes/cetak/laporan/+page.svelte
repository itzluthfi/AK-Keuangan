<script lang="ts">
	import { formatRupiah, formatPersen } from '#lib/utils';
	import { terbilang } from '#lib/terbilang';
	import { Printer, ArrowLeft, FileSpreadsheet, Building2, CheckCircle2, Download } from 'lucide-svelte';
	import { toast } from '#lib/hot-toast.svelte';
	import { downloadLaporanRekapitulasiPdf } from '#lib/utils/pdf-generator';

	let { data } = $props();

	let isExportingExcel = $state(false);

	function handleDownloadLaporanPdf() {
		downloadLaporanRekapitulasiPdf({
			title: 'LAPORAN REKAPITULASI KAS PROYEK SPPG MBG',
			exportDate: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
			projects: (data.rows || []).map((p: any, idx: number) => ({
				no: idx + 1,
				kode: p.kode,
				nama: p.nama,
				progresFisikPct: p.progresFisikPct,
				rabKontrak: p.rabKontrak,
				terminMasuk: p.terminMasuk,
				sisaTermin: Math.max(0, p.rabKontrak - p.terminMasuk),
				bebanSubkon: p.totalBebanVendor,
				operasionalCih: p.totalOperasional,
				marginBersih: p.marginBersih
			})),
			summary: {
				totalKontrak: data.totals.totalKontrak,
				totalTerminMasuk: data.totals.totalTerminMasuk,
				totalSisaTermin: Math.max(0, data.totals.totalKontrak - data.totals.totalTerminMasuk),
				totalBebanSubkon: data.totals.totalBebanVendor,
				totalOperasionalCih: data.totals.totalOperasional,
				totalMarginBersih: data.totals.totalMarginBersih
			}
		});
		toast.success('Laporan Rekapitulasi PDF berhasil diunduh ke komputer!');
	}

	async function handleExportExcel() {
		isExportingExcel = true;
		const loadingId = toast.loading('Menyiapkan file Excel resmi rekapitulasi...');
		try {
			const res = await fetch('/api/export/laporan-excel');
			if (!res.ok) throw new Error('Gagal mengunduh Excel');
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `REKAPITULASI_KAS_SPPG_MBG_${new Date().toISOString().split('T')[0]}.xlsx`;
			a.click();
			URL.revokeObjectURL(url);
			toast.dismiss(loadingId);
			toast.success('File Excel rekapitulasi berhasil diunduh!');
		} catch (e) {
			toast.dismiss(loadingId);
			toast.error('Terjadi kesalahan saat export.');
		} finally {
			isExportingExcel = false;
		}
	}
</script>

<svelte:head>
	<title>Laporan Rekapitulasi Kas SPPG MBG - Ekspor Resmi</title>
</svelte:head>

<div class="space-y-4">
	
	<!-- Top Bar Action (No Print) -->
	<div class="no-print bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
		<a 
			href="/"
			class="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
		>
			<ArrowLeft class="w-4 h-4 text-slate-500" />
			<span>Kembali ke Dashboard</span>
		</a>

		<div class="flex items-center gap-2.5">
			<!-- Ekspor Excel Button -->
			<button 
				type="button" 
				disabled={isExportingExcel}
				onclick={handleExportExcel}
				class="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
			>
				<FileSpreadsheet class="w-4 h-4 text-emerald-600" />
				<span>Ekspor Excel Resmi</span>
			</button>

			<!-- Unduh Dokumen PDF Langsung Button (Bukan Print Browser) -->
			<button 
				type="button" 
				onclick={handleDownloadLaporanPdf}
				class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
			>
				<Download class="w-4 h-4 text-white" />
				<span>Unduh Laporan PDF</span>
			</button>
		</div>
	</div>

	<!-- Printable Paper Container (A4 Landscape Formatted - Tanpa TTD) -->
	<div class="bg-white p-6 sm:p-10 rounded-2xl border border-slate-300 shadow-md print:shadow-none print:border-none print:p-0 max-w-[1150px] mx-auto text-slate-900 font-sans">
		
		<!-- Kop Surat Resmi Perusahaan -->
		<div class="border-b-2 border-slate-900 pb-3 mb-4 flex items-start justify-between">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shrink-0 print:border print:border-slate-900">
					<Building2 class="w-5 h-5 text-white" />
				</div>
				<div>
					<div class="text-sm font-black tracking-wider uppercase text-slate-900">PT. AK KARYA BERSAMA INDONESIA</div>
					<div class="text-[10px] text-slate-600 font-medium">Pelaksana Fasilitas Satuan Pelayanan Pemenuhan Gizi (SPPG) Program MBG</div>
					<div class="text-[9px] text-slate-500">Jl. Raya Wisma Tropodo No. 42, Jawa Timur &bull; Email: finance@akkarya.id</div>
				</div>
			</div>
			<div class="text-right">
				<div class="text-[10px] font-mono font-bold text-slate-900">KODE DOKUMEN: SPPG/FIN/2026/X/042</div>
				<div class="text-[10px] text-slate-600 font-mono">Tgl Terbit: {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
				<div class="text-[9px] text-emerald-700 font-bold font-mono">STATUS: VALIDASI OTOMATIS SISTEM</div>
			</div>
		</div>

		<!-- Judul Laporan Formal -->
		<div class="text-center my-4">
			<h1 class="text-base sm:text-lg font-black tracking-tight uppercase text-slate-900">
				LAPORAN REKAPITULASI REALISASI KAS & MARGIN BERSIH
			</h1>
			<p class="text-xs text-slate-600 mt-0.5 font-medium">
				Portofolio 29 Titik Dapur Sentral Sentra MBG &bull; Tahun Anggaran 2026
			</p>
		</div>

		<!-- Tabel Rekapitulasi Finansial 29 Titik -->
		<div class="overflow-x-auto my-4">
			<table class="w-full text-left text-[11px] border-collapse border border-slate-300">
				<thead class="bg-slate-100 font-bold text-slate-800 uppercase tracking-wider text-[10px] print:bg-slate-100">
					<tr class="divide-x divide-slate-300 border-b-2 border-slate-400">
						<th class="py-2 px-2 text-center w-8">NO</th>
						<th class="py-2 px-2 text-center w-20">KODE</th>
						<th class="py-2 px-3 min-w-[170px]">TITIK DAPUR SPPG</th>
						<th class="py-2 px-2 text-center w-16">PROGRES</th>
						<th class="py-2 px-2 text-right min-w-[110px]">KONTRAK SPK</th>
						<th class="py-2 px-2 text-right min-w-[110px]">TERMIN MASUK</th>
						<th class="py-2 px-2 text-right min-w-[100px]">BEBAN SUBKON</th>
						<th class="py-2 px-2 text-right min-w-[100px]">OPERASIONAL</th>
						<th class="py-2 px-2 text-right min-w-[110px]">MARGIN BERSIH</th>
						<th class="py-2 px-2 text-right w-16">MARGIN %</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-200 font-medium">
					{#each data.rows as r (r.kode)}
						<tr class="divide-x divide-slate-200 hover:bg-slate-50">
							<td class="py-1.5 px-2 text-center text-slate-500 tabular-nums">{r.no}</td>
							<td class="py-1.5 px-2 text-center font-mono font-semibold text-slate-800">{r.kode}</td>
							<td class="py-1.5 px-3 font-bold text-slate-900">{r.nama}</td>
							<td class="py-1.5 px-2 text-center tabular-nums">{r.progresFisikPct}%</td>
							<td class="py-1.5 px-2 text-right tabular-nums">{formatRupiah(r.rabKontrak)}</td>
							<td class="py-1.5 px-2 text-right tabular-nums font-bold text-emerald-700">{formatRupiah(r.terminMasuk)}</td>
							<td class="py-1.5 px-2 text-right tabular-nums">{formatRupiah(r.totalBebanVendor)}</td>
							<td class="py-1.5 px-2 text-right tabular-nums">{formatRupiah(r.totalOperasional)}</td>
							<td class="py-1.5 px-2 text-right tabular-nums font-extrabold {r.marginBersih >= 0 ? 'text-slate-900' : 'text-rose-700'}">
								{formatRupiah(r.marginBersih)}
							</td>
							<td class="py-1.5 px-2 text-right tabular-nums font-semibold {r.marginPct < 0 ? 'text-rose-700' : 'text-slate-700'}">{formatPersen(r.marginPct)}</td>
						</tr>
					{/each}
				</tbody>
				<!-- Baris Total Rekapitulasi -->
				<tfoot class="bg-slate-100 font-bold border-t-2 border-slate-900 print:bg-slate-100">
					<tr class="divide-x divide-slate-300">
						<td colspan="4" class="py-2.5 px-3 text-center uppercase tracking-wider text-slate-900 font-extrabold">
							TOTAL REKAPITULASI PORTOFOLIO SPPG (29 TITIK)
						</td>
						<td class="py-2 px-2 text-right tabular-nums font-bold">{formatRupiah(data.totals.totalKontrak)}</td>
						<td class="py-2 px-2 text-right tabular-nums font-black text-emerald-800">{formatRupiah(data.totals.totalTerminMasuk)}</td>
						<td class="py-2 px-2 text-right tabular-nums font-bold">{formatRupiah(data.totals.totalBebanVendor)}</td>
						<td class="py-2 px-2 text-right tabular-nums font-bold">{formatRupiah(data.totals.totalOperasional)}</td>
						<td class="py-2 px-2 text-right tabular-nums font-black text-slate-900">{formatRupiah(data.totals.totalMarginBersih)}</td>
						<td class="py-2 px-2 text-right tabular-nums font-black">{formatPersen(data.totals.netMarginPct)}</td>
					</tr>
				</tfoot>
			</table>
		</div>

		<!-- Kalimat Terbilang Otomatis -->
		<div class="border border-slate-300 p-3 rounded-xl bg-slate-50/70 my-4 text-xs flex items-center justify-between">
			<div>
				<span class="font-bold text-slate-700">Terbilang Total Margin Bersih:</span>
				<span class="italic font-medium text-slate-900 ml-1">
					"{terbilang(data.totals.totalMarginBersih)}"
				</span>
			</div>
			<div class="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
				<CheckCircle2 class="w-3.5 h-3.5 text-emerald-600" />
				<span>Validasi otomatis per tanggal cetak</span>
			</div>
		</div>

		<!-- Footer Dokumen Formal (Bersih Tanpa TTD Sesuai Instruksi User) -->
		<div class="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500 font-mono">
			<div>Dokumen ini dihasilkan secara otomatis oleh Sistem PANTAU MBG SPPG.</div>
			<div>Halaman 1 dari 1 &bull; Arsip Keuangan Elektronik PT. AK Karya Bersama Indonesia</div>
		</div>

	</div>

</div>
