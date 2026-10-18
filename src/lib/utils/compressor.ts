import Compressor from 'compressorjs';

export interface CompressResult {
	file: File;
	dataUrl: string;
	originalSize: number;
	compressedSize: number;
	savingsPct: number;
	originalFormatted: string;
	compressedFormatted: string;
}

export function formatBytes(bytes: number, decimals = 1): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Mengompresi file foto struk/nota di browser sebelum diunggah ke server.
 * Mengubah foto kamera HP resolusi tinggi (5MB - 12MB) menjadi ~150KB - 300KB
 * tanpa kehilangan ketajaman teks/angka pada nota fisik.
 */
export async function compressReceiptImage(
	file: File,
	options?: {
		quality?: number;
		maxWidth?: number;
		maxHeight?: number;
	}
): Promise<CompressResult> {
	// Jika bukan tipe gambar (misal file PDF), kembalikan langsung tanpa kompresi
	if (!file.type.startsWith('image/')) {
		return new Promise((resolve) => {
			const reader = new FileReader();
			reader.onload = (e) => {
				resolve({
					file,
					dataUrl: (e.target?.result as string) || '',
					originalSize: file.size,
					compressedSize: file.size,
					savingsPct: 0,
					originalFormatted: formatBytes(file.size),
					compressedFormatted: formatBytes(file.size)
				});
			};
			reader.readAsDataURL(file);
		});
	}

	return new Promise((resolve, reject) => {
		new Compressor(file, {
			quality: options?.quality ?? 0.75,
			maxWidth: options?.maxWidth ?? 1600,
			maxHeight: options?.maxHeight ?? 1600,
			mimeType: 'image/jpeg',
			convertSize: 500000, // Otomatis konversi file > 500KB ke JPEG
			success(result: Blob) {
				const fileName = file.name.replace(/\.[^/.]+$/, '') + '-nota-sppg.jpg';
				const compressedFile = new File([result], fileName, {
					type: 'image/jpeg',
					lastModified: Date.now()
				});

				const reader = new FileReader();
				reader.onload = (e) => {
					const savings = Math.max(0, Math.round(((file.size - compressedFile.size) / file.size) * 100));
					resolve({
						file: compressedFile,
						dataUrl: e.target?.result as string,
						originalSize: file.size,
						compressedSize: compressedFile.size,
						savingsPct: savings,
						originalFormatted: formatBytes(file.size),
						compressedFormatted: formatBytes(compressedFile.size)
					});
				};
				reader.onerror = (err) => reject(err);
				reader.readAsDataURL(compressedFile);
			},
			error(err) {
				reject(err);
			}
		});
	});
}
