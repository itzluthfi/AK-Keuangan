<script lang="ts">
	import { toast } from '#lib/hot-toast.svelte';
	import { fly, fade } from 'svelte/transition';
	import { Check, X, Loader2 } from 'lucide-svelte';
</script>

<!-- React Hot Toast Container (Top-Center Floating Stack) -->
<div class="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none flex flex-col items-center gap-2.5 max-w-[90vw] sm:max-w-md w-full">
	{#each toast.toasts as item (item.id)}
		<div
			in:fly={{ y: -20, duration: 250 }}
			out:fade={{ duration: 150 }}
			class="pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white text-slate-800 text-xs sm:text-sm font-medium shadow-[0_3px_10px_rgba(0,0,0,0.1),0_3px_3px_rgba(0,0,0,0.05)] border border-slate-100/80 transition-all select-none"
			role="status"
		>
			<!-- React Hot Toast Style Icons -->
			{#if item.type === 'success'}
				<div class="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs animate-in zoom-in-75 duration-200">
					<Check class="w-3.5 h-3.5 stroke-[3]" />
				</div>
			{:else if item.type === 'error'}
				<div class="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs animate-in zoom-in-75 duration-200">
					<X class="w-3.5 h-3.5 stroke-[3]" />
				</div>
			{:else if item.type === 'loading'}
				<div class="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
					<Loader2 class="w-3.5 h-3.5 animate-spin text-slate-600" />
				</div>
			{/if}

			<!-- Toast Message Text -->
			<span class="leading-snug break-words pr-1 text-slate-900 font-semibold">{item.message}</span>

			<!-- Dismiss button on tap -->
			<button
				type="button"
				onclick={() => toast.dismiss(item.id)}
				class="ml-1 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition-colors"
				aria-label="Tutup notifikasi"
			>
				<X class="w-3.5 h-3.5" />
			</button>
		</div>
	{/each}
</div>
