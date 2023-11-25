import fs from 'node:fs';
import { env, getRuntimeKey } from 'hono/adapter';
import {
	type AssetHandler,
	type ServerBuild,
	createAssetHandler,
	createPulsarRouter,
	handleRequest,
} from '@pulsarjs/runtime';

export type RequestHandler = (request: Request) => Promise<Response>;

export function createRequestHandler({
	build,
}: {
	build: ServerBuild;
	getAsset: AssetHandler;
}): RequestHandler {
	const readFile =
		process.env.NODE_ENV === 'development' ? fs.readFileSync : Bun.file;
	const handleAsset = createAssetHandler(readFile);
	const router = createPulsarRouter(build, handleAsset);
	const runtime = getRuntimeKey();

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
