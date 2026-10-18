<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from '#lib/hot-toast.svelte';
	import { 
		Building2, 
		Lock, 
		Mail, 
		ShieldCheck, 
		AlertTriangle, 
		ArrowRight, 
		Eye, 
		EyeOff,
		CheckCircle2,
		Loader2
	} from 'lucide-svelte';

	let { data, form } = $props();

	let email = $state(form?.email ?? 'azka@sppg.id');
	let password = $state('demo123');
	let showPassword = $state(false);
	let isSubmitting = $state(false);
	let isGoogleSubmitting = $state(false);

	// Validasi Frontend Lapis Pertama
	let clientError = $state<string | null>(null);

	function validateClient(): boolean {
		clientError = null;
		const trimmedEmail = email.trim();
		if (!trimmedEmail) {
			clientError = 'Alamat email wajib diisi.';
			toast.error(clientError);
			return false;
		}
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(trimmedEmail)) {
			clientError = 'Format email tidak valid (contoh: nama@perusahaan.id).';
			toast.error(clientError);
			return false;
		}
		if (!password || password.length < 6) {
			clientError = 'Kata sandi minimal 6 karakter.';
			toast.error(clientError);
			return false;
		}
		return true;
	}

	function prefillDemo(role: 'direktur' | 'finance' | 'mandor') {
		if (role === 'direktur') {
			email = 'azka@sppg.id';
			password = 'demo123';
			toast.success('Akun Direktur/Pimpinan dimuat.');
		} else if (role === 'finance') {
			email = 'finance@sppg.id';
			password = 'demo123';
			toast.success('Akun Finance/Kasir dimuat.');
		} else {
			email = 'lapangan@sppg.id';
			password = 'demo123';
			toast.success('Akun Site Manager Lapangan dimuat.');
		}
		clientError = null;
	}
</script>

<svelte:head>
	<title>Masuk Sistem Kas - Pantau MBG SPPG</title>
</svelte:head>

