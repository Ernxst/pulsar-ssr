import { createRouteContext, isRedirect } from 'pulsar/internal';
import { createResponse } from 'src/router/create-response';
import type { RouteHandler } from 'src/router/types';
import { handleRedirect } from './handle-request';

interface RenderOptions {
	request: Request;
	handler: [RouteHandler, Record<string, any>];
	stash: string[] | undefined;
	env: Pulsar.Env;
	statusOverride?: number;
}

export async function render({
	request,
	env,
	handler,
	stash,
	statusOverride,
}: RenderOptions) {
	const [{ handle, path }, paramsIndexMap] = handler;

	// No clue why Hono has decided to structure the match result like this
	const params: Record<string, string> = {};

	if (stash) {
		for (const [pathParam, index] of Object.entries(paramsIndexMap)) {
			params[pathParam] = stash[index];
		}
	}

	const context = await createRouteContext({ request, path, env, params });
	const responseBody = await handle(context);

	if (isRedirect(responseBody)) {
		return handleRedirect(responseBody);
	}

	const { status, headers } = context.response;
	return createResponse(responseBody, {
		headers,
		status: statusOverride ?? status,
	});
}
