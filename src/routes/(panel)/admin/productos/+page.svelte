<script lang="ts">
	import { toast } from 'svelte-sonner';
	import {
		BadgeCheck,
		Boxes,
		ImageUp,
		LoaderPinwheel,
		Pencil,
		Plus,
		Search,
		Tag,
		Trash2
	} from '@jis3r/icons';
	import {
		createProduct,
		deleteProduct,
		relateProducts,
		toggleProduct,
		updateProduct
	} from '$lib/client-api';
	import { getProducts } from '$lib/api';
	import { formatBs, formatUsd } from '$lib/format';
	import { uploadProductImage } from '$lib/mock/storage';
	import type { Product, ProductPayload, ProductSize } from '$lib/types';
	import KpiCard from '$lib/components/kpi-card.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Card, CardContent } from '$lib/components/ui/card/index.js';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog/index.js';
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
	import { Field, FieldError, FieldGroup, FieldLabel } from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const PAGE_SIZE = 20;

	const CATEGORIES = ['frutal', 'natural', 'especial'] as const;
	type Category = (typeof CATEGORIES)[number];
	type CategoryFilter = 'todas' | Category;

	// svelte-ignore state_referenced_locally
	let products = $state<Product[]>(data.products.map((p) => ({ ...p })));

	const tasaBcv = $derived(data.tasaBcv);

	type ProductForm = {
		name: string;
		category: string;
		price: string;
		liters: string;
		description: string;
		size: ProductSize;
		status: boolean;
	};

	type OppositePrompt = {
		originId: string;
		name: string;
		size: ProductSize;
		category: string;
		liters: string;
		description: string;
		price: string;
		image?: string;
	};

	let formOpen = $state(false);
	let editing = $state<Product | null>(null);
	let deleteTarget = $state<Product | null>(null);
	let submitting = $state(false);
	let togglingId = $state<string | null>(null);
	let formErrors = $state<Partial<Record<keyof ProductForm | 'form', string>>>({});
	let imageFile = $state<File | null>(null);
	let imagePreview = $state<string | null>(null);
	let prefillImage = $state<string | null>(null);
	let pendingRelation = $state<{ originId: string } | null>(null);
	let promptOpposite = $state<OppositePrompt | null>(null);
	let searchQuery = $state('');
	let categoryFilter = $state<CategoryFilter>('todas');
	let visibleCount = $state(PAGE_SIZE);
	let form = $state<ProductForm>({
		name: '',
		category: 'frutal',
		price: '',
		liters: '',
		description: '',
		size: 'pequeño',
		status: true
	});

	$effect(() => {
		searchQuery;
		categoryFilter;
		visibleCount = PAGE_SIZE;
	});

	function onImageChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0] ?? null;
		imageFile = file;
		imagePreview = file ? URL.createObjectURL(file) : null;
	}

	function sizeLabel(size: ProductSize): string {
		return size === 'grande' ? 'Grande' : 'Pequeño';
	}

	function siblingSize(size: ProductSize): ProductSize {
		return size === 'pequeño' ? 'grande' : 'pequeño';
	}

	function stripSizeName(name: string): string {
		return name.replace(/\s+(pequeñ?o|grande)\s*$/i, '').trim();
	}

	function siblingName(name: string, size: ProductSize): string {
		return `${stripSizeName(name)} ${sizeLabel(size)}`.trim();
	}

	function flavorName(value: string): string {
		return stripSizeName(value)
			.replace(/^yogur de\s*/i, '')
			.trim();
	}

	function openCreate(initial?: Partial<ProductForm> & { image?: string }) {
		const { image, ...rest } = initial ?? {};
		editing = null;
		form = {
			name: '',
			category: 'frutal',
			price: '',
			liters: '',
			description: '',
			size: 'pequeño',
			status: true,
			...rest
		};
		formErrors = {};
		imageFile = null;
		imagePreview = image ?? null;
		prefillImage = image ?? null;
		formOpen = true;
	}

	function openEdit(product: Product) {
		editing = product;
		form = {
			name: flavorName(product.name),
			category: product.category,
			price: String(product.price),
			liters: String(product.liters),
			description: product.description,
			size: product.size,
			status: product.isAvailable
		};
		formErrors = {};
		imageFile = null;
		imagePreview = product.image ?? null;
		prefillImage = product.image ?? null;
		formOpen = true;
	}

	function closeForm() {
		formOpen = false;
		editing = null;
		submitting = false;
		imageFile = null;
		imagePreview = null;
		prefillImage = null;
	}

	function capitalize(value: string): string {
		return value.charAt(0).toUpperCase() + value.slice(1);
	}

	const activeCount = $derived(products.filter((p) => p.isAvailable).length);
	const categoryCount = $derived(new Set(products.map((p) => p.category)).size);

	const categoryCounts = $derived.by(() => {
		const counts: Record<CategoryFilter, number> = {
			todas: products.length,
			frutal: 0,
			natural: 0,
			especial: 0
		};
		for (const product of products) {
			if (CATEGORIES.includes(product.category as Category)) {
				counts[product.category as Category] += 1;
			}
		}
		return counts;
	});

	const CATEGORY_FILTERS: { value: CategoryFilter; label: string }[] = [
		{ value: 'todas', label: 'Todos' },
		{ value: 'frutal', label: 'Frutal' },
		{ value: 'natural', label: 'Natural' },
		{ value: 'especial', label: 'Especial' }
	];

	const filteredProducts = $derived(
		products.filter((product) => {
			if (categoryFilter !== 'todas' && product.category !== categoryFilter) return false;
			const q = searchQuery.trim().toLowerCase();
			if (!q) return true;
			return `${product.name} ${product.description}`.toLowerCase().includes(q);
		})
	);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		const errors: Partial<Record<keyof ProductForm | 'form', string>> = {};
		const editingTarget = editing;
		const createdSize = form.size;
		const flavor = flavorName(form.name);
		const name = `Yogur de ${capitalize(flavor)} ${sizeLabel(createdSize)}`.trim();
		const category = form.category;
		const price = Number(form.price);
		const liters = Number(form.liters);

		if (!flavor) errors.name = 'Escribí el sabor del yogur';
		if (!category) errors.category = 'Seleccioná una categoría';
		if (!form.price || Number.isNaN(price) || price <= 0) {
			errors.price = 'Ingresá un precio válido';
		}
		if (!form.liters || Number.isNaN(liters) || liters <= 0) {
			errors.liters = 'Ingresá los litros';
		}
		if (Object.keys(errors).length) {
			formErrors = errors;
			return;
		}

		submitting = true;

		let image = editingTarget?.image ?? prefillImage ?? undefined;
		if (imageFile) {
			const slug = editingTarget?.id ?? slugify(`${flavor} ${createdSize}`);
			try {
				image = await uploadProductImage(imageFile, slug);
			} catch (err) {
				submitting = false;
				toast.error(err instanceof Error ? err.message : 'No se pudo subir la imagen');
				return;
			}
		}

		const payload: ProductPayload = {
			name,
			category,
			price,
			liters,
			size: createdSize,
			description: form.description.trim(),
			productImg: image ?? '',
			status: form.status
		};

		if (editingTarget) {
			const result = await updateProduct(editingTarget.id, payload);
			submitting = false;
			if (result.ok) {
				products = await getProducts();
				closeForm();
				toast.success('Producto editado con éxito');
			} else {
				toast.error(result.error ?? 'No se pudo editar el producto');
			}
		} else {
			const result = await createProduct(payload);
			submitting = false;
			if (result.ok) {
				products = await getProducts();
				closeForm();
				toast.success('Producto creado con éxito');
				const created = products.find((p) => p.name === name && p.size === createdSize);
				if (created && pendingRelation) {
					await relateProducts(created.id, pendingRelation.originId);
					await relateProducts(pendingRelation.originId, created.id);
					pendingRelation = null;
					products = await getProducts();
					toast.success('Variantes relacionadas');
				} else if (created && !created.relatedId) {
					promptOpposite = {
						originId: created.id,
						name: created.name,
						size: created.size,
						category: created.category,
						liters: String(created.liters),
						description: created.description,
						price: String(created.price),
						image: created.image
					};
				}
			} else {
				toast.error(result.error ?? 'No se pudo crear el producto');
			}
		}
	}

	function acceptOpposite() {
		if (!promptOpposite) return;
		const target = siblingSize(promptOpposite.size);
		pendingRelation = { originId: promptOpposite.originId };
		openCreate({
			name: siblingName(promptOpposite.name, target),
			category: promptOpposite.category,
			price: promptOpposite.price,
			liters: promptOpposite.liters,
			description: promptOpposite.description,
			size: target,
			status: true,
			image: promptOpposite.image
		});
		promptOpposite = null;
	}

	async function handleToggle(product: Product, checked: boolean) {
		togglingId = product.id;
		product.isAvailable = checked;
		const result = await toggleProduct(product.id, checked);
		togglingId = null;
		if (result.ok) {
			toast.success(result.data?.message ?? 'Disponibilidad actualizada');
		} else {
			product.isAvailable = !checked;
			toast.error(result.error ?? 'No se pudo actualizar la disponibilidad');
		}
	}

	async function handleDelete() {
		const target = deleteTarget;
		if (!target) return;
		const result = await deleteProduct(target.id);
		if (result.ok) {
			products = await getProducts();
			toast.success('Producto eliminado con éxito');
		} else {
			toast.error(result.error ?? 'No se pudo eliminar el producto');
		}
		deleteTarget = null;
	}

	function slugify(value: string): string {
		return value
			.toLowerCase()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}
