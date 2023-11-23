import type { Plugin } from 'vite';

export function pulsarConfig(): Plugin {
	return {
		name: 'pulsar-plugin-config',
		config() {
			return {
				appType: 'custom',
				clearScreen: false,
				build: {
					rollupOptions: {
						preserveEntrySignatures: 'exports-only',
						output: {
							format: 'esm',
							entryFileNames: '[name].mjs',
							exports: 'default',
						},
					},
				},
			};
		},
	};
}
