import Sqids from 'sqids';

// Server-side unique scrambled alphabet untuk mengamankan ID publik
const sqids = new Sqids({
	minLength: 8,
	alphabet: 'kLmNoPqRsTuVwXyZ0123456789aBcDeFgHiJ'
});

/**
 * Mengonversi ID integer database menjadi hash URL-safe yang tidak dapat ditebak
 * Contoh: 1 -> "xK8mP2qL"
 */
export function encodeId(id: number): string {
	return sqids.encode([id]);
}

/**
 * Mendekode hash URL-safe kembali menjadi integer ID asli
 * Mengembalikan null jika hash tidak valid (mencegah IDOR & tampering)
 */
export function decodeId(hash: string): number | null {
	try {
		const numbers = sqids.decode(hash);
		if (!numbers || numbers.length === 0) return null;
		return numbers[0];
	} catch {
		return null;
	}
}
