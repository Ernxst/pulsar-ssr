import { defineConfig } from 'tsup';

export default defineConfig({
	entry: {
		index: 'src/index.ts',
		'adapters/index': 'src/adapters/index.ts',
	},
	format: ['cjs', 'esm'],
	dts: true,
	clean: true,
	splitting: true,
});
