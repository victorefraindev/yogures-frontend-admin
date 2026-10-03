<script lang="ts">
	import { toast } from 'svelte-sonner';
	import {
		Boxes,
		CalendarDays,
		Check,
		FileText,
		ImageUp,
		LoaderPinwheel,
		Search,
		X
	} from '@jis3r/icons';
	import { updateOrderStatus } from '$lib/client-api';
	import { receiptPublicUrl } from '$lib/supabase/storage';
	import { formatBs, formatDate } from '$lib/format';
	import type { AdminClient, Order, OrderStatus } from '$lib/types';
	import OrderStatusBadge from '$lib/components/order-status-badge.svelte';
	import {
		AlertDialog,
		AlertDialogAction,
		AlertDialogCancel,
		AlertDialogContent,
		AlertDialogDescription,
		AlertDialogFooter,
		AlertDialogHeader,
		AlertDialogTitle
	} from '$lib/components/ui/alert-dialog/index.js';
	import { Avatar, AvatarFallback } from '$lib/components/ui/avatar/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card/index.js';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const PAGE_SIZE = 20;

	const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
		{ value: 'pendiente', label: 'Pendiente' },
		{ value: 'comprobada', label: 'Comprobada' },
		{ value: 'aprobada', label: 'Aprobada' },
		{ value: 'entregada', label: 'Entregada' },
		{ value: 'rechazada', label: 'Rechazada' }
	];

	type StatusFilter = 'todos' | 'por-verificar' | OrderStatus;

	// svelte-ignore state_referenced_locally
	let orders = $state<Order[]>(data.orders.map((o) => ({ ...o })));
	let selectedOrder = $state<Order | null>(null);
	let rejectOrder = $state<Order | null>(null);
	let updatingId = $state<string | null>(null);
	let statusFilter = $state<StatusFilter>('todos');
	let searchQuery = $state('');
	let visibleCount = $state(PAGE_SIZE);

	const clientById = $derived(
		new Map(data.clients.map((c) => [c.id, c]))
	);

	$effect(() => {
		statusFilter;
		searchQuery;
		visibleCount = PAGE_SIZE;
	});

	function isPendingVerification(order: Order): boolean {
		return order.orderStatus === 'pendiente' && !!order.paymentReceiptImg;
	}

	const statusCounts = $derived.by(() => {
		const counts: Record<StatusFilter, number> = {
			todos: orders.length,
			'por-verificar': 0,
			pendiente: 0,
			comprobada: 0,
			aprobada: 0,
			entregada: 0,
			rechazada: 0
		};
		for (const order of orders) {
			counts[order.orderStatus] += 1;
			if (isPendingVerification(order)) counts['por-verificar'] += 1;
		}
		return counts;
	});

	const FILTERS: { value: StatusFilter; label: string; attention?: boolean }[] = [
		{ value: 'todos', label: 'Todos' },
		{ value: 'por-verificar', label: 'Por verificar', attention: true },
		{ value: 'pendiente', label: 'Pendiente' },
		{ value: 'comprobada', label: 'Comprobada' },
		{ value: 'aprobada', label: 'Aprobada' },
		{ value: 'entregada', label: 'Entregada' },
		{ value: 'rechazada', label: 'Rechazada' }
	];

	function matchesSearch(order: Order): boolean {
		const q = searchQuery.trim().toLowerCase();
		if (!q) return true;
		if (order.id.toLowerCase().includes(q)) return true;
		const client = clientById.get(order.clientId);
		return client
			? `${client.name} ${client.lastname}`.toLowerCase().includes(q)
			: false;
	}

	const filteredOrders = $derived(
		orders
			.filter((order) => {
				if (statusFilter === 'por-verificar') return isPendingVerification(order);
				if (statusFilter !== 'todos') return order.orderStatus === statusFilter;
				return true;
			})
			.filter(matchesSearch)
	);

	function clientName(order: Order): string {
		const client = clientById.get(order.clientId);
		return client ? `${client.name} ${client.lastname}` : 'Cliente desconocido';
	}

	function itemCount(order: Order): number {
		return order.items.reduce((acc, item) => acc + item.quantity, 0);
	}

	function needsVerificationActions(order: Order): boolean {
		return (
			!!order.paymentReceiptImg &&
			(order.orderStatus === 'pendiente' || order.orderStatus === 'comprobada')
		);
	}

	async function handleStatusChange(order: Order, value: string) {
		const status = value as OrderStatus;
		if (status === order.orderStatus) return;
		updatingId = order.id;
		const result = await updateOrderStatus(order.id, status);
		updatingId = null;
		if (result.ok) {
			order.orderStatus = status;
			toast.success(result.data?.message ?? 'Estado actualizado');
		} else {
			toast.error(result.error ?? 'No se pudo actualizar el estado del pedido');
		}
	}

	async function confirmReject() {
		if (!rejectOrder) return;
		const order = rejectOrder;
		rejectOrder = null;
		await handleStatusChange(order, 'rechazada');
	}
