/**
 * Global reactive UI & session state for Pantau MBG using Svelte 5 Runes
 */
class AppState {
	isMobileSidebarOpen = $state(false);
	currentRole = $state<'DIREKTUR' | 'FINANCE' | 'SITE_MANAGER'>('DIREKTUR');
	userEmail = $state('azka@sppg.id');

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
}

export const appState = new AppState();
