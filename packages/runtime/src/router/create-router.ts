import { RegExpRouter } from 'hono/router/reg-exp-router';
import { SmartRouter } from 'hono/router/smart-router';
import { TrieRouter } from 'hono/router/trie-router';
import type { RouteFunctionArgs } from 'pulsar/route';
import { actionDataSymbol, loaderDataSymbol } from 'pulsar/internal';
import Html from 'pulsar/components';
import { createActionUrl } from 'src/utils/create-action-url';
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
		async ([_sourceUrl, { endpoint, loadModule }]) => {
			const {
				default: Page,
				loader,
				actions = {},
				...handlers
			} = await loadModule();

			if (handlers.GET && Page) {
				throw new Error('Cannot have a GET route and a page in the same route');
			}

			if (loader && !Page) {
				console.warn(
					'You have defined a loader, but do not have a page - the loader will be stripped from the server bundle.'
				);
			}

			if (Page) {
				router.add('GET', endpoint, {
					path: endpoint,
					async handle(ctx) {
						let loaderData;

						// Loader is executed with the page, not on a separate route
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

			Object.entries(actions).forEach(([actionName, handler]) => {
				const actionEndpoint = createActionUrl(endpoint, actionName);
				router.add('POST', actionEndpoint, {
					path: actionEndpoint,
					async handle(context) {
						const actionData = await handler(context);
						// Bind it so any useActionData usages are also bound
						(Page as any)[actionDataSymbol] = actionData;
					},
				});
			});

			Object.entries(handlers).forEach(([method, handler]) => {
				router.add(method, endpoint, { path: endpoint, handle: handler! });
			});
		}
	);

	await Promise.all(promises);

	return router;
}
