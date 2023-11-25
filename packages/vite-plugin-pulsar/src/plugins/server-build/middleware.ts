import { createRequestHandler } from '@pulsarjs/node';
import type { PulsarModule } from '@pulsarjs/runtime';
import { transformPathToUrl } from 'pulsar/internal';
import type { Connect, ResolvedConfig } from 'vite';

interface Options {
	routes: string[];
	routesDir: string;
	config: ResolvedConfig;
	loadModule: (path: string) => Promise<PulsarModule>;
}

export function serve({
	routes,
	routesDir,
	config,
	loadModule,
}: Options): Connect.NextHandleFunction {
	const entries = routes.map((entry) => {
		const relativeUrl = entry.split(routesDir)[1];
		return [
			relativeUrl,
			{
				endpoint: transformPathToUrl(relativeUrl),
				// Function so each entry can be lazily loaded for better startup time
				loadModule: () => loadModule(entry),
			},
		] as const;
	});

	const handle = createRequestHandler({
		build: {
			routes: Object.fromEntries(entries),
			// This is ignored in dev, letting vite handle assets
			assets: {
				url: '',
				files: [],
			},
		},
	});

	return async function middleware(req, res, next) {
		try {
			const protocol = config.server.https ? 'https' : 'http';
			const host = req.headers[':authority'] ?? req.headers.host;
			const base = `${protocol}://${host}`;

			const fullUrl = base + req.originalUrl;
			req.originalUrl = fullUrl;
			req.url = fullUrl;

			await handle(req, res);
		} catch (error) {
			next(error);
		}
	};
}
