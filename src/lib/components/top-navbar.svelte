<script lang="ts">
	import { page } from '$app/state';
	import { appState } from '#lib/app-state.svelte';
	import {
		Menu,
		ChevronRight,
		LogOut
	} from 'lucide-svelte';

	let breadcrumb = $derived.by(() => {
		const path = page.url.pathname;
		if (path === '/') return { parent: 'Dashboard', current: 'Kas Besar SPPG' };
		if (path.startsWith('/kas-lapangan')) return { parent: 'Operasional', current: 'Kasir CIH Lapangan' };
		if (path.startsWith('/cash-pooling')) return { parent: 'Portofolio', current: 'Cash Pooling' };
		if (path.startsWith('/cetak')) return { parent: 'Laporan', current: 'Rekapitulasi Cetak' };
		if (path.startsWith('/subkon')) return { parent: 'Manajemen', current: 'Subkon & Mandor' };
		if (path.startsWith('/pengaturan')) return { parent: 'Sistem', current: 'Pengaturan Sistem' };
		if (path.startsWith('/proyek')) return { parent: 'Proyek', current: 'Titik Dapur SPPG' };
		return { parent: 'Pantau MBG', current: 'Monitoring' };
	});
</script>

<header class="no-print sticky top-0 z-30 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
	
	<!-- Left Side: Hamburger Trigger & Breadcrumb -->
	<div class="flex items-center gap-3">
		<!-- Mobile Sidebar Hamburger Toggle (min-h 44px for thumb accessibility) -->
		<button
			type="button"
			onclick={() => appState.toggleMobileSidebar()}
			class="lg:hidden min-w-[44px] min-h-[44px] -ml-2 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
			aria-label="Buka Menu Navigasi"
		>
			<Menu class="w-5 h-5" />
		</button>

		<!-- Breadcrumb Trail -->
		<nav class="flex items-center gap-1.5 text-xs">
			<span class="text-slate-400 font-medium hidden sm:inline">{breadcrumb.parent}</span>
			<ChevronRight class="w-3.5 h-3.5 text-slate-300 hidden sm:inline" />
			<span class="font-semibold text-slate-900">{breadcrumb.current}</span>
		</nav>
	</div>

	<!-- Right Side: User Profile & Logout -->
	<div class="flex items-center gap-2 sm:gap-3">
		<!-- Active User Pill -->
		<div class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50">
			<div class="w-6 h-6 rounded bg-white border border-slate-200 text-slate-700 font-semibold text-[11px] flex items-center justify-center">
				{appState.initials}
			</div>
			<div class="hidden sm:block text-left">
				<div class="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[120px]">{appState.currentUser}</div>
				<div class="text-[9px] text-slate-400 uppercase tracking-wider font-medium leading-none">{appState.currentRole}</div>
			</div>
		</div>

		<!-- Logout Button -->
		<form method="POST" action="/login?/logout">
			<button
				type="submit"
				class="min-w-[40px] min-h-[40px] rounded-lg flex items-center justify-center text-rose-500 bg-rose-50/50 hover:text-rose-700 hover:bg-rose-100/80 border border-rose-200/50 transition-colors cursor-pointer"
				title="Keluar dari sesi (Logout)"
				aria-label="Logout"
			>
				<LogOut class="w-4 h-4 text-rose-600" />
			</button>
		</form>

	</div>

</header>
