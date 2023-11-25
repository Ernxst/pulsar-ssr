import type { IncomingMessage, ServerResponse } from 'node:http';
import { env, getRuntimeKey } from 'hono/adapter';
import {
	type ServerBuild,
	createAssetHandler,
	createPulsarRequest,
	createPulsarRouter,
	handleRequest,
	sendPulsarResponse,
} from '@pulsarjs/runtime';

export type RequestHandler = (
	req: IncomingMessage,
	res: ServerResponse<IncomingMessage>
) => Promise<void>;

export function createRequestHandler({
	build,
}: {
	build: ServerBuild;
}): RequestHandler {
	const handleAsset = createAssetHandler(Bun.file);
	const router = createPulsarRouter(build, handleAsset);
	const runtime = getRuntimeKey();

	return async function handle(req, res) {
		const pulsarEnv = env({} as any, runtime);
		const request = createPulsarRequest(req);
		const response = await handleRequest({ router, request, env: pulsarEnv });
		sendPulsarResponse(res, response);
	};
}
