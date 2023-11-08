import { defineConfig } from 'tsup';

export default defineConfig({
	entry: {
		index: 'src/index.ts',
		'components/index': 'src/components/index.ts',
		'internal/index': 'src/internal/index.ts',
		'loader/index': 'src/loader/index.ts',
		'route/index': 'src/route/index.ts',
	},
	format: ['cjs', 'esm'],
	dts: true,
	clean: true,
	splitting: true,
	banner: {
		js: `
// BANNER START
const require = (await import("node:module")).createRequire(import.meta.url);
const __filename = (await import("node:url")).fileURLToPath(import.meta.url);
// BANNER END
`,
	},
});
