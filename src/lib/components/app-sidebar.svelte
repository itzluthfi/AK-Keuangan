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
		FileText
	} from 'lucide-svelte';

	function handleNavigate() {
		appState.closeMobileSidebar();
	}

	let userRole = $derived(page.data.user?.role || 'SITE_MANAGER');

	const allNavGroups = [
		{
			label: 'Portofolio & Kas',
			items: [
				{
					title: 'Kas Besar (Dashboard)',
					url: '/',
					icon: LayoutDashboard,
					roles: ['DIREKTUR', 'FINANCE', 'SITE_MANAGER']
				},
				{
					title: 'Cash Pooling',
					url: '/cash-pooling',
					icon: ArrowRightLeft,
					roles: ['DIREKTUR', 'FINANCE']
				}
			]
		},
		{
			label: 'Manajemen Proyek SPPG',
			items: [
				{
					title: 'Titik Dapur SPPG',
					url: '/proyek',
					icon: Layers,
					roles: ['DIREKTUR', 'FINANCE', 'SITE_MANAGER']
				},
				{
					title: 'Subkon & Mandor',
					url: '/subkon',
					icon: HardHat,
					roles: ['DIREKTUR', 'FINANCE', 'SITE_MANAGER']
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
					roles: ['DIREKTUR', 'FINANCE', 'SITE_MANAGER']
				}
			]
		},
		{
			label: 'Pelaporan & Eksekutif',
			items: [
				{
					title: 'Laporan Rekapitulasi',
					url: '/cetak/laporan',
					icon: FileSpreadsheet,
					roles: ['DIREKTUR', 'FINANCE']
				},
				{
					title: 'Generator Invoice',
					url: '/invoice',
					icon: FileText,
					roles: ['DIREKTUR', 'FINANCE']
				}
			]
		},
		{
			label: 'Sistem & Master Data',
			items: [
				{
					title: 'Pengaturan & Master Data',
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

	<!-- Sidebar Navigation Links -->
	<div class="flex-1 overflow-y-auto px-3 py-4 space-y-6">
		{#each navGroups as group (group.label)}
			<div>
				<div class="px-3 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
					{group.label}
				</div>
				<div class="space-y-0.5">
					{#each group.items as item (item.url)}
						{@const isActive = item.url === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(item.url)}
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

	<!-- Sidebar User Profile & Role Switcher Footer (Integrated 2-Item Layout) -->
	<div class="border-t border-slate-200 p-3 space-y-2">
		<!-- 1. Integrated User Profile & Role Card -->
		<div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
			<div class="flex items-center gap-2.5 mb-2">
				<div class="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-800 flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
					{appState.initials}
				</div>
				<div class="flex-1 min-w-0">
					<div class="text-xs font-bold text-slate-900 truncate leading-tight">{appState.currentUser}</div>
					<div class="text-[10px] text-slate-500 font-medium truncate mt-0.5">{appState.userRoleLabel}</div>
				</div>
			</div>

			<!-- Sleek Styled Role Dropdown Pill -->
			<div class="relative">
				<select
					value={appState.currentRole}
					onchange={(e) => appState.setRole((e.target as HTMLSelectElement).value as any)}
					class="w-full appearance-none text-[11px] font-bold border border-slate-200 rounded-lg pl-7 pr-6 py-1.5 bg-white text-slate-800 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer shadow-2xs transition-all"
					title="Ganti Role Simulasi Akun"
				>
					<option value="DIREKTUR">Pimpinan (Direktur)</option>
					<option value="FINANCE">Finance (Kasir)</option>
					<option value="SITE_MANAGER">Site Manager</option>
				</select>
				<ShieldCheck class="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
				<ChevronDown class="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
			</div>
		</div>

		<!-- 2. Logout Button (Red Icon & Red Text - Form POST to /login?/logout) -->
		<form method="POST" action="/login?/logout" class="w-full">
			<button
				type="submit"
				class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50/70 hover:bg-rose-100 hover:text-rose-700 border border-rose-200/70 transition-colors cursor-pointer"
			>
				<LogOut class="w-4 h-4 text-rose-600" />
				<span>Keluar Akun (Logout)</span>
			</button>
		</form>
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
					class="w-11 h-11 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
					aria-label="Tutup Menu"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Mobile Nav Menu (Touch Target >= 44px each item) -->
			<div class="flex-1 overflow-y-auto px-3 py-4 space-y-6">
				{#each navGroups as group (group.label)}
					<div>
						<div class="px-3 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
							{group.label}
						</div>
						<div class="space-y-1">
							{#each group.items as item (item.url)}
								{@const isActive = item.url === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(item.url)}
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

			<!-- Mobile User Profile & Logout (Integrated 2-Item Layout) -->
			<div class="border-t border-slate-200 p-4 space-y-2 bg-slate-50">
				<!-- Integrated Card -->
				<div class="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
					<div class="flex items-center gap-3 mb-2.5">
						<div class="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 flex items-center justify-center font-black text-sm shrink-0">
							{appState.initials}
						</div>
						<div class="flex-1 min-w-0">
							<div class="text-sm font-bold text-slate-900 truncate leading-tight">{appState.currentUser}</div>
							<div class="text-xs text-slate-500 font-medium truncate mt-0.5">{appState.userRoleLabel}</div>
						</div>
					</div>

					<div class="relative">
						<select
							value={appState.currentRole}
							onchange={(e) => appState.setRole((e.target as HTMLSelectElement).value as any)}
							class="w-full h-10 appearance-none text-xs font-bold border border-slate-200 rounded-lg pl-8 pr-8 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer transition-all"
						>
							<option value="DIREKTUR">Pimpinan (Direktur)</option>
							<option value="FINANCE">Finance (Kasir)</option>
							<option value="SITE_MANAGER">Site Manager</option>
						</select>
						<ShieldCheck class="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
						<ChevronDown class="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
					</div>
				</div>

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
