<script lang="ts">
	import { Search, ChevronDown, Check, X } from 'lucide-svelte';

	interface Option {
		value: string | number;
		label: string;
		sublabel?: string;
	}

	let {
		options = [],
		value = $bindable(''),
		placeholder = 'Pilih opsi...',
		searchPlaceholder = 'Cari...',
		multiple = false,
		disabled = false,
		required = false,
		name = '',
		id = ''
	}: {
		options: Option[];
		value: any;
		placeholder?: string;
		searchPlaceholder?: string;
		multiple?: boolean;
		disabled?: boolean;
		required?: boolean;
		name?: string;
		id?: string;
	} = $props();

	let isOpen = $state(false);
	let searchFilter = $state('');
	let containerRef = $state<HTMLDivElement | null>(null);

	let filteredOptions = $derived(
		options.filter(opt => {
			if (!searchFilter.trim()) return true;
			const q = searchFilter.toLowerCase();
			return (
				opt.label.toLowerCase().includes(q) ||
				(opt.sublabel && opt.sublabel.toLowerCase().includes(q)) ||
				opt.value.toString().toLowerCase().includes(q)
			);
		})
	);

	let selectedLabel = $derived.by(() => {
		if (multiple) {
			const arr = Array.isArray(value) ? value : [];
			if (arr.length === 0) return '';
			if (arr.length === 1) {
				const opt = options.find(o => o.value === arr[0]);
				return opt ? opt.label : '';
			}
			return `${arr.length} opsi terpilih`;
		} else {
			const opt = options.find(o => o.value === value);
			return opt ? opt.label : '';
		}
	});

	function toggleOption(val: string | number) {
		if (multiple) {
			const current = Array.isArray(value) ? [...value] : [];
			const idx = current.indexOf(val);
			if (idx >= 0) {
				current.splice(idx, 1);
			} else {
				current.push(val);
			}
			value = current;
		} else {
			value = val;
			isOpen = false;
			searchFilter = '';
		}
	}

	function isSelected(val: string | number): boolean {
		if (multiple) {
			return Array.isArray(value) && value.includes(val);
		}
		return value === val;
	}

	function clearSelection(e: MouseEvent) {
		e.stopPropagation();
		if (multiple) {
			value = [];
		} else {
			value = '';
		}
		searchFilter = '';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			isOpen = false;
		}
	}
</script>

<svelte:window onclick={(e) => {
	if (containerRef && !containerRef.contains(e.target as Node)) {
		isOpen = false;
	}
}} />

<div class="relative w-full text-xs" bind:this={containerRef} onkeydown={handleKeydown}>
	
	<!-- Hidden Input for Form Submission -->
	{#if name}
		{#if multiple && Array.isArray(value)}
			<input type="hidden" {name} value={value.join(',')} />
		{:else}
			<input type="hidden" {name} value={value ?? ''} {required} />
		{/if}
	{/if}

	<!-- Trigger Button (Styled like SvelteForge custom select) -->
	<button
		type="button"
		{id}
		{disabled}
		onclick={() => {
			if (!disabled) isOpen = !isOpen;
		}}
		class="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border transition-all text-left bg-white cursor-pointer {isOpen ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-300 hover:border-slate-400'} {disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'shadow-2xs'}"
		aria-haspopup="listbox"
		aria-expanded={isOpen}
	>
		<div class="flex-1 truncate">
			{#if selectedLabel}
				<span class="font-bold text-slate-900">{selectedLabel}</span>
			{:else}
				<span class="text-slate-400 font-medium">{placeholder}</span>
			{/if}
		</div>

		<div class="flex items-center gap-1 shrink-0 text-slate-400">
			{#if selectedLabel && !disabled}
				<span
					role="button"
					tabindex="0"
					onclick={clearSelection}
					onkeydown={(e) => e.key === 'Enter' && clearSelection(e as any)}
					class="p-0.5 hover:text-slate-700 transition-colors"
					title="Hapus pilihan"
				>
					<X class="w-3.5 h-3.5" />
				</span>
			{/if}
			<ChevronDown class="w-4 h-4 transition-transform duration-200 {isOpen ? 'rotate-180 text-slate-900' : 'text-slate-400'}" />
		</div>
	</button>

	<!-- Dropdown Popover with Live Search (Select2 / Combobox style) -->
	{#if isOpen}
		<div
			class="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
			role="listbox"
		>
			<!-- Search Input Box -->
			<div class="p-2 border-b border-slate-100 bg-slate-50/70">
				<div class="relative">
					<Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
					<input
						type="text"
						bind:value={searchFilter}
						placeholder={searchPlaceholder}
						class="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
						onclick={(e) => e.stopPropagation()}
					/>
				</div>
			</div>

			<!-- Options List -->
			<div class="max-h-56 overflow-y-auto p-1 divide-y divide-slate-50">
				{#each filteredOptions as opt (opt.value)}
					{@const active = isSelected(opt.value)}
					<button
						type="button"
						onclick={() => toggleOption(opt.value)}
						class="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer {active ? 'bg-slate-100 font-bold text-slate-900' : 'text-slate-700 hover:bg-slate-50'}"
						role="option"
						aria-selected={active}
					>
						<div class="min-w-0 flex-1">
							<div class="truncate text-xs {active ? 'font-bold text-slate-900' : 'font-medium text-slate-800'}">{opt.label}</div>
							{#if opt.sublabel}
								<div class="text-[10px] text-slate-500 truncate">{opt.sublabel}</div>
							{/if}
						</div>
						{#if active}
							<Check class="w-3.5 h-3.5 text-slate-900 shrink-0" />
						{/if}
					</button>
				{:else}
					<div class="py-6 text-center text-xs text-slate-400">
						Tidak ada opsi yang cocok "{searchFilter}"
					</div>
				{/each}
			</div>
		</div>
	{/if}

</div>
