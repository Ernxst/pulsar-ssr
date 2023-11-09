import { RegExpRouter } from 'hono/router/reg-exp-router';
import { SmartRouter } from 'hono/router/smart-router';
import { TrieRouter } from 'hono/router/trie-router';
import { transformPathToUrl } from 'src/utils/transform-path-to-url';
import type { RouteFunctionArgs } from 'pulsar/route';
import { loaderDataSymbol } from 'pulsar/internal';
import Html from 'pulsar/components';
import type { ServerBuild } from './types';

export interface RouteHandler {
	path: string;
	handle: (context: RouteFunctionArgs) => Promise<any>;
}

export async function createPulsarRouter({
	routes,
}: ServerBuild): Promise<SmartRouter<RouteHandler>> {
	const router = new SmartRouter<RouteHandler>({
		routers: [new RegExpRouter(), new TrieRouter()],
	});

	const promises = Object.entries(routes).map(
		async ([sourceUrl, loadModule]) => {
			const { default: Page, loader, ...handlers } = await loadModule();

			if (handlers.GET && Page) {
				throw new Error('Cannot have a GET route and a page in the same route');
			}

			if (loader && !Page) {
				console.warn(
					'You have defined a loader, but do not have a page - the loader will be stripped from the server bundle.'
				);
			}

			const endpoint = transformPathToUrl(sourceUrl);

			if (Page) {
				router.add('GET', endpoint, {
					path: endpoint,
					async handle(ctx) {
						let loaderData;

						if (loader) {
							loaderData = await loader(ctx);
						}

						// Bind it so any useLoaderData usages are also bound
						(Page as any)[loaderDataSymbol] = loaderData;
						(globalThis as any)['Html'] = Html;

						const result = await Page.bind(Page)();
						return ctx.html(result);
					},
				});
			}

			Object.entries(handlers).forEach(([method, handler]) => {
				router.add(method, endpoint, { path: endpoint, handle: handler! });
			});
		}
	);

	await Promise.all(promises);

	return router;
}
