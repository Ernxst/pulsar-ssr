import { builtinModules } from 'module';
import path from 'node:path';
import type { Adapter } from 'src/adapters';
import type { Plugin, ResolvedConfig } from 'vite';
import MagicString from 'magic-string';
import type { ServerBuild } from '@pulsarjs/runtime';
import type { Options } from '../types';
import { MANIFEST_ID, createServerEntry } from './create-server-entry';
import { createServerManifest } from './create-server-manifest';
import { serve } from './middleware';

const MANIFEST_OUTPUT_NAME = 'server-build';
const MANIFEST_OUTPUT_FILE = `${MANIFEST_OUTPUT_NAME}.mjs`;

export function pulsarServerBuild({
	entry,
	routes,
	adapter,
	routesDir,
}: {
	adapter: Adapter;
} & Options): Plugin {
	const external = adapter.type === 'node' ? builtinModules : [];

	let resolved: ResolvedConfig;

	/**
	 * The idea is to transform the consumer entry into a server entry.
	 * To do so, we return a virtual import, which we then transform
	 * (which just returns a server entry)
	 */
	return {
		name: 'pulsar-create-server-entry',
		enforce: 'pre',
		config() {
			return {
				build: {
					rollupOptions: {
						input: { entry },
						external,
						output: {
							chunkFileNames(chunkInfo) {
								if (chunkInfo.name === MANIFEST_OUTPUT_NAME)
									return MANIFEST_OUTPUT_FILE;
								return '[name]-[hash].js';
							},
							manualChunks(id) {
								if (id === MANIFEST_ID) {
									return MANIFEST_OUTPUT_NAME;
								}
							},
						},
					},
				},
			};
		},
		configResolved(config) {
			resolved = config;
		},
		configurePreviewServer(vite) {
			const outDir = path.join(vite.config.root, vite.config.build.outDir);
			return () => {
				vite.config.logger.warnOnce(
					`You are using vite to preview the server build. This sets the runtime to 'node' (and not your adapter-specific runtime); please set any environment variables on process.env. Consult the adapter-specific documentation on how to run your server on the correct runtime.`
				);

				vite.middlewares.use(
					serve({
						routes,
						routesDir,
						config: vite.config,
						loadModule: async (file) => {
							const url = path.join(outDir, MANIFEST_OUTPUT_FILE);
							const module = await import(url);
							const build = Object.values(module).find((item) => {
								return (
									typeof item == 'object' &&
									item &&
									'routes' in item &&
									'assets' in item
								);
							}) as ServerBuild | undefined;

							if (!build) throw new Error('Could not find manifest');

							const routes = build.routes;
							const route = Object.keys(routes).find((key) => {
								const relative = file.split(routesDir)[1];
								return key === relative;
							});

							if (!route)
								throw new Error(`Could not find ${entry} in manifest`);
							return routes[route!].loadModule();
						},
					})
				);
			};
		},
		resolveId(id) {
			if (id === MANIFEST_ID) {
				return { id: MANIFEST_ID };
			}
		},
		async load(id) {
			if (id === MANIFEST_ID) {
				return '';
			}
		},
		transform(_code, id) {
			if (id === MANIFEST_ID) {
				const config = routes.map((input) => ({
					input,
					relative: input.split(routesDir)[1],
				}));

				const assetsDir = resolved.build.assetsDir;
				const code = createServerManifest({
					routes: config,
					assetsDir,
					assets: [],
				});

				const string = new MagicString(code);
				return { code, map: string.generateMap({ hires: 'boundary' }) };
			} else if (id === entry) {
				const code = createServerEntry({ adapter });
				const string = new MagicString(code);
				return { code, map: string.generateMap({ hires: 'boundary' }) };
			}
		},
	};
}
