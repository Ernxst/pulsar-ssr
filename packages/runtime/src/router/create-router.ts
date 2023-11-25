import { RegExpRouter } from 'hono/router/reg-exp-router';
import { SmartRouter } from 'hono/router/smart-router';
import { TrieRouter } from 'hono/router/trie-router';
import { getFilePath } from 'hono/utils/filepath';
import { renderToReadableStream } from 'hono/jsx/streaming';
import { notFound } from 'src/utils/not-found';
import {
	PULSAR_FORM_ACTIONS_ENDPOINT,
	PULSAR_FORM_ACTIONS_METHOD,
} from 'src/utils/url/create-action-url';
import type {
	AssetHandler,
	HTTPMethod,
	RouteHandler,
	ServerBuild,
} from './types';

export function createPulsarRouter(
	{ routes, assets }: ServerBuild,
	getAsset: AssetHandler
) {
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
					stream,
					...handlers
				} = await loadModule();

				const method = ctx.request.method.toUpperCase() as HTTPMethod;

				if (Page && method === 'GET') {
					const loaderData = loader ? await loader(ctx) : undefined;
					const result = await Page({ context: ctx, loaderData });
					const html =
						typeof result === 'object' && result ? result.toString() : result;

					if (stream) {
						const body = renderToReadableStream(html);
						ctx.response.headers.set('Transfer-Encoding', 'chunked');
						ctx.response.headers.set(
							'Content-Type',
							'text/html; charset=UTF-8'
						);
						return body;
					}

					return ctx.html(html);
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

			const { actions = {} } = await module.loadModule();

			const handler = actions[action];
			if (!handler)
				throw new Error(`Unknown form action "${action}" for file ${file}`);

			const actionData = await handler(context);
			// TODO: How to set action data. We won't have context
			return actionData;
		},
	});

	// Let vite handle assets in dev
	if (process.env.NODE_ENV !== 'development') {
		/** If we have the files ahead of time, we can register them */
		const files = assets.files.length ? assets.files : [`/${assets.url}/*`];

		const handle: RouteHandler['handle'] = async (ctx) => {
			const { pathname } = new URL(ctx.request.url);
			const filePath = getFilePath({ filename: pathname }) ?? pathname;
			const response = await getAsset(filePath, ctx);
			if (response) return response;

			return notFound(ctx.request.url);
		};

		files.forEach((assetFile) => {
			const path = assetFile.replaceAll('//', '/');
			router.add('GET', path, { path, handle });
		});

		// For assets in the public dir
		router.add('GET', '*', { path: '*', handle });
	}

	return router;
}
