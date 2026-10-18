<script lang="ts">
	import { page } from '$app/state';
	import { appState } from '#lib/app-state.svelte';
	import {
		Building2,
		LayoutDashboard,
		ArrowRightLeft,
		Receipt,
		FileSpreadsheet,
		LogOut,
		X,
		ShieldCheck,
		HardHat,
		Layers,
		Settings,
		ChevronDown,
		FileText,
		Landmark,
		KeyRound,
		Sliders,
		Users,
		Database
	} from 'lucide-svelte';

	function handleNavigate() {
		appState.closeMobileSidebar();
	}

	let userRole = $derived(page.data.user?.role || 'SITE_MANAGER');

	function isItemActive(itemUrl: string) {
		if (itemUrl === '/') return page.url.pathname === '/' && page.url.search === '';
		return page.url.pathname === itemUrl || page.url.pathname.startsWith(itemUrl + '/');
	}

	const allNavGroups = [
		{
			label: 'Portofolio & Kas',
			items: [
				{
					title: 'Kas Besar (Dashboard)',
					url: '/',
					icon: LayoutDashboard,
					roles: ['DIREKTUR', 'FINANCE', 'SITE_MANAGER', 'AUDITOR']
				},
				{
					title: 'Cash Pooling',
					url: '/cash-pooling',
					icon: ArrowRightLeft,
					roles: ['DIREKTUR', 'FINANCE', 'AUDITOR']
				}
			]
		},
		{
			label: 'Operasional Lapangan',
			items: [
				{
					title: 'Kasir CIH (Kas Lapangan)',
					url: '/kas-lapangan',
					icon: Receipt,
					roles: ['DIREKTUR', 'FINANCE', 'SITE_MANAGER', 'AUDITOR']
				},
				{
					title: 'Generator Invoice',
					url: '/invoice',
					icon: FileText,
					roles: ['DIREKTUR', 'FINANCE', 'AUDITOR']
				},
				{
					title: 'Laporan Rekapitulasi',
					url: '/cetak/laporan',
					icon: FileSpreadsheet,
					roles: ['DIREKTUR', 'FINANCE', 'AUDITOR']
				}
			]
		},
		{
			label: 'Master Data',
			items: [
				{
					title: 'Titik Proyek',
					url: '/proyek',
					icon: Layers,
					roles: ['DIREKTUR', 'FINANCE', 'SITE_MANAGER', 'AUDITOR']
				},
				{
					title: 'Subkon & Mandor',
					url: '/subkon',
					icon: HardHat,
					roles: ['DIREKTUR', 'FINANCE', 'SITE_MANAGER', 'AUDITOR']
				},
				{
					title: 'Rekening Bank & Kas',
					url: '/rekening',
					icon: Landmark,
					roles: ['DIREKTUR', 'FINANCE']
				},
				{
					title: 'Pengguna Sistem',
					url: '/pengguna',
					icon: Users,
					roles: ['DIREKTUR']
				},
				{
					title: 'Peran & Hak Akses',
					url: '/peran',
					icon: KeyRound,
					roles: ['DIREKTUR']
				}
			]
		},
		{
			label: 'Sistem',
			items: [
				{
					title: 'Pengaturan Sistem',
					url: '/pengaturan',
					icon: Settings,
					roles: ['DIREKTUR']
				}
			]
		}
	];

	let navGroups = $derived(
		allNavGroups
			.map(group => ({
				...group,
				items: group.items.filter(item => item.roles.includes(userRole))
			}))
			.filter(group => group.items.length > 0)
	);
</script>

