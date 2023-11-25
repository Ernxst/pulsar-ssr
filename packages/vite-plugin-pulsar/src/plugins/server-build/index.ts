import { builtinModules } from 'module';
import type { Adapter } from 'src/adapters';
import type { Plugin, ResolvedConfig } from 'vite';
import MagicString from 'magic-string';
import type { Options } from '../types';
import { createServerEntry } from './create-server-entry';

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
		enforce: 'post',
		config() {
			return {
				build: {
					rollupOptions: {
						input: { entry },
						external,
					},
				},
			};
		},
		configResolved(config) {
			resolved = config;
		},
		transform(_code, id) {
			if (id === entry) {
				const config = routes.map((input) => ({
					input,
					relative: input.split(routesDir)[1],
				}));

				const assetsDir = resolved.build.assetsDir;
				const code = createServerEntry({
					routes: config,
					adapter,
					assetsDir,
					assets: [],
				});
				const string = new MagicString(code);

				return { code, map: string.generateMap({ hires: 'boundary' }) };
			}
		},
	};
}
