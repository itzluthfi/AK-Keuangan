// Svelte 5 Native Store matching React Hot Toast API & Aesthetics

export interface ToastItem {
	id: string;
	type: 'success' | 'error' | 'loading' | 'default';
	message: string;
	duration?: number;
}

class ToastStore {
	toasts = $state<ToastItem[]>([]);

	add(type: ToastItem['type'], message: string, duration = 3500): string {
		const id = Math.random().toString(36).substring(2, 9);
		const newToast: ToastItem = { id, type, message, duration };

		// Batasi maksimal 4 toast bersamaan
		if (this.toasts.length >= 4) {
			this.toasts = [...this.toasts.slice(1), newToast];
		} else {
			this.toasts = [...this.toasts, newToast];
		}

		if (duration > 0 && type !== 'loading') {
			setTimeout(() => {
				this.dismiss(id);
			}, duration);
		}

		return id;
	}

	success(message: string, duration?: number): string {
		return this.add('success', message, duration);
	}

	error(message: string, duration?: number): string {
		return this.add('error', message, duration ?? 4000);
	}

	loading(message: string): string {
		return this.add('loading', message, 0);
	}

	dismiss(id?: string): void {
		if (id) {
			this.toasts = this.toasts.filter((t) => t.id !== id);
		} else {
			this.toasts = [];
		}
	}
}

export const toast = new ToastStore();
