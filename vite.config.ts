import adapterAuto from '@sveltejs/adapter-auto';
import adapterVercel from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// En Vercel usamos el adapter explícito (evita que adapter-auto lo instale
// dinámicamente en build time). En local, adapter-auto mantiene el build sin
// generar una función de Vercel.
const adapter = process.env.VERCEL ? adapterVercel() : adapterAuto();

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			adapter
		})
	]
});
