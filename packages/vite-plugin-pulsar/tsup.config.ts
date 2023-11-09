import { defineConfig } from 'tsup';

export default defineConfig({
	entry: {
		index: 'src/index.ts',
		'adapters/index': 'src/adapters/index.ts',
	},
	format: ['cjs', 'esm'],
	dts: true,
	clean: true,
	splitting: false,
	external: ['pulsar', 'vite'],
	banner: {
		js: `
// BANNER START
const require = (await import("node:module")).createRequire(import.meta.url);
const __filename = (await import("node:url")).fileURLToPath(import.meta.url);
// BANNER END
`,
	},
});
