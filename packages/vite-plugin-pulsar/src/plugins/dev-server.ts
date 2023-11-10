import { createHttpRequestHandler } from '@pulsarjs/runtime/adapters';
import { matches } from 'src/utils/matches';
import type { Plugin, ViteDevServer } from 'vite';
import { transformPathToUrl } from '@pulsarjs/runtime';
import type { Options } from './types';

const PULSAR_DEV_PROTOCOL = 'ws:';
const PULSAR_DEV_PORT = 8002;

function sendReload(vite: ViteDevServer, file: string, routesDir: string) {
	const relative = file.split(routesDir)[1];
	const endpoint = transformPathToUrl(relative);
	// @ts-expect-error it's fine
	vite.ws.send({ type: 'RELOAD', path: file, endpoint });
}

/**
 * Dev server which uses the node:http adapter, like it would do in a build
 * to serve the pages/routes
 */
export function pulsarDev({ routes, routesDir }: Options): Plugin {
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
			vite.watcher.on('change', async (file) => {
				if (matches(file, routesDir)) {
					sendReload(vite, file, routesDir);
				}
			});

			vite.watcher.on('add', async (file) => {
				if (matches(file, routesDir)) {
					await vite.restart();
					console.info(`Route ${file} added - restarting server`);
					sendReload(vite, file, routesDir);
				}
			});

			vite.watcher.on('unlink', async (file) => {
				if (matches(file, routesDir)) {
					await vite.restart();
					console.info(`Route ${file} deleted - restarting server`);
					sendReload(vite, file, routesDir);
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
						const base = vite.resolvedUrls?.local[0];
						if (!base) {
							throw new Error('Could not get base URL');
						}

						const fullUrl = new URL(req.originalUrl ?? '', base).toString();
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
