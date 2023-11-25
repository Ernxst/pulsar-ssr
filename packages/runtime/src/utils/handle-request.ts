import type { Redirect } from 'pulsar/internal';
import { isRedirect } from 'pulsar/internal';
import { isNotFound } from 'src/utils/not-found';
import type { SmartRouter } from 'hono/router/smart-router';
import type { RouteHandler } from 'src/router/types';
import { render } from './render';

interface HandleOptions {
	router: SmartRouter<RouteHandler>;
	request: Request;
	env: Pulsar.Env;
}

export async function handleRequest({ request, router, env }: HandleOptions) {
	const url = new URL(request.url);
	const method = request.method.toUpperCase();

	let response: Response;

	const [handlers, stash] = router.match(method, url.pathname);
	if (handlers.length) {
		try {
			response = await render({ request, env, handler: handlers[0], stash });
		} catch (error) {
			response = await handleError(error, { router, url, env });
		}
	} else {
		response = await handleNotFound({ router, url, env });
	}

	const endpoint = `${url.pathname}${url.search}`;
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
}

async function handleError(
	error: unknown,
	{ router, url, env }: NotFoundOptions
) {
	if (isRedirect(error)) {
		return handleRedirect(error);
	} else if (isNotFound(error)) {
		return await handleNotFound({ router, url, env });
	} else {
		throw error;
	}
}

export function handleRedirect(redirect: Redirect) {
	return new Response(null, {
		status: redirect.status,
		headers: { Location: redirect.path.toString() },
	});
}

interface NotFoundOptions {
	router: SmartRouter<RouteHandler>;
	url: URL;
	env: Pulsar.Env;
}

async function handleNotFound({ router, env, url }: NotFoundOptions) {
	const [notFoundHandler, stash] = router.match('GET', '/404');
	if (notFoundHandler.length) {
		const reqUrl = new URL('/404', url.origin);
		const request = new Request(reqUrl.toString());
		return await render({
			request,
			handler: notFoundHandler[0],
			env,
			stash,
			statusOverride: 404,
		});
	} else {
		throw new Error(`404 Not Found ${url.pathname}`);
	}
}
