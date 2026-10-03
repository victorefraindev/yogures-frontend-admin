<script lang="ts">
	import { getTasaBcv, getTasaEnUso } from '$lib/api';
	import { refreshTasaBcv } from '$lib/client-api';
	import {
		ChartColumn,
		History,
		Landmark,
		LoaderPinwheel,
		MoveHorizontal,
		RefreshCw
	} from '@jis3r/icons';
	import { formatNumber } from '$lib/format';
	import KpiCard from '$lib/components/kpi-card.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// svelte-ignore state_referenced_locally
	let rates = $state({
		tasa: { ...data.tasa },
		tasaEnUso: { ...data.tasaEnUso }
	});
	let refreshing = $state(false);
	let lastUpdate = $state(new Date());
	let error = $state('');

	const tasa = $derived(rates.tasa);
	const tasaEnUso = $derived(rates.tasaEnUso);

	const diff = $derived(tasa.tasaBcv - tasaEnUso.tasaBcv);
	const diffPct = $derived(tasaEnUso.tasaBcv > 0 ? (diff / tasaEnUso.tasaBcv) * 100 : 0);

	const lastUpdateLabel = $derived(
		lastUpdate.toLocaleTimeString('es-VE', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		})
	);

	async function refresh() {
		if (refreshing) return;
		refreshing = true;
		error = '';
		const result = await refreshTasaBcv();
		if (!result.ok) error = result.error ?? 'No se pudo actualizar la tasa';
		const [nuevaTasa, nuevaTasaEnUso] = await Promise.all([getTasaBcv(), getTasaEnUso()]);
		rates.tasa = nuevaTasa;
		rates.tasaEnUso = nuevaTasaEnUso;
		lastUpdate = new Date();
		refreshing = false;
	}
</script>

<svelte:head>
	<title>Tasa BCV · Panel de Administración</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<h1 class="flex items-center gap-2.5 font-heading text-2xl font-bold text-foreground">
				<span class="size-2.5 shrink-0 rounded-[3px] bg-brand-gradient"></span>
				Tasa BCV
			</h1>
			<p class="text-sm text-muted-foreground">
				Indicador de la tasa del día y comparación con la que usa la tienda.
			</p>
		</div>
		<div class="flex items-center gap-2">
			<span class="text-xs text-muted-foreground">
				Última actualización: {lastUpdateLabel}
			</span>
			{#if error}
				<span class="text-xs text-destructive">{error}</span>
			{/if}
			<Button variant="outline" size="sm" onclick={refresh} disabled={refreshing}>
				{#if refreshing}
					<LoaderPinwheel class="size-4 animate-spin" />
				{:else}
					<RefreshCw class="size-4" />
				{/if}
				Actualizar
			</Button>
		</div>
	</div>

	<div class="grid gap-4 sm:grid-cols-3">
		<KpiCard
			title="Tasa BCV"
			value={tasa.tasaBcv > 0 ? formatNumber(tasa.tasaBcv) : 'Sin datos'}
			icon={Landmark}
			description="Referencia del día"
		/>
		<KpiCard
			title="Tasa en uso"
			value={tasaEnUso.tasaBcv > 0 ? formatNumber(tasaEnUso.tasaBcv) : 'Sin datos'}
			icon={ChartColumn}
			description="La que usa la tienda"
		/>
		<KpiCard
			title="Diferencia"
			value={`${diff > 0 ? '+' : ''}${formatNumber(diff)} Bs`}
			icon={MoveHorizontal}
			description={
				diff === 0
					? 'Coincide con la tasa del día'
					: diff > 0
						? 'La tienda vende a una tasa menor'
						: 'La tienda usa una tasa mayor'
			}
		/>
	</div>

	<div class="grid gap-6 lg:grid-cols-2">
		<Card class="shadow-sm">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<ChartColumn class="size-5 text-primary" />
					Comparación con la tienda
				</CardTitle>
				<CardDescription>La tienda fija sus precios con la siguiente tasa.</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="grid grid-cols-2 gap-3">
					<div class="rounded-xl border border-border bg-muted/40 p-3">
						<p class="text-xs text-muted-foreground">Tasa BCV</p>
						<p class="mt-1 text-xl font-bold text-foreground">
							{formatNumber(tasa.tasaBcv)}
						</p>
					</div>
					<div class="rounded-xl border border-border bg-muted/40 p-3">
						<p class="text-xs text-muted-foreground">Tasa en uso</p>
						<p class="mt-1 text-xl font-bold text-foreground">
							{formatNumber(tasaEnUso.tasaBcv)}
						</p>
					</div>
				</div>
				<div
					class="mt-3 flex items-center justify-between rounded-xl border border-border p-3 {diff === 0 ? 'bg-muted/40' : diff > 0 ? 'bg-destructive/5' : 'bg-muted/40'}"
				>
					<p class="text-sm text-muted-foreground">Diferencia</p>
					<div class="text-right">
						<p class="font-semibold {diff === 0 ? 'text-foreground' : diff > 0 ? 'text-destructive' : 'text-emerald-600'}">
							{diff > 0 ? '+' : ''}{formatNumber(diff)} Bs ({diffPct.toFixed(2)}%)
						</p>
						<p class="text-xs text-muted-foreground">
							{#if diff > 0}
								La tienda vende con una tasa menor a la del día.
							{:else if diff < 0}
								La tienda usa una tasa mayor a la del día.
							{:else}
								La tienda usa exactamente la tasa del día.
							{/if}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>

		<Card class="shadow-sm">
			<CardHeader>
				<CardTitle>Histórico reciente</CardTitle>
				<CardDescription>Evolución de la tasa BCV en los últimos días.</CardDescription>
			</CardHeader>
			<CardContent>
				<div
					class="flex h-56 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-6 text-center"
				>
					<span
						class="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground"
					>
						<History class="size-6" />
					</span>
					<p class="text-sm font-medium text-foreground">Sin histórico disponible</p>
					<p class="max-w-xs text-xs text-muted-foreground">
						El historial de la tasa BCV estará disponible próximamente.
					</p>
				</div>
			</CardContent>
		</Card>
	</div>
</div>