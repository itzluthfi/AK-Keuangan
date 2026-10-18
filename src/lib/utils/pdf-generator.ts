import { formatRupiah, formatTanggal } from '../utils';

// Helper pemanggil dinamis client-side agar tidak crash di Node.js SSR
async function loadPdfModules() {
	if (typeof window === 'undefined') {
		return { jsPDF: null as any, autoTable: null as any };
	}
	const jspdfModule = await import('jspdf');
	const jsPDF = (jspdfModule.jsPDF || jspdfModule.default) as typeof import('jspdf').jsPDF;
	const autoTableModule = await import('jspdf-autotable');
	const autoTable = (autoTableModule.default || (autoTableModule as any).autoTable || autoTableModule) as any;
	return { jsPDF, autoTable };
}

// Helper Terbilang Bahasa Indonesia Resmi
export function terbilang(n: number): string {
	if (n === 0) return 'Nol Rupiah';
	const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
	
	function sebut(num: number): string {
		num = Math.floor(Math.abs(num));
		if (num < 12) return satuan[num];
		if (num < 20) return sebut(num - 10) + ' Belas';
		if (num < 100) return sebut(Math.floor(num / 10)) + ' Puluh ' + sebut(num % 10);
		if (num < 200) return 'Seratus ' + sebut(num - 100);
		if (num < 1000) return sebut(Math.floor(num / 100)) + ' Ratus ' + sebut(num % 100);
		if (num < 2000) return 'Seribu ' + sebut(num - 1000);
		if (num < 1000000) return sebut(Math.floor(num / 1000)) + ' Ribu ' + sebut(num % 1000);
		if (num < 1000000000) return sebut(Math.floor(num / 1000000)) + ' Juta ' + sebut(num % 1000000);
		if (num < 1000000000000) return sebut(Math.floor(num / 1000000000)) + ' Miliar ' + sebut(num % 1000000000);
		return sebut(Math.floor(num / 1000000000000)) + ' Triliun ' + sebut(num % 1000000000000);
	}

	const res = (sebut(n).replace(/\s+/g, ' ').trim() + ' Rupiah').replace(/Satu Puluh/g, 'Sepuluh');
	return res;
}

export function formatKategoriLabel(kat: string): string {
	const map: Record<string, string> = {
		'BBM_LOGISTIK': 'BBM & Transport Logistik',
		'KONSUMSI': 'Konsumsi & Jamuan Lapangan',
		'OPERASIONAL_LAPANGAN': 'Operasional Taktis Lapangan',
		'ATK_PERLENGKAPAN': 'ATK & Keperluan Kantor',
		'DROP_KAS': 'Drop Kas Masuk (Rek. Pusat)',
		'FEE': 'Fee Manajemen / Operasional',
		'KASBON_SUBKON': 'Pencairan Kasbon Mandor/Subkon',
		'MATERIAL_TAKTIS': 'Material Taktis Proyek'
	};
	return map[kat] || kat.replace(/_/g, ' ');
}

// ============================================================================
// 1. GENERATOR & DIRECT DOWNLOAD VOUCHER / KUITANSI KAS RESMI (A5 LANDSCAPE)
// ============================================================================
export interface VoucherData {
	id: number | string;
	tgl: string;
	tipe: 'IN' | 'OUT' | string;
	kategori: string;
	namaProyek?: string | null;
	penerimaPic?: string | null;
	nominal: number;
	keterangan: string;
}

