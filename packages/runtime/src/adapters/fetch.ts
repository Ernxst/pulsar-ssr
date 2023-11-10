import { SmartRouter } from 'hono/router/smart-router';
import { createRouteContext, isNotFound, isRedirect } from 'pulsar/internal';
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

async function handleNotFound(router: SmartRouter<RouteHandler>, url: URL) {
	const [notFoundHandler, stash] = router.match('GET', '/404');
	if (notFoundHandler.length) {
		const reqUrl = new URL('/404', url.origin);
		const request = new Request(reqUrl.toString());
		return await render(request, notFoundHandler[0], stash, 404);
	} else {
		throw new Error(`404 Not Found ${url.pathname}`);
	}
}

export function createFetchRequestHandler({
	build,
}: {
	build: ServerBuild;
}): FetchHandler {
	const router = createPulsarRouter(build);

	return async function handleRequest(request) {
		const url = new URL(request.url);
		const method = request.method.toUpperCase();
		const endpoint = `${url.pathname}${url.search}`;

		let response: Response;

		const [handlers, stash] = router.match(method, url.pathname);
		if (handlers.length) {
			try {
				response = await render(request, handlers[0], stash);
			} catch (error) {
				if (isRedirect(error)) {
					response = new Response(null, {
						status: error.status,
						headers: { Location: error.path.toString() },
					});
				} else if (isNotFound(error)) {
					response = await handleNotFound(router, url);
				} else {
					throw error;
				}
			}
		} else {
			response = await handleNotFound(router, url);
		}

		console.log(response.status, method, endpoint);
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