</script>

<svelte:head>
	<title>Productos · Panel de Administración</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-end justify-between gap-4">
		<div>
			<h1 class="flex items-center gap-2.5 font-heading text-2xl font-bold text-foreground">
				<span class="size-2.5 shrink-0 rounded-[3px] bg-brand-gradient"></span>
				Productos
			</h1>
			<p class="text-sm text-muted-foreground">
				Creá, editá y controlá la disponibilidad del catálogo.
			</p>
		</div>
		<Button onclick={() => openCreate()}>
			<Plus class="size-4" />
			Nuevo producto
		</Button>
	</div>

	<div class="grid gap-4 sm:grid-cols-3">
		<KpiCard
			title="Productos"
			value={products.length}
			icon={Boxes}
			description="En el catálogo"
		/>
		<KpiCard
			title="Activos"
			value={activeCount}
			icon={BadgeCheck}
			description="Disponibles para la venta"
		/>
		<KpiCard
			title="Categorías"
			value={categoryCount}
			icon={Tag}
			description="Frutal, natural y especial"
		/>
	</div>

	<div class="relative">
		<Search
			class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
		/>
		<Input
			type="search"
			placeholder="Buscar por nombre o descripción…"
			class="pl-8"
			bind:value={searchQuery}
		/>
	</div>

	<div class="flex items-center gap-2 overflow-x-auto pb-1">
		{#each CATEGORY_FILTERS as filter (filter.value)}
			<button
				type="button"
				class="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors {categoryFilter ===
				filter.value
					? 'border-transparent bg-brand-gradient text-white'
					: 'border-border bg-background text-muted-foreground hover:bg-muted'}"
				onclick={() => (categoryFilter = filter.value)}
			>
				{filter.label}
				<span
					class="rounded-full px-1.5 text-xs font-semibold {categoryFilter === filter.value
						? 'bg-white/20'
						: 'bg-muted'}"
				>
					{categoryCounts[filter.value]}
				</span>
			</button>
		{/each}
	</div>

	{#if filteredProducts.length === 0}
		<div class="rounded-xl border border-dashed border-border bg-background py-16 text-center">
			{#if products.length === 0}
				<p class="text-sm text-muted-foreground">
					Todavía no hay productos. Creá el primero.
				</p>
			{:else}
				<p class="text-sm text-muted-foreground">
					Ningún producto coincide con el filtro o la búsqueda.
				</p>
			{/if}
		</div>
	{:else}
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each filteredProducts.slice(0, visibleCount) as product (product.id)}
				<Card class="overflow-hidden shadow-sm">
					<div class="relative">
						{#if product.image}
							<img
								src={product.image}
								alt={product.name}
								class="h-40 w-full object-cover"
							/>
						{:else}
							<div
								class="flex h-40 w-full items-center justify-center bg-brand-gradient text-white/90"
							>
								<Boxes class="size-10" />
							</div>
						{/if}
						{#if !product.isAvailable}
							<span
								class="absolute left-2 top-2 rounded-full bg-foreground/80 px-2 py-0.5 text-xs font-medium text-background backdrop-blur"
							>
								Agotado
							</span>
						{/if}
						<div
							class="absolute right-2 top-2 flex items-center gap-0.5 rounded-lg bg-background/70 p-0.5 backdrop-blur"
						>
							<Button
								variant="ghost"
								size="icon-sm"
								class="text-foreground"
								aria-label={`Editar ${product.name}`}
								onclick={() => openEdit(product)}
							>
								<Pencil class="size-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon-sm"
								class="text-destructive hover:text-destructive"
								aria-label={`Eliminar ${product.name}`}
								onclick={() => (deleteTarget = product)}
							>
								<Trash2 class="size-4" />
							</Button>
						</div>
					</div>
					<CardContent class="p-4">
						<h3 class="truncate font-heading font-bold text-foreground">
							{product.name}
						</h3>
						<div class="mt-1 flex flex-wrap items-center gap-1.5">
							<Badge variant="secondary">{sizeLabel(product.size)}</Badge>
							<Badge variant="outline">{capitalize(product.category)}</Badge>
						</div>
						<p class="mt-1 line-clamp-2 text-xs text-muted-foreground">
							{product.description || 'Sin descripción.'}
						</p>
						<div
							class="mt-3 flex items-center justify-between border-t border-border pt-3"
						>
							<span class="text-lg font-bold text-primary">
								{formatBs(product.price)}
							</span>
							{#if tasaBcv > 0}
								<span class="text-xs text-muted-foreground">
									≈ {formatUsd(product.price / tasaBcv)}
								</span>
							{/if}
							<div class="flex items-center gap-1.5">
								<span class="text-xs text-muted-foreground">
									{product.isAvailable ? 'Disponible' : 'Agotado'}
								</span>
								<Switch
									checked={product.isAvailable}
									onCheckedChange={(checked) => handleToggle(product, checked)}
									aria-label={`Disponibilidad de ${product.name}`}
								/>
								{#if togglingId === product.id}
									<LoaderPinwheel class="size-3.5 animate-spin text-muted-foreground" />
								{/if}
							</div>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>

		{#if visibleCount < filteredProducts.length}
			<div class="mt-4 flex flex-col items-center gap-2">
				<p class="text-xs text-muted-foreground">
					Mostrando {visibleCount} de {filteredProducts.length} productos
				</p>
				<Button variant="outline" onclick={() => (visibleCount += PAGE_SIZE)}>
					Ver más
				</Button>
			</div>
		{/if}
	{/if}

	<Dialog
		open={formOpen}
		onOpenChange={(open) => {
			if (!open) closeForm();
		}}
	>
		<DialogContent class="max-h-[90dvh] overflow-y-auto sm:max-w-[calc(100vw-2rem)] lg:max-w-2xl">
			<DialogHeader>
				<DialogTitle class="flex items-center gap-2 text-lg">
					<span
						class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white"
					>
						<Boxes class="size-5" />
					</span>
					{editing ? 'Editar producto' : 'Nuevo producto'}
				</DialogTitle>
				<DialogDescription>
					Completá los datos del yogur. Los precios son en bolívares.
				</DialogDescription>
			</DialogHeader>

			<form onsubmit={handleSubmit} noValidate>
				<FieldGroup>
					<Field>
						<FieldLabel for="product-image">Imagen</FieldLabel>
						{#if imagePreview}
							<label for="product-image" class="group relative block cursor-pointer">
								<img
									src={imagePreview}
									alt="Vista previa del yogur"
									class="h-44 w-full rounded-xl border border-border object-cover"
								/>
								<span
									class="absolute inset-0 flex items-center justify-center gap-1.5 rounded-xl bg-black/40 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
								>
									<ImageUp class="size-4" />
									Cambiar imagen
								</span>
							</label>
						{:else}
							<label
								for="product-image"
								class="flex h-44 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:bg-muted/60"
							>
								<span
									class="flex size-12 items-center justify-center rounded-xl bg-brand-gradient text-white"
								>
									<ImageUp class="size-6" />
								</span>
								<span class="text-sm font-medium text-foreground">
									Subí una imagen del yogur
								</span>
								<span class="text-xs">JPG o PNG</span>
							</label>
						{/if}
						<Input
							id="product-image"
							type="file"
							accept="image/*"
							class="sr-only"
							onchange={onImageChange}
						/>
					</Field>

					<Field data-invalid={!!formErrors.name}>
						<FieldLabel for="product-name">Sabor</FieldLabel>
						<Input
							id="product-name"
							type="text"
							placeholder="Fresa, Mango, Guayaba…"
							bind:value={form.name}
						/>
						{#if formErrors.name}
							<FieldError>{formErrors.name}</FieldError>
						{/if}
					</Field>

					<Field data-invalid={!!formErrors.category}>
						<FieldLabel>Categoría</FieldLabel>
						<Select type="single" bind:value={form.category}>
							<SelectTrigger class="w-full">
								{capitalize(form.category)}
							</SelectTrigger>
							<SelectContent>
								{#each CATEGORIES as category (category)}
									<SelectItem value={category} label={capitalize(category)}>
										{capitalize(category)}
									</SelectItem>
								{/each}
							</SelectContent>
						</Select>
						{#if formErrors.category}
							<FieldError>{formErrors.category}</FieldError>
						{/if}
					</Field>

					<Field>
						<FieldLabel>Tamaño</FieldLabel>
						<Select type="single" bind:value={form.size}>
							<SelectTrigger class="w-full">
								{sizeLabel(form.size)}
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="pequeño" label="Pequeño">Pequeño</SelectItem>
								<SelectItem value="grande" label="Grande">Grande</SelectItem>
							</SelectContent>
						</Select>
					</Field>

					<div class="grid grid-cols-2 gap-3">
						<Field data-invalid={!!formErrors.price}>
							<FieldLabel for="product-price">Precio (Bs)</FieldLabel>
							<Input
								id="product-price"
								type="number"
								inputmode="decimal"
								min="0"
								step="0.01"
								placeholder="1000.00"
								bind:value={form.price}
							/>
							{#if form.price && !Number.isNaN(Number(form.price))}
								<p class="text-xs text-muted-foreground">
									≈ {formatBs(Number(form.price))}
									{#if tasaBcv > 0}
										· {formatUsd(Number(form.price) / tasaBcv)}
									{/if}
								</p>
							{/if}
							{#if formErrors.price}
								<FieldError>{formErrors.price}</FieldError>
							{/if}
						</Field>

						<Field data-invalid={!!formErrors.liters}>
							<FieldLabel for="product-liters">Litros</FieldLabel>
							<Input
								id="product-liters"
								type="number"
								inputmode="decimal"
								min="0"
								step="0.1"
								placeholder="0.50"
								bind:value={form.liters}
							/>
							{#if formErrors.liters}
								<FieldError>{formErrors.liters}</FieldError>
							{/if}
						</Field>
					</div>

					<Field>
						<FieldLabel for="product-description">Descripción</FieldLabel>
						<Textarea
							id="product-description"
							rows={3}
							placeholder="Breve descripción del sabor…"
							bind:value={form.description}
						/>
					</Field>

					<div class="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
						<div>
							<p class="text-sm font-medium text-foreground">Disponible</p>
							<p class="text-xs text-muted-foreground">¿Este producto se muestra en la tienda?</p>
						</div>
						<Switch bind:checked={form.status} aria-label="Disponible" />
					</div>

					<Separator />

					<DialogFooter class="sm:justify-between">
						<Button type="button" variant="outline" onclick={closeForm}>
							Cancelar
						</Button>
						<Button type="submit" disabled={submitting}>
							{#if submitting}
								<LoaderPinwheel class="animate-spin" />
							{:else}
								{editing ? 'Guardar cambios' : 'Crear producto'}
							{/if}
						</Button>
					</DialogFooter>
				</FieldGroup>
			</form>
		</DialogContent>
	</Dialog>

	<AlertDialog
		open={promptOpposite !== null}
		onOpenChange={(open) => {
			if (!open) promptOpposite = null;
		}}
	>
		{#if promptOpposite}
			{@const targetSize = siblingSize(promptOpposite.size)}
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						¿Querés crear el yogur {sizeLabel(targetSize)}?
					</AlertDialogTitle>
					<AlertDialogDescription>
						Se abrirá el formulario precargado con el mismo nombre, imagen, sabor,
						categoría y descripción para crear la variante {sizeLabel(targetSize)}.
						Solo cambiarás el precio y los litros.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onclick={() => (promptOpposite = null)}>
						No, gracias
					</AlertDialogCancel>
					<AlertDialogAction onclick={acceptOpposite}>Sí, crear</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		{/if}
	</AlertDialog>

	<AlertDialog
		open={deleteTarget !== null}
		onOpenChange={(open) => {
			if (!open) deleteTarget = null;
		}}
	>
		{#if deleteTarget}
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>¿Eliminar este producto?</AlertDialogTitle>
					<AlertDialogDescription>
						Se eliminará "{deleteTarget.name}" del catálogo. Esta acción no se puede deshacer.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancelar</AlertDialogCancel>
					<AlertDialogAction
						onclick={handleDelete}
						class="bg-destructive text-white hover:bg-destructive/90"
					>
						Eliminar
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		{/if}
	</AlertDialog>
</div>