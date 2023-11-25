import { createHttpRequestHandler } from '@pulsarjs/runtime/adapters';
import { transformPathToUrl } from 'pulsar/internal';
import type { Plugin } from 'vite';
import type { Options } from '../types';
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

			const entries = routes.map((entry) => {
				const relativeUrl = entry.split(routesDir)[1];
				return [
					relativeUrl,
					{
						endpoint: transformPathToUrl(relativeUrl),
						// Function so each entry can be lazily loaded for better startup time
						loadModule: () => vite.ssrLoadModule(entry),
					},
				] as const;
			});

			const handle = createHttpRequestHandler({
				build: {
					routes: Object.fromEntries(entries),
				},
			});

			return () => {
				vite.middlewares.use(async (req, res, next) => {
					try {
						const protocol = vite.config.server.https ? 'https' : 'http';
						const host = req.headers[':authority'] ?? req.headers.host;
						const base = `${protocol}://${host}`;

						const fullUrl = base + req.originalUrl;
						req.originalUrl = fullUrl;
						req.url = fullUrl;

						await handle(req, res);
					} catch (error) {
						vite.ssrFixStacktrace(error as Error);
						next(error);
					}
				});
			};
		},
	};
}
