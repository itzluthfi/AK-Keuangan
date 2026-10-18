<script lang="ts">
	import { formatRupiah, formatTanggal } from '#lib/utils';
	import { toast } from '#lib/hot-toast.svelte';
	import SearchableSelect from '#lib/components/searchable-select.svelte';
	import {
		FileText,
		Plus,
		Trash2,
		Building2,
		Download,
		CreditCard,
		CheckCircle2,
		Calendar
	} from 'lucide-svelte';
	import { downloadInvoicePdf } from '#lib/utils/pdf-generator';

	let { data } = $props();

	// Options untuk SearchableSelect Proyek
	let projectOptions = $derived(
		(data.projects || []).map((p: any) => ({
			value: String(p.id),
			label: p.nama,
			sublabel: `${p.kode} • RAB: ${formatRupiah(p.rabKontrak)}`
		}))
	);

	// Invoice Information
	let invoiceNo = $state('INV-SPPG/' + new Date().getFullYear() + '/04/' + Math.floor(1000 + Math.random() * 9000));
	let invoiceDate = $state(new Date().toISOString().split('T')[0]);
	let dueDate = $state(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);

	// Bill From (Pihak Penagih - Konsorsium Pelaksana MBG Jawa Timur)
	let senderCompany = $state('Konsorsium Mitra Pelaksana SPPG Jawa Timur');
	let senderAddress = $state('Wilayah Kerja SPPG Jawa Timur & Sekitarnya');
	let senderPic = $state('Bpk. Azka (Pimpinan Pelaksana)');

	// Bill To (Pihak Pembayar - Klien / Dinas Pemilik Dapur)
	let selectedProjectId = $state<string>('');
	let recipientName = $state('Pejabat Pembuat Komitmen (PPK) Dinas');
	let recipientProject = $state('Silakan pilih titik proyek SPPG di samping');
	let recipientAddress = $state('Jawa Timur');

	// Line Items
	interface InvoiceItem {
		id: string;
		desc: string;
		qty: number;
		unit: string;
		price: number;
	}

	let items = $state<InvoiceItem[]>([
		{ id: '1', desc: 'Termin I Pekerjaan Persiapan & Konstruksi Sipil Dapur', qty: 1, unit: 'Paket', price: 45000000 },
		{ id: '2', desc: 'Pengadaan Instalasi Jalur Gas LPG & Exhaust Hood', qty: 1, unit: 'Paket', price: 18500000 }
	]);

	// Reaktif: Saat Proyek Dipilih lewat SearchableSelect, update detail penerima & termin
	$effect(() => {
		if (selectedProjectId) {
			const found = data.projects?.find((p: any) => String(p.id) === selectedProjectId);
			if (found) {
				recipientProject = `${found.nama} (${found.kode})`;
				recipientAddress = found.lokasi || 'Wilayah Jawa Timur';
				recipientName = found.picPengawas ? `PPK / Pengawas: ${found.picPengawas}` : 'Pejabat Pembuat Komitmen (PPK) SPPG';

				// Cek apakah ada data termin di database untuk proyek ini
				const projTermins = data.termins?.filter((t: any) => t.projectId === found.id) || [];
				if (projTermins.length > 0) {
					// Ambil termin aktif (yang belum lunas atau termin pertama)
					const activeTermin = projTermins.find((t: any) => !t.isLunas) || projTermins[0];
					items = [
						{
							id: '1',
							desc: `Penagihan ${activeTermin.terminKe} - Pekerjaan Dapur SPPG ${found.nama}`,
							qty: 1,
							unit: 'Paket',
							price: activeTermin.nominalRencana || activeTermin.nominalCair || 45000000
						}
					];
				}
				toast.success(`Data penagihan disinkronkan: ${found.nama}`);
			}
		}
	});

	function addItem() {
		items = [
			...items,
			{ id: Math.random().toString(), desc: 'Pekerjaan / Material Tambahan', qty: 1, unit: 'Paket', price: 5000000 }
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

	// Pajak & Potongan
	let applyPpn = $state(true); // 11%
	let applyPph23 = $state(false); // 2%
	let retensiPct = $state(0);

	// Rekening Pembayaran (BSI Holding Operasional)
	let bsiAccount = $derived(
		data.accounts?.find((a: any) => a.tipe === 'BANK_HOLDING') || {
			namaBank: 'Bank Syariah Indonesia (BSI)',
			noRekening: '7210202601',
			atasNama: 'Konsorsium Mitra SPPG Jatim'
		}
	);

	let bankName = $state('Bank Syariah Indonesia (BSI)');
	let bankAccountNo = $state('7210202601');
	let bankAccountHolder = $state('Konsorsium Mitra SPPG Jatim');

	// Perhitungan Subtotal & Grand Total
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
		toast.success(`File Invoice #${invoiceNo} berhasil diunduh.`);
	}
</script>

<svelte:head>
	<title>Generator Faktur & Invoice - Pantau MBG</title>
</svelte:head>

<div class="space-y-6">

	<!-- Header Halaman -->
	<div class="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<h1 class="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
				Faktur & Penagihan Termin
			</h1>
			<p class="text-xs text-slate-500 mt-0.5">
				Penerbitan surat tagihan resmi termin proyek ke dinas dan pemberi kerja
			</p>
		</div>

		<div class="flex items-center gap-2">
			<button 
				type="button" 
				onclick={handleDownloadInvoice}
				class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
			>
				<Download class="w-4 h-4" />
				<span>Unduh Dokumen PDF</span>
			</button>
		</div>
	</div>

	<!-- Dual Grid: Left Editor & Right Live Document -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
		
		<!-- LEFT COLUMN: Form Editor (no-print) -->
		<div class="no-print lg:col-span-5 space-y-4">
			
			<!-- Card 1: Identitas & Proyek -->
			<div class="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-4">
				<div class="flex items-center gap-2 border-b border-slate-100 pb-3">
					<FileText class="w-4 h-4 text-slate-600" />
					<h3 class="text-xs font-bold text-slate-900">Identitas Tagihan & Proyek</h3>
				</div>

				<div class="space-y-3">
					<!-- Searchable Select Proyek (Select2 style) -->
					<div>
						<label for="projectSelect" class="block text-xs font-semibold text-slate-700 mb-1">
							Pilih Titik Proyek SPPG
						</label>
						<SearchableSelect
							options={projectOptions}
							bind:value={selectedProjectId}
							placeholder="-- Pilih Titik Proyek --"
							searchPlaceholder="Ketik nama atau kode proyek..."
						/>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<div>
							<label for="invoiceNo" class="block text-xs font-semibold text-slate-700 mb-1">Nomor Faktur</label>
							<input id="invoiceNo" type="text" bind:value={invoiceNo} class="w-full text-xs rounded-xl border border-slate-200 p-2.5 font-mono font-medium focus:ring-1 focus:ring-slate-900" />
						</div>
						<div>
							<label for="invoiceDate" class="block text-xs font-semibold text-slate-700 mb-1">Tanggal Terbit</label>
							<input id="invoiceDate" type="date" bind:value={invoiceDate} class="w-full text-xs rounded-xl border border-slate-200 p-2.5 text-slate-700 focus:ring-1 focus:ring-slate-900" />
						</div>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<div>
							<label for="dueDate" class="block text-xs font-semibold text-slate-700 mb-1">Jatuh Tempo</label>
							<input id="dueDate" type="date" bind:value={dueDate} class="w-full text-xs rounded-xl border border-slate-200 p-2.5 text-slate-700 focus:ring-1 focus:ring-slate-900" />
						</div>
						<div>
							<label for="recipientName" class="block text-xs font-semibold text-slate-700 mb-1">Penerima Tagihan</label>
							<input id="recipientName" type="text" bind:value={recipientName} placeholder="PPK / Bendahara" class="w-full text-xs rounded-xl border border-slate-200 p-2.5 font-medium focus:ring-1 focus:ring-slate-900" />
						</div>
					</div>
				</div>
			</div>

			<!-- Card 2: Rincian Tagihan -->
			<div class="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-4">
				<div class="flex items-center justify-between border-b border-slate-100 pb-3">
					<h3 class="text-xs font-bold text-slate-900">Rincian Pekerjaan / Termin</h3>
					<button 
						type="button" 
						onclick={addItem}
						class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
					>
						<Plus class="w-3.5 h-3.5" />
						<span>+ Tambah Baris</span>
					</button>
				</div>

				<div class="space-y-3 max-h-72 overflow-y-auto pr-1">
					{#each items as item (item.id)}
						<div class="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-2">
							<div class="flex items-center justify-between gap-2">
								<input 
									type="text" 
									bind:value={item.desc} 
									placeholder="Uraian pekerjaan termin..."
									class="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white font-medium focus:ring-1 focus:ring-slate-900" 
								/>
								<button 
									type="button" 
									onclick={() => removeItem(item.id)}
									class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
									title="Hapus baris"
								>
									<Trash2 class="w-3.5 h-3.5" />
								</button>
							</div>

							<div class="grid grid-cols-3 gap-2">
								<div>
									<label class="block text-[10px] text-slate-500 font-medium mb-0.5">Volume (Qty)</label>
									<input type="number" bind:value={item.qty} min="1" class="w-full text-xs rounded-lg border border-slate-200 p-1.5 bg-white font-mono text-center" />
								</div>
								<div>
									<label class="block text-[10px] text-slate-500 font-medium mb-0.5">Satuan</label>
									<input type="text" bind:value={item.unit} class="w-full text-xs rounded-lg border border-slate-200 p-1.5 bg-white text-center" />
								</div>
								<div>
									<label class="block text-[10px] text-slate-500 font-medium mb-0.5">Nilai (Rp)</label>
									<input type="number" bind:value={item.price} min="0" step="50000" class="w-full text-xs rounded-lg border border-slate-200 p-1.5 bg-white font-mono font-bold" />
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Card 3: Pajak & Rekening Tujuan -->
			<div class="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3">
				<div class="flex items-center gap-2 border-b border-slate-100 pb-3">
					<CreditCard class="w-4 h-4 text-slate-600" />
					<h3 class="text-xs font-bold text-slate-900">Pajak & Rekening Tujuan</h3>
				</div>

				<div class="flex items-center justify-between text-xs py-1">
					<label class="flex items-center gap-2 cursor-pointer select-none">
						<input type="checkbox" bind:checked={applyPpn} class="rounded-sm border-slate-300 text-slate-900 focus:ring-0" />
						<span class="font-semibold text-slate-700">Kenakan PPN (11%)</span>
					</label>
					<span class="font-mono text-slate-700 font-semibold">{applyPpn ? formatRupiah(ppnNominal) : 'Rp 0'}</span>
				</div>

				<div class="flex items-center justify-between text-xs py-1">
					<label class="flex items-center gap-2 cursor-pointer select-none">
						<input type="checkbox" bind:checked={applyPph23} class="rounded-sm border-slate-300 text-slate-900 focus:ring-0" />
						<span class="font-semibold text-slate-700">Potongan PPh (2%)</span>
					</label>
					<span class="font-mono text-rose-600 font-semibold">{applyPph23 ? '-' + formatRupiah(pphNominal) : 'Rp 0'}</span>
				</div>

				<div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
					<div>
						<label class="block text-[10px] text-slate-500 font-medium mb-0.5">Bank Penerima</label>
						<input type="text" bind:value={bankName} class="w-full text-xs rounded-lg border border-slate-200 p-2 bg-white" />
					</div>
					<div>
						<label class="block text-[10px] text-slate-500 font-medium mb-0.5">Nomor Rekening</label>
						<input type="text" bind:value={bankAccountNo} class="w-full text-xs rounded-lg border border-slate-200 p-2 font-mono bg-white font-bold" />
					</div>
				</div>
			</div>

		</div>

		<!-- RIGHT COLUMN: Live Official Invoice Document (Clean Modern Preview) -->
		<div class="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6 print:shadow-none print:border-none print:p-0">
			
			<!-- Document Header -->
			<div class="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-5">
				<div>
					<div class="flex items-center gap-2">
						<div class="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
							<Building2 class="w-4 h-4 text-white" />
						</div>
						<div class="text-sm font-extrabold tracking-tight text-slate-900">{senderCompany}</div>
					</div>
					<div class="text-[11px] text-slate-500 mt-1 max-w-sm">{senderAddress}</div>
					<div class="text-[11px] text-slate-700 font-medium mt-0.5">Penanggung Jawab: {senderPic}</div>
				</div>

				<div class="text-left sm:text-right">
					<div class="text-xl font-black text-slate-900 uppercase tracking-tight">FAKTUR PENAGIHAN</div>
					<div class="text-xs font-mono font-bold text-slate-700 mt-0.5">{invoiceNo}</div>
					<div class="text-[11px] text-slate-500 mt-1">Tanggal: {formatTanggal(invoiceDate)}</div>
					<div class="text-[11px] font-semibold text-rose-600">Jatuh Tempo: {formatTanggal(dueDate)}</div>
				</div>
			</div>

			<!-- Bill To Box -->
			<div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
				<div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TAGIHAN DITUJUKAN KEPADA:</div>
				<div class="text-sm font-bold text-slate-900">{recipientName}</div>
				<div class="text-slate-800 font-medium">{recipientProject}</div>
				<div class="text-slate-500">{recipientAddress}</div>
			</div>

			<!-- Line Items Table (Clean Minimalist Style) -->
			<div class="overflow-hidden rounded-xl border border-slate-200">
				<table class="w-full text-left text-xs border-collapse">
					<thead class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase">
						<tr>
							<th class="py-2.5 px-3 w-8 text-center">NO</th>
							<th class="py-2.5 px-3">URAIAN PEKERJAAN / TERMIN</th>
							<th class="py-2.5 px-3 text-center w-20">VOL</th>
							<th class="py-2.5 px-3 text-right w-28">NILAI SATUAN</th>
							<th class="py-2.5 px-3 text-right w-32">TOTAL (RP)</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-100 font-medium">
						{#each items as item, idx (item.id)}
							<tr class="hover:bg-slate-50/50">
								<td class="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
								<td class="py-2.5 px-3 font-semibold text-slate-900">{item.desc}</td>
								<td class="py-2.5 px-3 text-center text-slate-600 font-mono text-[11px]">{item.qty} {item.unit}</td>
								<td class="py-2.5 px-3 text-right text-slate-600 tabular-nums font-mono text-[11px]">{formatRupiah(item.price)}</td>
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
					<div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">REKENING TUJUAN PEMBAYARAN</div>
					<div class="font-bold text-slate-900">{bankName}</div>
					<div class="font-mono font-bold text-sm text-slate-900">{bankAccountNo}</div>
					<div class="text-slate-600 text-[11px]">a/n {bankAccountHolder}</div>
				</div>

				<!-- Summary Amounts -->
				<div class="w-full sm:w-64 space-y-1.5 text-xs">
					<div class="flex justify-between text-slate-600">
						<span>Subtotal Tagihan:</span>
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

					<div class="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
						<span>TOTAL TAGIHAN:</span>
						<span class="font-mono tabular-nums text-base">{formatRupiah(grandTotal)}</span>
					</div>
				</div>

			</div>

			<!-- Footer Dokumen -->
			<div class="pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
				<span>Dokumen faktur penagihan resmi &bull; Pantau MBG</span>
				<span class="font-mono">Ref #{invoiceNo}</span>
			</div>

		</div>

	</div>

</div>
