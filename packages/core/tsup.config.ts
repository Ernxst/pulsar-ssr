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
	sourcemap: true,
	clean: true,
	splitting: false,
});
