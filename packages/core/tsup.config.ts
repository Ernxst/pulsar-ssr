import { defineConfig } from 'tsup';

export default defineConfig({
	entry: {
		index: 'src/index.ts',
		'jsx/index': 'src/jsx/index.ts',
		'jsx/jsx-runtime': 'src/jsx/jsx-runtime.ts',
		'jsx/jsx-dev-runtime': 'src/jsx/jsx-dev-runtime.ts',
		'components/index': 'src/components/index.ts',
		'layouts/index': 'src/layouts/index.ts',
		'internal/index': 'src/internal/index.ts',
		'actions/index': 'src/actions/index.ts',
		'loader/index': 'src/loader/index.ts',
		'route/index': 'src/route/index.ts',
	},
	format: ['cjs', 'esm'],
	dts: true,
	clean: true,
	splitting: true,
});
