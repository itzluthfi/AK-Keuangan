import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Format angka menjadi Rupiah Indonesia
 * Contoh: 1500000 -> "Rp 1.500.000"
 */
export function formatRupiah(value: number | null | undefined): string {
	if (value === null || value === undefined || isNaN(value)) return 'Rp 0';
	const rounded = Math.round(value);
	return 'Rp ' + rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Format angka rupiah ringkas untuk kartu metrik
 * Contoh: 1500000000 -> "Rp 1.50 M", 75000000 -> "Rp 75.0 Jt"
 */
export function formatRupiahRingkas(value: number | null | undefined): string {
	if (value === null || value === undefined || isNaN(value)) return 'Rp 0';
	const absVal = Math.abs(value);
	const sign = value < 0 ? '-' : '';

	if (absVal >= 1_000_000_000) {
		return `${sign}Rp ${(absVal / 1_000_000_000).toFixed(2)} M`;
	} else if (absVal >= 1_000_000) {
		return `${sign}Rp ${(absVal / 1_000_000).toFixed(1)} Jt`;
	} else if (absVal >= 1_000) {
		return `${sign}Rp ${(absVal / 1_000).toFixed(0)} Rb`;
	}
	return `${sign}Rp ${absVal}`;
}

/**
 * Format persentase
 * Contoh: 25.5 -> "25.5%"
 */
export function formatPersen(value: number | null | undefined): string {
	if (value === null || value === undefined || isNaN(value)) return '0.0%';
	return value.toFixed(1) + '%';
}

/**
 * Format tanggal Indonesia
 * Contoh: "2026-10-12" -> "12 Okt 2026"
 */
export function formatTanggal(dateStr: string | null | undefined): string {
	if (!dateStr) return '-';
	try {
		const d = new Date(dateStr);
		if (isNaN(d.getTime())) return dateStr;
		const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
		return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
	} catch {
		return dateStr;
	}
}
