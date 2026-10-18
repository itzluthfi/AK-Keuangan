<script lang="ts">
	import { page } from '$app/state';
	import { appState } from '#lib/app-state.svelte';
	import {
		Menu,
		ChevronRight,
		Search,
		Bell,
		Sun,
		Moon,
		User,
		LogOut,
		ChevronDown,
		CheckCircle2,
		AlertTriangle,
		ShieldCheck,
		Settings,
		Users,
		Clock,
		ExternalLink
	} from 'lucide-svelte';

	let isProfileOpen = $state(false);

	let breadcrumb = $derived.by(() => {
		const path = page.url.pathname;
		if (path === '/') return { parent: 'Dashboard', current: 'Kas Besar SPPG' };
		if (path.startsWith('/cash-pooling')) return { parent: 'Portofolio', current: 'Cash Pooling' };
		if (path.startsWith('/kas-lapangan')) return { parent: 'Operasional', current: 'Kasir CIH Lapangan' };
		if (path.startsWith('/invoice')) return { parent: 'Operasional', current: 'Generator Invoice' };
		if (path.startsWith('/cetak')) return { parent: 'Laporan', current: 'Rekapitulasi Cetak' };
		if (path.startsWith('/proyek')) return { parent: 'Master Data', current: 'Titik Proyek' };
		if (path.startsWith('/subkon')) return { parent: 'Master Data', current: 'Subkon & Mandor' };
		if (path.startsWith('/rekening')) return { parent: 'Master Data', current: 'Rekening Bank & Kas' };
		if (path.startsWith('/pengguna')) return { parent: 'Master Data', current: 'Pengguna Sistem' };
		if (path.startsWith('/peran')) return { parent: 'Master Data', current: 'Peran & Hak Akses' };
		if (path.startsWith('/pengaturan')) return { parent: 'Sistem', current: 'Pengaturan Sistem' };
		return { parent: 'Pantau MBG', current: 'Monitoring' };
	});

	// Realistic Operational Alerts for the Notification Center
	const alerts = [
		{
			id: 1,
			type: 'warning',
			title: 'Kasbon Melebihi Progres Fisik',
			desc: 'Pengajuan kasbon Mandor Rohman (Dapur 17) telah mencapai 75%, progres fisik 60%.',
			time: '10 menit lalu',
			url: '/subkon'
		},
		{
			id: 2,
			type: 'info',
			title: 'Termin 2 Siap Verifikasi',
			desc: 'SPPG Dapur 04 telah mencapai progres 50%, termin 2 (Rp 320jt) siap diverifikasi.',
			time: '45 menit lalu',
			url: '/proyek'
		},
		{
			id: 3,
			type: 'alert',
			title: 'Saldo Kas Kecil Lapangan Menipis',
			desc: 'Kasir CIH Titik Dapur 11 tersisa Rp 4.200.000 (di bawah batas aman Rp 5jt).',
			time: '2 jam lalu',
			url: '/kas-lapangan'
		}
	];

	function closeAllDropdowns() {
		isProfileOpen = false;
		if (appState.isNotificationsOpen) appState.closeNotifications();
	}
</script>

<svelte:window onclick={(e) => {
	const target = e.target as HTMLElement;
	if (!target.closest('.user-dropdown-container') && !target.closest('.notif-dropdown-container')) {
		closeAllDropdowns();
	}
}} />