</script>

<svelte:head>
	<title>Pedidos · Panel de Administración</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-end justify-between gap-4">
		<div>
			<h1 class="flex items-center gap-2.5 font-heading text-2xl font-bold text-foreground">
				<span class="size-2.5 shrink-0 rounded-[3px] bg-brand-gradient"></span>
				Pedidos
			</h1>
			<p class="text-sm text-muted-foreground">
				Historial de pedidos, comprobantes de pago y cambio de estado.
			</p>
		</div>
		<Badge variant="secondary">{orders.length} pedidos</Badge>
	</div>

	<div class="flex items-center gap-2 overflow-x-auto pb-1">
		{#each FILTERS as filter (filter.value)}
			<button
				type="button"
				class="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors {statusFilter ===
				filter.value
					? filter.attention
						? 'border-transparent bg-amber-500 text-white'
						: 'border-transparent bg-brand-gradient text-white'
					: 'border-border bg-background text-muted-foreground hover:bg-muted'}"
				onclick={() => (statusFilter = filter.value)}
			>
				{#if filter.attention}
					<span
						class="size-1.5 rounded-full {statusFilter === filter.value
							? 'bg-white/80'
							: 'bg-amber-400'}"
					></span>
				{/if}
				{filter.label}
				<span
					class="rounded-full px-1.5 text-xs font-semibold {statusFilter === filter.value
						? 'bg-white/20'
						: 'bg-muted'}"
				>
					{statusCounts[filter.value]}
				</span>
			</button>
		{/each}
	</div>

	<div class="relative">
		<Search
			class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
		/>
		<Input
			type="search"
			placeholder="Buscar por #pedido o nombre del cliente…"
			class="pl-8"
			bind:value={searchQuery}
		/>
	</div>

	<Card class="shadow-sm">
		<CardHeader>
			<CardTitle>Historial de pedidos</CardTitle>
			<CardDescription>
				Hacé clic en un pedido para ver el detalle, el cliente y verificar el pago.
			</CardDescription>
		</CardHeader>
		<CardContent>
			{#if filteredOrders.length === 0}
				<div class="py-10 text-center">
					{#if orders.length === 0}
						<p class="text-sm text-muted-foreground">
							Todavía no hay pedidos registrados.
						</p>
					{:else}
						<p class="text-sm text-muted-foreground">
							Ningún pedido coincide con el filtro o la búsqueda.
						</p>
					{/if}
				</div>
			{:else}
				<div class="overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Pedido</TableHead>
								<TableHead>Cliente</TableHead>
								<TableHead>Fecha</TableHead>
								<TableHead>Entrega</TableHead>
								<TableHead>Litros</TableHead>
								<TableHead>Estado</TableHead>
								<TableHead class="text-right">Total</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each filteredOrders.slice(0, visibleCount) as order (order.id)}
								{@const pending = isPendingVerification(order)}
								<TableRow
									class="cursor-pointer {pending ? 'bg-amber-500/5' : ''}"
									onclick={() => (selectedOrder = order)}
								>
									<TableCell class="font-medium text-foreground">
										<span class="inline-flex items-center gap-2">
											#{order.id.slice(0, 8)}
											{#if pending}
												<span
													class="size-1.5 rounded-full bg-amber-500"
													title="Comprobante por verificar"
												></span>
											{/if}
										</span>
									</TableCell>
									<TableCell>{clientName(order)}</TableCell>
									<TableCell>{formatDate(order.orderDate)}</TableCell>
									<TableCell>{formatDate(order.deliveryDate ?? '')}</TableCell>
									<TableCell>{order.liters} L</TableCell>
									<TableCell>
										<div class="flex flex-col items-start gap-1.5">
											<OrderStatusBadge status={order.orderStatus} />
											{#if needsVerificationActions(order)}
												<div class="flex items-center gap-1">
													<Button
														size="xs"
														variant="outline"
														class="h-6 gap-1 text-xs"
														disabled={updatingId === order.id}
														onclick={(e) => {
															e.stopPropagation();
															void handleStatusChange(order, 'aprobada');
														}}
													>
														<Check class="size-3" />
														Aprobar
													</Button>
													<Button
														size="xs"
														variant="outline"
														class="h-6 gap-1 text-xs text-destructive hover:text-destructive"
														disabled={updatingId === order.id}
														onclick={(e) => {
															e.stopPropagation();
															rejectOrder = order;
														}}
													>
														<X class="size-3" />
														Rechazar
													</Button>
												</div>
											{/if}
										</div>
									</TableCell>
									<TableCell class="text-right font-semibold text-primary">
										{formatBs(order.price)}
									</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				</div>

				{#if visibleCount < filteredOrders.length}
					<div class="mt-4 flex flex-col items-center gap-2">
						<p class="text-xs text-muted-foreground">
							Mostrando {visibleCount} de {filteredOrders.length} pedidos
						</p>
						<Button variant="outline" onclick={() => (visibleCount += PAGE_SIZE)}>
							Ver más
						</Button>
					</div>
				{/if}
			{/if}
		</CardContent>
	</Card>

	<AlertDialog
		open={rejectOrder !== null}
		onOpenChange={(open) => {
			if (!open) rejectOrder = null;
		}}
	>
		{#if rejectOrder}
			{@const order = rejectOrder}
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						¿Rechazar el pedido #{order.id.slice(0, 8)}?
					</AlertDialogTitle>
					<AlertDialogDescription>
						El pedido pasará a estado "Rechazada". Esta acción no se puede deshacer.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onclick={() => (rejectOrder = null)}>Cancelar</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						disabled={updatingId === order.id}
						onclick={() => void confirmReject()}
					>
						Rechazar pedido
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		{/if}
	</AlertDialog>

	<Dialog
		open={selectedOrder !== null}
		onOpenChange={(open) => {
			if (!open) selectedOrder = null;
		}}
	>
		{#if selectedOrder}
			{@const order = selectedOrder}
			{@const client = clientById.get(order.clientId) as AdminClient | undefined}
			{@const pendingReceipt =
				!!order.paymentReceiptImg &&
				(order.orderStatus === 'pendiente' || order.orderStatus === 'comprobada')}
			<DialogContent class="max-h-[90dvh] overflow-y-auto sm:max-w-[calc(100vw-2rem)] lg:max-w-3xl">
				<DialogHeader>
					<DialogTitle class="flex flex-wrap items-center gap-2 text-lg">
						<FileText class="size-5 text-primary" />
						Pedido #{order.id.slice(0, 8)}
						<OrderStatusBadge status={order.orderStatus} />
					</DialogTitle>
					<DialogDescription>
						Detalle del pedido, datos del cliente y comprobante de pago.
					</DialogDescription>
				</DialogHeader>

				<div class="grid min-w-0 gap-4 sm:grid-cols-2">
					<div class="min-w-0 space-y-4">
						<div class="rounded-xl border border-border p-3">
							<p class="text-xs font-semibold text-foreground">Datos del cliente</p>
							{#if client}
								<div class="mt-3 flex items-center gap-3">
									<Avatar size="lg">
										<AvatarFallback
											class="bg-brand-gradient text-sm font-semibold text-white"
										>
											{client.name.trim().charAt(0)}
											{client.lastname.trim().charAt(0)}
										</AvatarFallback>
									</Avatar>
									<div class="min-w-0">
										<p class="truncate text-sm font-semibold text-foreground">
											{client.name} {client.lastname}
										</p>
										<p class="truncate text-xs text-muted-foreground">{client.email}</p>
										<p class="truncate text-xs text-muted-foreground">{client.phone}</p>
									</div>
								</div>
							{:else}
								<p class="mt-2 text-sm text-muted-foreground">Cliente no encontrado.</p>
							{/if}
						</div>

						<div class="grid grid-cols-3 gap-2">
							<div class="rounded-xl border border-border bg-muted/40 p-3">
								<CalendarDays class="size-4 text-primary" />
								<p class="mt-1.5 text-xs text-muted-foreground">Fecha</p>
								<p class="text-sm font-semibold text-foreground">
									{formatDate(order.orderDate)}
								</p>
							</div>
							<div class="rounded-xl border border-border bg-muted/40 p-3">
								<CalendarDays class="size-4 text-primary" />
								<p class="mt-1.5 text-xs text-muted-foreground">Entrega</p>
								<p class="text-sm font-semibold text-foreground">
									{formatDate(order.deliveryDate ?? '')}
								</p>
							</div>
							<div class="rounded-xl border border-border bg-muted/40 p-3">
								<Boxes class="size-4 text-primary" />
								<p class="mt-1.5 text-xs text-muted-foreground">Litros</p>
								<p class="text-sm font-semibold text-foreground">{order.liters} L</p>
							</div>
						</div>

						<div>
							<p
								class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
							>
								Productos ({itemCount(order)} unidades)
							</p>
							<div class="space-y-2">
								{#each order.items as item (item.productId + item.size)}
									<div
										class="flex items-center gap-3 rounded-lg border border-border p-2.5"
									>
										{#if item.imageSrc}
											<img
												src={item.imageSrc}
												alt={item.name}
												class="size-10 shrink-0 rounded-lg border border-border object-cover"
											/>
										{:else}
											<span
												class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
											>
												<Boxes class="size-5" />
											</span>
										{/if}
										<div class="min-w-0 flex-1">
											<p class="truncate text-sm font-semibold text-foreground">
												{item.name}
											</p>
											<p class="text-xs text-muted-foreground">
												{item.size} · {item.liters} L · {formatBs(item.unitPrice)} c/u
											</p>
										</div>
										<div class="flex shrink-0 flex-col items-end gap-1">
											<Badge variant="secondary">x{item.quantity}</Badge>
											<span class="text-sm font-semibold text-primary">
												{formatBs(item.unitPrice * item.quantity)}
											</span>
										</div>
									</div>
								{/each}
							</div>
						</div>
					</div>

					<div class="min-w-0 space-y-4">
						{#if order.paymentReceiptImg}
							<div class="rounded-xl border border-border bg-muted/40 p-3">
								<p class="flex items-center gap-1.5 text-xs font-semibold text-foreground">
									<ImageUp class="size-3.5 text-primary" />
									Comprobante de pago
								</p>
								<a
									href={receiptPublicUrl(order.paymentReceiptImg)}
									target="_blank"
									rel="noopener noreferrer"
									class="mt-2 block overflow-hidden rounded-lg border border-border"
								>
									<img
										src={receiptPublicUrl(order.paymentReceiptImg)}
										alt="Comprobante de pago"
										class="max-h-56 w-full object-contain bg-background"
									/>
								</a>
								<p class="mt-2 truncate text-xs text-muted-foreground">
									{order.paymentReceiptImg} · clic para abrir
								</p>
								<p class="mt-1 text-xs text-muted-foreground">
									Verifica que el monto y el titular coincidan antes de aprobar el pedido.
								</p>
							</div>
						{:else}
							<div
								class="rounded-xl border border-dashed border-border bg-muted/40 p-3"
							>
								<p
									class="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"
								>
									<FileText class="size-3.5 text-primary" />
									Sin comprobante de pago
								</p>
								<p class="mt-1 text-xs text-muted-foreground">
									El cliente todavía no envió su comprobante.
								</p>
							</div>
						{/if}

						<div class="rounded-xl border border-border p-3">
							<p class="mb-2 text-xs font-semibold text-foreground">
								Cambiar estado del pedido
							</p>
							{#if pendingReceipt}
								<div class="space-y-2">
									<div class="flex items-center gap-2">
										<Button
											class="flex-1"
											disabled={updatingId === order.id}
											onclick={() => void handleStatusChange(order, 'aprobada')}
										>
											<Check class="size-4" />
											Aprobar
										</Button>
										<Button
											variant="destructive"
											class="flex-1"
											disabled={updatingId === order.id}
											onclick={() => (rejectOrder = order)}
										>
											<X class="size-4" />
											Rechazar
										</Button>
									</div>
									<p class="text-xs text-muted-foreground">
										Confirma el pago del comprobante adjunto o rechazalo.
									</p>
								</div>
							{:else}
								<Select
									type="single"
									value={order.orderStatus}
									onValueChange={(value) => handleStatusChange(order, value)}
								>
									<SelectTrigger class="w-full" id="order-status">
										{STATUS_OPTIONS.find((s) => s.value === order.orderStatus)?.label ??
											order.orderStatus}
									</SelectTrigger>
									<SelectContent>
										{#each STATUS_OPTIONS as option (option.value)}
											<SelectItem
												value={option.value}
												label={option.label}
												disabled={updatingId === order.id}
											>
												{option.label}
											</SelectItem>
										{/each}
									</SelectContent>
								</Select>
							{/if}
						</div>
					</div>
				</div>

				<Separator />

				<DialogFooter class="items-center justify-between sm:justify-between">
					<div>
						<p class="text-xs text-muted-foreground">
							{itemCount(order)} {itemCount(order) === 1 ? 'unidad' : 'unidades'} ·{' '}
							{order.liters} L
						</p>
						<p class="text-xs text-muted-foreground">Total del pedido</p>
					</div>
					<div class="flex items-center gap-2">
						{#if updatingId === order.id}
							<LoaderPinwheel class="animate-spin text-primary" />
						{/if}
						<span class="text-2xl font-bold text-primary">
							{formatBs(order.price)}
						</span>
					</div>
				</DialogFooter>

				<DialogFooter>
					<Button variant="outline" class="w-full" onclick={() => (selectedOrder = null)}>
						Cerrar
					</Button>
				</DialogFooter>
			</DialogContent>
		{/if}
	</Dialog>
</div>