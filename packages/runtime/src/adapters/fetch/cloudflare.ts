import { createPulsarRouter } from 'src/router/create-router';
import type { ServerBuild } from 'src/router/types';
import { handleRequest } from './utils/handle-request';

export type CloudflareWorker = (
	request: Request,
	env: Pulsar.Env,
	context: ExecutionContext
) => Promise<Response>;

export function createCloudflareWorker({
	build,
}: {
	build: ServerBuild;
}): CloudflareWorker {
	const router = createPulsarRouter(build);

	return async function handle(request, env) {
		return handleRequest({ router, request, env });
	};
}
