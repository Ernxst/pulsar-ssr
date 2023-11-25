/// <reference types="@types/node" />
import type { Options as KvAssetHandlerOptions } from '@cloudflare/kv-asset-handler';
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import type { ExecutionContext } from '@cloudflare/workers-types';
import type { ServerBuild } from '@pulsarjs/runtime';
import { createPulsarRouter, handleRequest } from '@pulsarjs/runtime';

export type RequestHandler = (
	request: Request,
	env: Pulsar.Env,
	context: ExecutionContext
) => Promise<Response>;

export function createRequestHandler({
	build,
	options,
}: {
	build: ServerBuild;
	options?: Partial<KvAssetHandlerOptions>;
}): RequestHandler {
	const router = createPulsarRouter(build, (_, { request }) =>
		handleAsset(request, build, options)
	);

	return async function handle(request, env) {
		return handleRequest({ router, request, env });
	};
}

async function handleAsset(
	request: Request,
	build: ServerBuild,
	options?: Partial<KvAssetHandlerOptions>
) {
	if (process.env.NODE_ENV === 'development') {
		return await getAssetFromKV(request, {
			cacheControl: { bypassCache: true },
			...options,
		});
	}

	let cacheControl = {};
	const url = new URL(request.url);
	const assetPath = build.assets.url.split('/').slice(0, -1).join('/');
	const requestPath = url.pathname.split('/').slice(0, -1).join('/');

	if (requestPath.startsWith(assetPath)) {
		// Assets are hashed by Remix so are safe to cache in the browser
		// And they're also hashed in KV storage, so are safe to cache on the edge
		cacheControl = {
			bypassCache: false,
			edgeTTL: 31536000,
			browserTTL: 31536000,
		};
	} else {
		// Assets are not necessarily hashed in the request URL, so we cannot cache in the browser
		// But they are hashed in KV storage, so we can cache on the edge
		cacheControl = {
			bypassCache: false,
			edgeTTL: 31536000,
		};
	}

	return await getAssetFromKV(request, {
		cacheControl,
		...options,
	});
}
