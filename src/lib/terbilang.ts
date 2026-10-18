/**
 * Mengonversi nominal angka rupiah menjadi kalimat terbilang resmi Bahasa Indonesia
 * Contoh: 1500000 -> "Satu Juta Lima Ratus Ribu Rupiah"
 */
export function terbilang(nominal: number): string {
	if (isNaN(nominal) || nominal === 0) return 'Nol Rupiah';

	const bilangan = [
		'',
		'Satu',
		'Dua',
		'Tiga',
		'Empat',
		'Lima',
		'Enam',
		'Tujuh',
		'Delapan',
		'Sembilan',
		'Sepuluh',
		'Sebelas'
	];

	function sebut(angka: number): string {
		angka = Math.floor(Math.abs(angka));

		if (angka < 12) {
			return ' ' + bilangan[angka];
		} else if (angka < 20) {
			return sebut(angka - 10) + ' Belas';
		} else if (angka < 100) {
			return sebut(Math.floor(angka / 10)) + ' Puluh' + sebut(angka % 10);
		} else if (angka < 200) {
			return ' Seratus' + sebut(angka - 100);
		} else if (angka < 1000) {
			return sebut(Math.floor(angka / 100)) + ' Ratus' + sebut(angka % 100);
		} else if (angka < 2000) {
			return ' Seribu' + sebut(angka - 1000);
		} else if (angka < 1000000) {
			return sebut(Math.floor(angka / 1000)) + ' Ribu' + sebut(angka % 1000);
		} else if (angka < 1000000000) {
			return sebut(Math.floor(angka / 1000000)) + ' Juta' + sebut(angka % 1000000);
		} else if (angka < 1000000000000) {
			return sebut(Math.floor(angka / 1000000000)) + ' Miliar' + sebut(angka % 1000000000);
		} else if (angka < 1000000000000000) {
			return sebut(Math.floor(angka / 1000000000000)) + ' Triliun' + sebut(angka % 1000000000000);
		}
		return '';
	}

	const hasil = sebut(nominal).trim();
	return (nominal < 0 ? 'Minus ' : '') + hasil + ' Rupiah';
}