<div class="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
	
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<!-- Brand Logo & Title -->
		<div class="flex justify-center">
			<div class="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-md">
				<Building2 class="w-6 h-6 text-white" />
			</div>
		</div>
		<h1 class="mt-4 text-center text-2xl font-black tracking-tight text-slate-900">
			PANTAU MBG
		</h1>
		<p class="mt-1 text-center text-xs font-medium text-slate-500">
			Sistem Pengendalian Kas & Progres Fisik Proyek SPPG
		</p>
	</div>

	<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
		
		<!-- Card Box -->
		<div class="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200 rounded-2xl space-y-6">
			
			<!-- Rate Limiting / Error Alert Banner -->
			{#if form?.error || clientError}
				<div class="p-3.5 rounded-xl border {form?.isRateLimited ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-amber-50 border-amber-200 text-amber-800'} text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
					<AlertTriangle class="w-4 h-4 shrink-0 mt-0.5 {form?.isRateLimited ? 'text-rose-600' : 'text-amber-600'}" />
					<div>
						<div class="font-bold">{form?.isRateLimited ? 'Peringatan Keamanan Sistem (Rate Limit)' : 'Periksa Kembali Input Anda'}</div>
						<div class="mt-0.5 leading-relaxed">{form?.error || clientError}</div>
					</div>
				</div>
			{/if}

			<!-- Option 1: Google OAuth SSO Button -->
			<form 
				method="POST" 
				action="?/googleOAuthLogin"
				use:enhance={() => {
					isGoogleSubmitting = true;
					return async ({ update }) => {
						isGoogleSubmitting = false;
						await update();
					};
				}}
			>
				<button
					type="submit"
					disabled={isGoogleSubmitting || form?.isRateLimited}
					class="w-full h-11 flex items-center justify-center gap-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs hover:border-slate-300 disabled:opacity-50 cursor-pointer"
				>
					{#if isGoogleSubmitting}
						<Loader2 class="w-4 h-4 animate-spin text-slate-500" />
						<span>Menghubungkan ke Google Workspace...</span>
					{:else}
						<!-- Official Google SVG Logo -->
						<svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
							<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
							<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
							<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
							<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
						</svg>
						<span>Masuk dengan Google Workspace SPPG</span>
					{/if}
				</button>
			</form>

			<!-- Divider -->
			<div class="relative">
				<div class="absolute inset-0 flex items-center">
					<div class="w-full border-t border-slate-200"></div>
				</div>
				<div class="relative flex justify-center text-xs">
					<span class="px-3 bg-white text-slate-400 font-medium">atau masuk dengan email kredensial</span>
				</div>
			</div>

			<!-- Option 2: Email & Password Form (Dual-Layer Validated) -->
			<form 
				method="POST" 
				action="?/emailLogin"
				onsubmit={(e) => {
					if (!validateClient()) {
						e.preventDefault();
					}
				}}
				use:enhance={() => {
					isSubmitting = true;
					return async ({ update, result }) => {
						isSubmitting = false;
						if (result.type === 'failure') {
							const msg = String((result.data as Record<string, any>)?.error || 'Gagal masuk akun.');
							toast.error(msg);
						} else if (result.type === 'redirect') {
							toast.success('Login berhasil! Mengalihkan ke dashboard...');
						}
						await update();
					};
				}}
				class="space-y-4"
			>
				<input type="hidden" name="redirectUrl" value={data.redirectUrl} />

				<!-- Email Input -->
				<div>
					<label for="email" class="block text-xs font-semibold text-slate-700 mb-1">
						Alamat Email Terdaftar <span class="text-rose-500">*</span>
					</label>
					<div class="relative">
						<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
							<Mail class="w-4 h-4" />
						</div>
						<input
							id="email"
							name="email"
							type="email"
							autocomplete="email"
							bind:value={email}
							placeholder="nama@sppg.id"
							class="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 bg-white"
							required
						/>
					</div>
				</div>

				<!-- Password Input -->
				<div>
					<div class="flex items-center justify-between mb-1">
						<label for="password" class="block text-xs font-semibold text-slate-700">
							Kata Sandi (Password) <span class="text-rose-500">*</span>
						</label>
						<span class="text-[11px] text-slate-400">Min. 6 Karakter</span>
					</div>
					<div class="relative">
						<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
							<Lock class="w-4 h-4" />
						</div>
						<input
							id="password"
							name="password"
							type={showPassword ? 'text' : 'password'}
							autocomplete="current-password"
							bind:value={password}
							placeholder="••••••••"
							class="w-full text-xs rounded-xl border border-slate-200 pl-9 pr-10 py-2.5 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 bg-white"
							required
						/>
						<button
							type="button"
							onclick={() => showPassword = !showPassword}
							class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
							tabindex="-1"
						>
							{#if showPassword}
								<EyeOff class="w-4 h-4" />
							{:else}
								<Eye class="w-4 h-4" />
							{/if}
						</button>
					</div>
				</div>

				<!-- Submit Button -->
				<button
					type="submit"
					disabled={isSubmitting || form?.isRateLimited}
					class="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer"
				>
					{#if isSubmitting}
						<Loader2 class="w-4 h-4 animate-spin text-white" />
						<span>Memverifikasi Akun...</span>
					{:else}
						<span>Masuk ke Dashboard</span>
						<ArrowRight class="w-4 h-4" />
					{/if}
				</button>
			</form>

			<!-- Quick 1-Click Role Switcher for Demo / Testing -->
			<div class="pt-4 border-t border-slate-100">
				<div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
					Pilih Cepat Akun Demo (1-Klik)
				</div>
				<div class="grid grid-cols-3 gap-2">
					<button
						type="button"
						onclick={() => prefillDemo('direktur')}
						class="px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors cursor-pointer"
					>
						<div class="text-[10px] text-slate-400 font-semibold">DIREKTUR</div>
						<div class="text-xs font-bold text-slate-800 truncate">Bpk. Azka</div>
					</button>

					<button
						type="button"
						onclick={() => prefillDemo('finance')}
						class="px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors cursor-pointer"
					>
						<div class="text-[10px] text-slate-400 font-semibold">FINANCE</div>
						<div class="text-xs font-bold text-slate-800 truncate">Kasir SPPG</div>
					</button>

					<button
						type="button"
						onclick={() => prefillDemo('mandor')}
						class="px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors cursor-pointer"
					>
						<div class="text-[10px] text-slate-400 font-semibold">LAPANGAN</div>
						<div class="text-xs font-bold text-slate-800 truncate">Wahyu (SM)</div>
					</button>
				</div>
			</div>

		</div>

		<!-- Footer Security Note -->
		<div class="mt-6 text-center text-xs text-slate-400 space-y-1">
			<div class="flex items-center justify-center gap-1.5">
				<ShieldCheck class="w-4 h-4 text-emerald-600" />
				<span class="font-medium text-slate-600">Dilindungi Rate Limiting & Enkripsi Sesi HTTP-Only</span>
			</div>
			<div>Khusus Personel & Rekanan Resmi Proyek Sentra Pelayanan Program Gizi MBG</div>
		</div>

	</div>

</div>
