import type { Plugin } from 'vite';
import type { Options } from '../types';
import { serve } from '../server-build/middleware';
import { createHandler } from './handler';

const PULSAR_DEV_PROTOCOL = 'ws:';
const PULSAR_DEV_PORT = 8002;

/**
 * Dev server which uses the node:http adapter, like it would do in a build
 * to serve the pages/routes
 */
export function pulsarDev({ routes, routesDir, entry }: Options): Plugin {
	return {
		name: 'pulsar-dev-server',
		config() {
			return {
				define: {
					'process.env.PULSAR_HMR_PROTOCOL':
						JSON.stringify(PULSAR_DEV_PROTOCOL),
					'process.env.PULSAR_HMR_PORT': JSON.stringify(PULSAR_DEV_PORT),
				},
				server: {
					hmr: {
						overlay: true,
						host: 'localhost',
						protocol: PULSAR_DEV_PROTOCOL,
						port: PULSAR_DEV_PORT,
					},
				},
			};
		},
		async configureServer(vite) {
			const handler = createHandler({
				vite,
				serverEntry: entry,
				routesDir,
				routes,
			});

			vite.watcher.on('change', (id) => {
				if (
					handler.is.page(id) ||
					handler.is.asset.andDependencyOf.root(id) ||
					handler.is.asset.andDependencyOf.page(id) ||
					handler.is.asset.andDependencyOf.layout(id)
				) {
					return handler.send.reload(id, { force: true });
				}
			});

			vite.watcher.on('add', (id) => {
				// Do nothing when assets are added
				if (
					handler.is.page(id) ||
					handler.is.entry(id) ||
					handler.is.layout(id)
				) {
					return handler.send.restart(id);
				}
			});

			vite.watcher.on('unlink', (id) => {
				// Do nothing when assets are removed
				if (
					handler.is.page(id) ||
					handler.is.entry(id) ||
					handler.is.layout(id)
				) {
					return handler.send.restart(id);
				}
			});

			return () => {
				vite.middlewares.use(
					serve({
						routes,
						routesDir,
						server: vite,
						loadModule: vite.ssrLoadModule,
					})
				);
			};
		},
	};
}