export async function downloadVoucherPdf(tx: VoucherData): Promise<void> {
	const { jsPDF, autoTable } = await loadPdfModules();

	// A5 Landscape (210 x 148 mm) - Standar Kuitansi Keuangan Resmi
	const doc = new jsPDF({
		orientation: 'landscape',
		unit: 'mm',
		format: 'a5'
	});

	const pageWidth = doc.internal.pageSize.getWidth();
	const isMasuk = tx.tipe === 'IN';

	// 1. Double Border Frame Elegan
	doc.setDrawColor(203, 213, 225); // Slate-300
	doc.setLineWidth(0.6);
	doc.rect(7, 7, pageWidth - 14, 134);
	doc.setDrawColor(226, 232, 240); // Slate-200
	doc.setLineWidth(0.25);
	doc.rect(8.5, 8.5, pageWidth - 17, 131);

	// 2. Header Bersih (White Corporate Theme - Bukan Kotak Hitam)
	// Logo/Company Identity Left
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(12);
	doc.setTextColor(15, 23, 42); // Slate-900
	doc.text('PT. SENTRA GIZI INDONESIA', 13, 16);

	doc.setFont('helvetica', 'normal');
	doc.setFontSize(7.5);
	doc.setTextColor(71, 85, 105); // Slate-600
	doc.text('Pelaksana Satuan Pelayanan Pemenuhan Gizi (SPPG) Program MBG', 13, 20.5);
	doc.text('Gedung SPPG Sentra Tropodo • finance@sentragizi.id • Kas Operasional', 13, 24.5);

	// Badge Jenis Voucher Right
	const badgeText = isMasuk ? 'BUKTI KAS MASUK (BKM)' : 'BUKTI KAS KELUAR (BKK)';
	doc.setFillColor(isMasuk ? 236 : 255, isMasuk ? 253 : 241, isMasuk ? 245 : 242);
	doc.setDrawColor(isMasuk ? 16 : 225, isMasuk ? 185 : 29, isMasuk ? 129 : 72);
	doc.roundedRect(pageWidth - 75, 11, 62, 7.5, 1.5, 1.5, 'FD');

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(7.5);
	doc.setTextColor(isMasuk ? 6 : 159, isMasuk ? 95 : 18, isMasuk ? 70 : 57);
	doc.text(badgeText, pageWidth - 44, 16, { align: 'center' });

	// Ref ID & Tanggal (Kanan di bawah Badge)
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(8.5);
	doc.setTextColor(30, 41, 59);
	doc.text(`NO. VOUCHER: ${isMasuk ? 'BKM' : 'BKK'}-${String(tx.id).padStart(6, '0')}`, pageWidth - 13, 22.5, { align: 'right' });

	doc.setFont('helvetica', 'normal');
	doc.setFontSize(7.5);
	doc.setTextColor(100, 116, 139);
	doc.text(`Tanggal Transaksi: ${formatTanggal(tx.tgl)}`, pageWidth - 13, 26.5, { align: 'right' });

	// Garis Pemisah Header
	doc.setDrawColor(203, 213, 225);
	doc.setLineWidth(0.4);
	doc.line(13, 29, pageWidth - 13, 29);

	// 3. Grid Rincian Transaksi menggunakan autoTable Elegan
	const tableData = [
		[
			{ content: isMasuk ? 'Diterima Dari / Sumber Dana:' : 'Dibayarkan Kepada / Penerima:', styles: { fontStyle: 'bold', textColor: [100, 116, 139] } },
			{ content: tx.penerimaPic || (isMasuk ? 'Rekening Induk / Pimpinan' : 'Petugas Lapangan'), styles: { fontStyle: 'bold', textColor: [15, 23, 42] } },
			{ content: 'Beban Proyek SPPG:', styles: { fontStyle: 'bold', textColor: [100, 116, 139] } },
			{ content: tx.namaProyek || 'Umum Lapangan', styles: { fontStyle: 'bold', textColor: [15, 23, 42] } }
		],
		[
			{ content: 'Akun Kas / Pembukuan:', styles: { fontStyle: 'bold', textColor: [100, 116, 139] } },
			{ content: 'Kas Operasional Lapangan (CIH)', styles: { textColor: [30, 41, 59] } },
			{ content: 'Kategori Biaya:', styles: { fontStyle: 'bold', textColor: [100, 116, 139] } },
			{ content: formatKategoriLabel(tx.kategori), styles: { fontStyle: 'bold', textColor: isMasuk ? [5, 150, 105] : [225, 29, 72] } }
		],
		[
			{ content: 'Uraian / Keterangan:', styles: { fontStyle: 'bold', textColor: [100, 116, 139] } },
			{ content: tx.keterangan || '-', colSpan: 3, styles: { textColor: [15, 23, 42] } }
		]
	];

	autoTable(doc, {
		startY: 32,
		body: tableData,
		theme: 'plain',
		styles: {
			fontSize: 8,
			cellPadding: 2.2,
			lineColor: [226, 232, 240],
			lineWidth: 0.2
		},
		columnStyles: {
			0: { cellWidth: 42 },
			1: { cellWidth: 50 },
			2: { cellWidth: 38 },
			3: { cellWidth: 54 }
		},
		margin: { left: 13, right: 13 }
	});

	// 4. Box Nominal & Terbilang (Elegan, Terang, Standar Perbankan)
	const nominalY = (doc as any).lastAutoTable.finalY + 3.5;
	
	doc.setFillColor(248, 250, 252); // Slate-50
	doc.setDrawColor(203, 213, 225); // Slate-300
	doc.setLineWidth(0.35);
	doc.roundedRect(13, nominalY, pageWidth - 26, 21, 1.5, 1.5, 'FD');

	// Sisi Kiri: Terbilang
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(7.5);
	doc.setTextColor(100, 116, 139);
	doc.text('JUMLAH TERBILANG:', 17, nominalY + 6.5);

	doc.setFont('helvetica', 'italic');
	doc.setFontSize(8.5);
	doc.setTextColor(15, 23, 42);
	doc.text(`### ${terbilang(tx.nominal)} ###`, 17, nominalY + 14, { maxWidth: pageWidth - 90 });

	// Sisi Kanan: Total Nominal Angka Besar
	const boxRight = pageWidth - 17;
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(7.5);
	doc.setTextColor(100, 116, 139);
	doc.text(isMasuk ? 'TOTAL DITERIMA:' : 'TOTAL KELUAR:', boxRight, nominalY + 6.5, { align: 'right' });

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(13);
	if (isMasuk) {
		doc.setTextColor(5, 150, 105); // Emerald-600
	} else {
		doc.setTextColor(225, 29, 72); // Rose-600
	}
	doc.text(formatRupiah(tx.nominal) + ',-', boxRight, nominalY + 15, { align: 'right' });

	// 5. Kotak Verifikasi & Pengesahan Digital (3 Kolom Berjejer)
	const signY = nominalY + 25;
	const colWidth = (pageWidth - 26) / 3;

	// Kolom 1: Mengetahui / Direktur
	doc.setDrawColor(226, 232, 240);
	doc.setFillColor(255, 255, 255);
	doc.roundedRect(13, signY, colWidth - 2, 22, 1, 1, 'FD');
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(7);
	doc.setTextColor(100, 116, 139);
	doc.text('Disetujui Oleh:', 13 + (colWidth - 2) / 2, signY + 5, { align: 'center' });
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(7.5);
	doc.setTextColor(15, 23, 42);
	doc.text('DIREKTUR OPERASIONAL', 13 + (colWidth - 2) / 2, signY + 18, { align: 'center' });

	// Kolom 2: Verifikasi Finance Holding
	doc.roundedRect(13 + colWidth, signY, colWidth - 2, 22, 1, 1, 'FD');
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(7);
	doc.setTextColor(100, 116, 139);
	doc.text('Diverifikasi:', 13 + colWidth + (colWidth - 2) / 2, signY + 5, { align: 'center' });
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(7.5);
	doc.setTextColor(15, 23, 42);
	doc.text('FINANCE HOLDING', 13 + colWidth + (colWidth - 2) / 2, signY + 18, { align: 'center' });

	// Kolom 3: Pemohon / PIC Lapangan (dengan Validasi Digital Badge)
	doc.roundedRect(13 + colWidth * 2, signY, colWidth - 2, 22, 1, 1, 'FD');
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(7);
	doc.setTextColor(100, 116, 139);
	doc.text(isMasuk ? 'Penerima Kasir:' : 'Pemohon / Kasir:', 13 + colWidth * 2 + (colWidth - 2) / 2, signY + 5, { align: 'center' });
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(7.5);
	doc.setTextColor(15, 23, 42);
	doc.text(tx.penerimaPic || 'PIC TIM LAPANGAN', 13 + colWidth * 2 + (colWidth - 2) / 2, signY + 18, { align: 'center' });

	// Cap Validasi Digital di Tengah Box Tanda Tangan
	doc.setDrawColor(16, 185, 129);
	doc.setFillColor(240, 253, 244);
	doc.roundedRect(13 + colWidth + 5, signY + 7.5, colWidth - 12, 6, 1, 1, 'FD');
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(6.5);
	doc.setTextColor(5, 150, 105);
	doc.text('VALIDASI SISTEM OTOMATIS', 13 + colWidth + (colWidth - 2) / 2, signY + 11.5, { align: 'center' });

	// 6. Footer System Security Trail (Menggunakan titik unicode asli, bukan &bull;)
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(6.5);
	doc.setTextColor(148, 163, 184); // Slate-400
	const exportTime = new Date().toLocaleString('id-ID');
	doc.text(
		`Dokumen digital sah • Diterbitkan Sistem Pantau MBG SPPG pada ${exportTime} • Security Ref: TX-${tx.id} • Tanpa tanda tangan basah fisik`,
		pageWidth / 2,
		137,
		{ align: 'center' }
	);

	// DIRECT DOWNLOAD (Bukan print dialog browser)
	doc.save(`Voucher-Kas-SPPG-${tx.id}.pdf`);
}

