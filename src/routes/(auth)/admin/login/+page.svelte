<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import { KeyRound, LoaderPinwheel, ShieldCheck } from '@jis3r/icons';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card/index.js';
	import { Field, FieldError, FieldGroup, FieldLabel } from '$lib/components/ui/field/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	let submitting = $state(false);

	const onSubmit = ({
		formElement,
		formData,
		action,
		cancel,
		submitter
	}: {
		formElement: HTMLFormElement;
		formData: FormData;
		action: URL;
		cancel: () => void;
		submitter: HTMLElement | null;
	}) => {
		void formElement;
		void formData;
		void action;
		void cancel;
		void submitter;
		submitting = true;

		return async ({
			result,
			update
		}: {
			result: { type: string };
			update: () => Promise<void>;
		}) => {
			submitting = false;
			if (result.type === 'redirect') {
				toast.success('¡Bienvenido de nuevo al panel!');
			}
			if (result.type === 'failure') {
				toast.error('No se pudo iniciar sesión');
			}
			return update();
		};
	};

	const errors = $derived(form?.errors ?? {});
	// El layout redirige acá con ?error=forbidden cuando la sesión no es válida.
	const bounced = $derived(page.url.searchParams.get('error') === 'forbidden');
	const formError = $derived(
		form?.errors?.form ??
			(bounced ? 'Tu sesión no es válida. Volvé a iniciar sesión.' : null)
	);
</script>

<svelte:head>
	<title>Ingresar · Panel de Administración</title>
	<meta
		name="description"
		content="Acceso restringido al panel de administración de Yogures Cremosos."
	/>
</svelte:head>

<div class="flex min-h-dvh items-center justify-center bg-crema px-4 py-10">
	<div class="pointer-events-none fixed -right-24 -top-24 text-primary/10">
		<svg viewBox="0 0 200 200" class="size-96" aria-hidden="true">
			<circle cx="100" cy="100" r="100" fill="currentColor" />
		</svg>
	</div>
	<div class="pointer-events-none fixed -bottom-32 -left-20 text-secondary/60">
		<svg viewBox="0 0 200 200" class="size-80 rotate-12" aria-hidden="true">
			<circle cx="100" cy="100" r="100" fill="currentColor" />
		</svg>
	</div>

	<Card class="relative z-10 w-full max-w-md shadow-dollop">
		<CardHeader class="text-center">
			<span
				class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-gradient text-white"
			>
				<ShieldCheck class="size-8" />
			</span>
			<CardTitle class="mt-3 text-2xl font-bold">Panel de Administración</CardTitle>
			<CardDescription>
				Modo demo: cualquier correo y contraseña abren el panel. No hay autenticación real.
			</CardDescription>
		</CardHeader>

		<CardContent>
			<form method="POST" use:enhance={onSubmit} noValidate>
				<FieldGroup>
<Field data-invalid={!!errors.email}>
						<FieldLabel for="email">Correo electrónico</FieldLabel>
						<Input
							id="email"
							name="email"
							type="email"
							autocomplete="email"
							aria-invalid={!!errors.email}
							value="admin@yogures.com"
							placeholder="admin@yogures.com"
						/>
						{#if errors.email}
							<FieldError>{errors.email}</FieldError>
						{/if}
					</Field>

<Field data-invalid={!!errors.password}>
						<FieldLabel for="password">Contraseña</FieldLabel>
						<Input
							id="password"
							name="password"
							type="password"
							autocomplete="current-password"
							aria-invalid={!!errors.password}
							value="demo1234"
							placeholder="••••••••"
						/>
						{#if errors.password}
							<FieldError>{errors.password}</FieldError>
						{/if}
					</Field>

					{#if formError}
						<Alert variant="destructive">
							<AlertTitle>No pudimos iniciar sesión</AlertTitle>
							<AlertDescription>{formError}</AlertDescription>
						</Alert>
					{/if}

					<Button type="submit" size="lg" class="w-full" disabled={submitting}>
						{#if submitting}
							<LoaderPinwheel class="animate-spin" />
						{:else}
							<KeyRound class="size-4" />
						{/if}
						{submitting ? 'Verificando…' : 'Ingresar'}
					</Button>
				</FieldGroup>
			</form>

			<p class="mt-6 text-center text-xs text-muted-foreground">
				Demo local: los cambios del panel se guardan en este navegador.
			</p>
		</CardContent>
	</Card>
</div>