import { createHttpRequestHandler } from '@pulsarjs/runtime/adapters';
import { matches } from 'src/utils/matches';
import type { Plugin } from 'vite';
import { transformPathToUrl } from '@pulsarjs/runtime';
import type { Options } from './types';

/**
 * Dev server which uses the node:http adapter, like it would do in a build
 * to serve the pages/routes
 */
export function pulsarDev({ routes, routesDir }: Options): Plugin {
	return {
		name: 'pulsar-dev-server',
		async configureServer(vite) {
			vite.watcher.on('change', async (file) => {
				if (matches(file, routesDir)) {
					// TODO: Reload browser
				}
			});

			vite.watcher.on('add', async (file) => {
				if (matches(file, routesDir)) {
					await vite.restart();
					console.info(`Route ${file} added - restarting server`);
				}
			});

			vite.watcher.on('unlink', async (file) => {
				if (matches(file, routesDir)) {
					await vite.restart();
					console.info(`Route ${file} deleted - restarting server`);
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