<header class="no-print sticky top-0 z-30 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md h-16 px-4 sm:px-6 flex items-center justify-between gap-3 select-none">
	
	<!-- Left Side: Mobile Hamburger & Breadcrumb -->
	<div class="flex items-center gap-2 sm:gap-3 shrink-0">
		<button
			type="button"
			onclick={() => appState.toggleMobileSidebar()}
			class="lg:hidden min-w-[40px] min-h-[40px] -ml-1.5 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
			aria-label="Buka Menu Navigasi"
		>
			<Menu class="w-5 h-5" />
		</button>

		<nav class="flex items-center gap-1.5 text-xs">
			<span class="text-slate-400 font-medium hidden sm:inline">{breadcrumb.parent}</span>
			<ChevronRight class="w-3.5 h-3.5 text-slate-300 hidden sm:inline" />
			<span class="font-bold text-slate-900">{breadcrumb.current}</span>
		</nav>
	</div>

	<!-- Center: Global Search Trigger Bar (Command Palette) -->
	<div class="flex-1 max-w-md mx-2 hidden sm:block">
		<button
			type="button"
			onclick={() => appState.openSearch()}
			class="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs transition-colors cursor-pointer group"
		>
			<div class="flex items-center gap-2.5 truncate">
				<Search class="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-colors" />
				<span class="truncate text-slate-500 group-hover:text-slate-700">Cari proyek, subkon, faktur...</span>
			</div>
			<kbd class="hidden md:inline-flex items-center gap-0.5 text-[10px] font-mono font-bold px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-400 shadow-2xs">Ctrl K</kbd>
		</button>
	</div>

	<!-- Right Side Actions: Search (Mobile), Theme Toggle, Notifications, User Profile -->
	<div class="flex items-center gap-1.5 sm:gap-2 shrink-0">

		<!-- Mobile Search Icon Button -->
		<button
			type="button"
			onclick={() => appState.openSearch()}
			class="sm:hidden min-w-[38px] min-h-[38px] rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
			title="Cari Proyek & Data (Ctrl K)"
		>
			<Search class="w-4 h-4" />
		</button>

		<!-- Theme Toggle (Light / Dark) -->
		<button
			type="button"
			onclick={() => appState.toggleTheme()}
			class="min-w-[38px] min-h-[38px] rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
			title={appState.theme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
			aria-label="Toggle Theme"
		>
			{#if appState.theme === 'dark'}
				<Sun class="w-4 h-4 text-amber-500" />
			{:else}
				<Moon class="w-4 h-4 text-slate-600" />
			{/if}
		</button>

		<!-- Notification Bell Center with Popover Drawer -->
		<div class="relative notif-dropdown-container">
			<button
				type="button"
				onclick={() => {
					isProfileOpen = false;
					appState.toggleNotifications();
				}}
				class="relative min-w-[38px] min-h-[38px] rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
				title="Pemberitahuan & Peringatan Risiko"
				aria-label="Pemberitahuan"
			>
				<Bell class="w-4 h-4" />
				<!-- Notification Badge Count -->
				<span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
			</button>

			{#if appState.isNotificationsOpen}
				<div class="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
					<div class="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
						<div class="flex items-center gap-2">
							<span class="text-xs font-bold text-slate-900">Pemberitahuan Operasional</span>
							<span class="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">3 Baru</span>
						</div>
						<button
							type="button"
							onclick={() => appState.closeNotifications()}
							class="text-[11px] text-slate-400 hover:text-slate-700"
						>
							Tutup
						</button>
					</div>

					<div class="divide-y divide-slate-100 max-h-80 overflow-y-auto">
						{#each alerts as alert}
							<a
								href={alert.url}
								onclick={() => appState.closeNotifications()}
								class="block p-3.5 hover:bg-slate-50 transition-colors"
							>
								<div class="flex items-start gap-2.5">
									{#if alert.type === 'warning'}
										<div class="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/60">
											<AlertTriangle class="w-3.5 h-3.5" />
										</div>
									{:else if alert.type === 'alert'}
										<div class="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200/60">
											<Clock class="w-3.5 h-3.5" />
										</div>
									{:else}
										<div class="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200/60">
											<CheckCircle2 class="w-3.5 h-3.5" />
										</div>
									{/if}

									<div class="flex-1 min-w-0">
										<div class="text-xs font-bold text-slate-900 leading-tight">{alert.title}</div>
										<p class="text-[11px] text-slate-500 mt-0.5 leading-snug">{alert.desc}</p>
										<span class="text-[10px] text-slate-400 mt-1 block">{alert.time}</span>
									</div>
								</div>
							</a>
						{/each}
					</div>

					<div class="px-4 py-2 border-t border-slate-100 text-center bg-slate-50/50">
						<a
							href="/proyek"
							onclick={() => appState.closeNotifications()}
							class="text-xs font-bold text-slate-700 hover:text-slate-900"
						>
							Lihat Semua Peringatan Risiko &rarr;
						</a>
					</div>
				</div>
			{/if}
		</div>

		<!-- Unified User Profile Dropdown Pill -->
		<div class="relative user-dropdown-container">
			<button
				type="button"
				onclick={() => {
					if (appState.isNotificationsOpen) appState.closeNotifications();
					isProfileOpen = !isProfileOpen;
				}}
				class="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
			>
				<div class="w-7 h-7 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
					{appState.initials}
				</div>
				<div class="text-left hidden sm:block">
					<div class="text-xs font-bold text-slate-900 leading-tight truncate max-w-[110px]">{appState.currentUser}</div>
					<div class="text-[9px] text-slate-500 font-semibold leading-none mt-0.5 truncate">{appState.userRoleLabel}</div>
				</div>
				<ChevronDown class="w-3.5 h-3.5 text-slate-400 shrink-0 ml-0.5" />
			</button>

			<!-- Profile Dropdown Menu -->
			{#if isProfileOpen}
				<div class="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
					<!-- User Info Header -->
					<div class="px-4 py-2.5 border-b border-slate-100">
						<div class="text-xs font-bold text-slate-900 truncate">{appState.currentUser}</div>
						<div class="text-[11px] text-slate-400 truncate mt-0.5">user@sppg.id</div>
						<span class="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700 border border-slate-200">
							{appState.currentRole}
						</span>
					</div>

					<!-- Role Perspective Switcher (Clean Select) -->
					<div class="px-3 py-2.5 bg-slate-50/70 border-b border-slate-100 space-y-1">
						<label for="navbar-role-select" class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
							Simulasi Peran Akses:
						</label>
						<select
							id="navbar-role-select"
							value={appState.currentRole}
							onchange={(e) => {
								appState.setRole((e.target as HTMLSelectElement).value as any);
								isProfileOpen = false;
							}}
							class="w-full text-xs font-bold border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-slate-900 cursor-pointer shadow-2xs"
						>
							<option value="DIREKTUR">Direktur (Akses Penuh)</option>
							<option value="FINANCE">Finance (HO & Kas)</option>
							<option value="SITE_MANAGER">Site Manager (Lapangan)</option>
						</select>
					</div>

					<!-- Shortcuts -->
					<div class="py-1">
						<a
							href="/pengguna"
							onclick={() => isProfileOpen = false}
							class="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
						>
							<Users class="w-4 h-4 text-slate-400" />
							<span>Kelola Pengguna Sistem</span>
						</a>
						<a
							href="/pengaturan"
							onclick={() => isProfileOpen = false}
							class="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
						>
							<Settings class="w-4 h-4 text-slate-400" />
							<span>Pengaturan Sistem</span>
						</a>
					</div>

					<!-- Divider & Logout Button -->
					<div class="pt-1 border-t border-slate-100 px-3">
						<form method="POST" action="/login?/logout">
							<button
								type="submit"
								class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50/60 hover:bg-rose-100 hover:text-rose-700 border border-rose-200/50 transition-colors cursor-pointer"
							>
								<LogOut class="w-3.5 h-3.5 text-rose-600" />
								<span>Keluar (Logout)</span>
							</button>
						</form>
					</div>
				</div>
			{/if}
		</div>

	</div>

</header>
