<script lang="ts">
	import { formatRupiah, formatTanggal } from '#lib/utils';
	import { toast } from '#lib/hot-toast.svelte';
	import {
		FileText,
		Printer,
		Plus,
		Trash2,
		Building2,
		RotateCcw,
		Download,
		CheckCircle2,
		Percent,
		CreditCard
	} from 'lucide-svelte';
	import { downloadInvoicePdf } from '#lib/utils/pdf-generator';

	let { data } = $props();

	// Invoice Information
	let invoiceNo = $state('INV-SPPG/' + new Date().getFullYear() + '/04/' + Math.floor(1000 + Math.random() * 9000));
	let invoiceDate = $state(new Date().toISOString().split('T')[0]);
	let dueDate = $state(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);

	// Bill From
	let senderCompany = $state('PT. SENTRA GIZI INDONESIA (SPPG)');
	let senderAddress = $state('Graha SPPG Lt. 4, Jl. Jenderal Sudirman No. 88, Jakarta Selatan');
	let senderPic = $state('Bpk. Azka (Direktur Utama)');

	// Bill To
	let selectedProjectId = $state<string>('');
	let recipientName = $state('CV. BINTANG TEKNIK MANDIRI');
	let recipientProject = $state('SPPG Balai PU Wilayah Timur (SPPG-JTM-01)');
	let recipientAddress = $state('Jl. Raya Sukolilo No. 12, Surabaya, Jawa Timur');

	function handleProjectChange(e: Event) {
		const id = (e.target as HTMLSelectElement).value;
		selectedProjectId = id;
		const found = data.projects.find((p: any) => String(p.id) === id);
		if (found) {
			recipientProject = `${found.nama} (${found.kode})`;
			recipientAddress = found.lokasi || 'Lokasi Proyek SPPG';
			toast.success(`Alokasi proyek diset: ${found.nama}`);
		}
	}

	// Line Items
	interface InvoiceItem {
		id: string;
		desc: string;
		qty: number;
		unit: string;
		price: number;
	}

	let items = $state<InvoiceItem[]>([
		{ id: '1', desc: 'Termin II Pekerjaan Sipil & Pengecoran Dapur SPPG', qty: 1, unit: 'LS', price: 45000000 },
		{ id: '2', desc: 'Instalasi Jalur Gas LPG & Exhaust Hood Stainless 304', qty: 1, unit: 'Paket', price: 18500000 }
	]);

	function addItem() {
		items = [
			...items,
			{ id: Math.random().toString(), desc: 'Pekerjaan / Material Tambahan', qty: 1, unit: 'LS', price: 5000000 }
		];
		toast.success('Baris item tagihan ditambahkan.');
	}

	function removeItem(id: string) {
		if (items.length <= 1) {
			toast.error('Minimal harus ada 1 item dalam invoice.');
			return;
		}
		items = items.filter(i => i.id !== id);
	}

	// Tax & Deductions
	let applyPpn = $state(true); // 11%
	let applyPph23 = $state(false); // 2%
	let retensiPct = $state(0); // Misal 5%

	// Payment Info
	let bankName = $state('Bank Mandiri');
	let bankAccountNo = $state('142-00-8899123-4');
	let bankAccountHolder = $state('PT. SENTRA GIZI INDONESIA');

	// Computed Totals
	let subtotal = $derived(items.reduce((acc, i) => acc + (i.qty * i.price), 0));
	let ppnNominal = $derived(applyPpn ? Math.round(subtotal * 0.11) : 0);
	let pphNominal = $derived(applyPph23 ? Math.round(subtotal * 0.02) : 0);
	let retensiNominal = $derived(retensiPct > 0 ? Math.round(subtotal * (retensiPct / 100)) : 0);
	let grandTotal = $derived(subtotal + ppnNominal - pphNominal - retensiNominal);

	function handleDownloadInvoice() {
		downloadInvoicePdf({
			invoiceNo,
			invoiceDate,
			dueDate,
			senderCompany,
			senderAddress,
			senderPic,
			recipientName,
			recipientProject,
			recipientAddress,
			items,
			subtotal,
			applyPpn,
			ppnNominal,
			applyPph23,
			pphNominal,
			grandTotal,
			bankName,
			bankAccountNo,
			bankAccountHolder
		});
		toast.success(`File Invoice #${invoiceNo} berhasil diunduh ke komputer.`);
	}
</script>

<svelte:head>
	<title>Generator Invoice SPPG - Pantau MBG</title>
</svelte:head>