// ============================================================================
// 2. GENERATOR & DIRECT DOWNLOAD INVOICE RESMI SPPG (A4 PORTRAIT)
// ============================================================================
export interface InvoicePdfData {
	invoiceNo: string;
	invoiceDate: string;
	dueDate: string;
	senderCompany: string;
	senderAddress: string;
	senderPic: string;
	recipientName: string;
	recipientProject: string;
	recipientAddress: string;
	items: Array<{ desc: string; qty: number; unit: string; price: number }>;
	subtotal: number;
	applyPpn: boolean;
	ppnNominal: number;
	applyPph23: boolean;
	pphNominal: number;
	grandTotal: number;
	bankName: string;
	bankAccountNo: string;
	bankAccountHolder: string;
}

export async function downloadInvoicePdf(inv: InvoicePdfData): Promise<void> {
	const { jsPDF, autoTable } = await loadPdfModules();

	const doc = new jsPDF({
		orientation: 'portrait',
		unit: 'mm',
		format: 'a4'
	});

	const pageWidth = doc.internal.pageSize.getWidth();

	// Clean Corporate Header (Light Mode Friendly)
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(14);
	doc.setTextColor(15, 23, 42); // Slate-900
	doc.text(inv.senderCompany || 'PT. SENTRA GIZI INDONESIA', 16, 16);

	doc.setFont('helvetica', 'normal');
	doc.setFontSize(8.5);
	doc.setTextColor(71, 85, 105);
	doc.text(inv.senderAddress || 'Graha SPPG Lt. 4, Jakarta Selatan', 16, 21.5);
	doc.text(`PIC Finance: ${inv.senderPic || 'Bpk. Azka'}`, 16, 26);

	// INVOICE Header Text Right
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(16);
	doc.setTextColor(15, 23, 42);
	doc.text('FAKTUR / INVOICE', pageWidth - 16, 16, { align: 'right' });

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(9);
	doc.setTextColor(30, 41, 59);
	doc.text(`NO: ${inv.invoiceNo}`, pageWidth - 16, 22, { align: 'right' });

	doc.setFont('helvetica', 'normal');
	doc.setFontSize(8);
	doc.setTextColor(100, 116, 139);
	doc.text(`Tgl Terbit: ${formatTanggal(inv.invoiceDate)}`, pageWidth - 16, 26.5, { align: 'right' });

	// Garis Pemisah Header
	doc.setDrawColor(203, 213, 225);
	doc.setLineWidth(0.4);
	doc.line(16, 29, pageWidth - 16, 29);

	// Bill To Section Box
	let y = 33;
	doc.setFillColor(248, 250, 252);
	doc.setDrawColor(226, 232, 240);
	doc.roundedRect(16, y, pageWidth - 32, 24, 2, 2, 'FD');

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(8);
	doc.setTextColor(148, 163, 184);
	doc.text('TAGIHAN DITUJUKAN KEPADA:', 22, y + 6);

	doc.setFontSize(10);
	doc.setTextColor(15, 23, 42);
	doc.text(inv.recipientName, 22, y + 12);

	doc.setFont('helvetica', 'normal');
	doc.setFontSize(8.5);
	doc.setTextColor(71, 85, 105);
	doc.text(inv.recipientProject, 22, y + 17);
	doc.text(inv.recipientAddress, 22, y + 21);

	// Table Items via autoTable
	const tableRows = inv.items.map((item, idx) => [
		idx + 1,
		item.desc,
		`${item.qty} ${item.unit}`,
		formatRupiah(item.price),
		formatRupiah(item.qty * item.price)
	]);

	autoTable(doc, {
		startY: y + 28,
		head: [['NO', 'URAIAN PEKERJAAN / BARANG', 'VOLUME', 'HARGA SATUAN', 'TOTAL (RP)']],
		body: tableRows,
		theme: 'grid',
		headStyles: {
			fillColor: [15, 23, 42],
			textColor: [255, 255, 255],
			fontStyle: 'bold',
			fontSize: 8.5,
			halign: 'center'
		},
		bodyStyles: {
			fontSize: 8.5,
			textColor: [30, 41, 59]
		},
		columnStyles: {
			0: { cellWidth: 12, halign: 'center' },
			1: { cellWidth: 'auto' },
			2: { cellWidth: 26, halign: 'center' },
			3: { cellWidth: 35, halign: 'right' },
			4: { cellWidth: 38, halign: 'right', fontStyle: 'bold' }
		},
		margin: { left: 16, right: 16 }
	});

	// Totals & Bank Instruction
	const finalY = (doc as any).lastAutoTable.finalY + 8;

	// Bank Card
	doc.setFillColor(248, 250, 252);
	doc.setDrawColor(226, 232, 240);
	doc.roundedRect(16, finalY, 80, 28, 2, 2, 'FD');

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(8);
	doc.setTextColor(148, 163, 184);
	doc.text('INSTRUKSI PEMBAYARAN', 22, finalY + 6);

	doc.setFontSize(9.5);
	doc.setTextColor(15, 23, 42);
	doc.text(inv.bankName, 22, finalY + 12);

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(10.5);
	doc.text(inv.bankAccountNo, 22, finalY + 18);

	doc.setFont('helvetica', 'normal');
	doc.setFontSize(8);
	doc.setTextColor(71, 85, 105);
	doc.text(`a/n ${inv.bankAccountHolder}`, 22, finalY + 23);

	// Summary Calculation
	const rightX = pageWidth - 16;
	let calcY = finalY + 5;

	doc.setFontSize(9);
	doc.setTextColor(100, 116, 139);
	doc.text('Subtotal Pekerjaan:', rightX - 50, calcY);
	doc.setFont('helvetica', 'bold');
	doc.setTextColor(15, 23, 42);
	doc.text(formatRupiah(inv.subtotal), rightX, calcY, { align: 'right' });

	if (inv.applyPpn) {
		calcY += 6;
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(100, 116, 139);
		doc.text('PPN (11%):', rightX - 50, calcY);
		doc.setFont('helvetica', 'bold');
		doc.setTextColor(15, 23, 42);
		doc.text(formatRupiah(inv.ppnNominal), rightX, calcY, { align: 'right' });
	}

	if (inv.applyPph23) {
		calcY += 6;
		doc.setFont('helvetica', 'normal');
		doc.setTextColor(225, 29, 72);
		doc.text('Potongan PPh (2%):', rightX - 50, calcY);
		doc.setFont('helvetica', 'bold');
		doc.text(`-${formatRupiah(inv.pphNominal)}`, rightX, calcY, { align: 'right' });
	}

	calcY += 8;
	doc.setDrawColor(15, 23, 42);
	doc.setLineWidth(0.5);
	doc.line(rightX - 70, calcY - 2, rightX, calcY - 2);

	doc.setFont('helvetica', 'bold');
	doc.setFontSize(10.5);
	doc.setTextColor(15, 23, 42);
	doc.text('TOTAL TAGIHAN:', rightX - 50, calcY + 3);
	doc.setFontSize(12);
	doc.text(formatRupiah(inv.grandTotal), rightX, calcY + 3, { align: 'right' });

	// Footer Note
	doc.setFont('helvetica', 'italic');
	doc.setFontSize(8);
	doc.setTextColor(148, 163, 184);
	doc.text(
		'Dokumen digital sah • Diterbitkan melalui Sistem Pantau MBG • Tanpa tanda tangan basah fisik',
		pageWidth / 2,
		285,
		{ align: 'center' }
	);

	// DIRECT DOWNLOAD (Bukan print dialog browser)
	const cleanFilename = (inv.invoiceNo || 'INV').replace(/[/\\?%*:|"<>]/g, '-');
	doc.save(`Invoice-${cleanFilename}.pdf`);
}

// ============================================================================
// 3. GENERATOR & DIRECT DOWNLOAD LAPORAN REKAPITULASI (A4 LANDSCAPE)
// ============================================================================
export interface LaporanPdfData {
	title: string;
	exportDate: string;
	projects: Array<{
		no: number;
		kode: string;
		nama: string;
		progresFisikPct: number;
		rabKontrak: number;
		terminMasuk: number;
		sisaTermin: number;
		bebanSubkon: number;
		operasionalCih: number;
		marginBersih: number;
	}>;
	summary: {
		totalKontrak: number;
		totalTerminMasuk: number;
		totalSisaTermin: number;
		totalBebanSubkon: number;
		totalOperasionalCih: number;
		totalMarginBersih: number;
	};
}

export async function downloadLaporanRekapitulasiPdf(data: LaporanPdfData): Promise<void> {
	const { jsPDF, autoTable } = await loadPdfModules();

	const doc = new jsPDF({
		orientation: 'landscape',
		unit: 'mm',
		format: 'a4'
	});

	const pageWidth = doc.internal.pageSize.getWidth();

	// Title Banner - Clean Corporate Light Theme
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(12);
	doc.setTextColor(15, 23, 42);
	doc.text('PT. SENTRA GIZI INDONESIA - LAPORAN REKAPITULASI KAS PROYEK SPPG MBG', 14, 13);

	doc.setFont('helvetica', 'normal');
	doc.setFontSize(8);
	doc.setTextColor(100, 116, 139);
	doc.text(
		`Tanggal Ekspor: ${data.exportDate} | Status: Dokumen Eksekutif Resmi | Portofolio: 29 Titik Dapur SPPG`,
		14,
		18.5
	);

	doc.setDrawColor(203, 213, 225);
	doc.setLineWidth(0.4);
	doc.line(14, 22, pageWidth - 14, 22);

	// Table Rows
	const tableRows = data.projects.map((p) => [
		p.no,
		p.kode,
		p.nama,
		`${p.progresFisikPct}%`,
		formatRupiah(p.rabKontrak),
		formatRupiah(p.terminMasuk),
		formatRupiah(p.sisaTermin),
		formatRupiah(p.bebanSubkon),
		formatRupiah(p.operasionalCih),
		formatRupiah(p.marginBersih)
	]);

	// Baris Grand Total
	const totalRow = [
		'',
		'TOTAL',
		'TOTAL PORTOFOLIO 29 TITIK SPPG',
		'',
		formatRupiah(data.summary.totalKontrak),
		formatRupiah(data.summary.totalTerminMasuk),
		formatRupiah(data.summary.totalSisaTermin),
		formatRupiah(data.summary.totalBebanSubkon),
		formatRupiah(data.summary.totalOperasionalCih),
		formatRupiah(data.summary.totalMarginBersih)
	];

	autoTable(doc, {
		startY: 26,
		head: [
			[
				'NO',
				'KODE',
				'TITIK DAPUR SPPG',
				'FISIK',
				'KONTRAK SPK',
				'TERMIN MASUK',
				'SISA TERMIN',
				'BEBAN SUBKON',
				'KAS CIH',
				'MARGIN BERSIH'
			]
		],
		body: [...tableRows, totalRow],
		theme: 'grid',
		headStyles: {
			fillColor: [30, 41, 59], // Slate-800
			textColor: [255, 255, 255],
			fontStyle: 'bold',
			fontSize: 7.5,
			halign: 'center'
		},
		bodyStyles: {
			fontSize: 7.5,
			textColor: [30, 41, 59]
		},
		columnStyles: {
			0: { cellWidth: 10, halign: 'center' },
			1: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
			2: { cellWidth: 'auto', fontStyle: 'bold' },
			3: { cellWidth: 15, halign: 'center' },
			4: { cellWidth: 26, halign: 'right' },
			5: { cellWidth: 26, halign: 'right' },
			6: { cellWidth: 26, halign: 'right' },
			7: { cellWidth: 26, halign: 'right' },
			8: { cellWidth: 24, halign: 'right' },
			9: { cellWidth: 28, halign: 'right', fontStyle: 'bold' }
		},
		didParseCell: (dataHook: any) => {
			// Format styling untuk baris grand total
			if (dataHook.row.index === tableRows.length) {
				dataHook.cell.styles.fillColor = [241, 245, 249];
				dataHook.cell.styles.fontStyle = 'bold';
				dataHook.cell.styles.textColor = [15, 23, 42];
			}
		},
		margin: { left: 14, right: 14 }
	});

	// Footer Note
	doc.setFont('helvetica', 'italic');
	doc.setFontSize(7.5);
	doc.setTextColor(148, 163, 184);
	doc.text(
		'Dokumen digital sah • Diunduh langsung dari Sistem Pantau MBG • Tanpa tanda tangan basah fisik',
		pageWidth / 2,
		200,
		{ align: 'center' }
	);

	// DIRECT DOWNLOAD (Bukan print dialog browser)
	const dateCode = new Date().toISOString().split('T')[0];
	doc.save(`Laporan-Rekapitulasi-Kas-SPPG-${dateCode}.pdf`);
}

// ============================================================================
// 4. GENERATOR & DIRECT DOWNLOAD LAPORAN MUTASI KAS LAPANGAN CIH (A4 LANDSCAPE)
// ============================================================================
export interface KasLapanganReportData {
	exportDate: string;
	transactions: Array<{
		id: number | string;
		tgl: string;
		tipe: string;
		kategori: string;
		namaProyek?: string | null;
		penerimaPic?: string | null;
		nominal: number;
		keterangan: string;
	}>;
	summary: {
		saldoSaatIni: number;
		totalMasuk: number;
		totalKeluar: number;
	};
}

export async function downloadLaporanKasLapanganPdf(data: KasLapanganReportData): Promise<void> {
	const { jsPDF, autoTable } = await loadPdfModules();

	const doc = new jsPDF({
		orientation: 'landscape',
		unit: 'mm',
		format: 'a4'
	});

	const pageWidth = doc.internal.pageSize.getWidth();

	// Title Banner - Clean Corporate Light Theme
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(13);
	doc.setTextColor(15, 23, 42); // Slate-900
	doc.text('PT. SENTRA GIZI INDONESIA - BUKU KAS OPERASIONAL LAPANGAN (CIH)', 14, 13);

	doc.setFont('helvetica', 'normal');
	doc.setFontSize(8);
	doc.setTextColor(100, 116, 139);
	doc.text(
		`Tanggal Cetak: ${data.exportDate} | Sumber Kas: Cash In Hand (CIH) Lapangan | Dokumen Pembukuan Resmi Proyek MBG`,
		14,
		18.5
	);

	doc.setDrawColor(203, 213, 225);
	doc.setLineWidth(0.4);
	doc.line(14, 22, pageWidth - 14, 22);

	// Summary Cards Bar (Mini 3 Metrics)
	const cardY = 25;
	const cardWidth = (pageWidth - 28 - 8) / 3;

	// Card 1: Saldo
	doc.setFillColor(248, 250, 252);
	doc.setDrawColor(203, 213, 225);
	doc.roundedRect(14, cardY, cardWidth, 14, 1, 1, 'FD');
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(7);
	doc.setTextColor(100, 116, 139);
	doc.text('SALDO KAS DI LAPANGAN (CIH):', 18, cardY + 5);
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(9.5);
	doc.setTextColor(15, 23, 42);
	doc.text(formatRupiah(data.summary.saldoSaatIni), 18, cardY + 11);

	// Card 2: Total Masuk
	doc.roundedRect(14 + cardWidth + 4, cardY, cardWidth, 14, 1, 1, 'FD');
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(7);
	doc.setTextColor(100, 116, 139);
	doc.text('TOTAL PEMASUKAN (DROP INDUK):', 18 + cardWidth + 4, cardY + 5);
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(9.5);
	doc.setTextColor(5, 150, 105);
	doc.text(formatRupiah(data.summary.totalMasuk), 18 + cardWidth + 4, cardY + 11);

	// Card 3: Total Pengeluaran
	doc.roundedRect(14 + (cardWidth + 4) * 2, cardY, cardWidth, 14, 1, 1, 'FD');
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(7);
	doc.setTextColor(100, 116, 139);
	doc.text('TOTAL REALISASI PENGELUARAN:', 18 + (cardWidth + 4) * 2, cardY + 5);
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(9.5);
	doc.setTextColor(225, 29, 72);
	doc.text(formatRupiah(data.summary.totalKeluar), 18 + (cardWidth + 4) * 2, cardY + 11);

	// Table Rows
	const tableRows = data.transactions.map((t, idx) => [
		idx + 1,
		formatTanggal(t.tgl),
		t.tipe === 'IN' ? 'KAS MASUK' : 'PENGELUARAN',
		formatKategoriLabel(t.kategori),
		t.namaProyek || 'Umum Lapangan',
		t.penerimaPic || '-',
		t.keterangan || '-',
		t.tipe === 'IN' ? formatRupiah(t.nominal) : '-',
		t.tipe === 'OUT' ? formatRupiah(t.nominal) : '-'
	]);

	const totalRow = [
		'',
		'TOTAL',
		'',
		'',
		'',
		'',
		'TOTAL REKAPITULASI MUTASI KAS OPERASIONAL',
		formatRupiah(data.summary.totalMasuk),
		formatRupiah(data.summary.totalKeluar)
	];

	autoTable(doc, {
		startY: 42,
		head: [
			[
				'NO',
				'TANGGAL',
				'ALUR',
				'KATEGORI BIAYA',
				'BEBAN PROYEK',
				'PIC / PENERIMA',
				'URAIAN TRANSAKSI',
				'MASUK (RP)',
				'KELUAR (RP)'
			]
		],
		body: [...tableRows, totalRow],
		theme: 'grid',
		headStyles: {
			fillColor: [30, 41, 59], // Slate-800
			textColor: [255, 255, 255],
			fontStyle: 'bold',
			fontSize: 7.5,
			halign: 'center'
		},
		bodyStyles: {
			fontSize: 7.5,
			textColor: [30, 41, 59]
		},
		columnStyles: {
			0: { cellWidth: 10, halign: 'center' },
			1: { cellWidth: 20, halign: 'center' },
			2: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
			3: { cellWidth: 32 },
			4: { cellWidth: 30 },
			5: { cellWidth: 26 },
			6: { cellWidth: 'auto' },
			7: { cellWidth: 26, halign: 'right' },
			8: { cellWidth: 26, halign: 'right' }
		},
		didParseCell: (dataHook: any) => {
			if (dataHook.row.index === tableRows.length) {
				dataHook.cell.styles.fillColor = [241, 245, 249];
				dataHook.cell.styles.fontStyle = 'bold';
				dataHook.cell.styles.textColor = [15, 23, 42];
			}
		},
		margin: { left: 14, right: 14 }
	});

	// Footer Note
	doc.setFont('helvetica', 'italic');
	doc.setFontSize(7.5);
	doc.setTextColor(148, 163, 184);
	doc.text(
		'Dokumen digital sah • Diterbitkan melalui Sistem Pantau MBG SPPG • Tanpa tanda tangan basah fisik',
		pageWidth / 2,
		200,
		{ align: 'center' }
	);

	const dateCode = new Date().toISOString().split('T')[0];
	doc.save(`Laporan-Mutasi-Kas-CIH-${dateCode}.pdf`);
}