<!-- DESKTOP SIDEBAR (Static/Fixed on lg: screens) -->
<aside class="hidden lg:flex w-64 flex-col border-r border-slate-200 bg-white min-h-screen shrink-0 sticky top-0 h-screen select-none">
	
	<!-- Sidebar Header / Brand -->
	<div class="h-16 border-b border-slate-200 px-5 flex items-center gap-3">
		<div class="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shrink-0">
			<Building2 class="w-4 h-4 text-white" />
		</div>
		<div class="flex-1 min-w-0">
			<div class="font-bold tracking-tight text-slate-900 text-sm leading-none">PANTAU MBG</div>
			<div class="text-[10px] text-slate-500 font-medium mt-1 truncate">Sistem Kas Proyek SPPG</div>
		</div>
	</div>

	<!-- Sidebar Navigation Links (Compact, Clean, Spacious) -->
	<div class="flex-1 overflow-y-auto px-3 py-4 space-y-5">
		{#each navGroups as group (group.label)}
			<div>
				<div class="px-3 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
					{group.label}
				</div>
				<div class="space-y-0.5">
					{#each group.items as item (item.url)}
						{@const isActive = isItemActive(item.url)}
						<a
							href={item.url}
							class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors {isActive ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}"
						>
							<item.icon class="w-4 h-4 shrink-0 {isActive ? 'text-slate-900' : 'text-slate-400'}" />
							<span class="truncate">{item.title}</span>
						</a>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<!-- Desktop Footer: Clean & Light System Info (No duplicate profile/logout here) -->
	<div class="border-t border-slate-200 px-4 py-3 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-400">
		<span class="font-medium text-slate-500">Pantau MBG Enterprise</span>
		<span class="font-mono text-[10px] px-1.5 py-0.5 bg-slate-200/60 rounded text-slate-600 font-semibold">v2.4</span>
	</div>

</aside>

<!-- MOBILE & TABLET DRAWER OVERLAY (< lg screens) -->
{#if appState.isMobileSidebarOpen}
	<div
		class="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex lg:hidden animate-in fade-in duration-200"
		onclick={() => appState.closeMobileSidebar()}
		role="dialog"
		aria-modal="true"
	>
		<!-- Slide Drawer Container -->
		<div
			class="w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-left duration-200"
			onclick={(e) => e.stopPropagation()}
			role="document"
		>
			<!-- Mobile Header -->
			<div class="h-16 border-b border-slate-200 px-4 flex items-center justify-between">
				<div class="flex items-center gap-2.5">
					<div class="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shrink-0">
						<Building2 class="w-4 h-4 text-white" />
					</div>
					<div>
						<div class="font-bold tracking-tight text-slate-900 text-sm leading-none">PANTAU MBG</div>
						<div class="text-[10px] text-slate-500 font-medium mt-0.5">Sistem Kas Proyek SPPG</div>
					</div>
				</div>

				<!-- Close Drawer Button (Touch Target >= 44px) -->
				<button
					type="button"
					onclick={() => appState.closeMobileSidebar()}
					class="w-11 h-11 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
					aria-label="Tutup Menu"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Mobile Nav Menu (Touch Target >= 44px each item) -->
			<div class="flex-1 overflow-y-auto px-3 py-4 space-y-5">
				{#each navGroups as group (group.label)}
					<div>
						<div class="px-3 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
							{group.label}
						</div>
						<div class="space-y-1">
							{#each group.items as item (item.url)}
								{@const isActive = isItemActive(item.url)}
								<a
									href={item.url}
									onclick={handleNavigate}
									class="w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors {isActive ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50 active:bg-slate-100'}"
								>
									<item.icon class="w-5 h-5 {isActive ? 'text-slate-900' : 'text-slate-400'}" />
									<span>{item.title}</span>
								</a>
							{/each}
						</div>
					</div>
				{/each}
			</div>

			<!-- Mobile Compact Logout -->
			<div class="border-t border-slate-200 p-4 bg-slate-50">
				<form method="POST" action="/login?/logout" class="w-full">
					<button
						type="submit"
						onclick={handleNavigate}
						class="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl border border-rose-200/80 bg-rose-50 text-rose-600 font-bold text-xs hover:text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
					>
						<LogOut class="w-4 h-4 text-rose-600" />
						<span>Keluar Akun (Logout)</span>
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}