<div class="space-y-6">

	<!-- Header Banner & Print Button -->
	<div class="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<h1 class="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
				Invoice & Penagihan SPPG
			</h1>
			<p class="text-xs text-slate-500 mt-0.5">
				Faktur termin proyek dan penagihan resmi berstandar akuntansi
			</p>
		</div>

		<div class="flex items-center gap-2">
			<button 
				type="button" 
				onclick={handleDownloadInvoice}
				class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
			>
				<Download class="w-4 h-4" />
				<span>Unduh PDF Invoice</span>
			</button>
		</div>
	</div>

	<!-- Dual Grid: Left Editor & Right Live Document -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
		
		<!-- LEFT: Form Configuration (no-print) -->
		<div class="no-print lg:col-span-5 space-y-4">
			
			<!-- Card 1: Data Penagihan -->
			<div class="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
				<h3 class="text-xs font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
					<FileText class="w-4 h-4 text-slate-500" />
					<span>Identitas Invoice & Tujuan Proyek</span>
				</h3>

				<div class="grid grid-cols-2 gap-2">
					<div>
						<label class="block text-[11px] font-semibold text-slate-600 mb-1">Nomor Invoice</label>
						<input type="text" bind:value={invoiceNo} class="w-full text-xs rounded-lg border border-slate-200 p-2 font-mono" />
					</div>
					<div>
						<label class="block text-[11px] font-semibold text-slate-600 mb-1">Pilih Proyek SPPG</label>
						<select onchange={handleProjectChange} class="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white">
							<option value="">-- Pilih Titik Dapur --</option>
							{#each data.projects as p}
								<option value={p.id}>{p.nama}</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-2">
					<div>
						<label class="block text-[11px] font-semibold text-slate-600 mb-1">Tanggal Terbit</label>
						<input type="date" bind:value={invoiceDate} class="w-full text-xs rounded-lg border border-slate-200 p-2" />
					</div>
					<div>
						<label class="block text-[11px] font-semibold text-slate-600 mb-1">Jatuh Tempo</label>
						<input type="date" bind:value={dueDate} class="w-full text-xs rounded-lg border border-slate-200 p-2" />
					</div>
				</div>

				<div>
					<label class="block text-[11px] font-semibold text-slate-600 mb-1">Ditujukan Kepada (Klien / Vendor)</label>
					<input type="text" bind:value={recipientName} class="w-full text-xs rounded-lg border border-slate-200 p-2 font-semibold" />
				</div>
			</div>

			<!-- Card 2: Line Items Editor -->
			<div class="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
				<div class="flex items-center justify-between border-b border-slate-100 pb-2">
					<h3 class="text-xs font-bold text-slate-900">Rincian Tagihan & Biaya</h3>
					<button 
						type="button" 
						onclick={addItem}
						class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
					>
						<Plus class="w-3.5 h-3.5" />
						Tambah Baris
					</button>
				</div>

				<div class="space-y-2.5 max-h-72 overflow-y-auto pr-1">
					{#each items as item (item.id)}
						<div class="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
							<div class="flex items-center justify-between gap-2">
								<input 
									type="text" 
									bind:value={item.desc} 
									placeholder="Deskripsi pekerjaan/material..."
									class="w-full text-xs rounded border border-slate-200 p-1.5 bg-white font-medium" 
								/>
								<button 
									type="button" 
									onclick={() => removeItem(item.id)}
									class="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
								>
									<Trash2 class="w-3.5 h-3.5" />
								</button>
							</div>

							<div class="grid grid-cols-3 gap-2">
								<div>
									<label class="block text-[10px] text-slate-500">Volume (Qty)</label>
									<input type="number" bind:value={item.qty} min="1" class="w-full text-xs rounded border border-slate-200 p-1 bg-white font-mono text-center" />
								</div>
								<div>
									<label class="block text-[10px] text-slate-500">Satuan</label>
									<input type="text" bind:value={item.unit} class="w-full text-xs rounded border border-slate-200 p-1 bg-white text-center" />
								</div>
								<div>
									<label class="block text-[10px] text-slate-500">Harga Satuan</label>
									<input type="number" bind:value={item.price} min="0" step="50000" class="w-full text-xs rounded border border-slate-200 p-1 bg-white font-mono font-bold" />
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Card 3: Pajak & Rekening -->
			<div class="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
				<h3 class="text-xs font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
					<CreditCard class="w-4 h-4 text-slate-500" />
					<span>Pajak, Potongan & Rekening Pembayaran</span>
				</h3>

				<div class="flex items-center justify-between text-xs py-1">
					<label class="flex items-center gap-2 cursor-pointer">
						<input type="checkbox" bind:checked={applyPpn} class="rounded border-slate-300 text-slate-900" />
						<span class="font-semibold text-slate-700">Kenakan PPN 11%</span>
					</label>
					<span class="font-mono text-slate-600">{applyPpn ? formatRupiah(ppnNominal) : 'Rp 0'}</span>
				</div>

				<div class="flex items-center justify-between text-xs py-1">
					<label class="flex items-center gap-2 cursor-pointer">
						<input type="checkbox" bind:checked={applyPph23} class="rounded border-slate-300 text-slate-900" />
						<span class="font-semibold text-slate-700">Potong PPh 2%</span>
					</label>
					<span class="font-mono text-rose-600">{applyPph23 ? '-' + formatRupiah(pphNominal) : 'Rp 0'}</span>
				</div>

				<div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
					<div>
						<label class="block text-[10px] text-slate-500">Nama Bank</label>
						<input type="text" bind:value={bankName} class="w-full text-xs rounded border border-slate-200 p-1.5" />
					</div>
					<div>
						<label class="block text-[10px] text-slate-500">Nomor Rekening</label>
						<input type="text" bind:value={bankAccountNo} class="w-full text-xs rounded border border-slate-200 p-1.5 font-mono" />
					</div>
				</div>
			</div>

		</div>

		<!-- RIGHT: Live Official Invoice Document (Print Ready) -->
		<div class="lg:col-span-7 bg-white rounded-2xl border border-slate-300 p-6 sm:p-8 shadow-sm space-y-6 print:shadow-none print:border-none print:p-0">
			
			<!-- Document Header Banner -->
			<div class="flex justify-between items-start border-b-2 border-slate-900 pb-5">
				<div>
					<div class="flex items-center gap-2">
						<div class="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
							<Building2 class="w-5 h-5 text-white" />
						</div>
						<div class="text-base font-black tracking-tight text-slate-900">{senderCompany}</div>
					</div>
					<div class="text-[11px] text-slate-500 mt-1 max-w-sm">{senderAddress}</div>
					<div class="text-[11px] text-slate-600 font-semibold mt-0.5">PIC: {senderPic}</div>
				</div>

				<div class="text-right">
					<div class="text-2xl font-black text-slate-900 uppercase tracking-tight">INVOICE</div>
					<div class="text-xs font-mono font-bold text-slate-700 mt-0.5">{invoiceNo}</div>
					<div class="text-[11px] text-slate-500 mt-1">Tanggal: {formatTanggal(invoiceDate)}</div>
					<div class="text-[11px] font-semibold text-rose-600">Jatuh Tempo: {formatTanggal(dueDate)}</div>
				</div>
			</div>

			<!-- Bill To Section -->
			<div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
				<div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TAGIHAN DITUJUKAN KEPADA:</div>
				<div class="text-sm font-bold text-slate-900">{recipientName}</div>
				<div class="text-slate-700 font-medium">{recipientProject}</div>
				<div class="text-slate-500">{recipientAddress}</div>
			</div>

			<!-- Line Items Table -->
			<div class="overflow-hidden rounded-xl border border-slate-200">
				<table class="w-full text-left text-xs border-collapse">
					<thead class="bg-slate-900 text-white font-bold">
						<tr>
							<th class="py-2.5 px-3 w-8 text-center">NO</th>
							<th class="py-2.5 px-3">URAIAN PEKERJAAN / BARANG</th>
							<th class="py-2.5 px-3 text-center w-20">VOL</th>
							<th class="py-2.5 px-3 text-right w-28">HARGA SATUAN</th>
							<th class="py-2.5 px-3 text-right w-32">TOTAL (RP)</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-100 font-medium">
						{#each items as item, idx (item.id)}
							<tr class="hover:bg-slate-50/50">
								<td class="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
								<td class="py-2.5 px-3 font-semibold text-slate-800">{item.desc}</td>
								<td class="py-2.5 px-3 text-center text-slate-600 font-mono">{item.qty} {item.unit}</td>
								<td class="py-2.5 px-3 text-right text-slate-600 tabular-nums font-mono">{formatRupiah(item.price)}</td>
								<td class="py-2.5 px-3 text-right font-bold text-slate-900 tabular-nums font-mono">{formatRupiah(item.qty * item.price)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Totals Calculation Table -->
			<div class="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
				
				<!-- Bank Transfer Details -->
				<div class="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1 w-full sm:w-64">
					<div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">INSTRUKSI PEMBAYARAN</div>
					<div class="font-bold text-slate-800">{bankName}</div>
					<div class="font-mono font-bold text-sm text-slate-900">{bankAccountNo}</div>
					<div class="text-slate-600 text-[11px]">a/n {bankAccountHolder}</div>
				</div>

				<!-- Summary Amounts -->
				<div class="w-full sm:w-64 space-y-1.5 text-xs">
					<div class="flex justify-between text-slate-600">
						<span>Subtotal Pekerjaan:</span>
						<span class="font-mono font-bold tabular-nums text-slate-800">{formatRupiah(subtotal)}</span>
					</div>

					{#if applyPpn}
						<div class="flex justify-between text-slate-600">
							<span>PPN (11%):</span>
							<span class="font-mono font-bold tabular-nums text-slate-800">{formatRupiah(ppnNominal)}</span>
						</div>
					{/if}

					{#if applyPph23}
						<div class="flex justify-between text-rose-600">
							<span>Potongan PPh (2%):</span>
							<span class="font-mono font-bold tabular-nums">-{formatRupiah(pphNominal)}</span>
						</div>
					{/if}

					<div class="pt-2 border-t-2 border-slate-900 flex justify-between text-sm font-black text-slate-900">
						<span>TOTAL TAGIHAN:</span>
						<span class="font-mono tabular-nums text-base">{formatRupiah(grandTotal)}</span>
					</div>
				</div>

			</div>

			<!-- Footer System Note (Tanpa Tanda Tangan Sesuai Standar Laporan MBG) -->
			<div class="pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
				<span>Dokumen faktur penagihan digital sah &bull; Diterbitkan melalui Pantau MBG</span>
				<span class="font-mono">Ref ID #{invoiceNo}</span>
			</div>

		</div>

	</div>

</div>
