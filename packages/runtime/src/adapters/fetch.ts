import { createRouteContext } from 'pulsar/internal';
import { createResponse } from 'src/router/create-response';
import type { RouteHandler } from 'src/router/create-router';
import { createPulsarRouter } from 'src/router/create-router';
import type { ServerBuild } from 'src/router/types';

type FetchHandler = (request: Request) => Promise<Response>;

async function render(
	request: Request,
	handler: [RouteHandler, Record<string, any>],
	stash: string[] | undefined,
	statusOverride?: number
) {
	const [{ handle, path }, paramsIndexMap] = handler;

	// No clue why Hono has decided to structure the match result like this
	const params: Record<string, string> = {};

	if (stash) {
		for (const [pathParam, index] of Object.entries(paramsIndexMap)) {
			params[pathParam] = stash[index];
		}
	}

	const context = await createRouteContext({ request, path, params });
	const responseBody = await handle(context);
	const { status, headers } = context.response;
	return createResponse(responseBody, {
		headers,
		status: statusOverride ?? status,
	});
}

export function createFetchRequestHandler({
	build,
}: {
	build: ServerBuild;
}): FetchHandler {
	const routerPromise = createPulsarRouter(build);
	let router: Awaited<ReturnType<typeof createPulsarRouter>>;

	return async function handleRequest(request) {
		if (!router) {
			// Wait for all routes to be loaded
			router = await routerPromise;
		}

		const url = new URL(request.url);
		let response: Response;

		const [handlers, stash] = router.match(request.method, url.pathname);
		if (handlers.length) {
			response = await render(request, handlers[0], stash);
		} else {
			const [notFoundHandler, stash] = router.match('GET', '/404');
			if (notFoundHandler.length) {
				const reqUrl = new URL('/404', url.origin);
				const request = new Request(reqUrl.toString());
				response = await render(request, notFoundHandler[0], stash, 404);
			} else {
				throw new Error(`404 Not Found ${url.pathname}`);
			}
		}

		console.log(response.status, request.method.toUpperCase(), url.pathname);
		/** HEAD requests have no body, as per the spec */
		if (request.method === 'HEAD') {
			return new Response(null, {
				headers: response.headers,
				status: response.status,
				statusText: response.statusText,
			});
		}

		return response;
	};
}

export type PulsarFetchHandler = ReturnType<typeof createFetchRequestHandler>;
