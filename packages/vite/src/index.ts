import path from 'node:path';
import type { Plugin } from 'vite';
import glob from 'tiny-glob';
import { useCache } from 'src/cache';
import { createServerEntry } from 'src/create-server-entry';
import { getOutputFilename } from 'src/utils/slug';

export interface PulsarOptions {
	/**
	 * @default src/root.tsx
	 */
	entry?: string;
	/**
	 * The directory where your routes/pages are located
	 *
	 * @default src/routes
	 */
	routes?: string;
}

export default function pulsar(options: PulsarOptions = {}): Plugin[] {
	const {
		// entry = path.join(process.cwd(), 'src/root.tsx'),
		routes = path.join(process.cwd(), 'src', 'routes'),
	} = options;

	const { createEntry, cache, globPatterns } = useCache({ routes });

	/** Output files relative to the <OUTPUT_DIR>/server/ directory */
	const routeFiles = new Set<string>();

	return [
		{
			name: 'pulsar-config',
			async config() {
				const entries = await Promise.all(globPatterns.map((p) => glob(p)));
				return {
					build: {
						// TODO: For some reason, this bundles the input files again
						lib: { formats: ['es'], entry: entries.flat() },
					},
				};
			},
		},
		/**
		 * Plugin to split consumer code into server and client bundles
		 */
		{
			name: 'pulsar-bundle',
			transform(code, id, options) {
				return createEntry({ code, id, ...options });
			},
		},
		/**
		 * Plugin to write the bundles to the filesystem
		 */
		{
			name: 'pulsar-write-files',
			enforce: 'post',
			buildEnd() {
				cache.forEach((result, filePath) => {
					for (const [type, source] of Object.entries(result)) {
						if (source) {
							const file = getOutputFilename(
								filePath.split(routes)[1],
								type as any
							);

							const directory = type === 'client' ? 'client' : 'server';
							const fileName = path.join(directory, file);

							if (type === 'server') {
								// Relative to the <OUTPUT_DIR>/server/
								routeFiles.add(`.${file}`);
							}

							// TODO: This doesn't bundle files - need that, maybe write to virtual files first then add entries?
							this.emitFile({ type: 'asset', fileName, source });
						}
					}
				});
			},
		},
		{
			name: 'pulsar-create-server-entry',
			enforce: 'post',
			buildEnd() {
				const entry = createServerEntry({ routes: [...routeFiles.values()] });

				this.emitFile({
					type: 'asset',
					fileName: path.join('server', 'entry.mjs'),
					source: entry,
				});
			},
		},
	];
}
