<script lang="ts">
	import {
		Boxes,
		ClipboardList,
		Clock,
		FileText,
		HandCoins,
		Users
	} from '@jis3r/icons';
	import { AreaChart, BarChart, PieChart, Text } from 'layerchart';
	import { scaleBand, scalePoint } from 'd3-scale';
	import { formatBs, formatCompact, formatNumber } from '$lib/format';
	import type { OrderStatus } from '$lib/types';
	import KpiCard from '$lib/components/kpi-card.svelte';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import OrderStatusBadge from '$lib/components/order-status-badge.svelte';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { receiptPublicUrl } from '$lib/mock/storage';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const totalClients = $derived(data.clients.length);
	const totalOrders = $derived(data.orders.length);
	const pendingOrders = $derived(
		data.orders.filter((o) => o.orderStatus === 'pendiente').length
	);
	const revenue = $derived(
		data.orders
			.filter((o) => ['comprobada', 'aprobada', 'entregada'].includes(o.orderStatus))
			.reduce((acc, o) => acc + o.price, 0)
	);
	const activeProducts = $derived(data.products.filter((p) => p.isAvailable).length);

	const statusColors: Record<OrderStatus, string> = {
		pendiente: '#b794f6',
		comprobada: '#7c3aed',
		aprobada: '#3b82f6',
		entregada: '#f5a623',
		rechazada: '#d9285e'
	};

	const ingresosConfig = {
		ingresos: { label: 'Ingresos', color: 'var(--chart-2)' }
	} satisfies Chart.ChartConfig;

	const pedidosConfig = {
		pedidos: { label: 'Pedidos', color: 'var(--chart-1)' }
	} satisfies Chart.ChartConfig;

	const estadosConfig = {
		pendiente: { label: 'Pendiente', color: statusColors.pendiente },
		comprobada: { label: 'Comprobada', color: statusColors.comprobada },
		aprobada: { label: 'Aprobada', color: statusColors.aprobada },
		entregada: { label: 'Entregada', color: statusColors.entregada },
		rechazada: { label: 'Rechazada', color: statusColors.rechazada }
	} satisfies Chart.ChartConfig;

	const statusData = $derived(
		data.byStatus.map((status) => ({
			...status,
			label: capitalize(status.status),
			color: statusColors[status.status]
		}))
	);

	const totalIngresosMes = $derived(
		data.byMonth.reduce((acc, m) => acc + m.ingresos, 0)
	);
	const totalPedidosMes = $derived(
		data.byMonth.reduce((acc, m) => acc + m.pedidos, 0)
	);

	function capitalize(value: string): string {
		return value.charAt(0).toUpperCase() + value.slice(1);
	}
</script>

