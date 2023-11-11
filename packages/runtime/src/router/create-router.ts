import { RegExpRouter } from 'hono/router/reg-exp-router';
import { SmartRouter } from 'hono/router/smart-router';
import { TrieRouter } from 'hono/router/trie-router';
import type { RouteFunctionArgs } from 'pulsar/route';
import { actionDataSymbol, loaderDataSymbol, notFound } from 'pulsar/internal';
import Html from 'pulsar/components';
import {
	PULSAR_FORM_ACTIONS_ENDPOINT,
	PULSAR_FORM_ACTIONS_METHOD,
} from 'src/utils/create-action-url';
import type { HTTPMethod, ServerBuild } from './types';

export interface RouteHandler {
	path: string;
	handle: (context: RouteFunctionArgs) => Promise<any>;
}

export function createPulsarRouter({ routes }: ServerBuild) {
	const router = new SmartRouter<RouteHandler>({
		routers: [new RegExpRouter(), new TrieRouter()],
	});

	Object.entries(routes).forEach(([_sourceUrl, { endpoint, loadModule }]) => {
		/**
		 * ! When building, we could register the route + method ahead of time,
		 * instead of a blanket route here, but I'd like to keep the differences
		 * between the dev and prod builds as minimal as possible
		 *
		 * Maybe if someone asks for it, I can add this change
		 */
		router.add('ALL', endpoint, {
			path: endpoint,
			async handle(ctx) {
				const {
					default: Page,
					loader,
					actions: _,
					...handlers
				} = await loadModule();

				const method = ctx.request.method.toUpperCase() as HTTPMethod;

				// TODO: This needs to happen at compile time
				if (handlers.GET && Page) {
					throw new Error(
						'Cannot have a GET route and a page in the same route'
					);
				}

				// TODO: This needs to happen at compile time
				if (process.env.NODE_ENV === 'development') {
					if (loader && !Page) {
						console.warn(
							'You have defined a loader, but do not have a page - the loader will be stripped from the production bundle.'
						);
					}
				}

				if (Page && method === 'GET') {
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
				}

				const handle = handlers[method];
				if (handle) {
					return await handle(ctx);
				}

				return notFound(ctx.request.url);
			},
		});
	});

	router.add(PULSAR_FORM_ACTIONS_METHOD, PULSAR_FORM_ACTIONS_ENDPOINT, {
		path: PULSAR_FORM_ACTIONS_ENDPOINT,
		async handle(context) {
			const { filename, action } = context.params;
			if (!filename) throw new Error('Missing filename path param');
			if (!action) throw new Error('Missing form action path param');

			const file = filename.startsWith('/') ? filename : `/${filename}`;
			const module = routes[file];
			if (!module) throw new Error(`Could not find module ${file}`);

			const { default: Page, actions = {} } = await module.loadModule();

			const handler = actions[action];
			if (!handler)
				throw new Error(`Unknown form action "${action}" for file ${file}`);

			const actionData = await handler(context);
			(Page as any)[actionDataSymbol] ??= {};
			// Bind it so any useActionData usages are also bound
			(Page as any)[actionDataSymbol][action] = actionData;
		},
	});

	return router;
}
