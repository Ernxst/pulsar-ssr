import path from 'node:path';
import { html } from '@elysiajs/html';
import type { Context, HTTPMethod } from 'elysia';
import { Elysia, NotFoundError } from 'elysia';
import { fileToPathname } from 'src/internal/utils/slug';
import { getRoutes } from '../utils/get-routes';
import { handleError, handlePage, handleRoute } from './handlers';
import type { ModuleLoader } from './types';

interface Options {
	filePath: string;
	server: Elysia;
	loader: ModuleLoader;
	routesDir: string;
}

export function registerNewRoute({
	filePath,
	server,
	loader,
	routesDir,
}: Options) {
	const suffix = filePath.split(routesDir)[1];
	const endpoint = fileToPathname(suffix);
	const routes = new Set([
		endpoint,
		path.join(endpoint, 'index'),
		path.join(endpoint, 'index.html'),
	]);

	routes.forEach((pathname) =>
		server.all(pathname, (elysia) =>
			handle({ pathname, elysia, moduleLoader: loader, file: filePath })
		)
	);
}

export async function createRouter(loader: ModuleLoader, routesDir: string) {
	const routeFiles = await getRoutes(routesDir);

	// ! aot: false sets the ctx.error to undefined for some reason (elysia bug)
	const server = new Elysia()
		.use(html())
		.onError((ctx) => handleError(ctx, loader, routesDir));

	for (const filePath of routeFiles) {
		registerNewRoute({ filePath, server, loader, routesDir });
	}

	return server;
}

async function handle({
	file,
	elysia,
	pathname,
	moduleLoader,
}: {
	file: string;
	elysia: Context;
	pathname: string;
	moduleLoader: ModuleLoader;
}) {
	const reqMethod = elysia.request.method.toUpperCase() as HTTPMethod;
	console.info(reqMethod, pathname);

	const module = await moduleLoader.ssrLoadModule(file);
	const Page = module.default;
	const loader = module.loader;

	if (module.GET && Page) {
		throw new Error('Cannot have a GET route and a page in the same route');
	}

	if (loader && !Page) {
		console.warn(
			'You have defined a loader, but do not have a page - the loader will be stripped from the server bundle.'
		);
	}

	if (reqMethod === 'GET' && Page) {
		return await handlePage(elysia, Page, loader);
	}

	const handler = module[reqMethod];
	if (handler) {
		return await handleRoute(elysia, handler);
	}

	throw new NotFoundError();
}
