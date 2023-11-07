import path from 'node:path';
import MagicString from 'magic-string';
import { createRouter } from 'src/server/create-router';
import { createRequest, setResponse } from 'src/server/http';
import { getRoutes } from 'src/utils/get-routes';
import type { Plugin } from 'vite';
import { matches } from './utils/matches';

// TODO: Error boundaries and (nested) layouts

export interface PulsarOptions {
	/**
	 * The directory where your routes/pages are located
	 *
	 * @default src/routes
	 */
	routes?: string;
}

export default function pulsar(options: PulsarOptions = {}): Plugin[] {
	const { routes = path.join(process.cwd(), 'src', 'routes') } = options;

	return [
		{
			name: 'pulsar-config',
			enforce: 'pre',
			async config() {
				const files = await getRoutes(routes);
				return {
					build: {
						lib: { formats: ['es'], entry: files },
					},
				};
			},
		},
		{
			name: 'pulsar-vite',
			transform(code, id) {
				/**
				 * Bind the usage of useLoaderData to the outer scope.
				 * This way, we can set the loader data on the outer scope,
				 * which we have access to, and then access it inside
				 * the definition of useLoaderData and then return it
				 *
				 * This means useLoaderData() will only ever return the
				 * loader data from the loader defined in the same file
				 * as the module
				 *
				 * We perform this replacement so the consumer doesn't
				 * have to bind it themselves.
				 */
				if (matches(id, routes)) {
					// Use magic string so our transformations don't break the source map
					const string = new MagicString(code);
					const pattern = /useLoaderData([.*?])?\(\)/g;

					let match = pattern.exec(code);
					while (match) {
						const [fullMatch, typeParam] = match;
						const start = match.index;
						const end = start + fullMatch.length;
						const replacement = `useLoaderData${typeParam ?? ''}.bind(this)()`;
						string.overwrite(start, end, replacement);
						match = pattern.exec(code);
					}

					return { code: string.toString(), map: string.generateMap() };
				}
			},
			async configureServer(server) {
				const router = await createRouter(server, routes);

				return () => {
					server.middlewares.use(async (req, res, next) => {
						try {
							// This is null outside of this scope
							const base = server.resolvedUrls?.local[0];
							if (!base) throw new Error('Could not get base url');

							const { origin } = new URL(base);
							// For some reason, req.url is not correct, so we fix it before
							// creating the request
							req.url = req.originalUrl;
							const request = await createRequest(origin, req);
							const response = await router.handle(request);
							await setResponse(res, response);
						} catch (error) {
							server.ssrFixStacktrace(error as Error);
							next(error);
						}
					});
				};
			},
		},
	];
}
