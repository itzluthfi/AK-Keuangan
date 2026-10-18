<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import HotToast from '#lib/components/hot-toast.svelte';
	import AppSidebar from '#lib/components/app-sidebar.svelte';
	import TopNavbar from '#lib/components/top-navbar.svelte';
	import GlobalSearchModal from '#lib/components/global-search-modal.svelte';
	import { appState } from '#lib/app-state.svelte';
	import { toast } from 'svelte-french-toast';

	let { children } = $props();

	// Check if this is an authentication route (e.g. /login)
	let isAuthPage = $derived(page.url.pathname.startsWith('/login'));

	$effect(() => {
		const authErr = page.url.searchParams.get('auth_error');
		if (authErr) {
			toast.error(decodeURIComponent(authErr), { id: 'auth-error' });
		}
		// Synchronize theme on hydration
		const savedTheme = localStorage.getItem('pantau_theme') as 'light' | 'dark' | null;
		if (savedTheme) {
			appState.theme = savedTheme;
			document.documentElement.classList.toggle('dark', savedTheme === 'dark');
		}
	});
</script>

<svelte:head>
	<title>Pantau MBG - Monitoring Kas Proyek SPPG</title>
</svelte:head>

<!-- React Hot Toast Container (Top Center) -->
<HotToast />

<!-- Global Search Command Palette (Ctrl + K) -->
<GlobalSearchModal />

{#if isAuthPage}
	<!-- Plain Fullscreen Layout for Authentication Pages -->
	{@render children()}
{:else}
	<!-- Enterprise Admin Dashboard Layout with Responsive Sidebar & Topbar -->
	<div class="min-h-screen flex bg-slate-50/60 text-slate-900">
		
		<!-- Sidebar Navigation -->
		<AppSidebar />

		<!-- Main Workspace Area -->
		<div class="flex-1 flex flex-col min-w-0">
			<!-- Top Navbar -->
			<TopNavbar />

			<!-- Page Body -->
			<main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
				{@render children()}
			</main>

			<!-- Minimal Executive Footer -->
			<footer class="no-print border-t border-slate-200 bg-white py-4 text-xs text-slate-500">
				<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
					<div class="font-bold text-slate-700 text-xs">
						PANTAU MBG
					</div>
					<div class="text-[11px] text-slate-400">
						&copy; 2026 SPPG MBG &bull; Hak Cipta Dilindungi
					</div>
				</div>
			</footer>
		</div>

	</div>
{/if}
