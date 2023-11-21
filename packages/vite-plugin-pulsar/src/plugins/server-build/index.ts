import type { Adapter } from 'src/adapters';
import type { Plugin } from 'vite';
import type { Options } from '../types';
import { createServerEntry } from './create-server-entry';

export function pulsarServerBuild({
	entry,
	routes,
	adapter,
	routesDir,
}: {
	entry: string;
	adapter: Adapter;
} & Options): Plugin {
	/**
	 * The idea is to transform the consumer entry into a server entry.
	 * To do so, we return a virtual import, which we then transform
	 * (which just returns a server entry)
	 */
	return {
		name: 'pulsar-create-server-entry',
		enforce: 'pre',
		async config() {
			return {
				build: {
					rollupOptions: {
						input: { 'server/entry': entry },
					},
				},
			};
		},
		transform(_code, id) {
			if (id === entry) {
				const config = routes.map((input) => ({
					input,
					relative: input.split(routesDir)[1],
				}));

				return createServerEntry({ routes: config, adapter });
			}
		},
	};
}
