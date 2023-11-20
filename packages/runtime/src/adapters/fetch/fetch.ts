import { env, getRuntimeKey } from 'hono/adapter';
import { createPulsarRouter } from 'src/router/create-router';
import type { ServerBuild } from 'src/router/types';
import { handleRequest } from './utils/handle-request';

export type PulsarFetchHandler = (request: Request) => Promise<Response>;

export function createFetchRequestHandler({
	build,
}: {
	build: ServerBuild;
}): PulsarFetchHandler {
	const runtime = getRuntimeKey();
	if (runtime === 'workerd') {
		throw new Error(
			'Please use the cloudflare adapter over the fetch adapter when running on Cloudflare Workers.'
		);
	}

	const router = createPulsarRouter(build);

	return async function handle(request) {
		/**
		 * Cloudflare workers is the only runtime that needs the actual context
		 * We already provide an adapter that doesn't need to use the method
		 * below and throw if it is not being used on workers.
		 */
		const pulsarEnv = env({} as any, runtime);
		return await handleRequest({ router, request, env: pulsarEnv });
	};
}