<svelte:head>
	<title>Dashboard · Panel de Administración</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="flex items-center gap-2.5 font-heading text-2xl font-bold text-foreground">
			<span class="size-2.5 shrink-0 rounded-[3px] bg-brand-gradient"></span>
			Dashboard
		</h1>
		<p class="text-sm text-muted-foreground">
			Vista general del estado de ventas, clientes, pedidos y productos.
		</p>
	</div>

	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
		<KpiCard title="Clientes" value={totalClients} icon={Users} description="Registrados en la tienda" />
		<KpiCard title="Pedidos" value={totalOrders} icon={ClipboardList} description="Total en el historial" />
		<KpiCard
			title="Pedidos pendientes"
			value={pendingOrders}
			icon={Clock}
			description="A la espera de verificación"
			accent="text-amber-600"
		/>
		<KpiCard
			title="Ingresos confirmados"
			value={formatBs(revenue)}
			icon={HandCoins}
			description="Comprobados + aprobados + entregados"
			accent="text-emerald-600"
		/>
		<KpiCard
			title="Productos activos"
			value={`${activeProducts} / ${data.products.length}`}
			icon={Boxes}
			description="Disponibles en el catálogo"
		/>
	</div>

	<div class="grid gap-6 lg:grid-cols-3">
		<Card class="shadow-sm lg:col-span-2">
			<CardHeader>
				<CardTitle>Ingresos por mes</CardTitle>
				<CardDescription>
					Facturación confirmada de cada mes (comprobada, aprobada o entregada).
				</CardDescription>
			</CardHeader>
			<CardContent>
				{#if data.byMonth.length === 0}
					<p class="py-10 text-center text-sm text-muted-foreground">
						Sin ingresos registrados.
					</p>
				{:else}
					<Chart.Container config={ingresosConfig} class="aspect-auto h-[240px] w-full">
						<AreaChart
							data={data.byMonth}
							x="month"
							xScale={scalePoint().padding(0.28)}
							series={[
								{ key: 'ingresos', label: 'Ingresos', color: 'var(--color-ingresos)' }
							]}
							props={{
								area: { motion: 'tween' },
								yAxis: { format: (value: number) => formatCompact(value) }
							}}
						>
							{#snippet tooltip()}
								<Chart.Tooltip indicator="line" />
							{/snippet}
						</AreaChart>
					</Chart.Container>
					<p class="mt-2 text-xs text-muted-foreground">
						{formatBs(totalIngresosMes)} en total.
					</p>
				{/if}
			</CardContent>
		</Card>

		<Card class="shadow-sm">
			<CardHeader>
				<CardTitle>Distribución por estado</CardTitle>
				<CardDescription>Pedidos según su estado actual.</CardDescription>
			</CardHeader>
			<CardContent>
				{#if statusData.length === 0}
					<p class="py-10 text-center text-sm text-muted-foreground">
						Sin pedidos registrados.
					</p>
				{:else}
					<Chart.Container config={estadosConfig} class="mx-auto aspect-square max-h-[240px]">
						<PieChart
							data={statusData}
							key="status"
							value="cantidad"
							c="color"
							innerRadius={58}
							padding={18}
						>
							{#snippet aboveMarks()}
								<Text
									value={formatNumber(totalOrders)}
									textAnchor="middle"
									verticalAnchor="middle"
									class="fill-foreground text-2xl! font-bold"
								/>
								<Text
									value="Pedidos"
									textAnchor="middle"
									verticalAnchor="middle"
									class="fill-muted-foreground!"
									dy={18}
								/>
							{/snippet}
							{#snippet tooltip()}
								<Chart.Tooltip hideLabel />
							{/snippet}
						</PieChart>
					</Chart.Container>
					<ul class="mt-4 grid grid-cols-2 gap-2">
						{#each statusData as status (status.status)}
							<li class="flex items-center justify-between gap-2 text-xs">
								<span class="flex min-w-0 items-center gap-1.5 text-muted-foreground">
									<span
										class="size-2 shrink-0 rounded-[2px]"
										style="background:{status.color}"
									></span>
									<span class="truncate">{status.label}</span>
								</span>
								<span class="shrink-0 font-semibold text-foreground">
									{formatNumber(status.cantidad)}
								</span>
							</li>
						{/each}
					</ul>
				{/if}
			</CardContent>
		</Card>

		<Card class="shadow-sm lg:col-span-2">
			<CardHeader>
				<CardTitle>Pedidos por mes</CardTitle>
				<CardDescription>Pedidos confirmados, agrupados por mes.</CardDescription>
			</CardHeader>
			<CardContent>
				{#if data.byMonth.length === 0}
					<p class="py-10 text-center text-sm text-muted-foreground">
						Sin pedidos registrados.
					</p>
				{:else}
					<Chart.Container config={pedidosConfig} class="aspect-auto h-[220px] w-full">
						<BarChart
							data={data.byMonth}
							x="month"
							xScale={scaleBand().padding(0.35)}
							axis="x"
							series={[
								{ key: 'pedidos', label: 'Pedidos', color: 'var(--color-pedidos)' }
							]}
							props={{
								bars: { stroke: 'none', rounded: 'all', radius: 3 }
							}}
						>
							{#snippet tooltip()}
								<Chart.Tooltip indicator="dot" />
							{/snippet}
						</BarChart>
					</Chart.Container>
					<p class="mt-2 text-xs text-muted-foreground">
						{formatNumber(totalPedidosMes)} pedidos confirmados en el periodo.
					</p>
				{/if}
			</CardContent>
		</Card>

		<Card class="shadow-sm">
			<CardHeader>
				<CardTitle>Yogures más vendidos</CardTitle>
				<CardDescription>Top yogures por unidades vendidas.</CardDescription>
			</CardHeader>
			<CardContent>
				{#if data.topProducts.length === 0}
					<p class="py-8 text-center text-sm text-muted-foreground">
						Sin ventas registradas.
					</p>
				{:else}
					<ul class="space-y-2">
						{#each data.topProducts as product (product.id)}
							<li class="flex items-center justify-between gap-3">
								<span class="truncate text-sm text-muted-foreground">{product.name}</span>
								<span class="text-sm font-semibold text-foreground">
									{formatNumber(product.quantity)} uds
								</span>
							</li>
						{/each}
					</ul>
				{/if}
			</CardContent>
		</Card>

		<Card class="shadow-sm">
			<CardHeader>
				<CardTitle>Categorías más populares</CardTitle>
				<CardDescription>Unidades vendidas por categoría.</CardDescription>
			</CardHeader>
			<CardContent>
				{#if data.topCategories.length === 0}
					<p class="py-8 text-center text-sm text-muted-foreground">
						Sin ventas registradas.
					</p>
				{:else}
					<ul class="space-y-2">
						{#each data.topCategories as category (category.category)}
							<li class="flex items-center justify-between gap-3">
								<span class="text-sm text-muted-foreground">
									{capitalize(category.category)}
								</span>
								<span class="text-sm font-semibold text-foreground">
									{formatNumber(category.quantity)} uds
								</span>
							</li>
						{/each}
					</ul>
				{/if}
			</CardContent>
		</Card>

		<Card class="shadow-sm lg:col-span-2">
			<CardHeader>
				<CardTitle>Comprobantes por verificar</CardTitle>
				<CardDescription>
					Pedidos que ya enviaron su comprobante de pago y están pendientes de revisión.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{#if data.pendingPayment.length === 0}
					<p class="py-8 text-center text-sm text-muted-foreground">
						No hay comprobantes por verificar.
					</p>
				{:else}
					<ul class="space-y-3">
						{#each data.pendingPayment as order (order.id)}
							<li class="rounded-xl border border-border bg-muted/40 p-3">
								<div class="flex items-center justify-between gap-2">
									<div class="flex min-w-0 items-center gap-2">
										<FileText class="size-4 shrink-0 text-primary" />
										<span class="truncate text-sm font-semibold text-foreground">
											Pedido #{order.id.slice(0, 8)}
										</span>
									</div>
									<OrderStatusBadge status={order.orderStatus} />
								</div>
								<div class="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
									<a
										href={receiptPublicUrl(order.paymentReceiptImg ?? '')}
										target="_blank"
										rel="noopener noreferrer"
										class="flex min-w-0 items-center gap-2"
									>
										<img
											src={receiptPublicUrl(order.paymentReceiptImg ?? '')}
											alt="Comprobante"
											class="size-9 shrink-0 rounded-lg border border-border object-cover"
										/>
										<span class="truncate hover:underline">Ver comprobante</span>
									</a>
									<span class="font-semibold text-foreground">{formatBs(order.price)}</span>
								</div>
								<Separator class="my-2.5!" />
								<Button size="sm" variant="outline" href="/admin/pedidos" class="w-full">
									Revisar pedido
								</Button>
							</li>
						{/each}
					</ul>
				{/if}
			</CardContent>
		</Card>
	</div>
</div>
