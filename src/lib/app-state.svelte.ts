/**
 * Global reactive UI & session state for Pantau MBG using Svelte 5 Runes
 */
class AppState {
	isMobileSidebarOpen = $state(false);
	currentRole = $state<'DIREKTUR' | 'FINANCE' | 'SITE_MANAGER'>('DIREKTUR');
	userEmail = $state('azka@sppg.id');

	// Global Search & Notification & Theme
	isSearchOpen = $state(false);
	isNotificationsOpen = $state(false);
	theme = $state<'light' | 'dark'>('light');

	constructor() {
		if (typeof window !== 'undefined') {
			const savedTheme = localStorage.getItem('pantau_theme') as 'light' | 'dark' | null;
			if (savedTheme) {
				this.theme = savedTheme;
				document.documentElement.classList.toggle('dark', savedTheme === 'dark');
			}
		}
	}

	get currentUser(): string {
		if (this.currentRole === 'DIREKTUR') return 'Bpk. Azka (Pimpinan)';
		if (this.currentRole === 'FINANCE') return 'Admin Finance';
		return 'Mandor Lapangan';
	}

	get userRoleLabel(): string {
		if (this.currentRole === 'DIREKTUR') return 'Direktur / Pimpinan';
		if (this.currentRole === 'FINANCE') return 'Kasir & Finance';
		return 'Site Manager (Lapangan)';
	}

	get initials(): string {
		if (this.currentRole === 'DIREKTUR') return 'BA';
		if (this.currentRole === 'FINANCE') return 'AF';
		return 'ML';
	}

	toggleMobileSidebar() {
		this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
	}

	closeMobileSidebar() {
		this.isMobileSidebarOpen = false;
	}

	setRole(role: 'DIREKTUR' | 'FINANCE' | 'SITE_MANAGER') {
		this.currentRole = role;
		if (role === 'DIREKTUR') this.userEmail = 'azka@sppg.id';
		else if (role === 'FINANCE') this.userEmail = 'finance@sppg.id';
		else this.userEmail = 'mandor@sppg.id';
	}

	openSearch() {
		this.isSearchOpen = true;
	}

	closeSearch() {
		this.isSearchOpen = false;
	}

	toggleNotifications() {
		this.isNotificationsOpen = !this.isNotificationsOpen;
	}

	closeNotifications() {
		this.isNotificationsOpen = false;
	}

	toggleTheme() {
		const next = this.theme === 'light' ? 'dark' : 'light';
		this.theme = next;
		if (typeof window !== 'undefined') {
			localStorage.setItem('pantau_theme', next);
			document.documentElement.classList.toggle('dark', next === 'dark');
		}
	}
}

export const appState = new AppState();

