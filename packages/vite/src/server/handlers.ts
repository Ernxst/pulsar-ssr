import path from 'node:path';
import type { Context, Elysia, HTTPMethod } from 'elysia';
import { createRouteContext, loaderDataSymbol } from 'pulsar/internal';
import glob from 'tiny-glob';
import type { ViteDevServer } from 'vite';
import type { RouteFile } from './types';

type ErrorContext = Parameters<Parameters<Elysia['onError']>[0]>[0];

export async function handleRoute(
	elysia: Context,
	handler: RouteFile[HTTPMethod]
) {
	// Elysia defaults to a 404
	elysia.set.status = 200;
	const context = createRouteContext(elysia);
	return await handler(context);
}

export async function handlePage(
	elysia: Context,
	Page: RouteFile['default'],
	loader?: RouteFile['loader']
) {
	// Elysia defaults to a 404
	elysia.set.status = 200;
	let loaderData;

	if (loader) {
		const context = createRouteContext(elysia);
		loaderData = await loader(context);
	}

	// Bind it so any useLoaderData usages are also bound
	(Page as any)[loaderDataSymbol] = loaderData;
	return await Page.bind(Page)();
}

export async function handleError(
	ctx: ErrorContext,
	vite: ViteDevServer,
	routesDir: string
) {
	if (ctx.code === 'NOT_FOUND') {
		return await handle404(ctx, vite, routesDir);
	}

	if (ctx.code === 'VALIDATION') {
		ctx.set.status = 400;
	} else if (ctx.code === 'INVALID_COOKIE_SIGNATURE') {
		ctx.set.status = 404;
	}

	throw ctx.error;
}

async function handle404(
	ctx: ErrorContext,
	vite: ViteDevServer,
	routesDir: string
) {
	// TODO: Nicer 404 error for when a consumer 404 page does not exist
	ctx.set.status = 404;

	try {
		const pattern = path.join(routesDir, '404.{server,page}.{js,ts,jsx,tsx}');
		const [url] = await glob(pattern);
		if (!url) throw ctx.error;

		const module = (await vite.ssrLoadModule(url)) as Partial<RouteFile>;
		if (!module.default) throw ctx.error;

		const response = await handlePage(ctx, module.default, module.loader);
		ctx.set.headers['Content-Type'] = 'text/html;charset=utf-8';
		return response;
	} catch {
		throw ctx.error;
	}
}
