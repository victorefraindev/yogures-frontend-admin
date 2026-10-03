<script lang="ts">
	import type { Component } from 'svelte';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';

	let {
		title,
		value,
		description,
		icon,
		accent = 'text-primary'
	}: {
		title: string;
		value: string | number;
		description?: string;
		icon?: Component;
		accent?: string;
	} = $props();
</script>

<Card class="shadow-sm">
	<CardContent class="flex items-center gap-4">
		{#if icon}
			{@const Icon = icon}
			<span
				class="flex size-12 shrink-0 items-center justify-center rounded-xl {accent === 'text-primary'
					? 'bg-brand-gradient text-white'
					: 'bg-muted ' + accent}"
			>
				<Icon class="size-6"></Icon>
			</span>
		{/if}
		<div class="min-w-0">
			<p class="truncate text-sm font-medium text-muted-foreground">{title}</p>
			<div class="mt-0.5 text-2xl font-bold text-foreground">{value}</div>
			{#if description}
				<p class="mt-0.5 text-xs text-muted-foreground">{description}</p>
			{/if}
		</div>
	</CardContent>
</Card>