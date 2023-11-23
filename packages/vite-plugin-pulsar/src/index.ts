import fs from 'node:fs';
import path from 'node:path';
import { LAYOUT_PATTERN, ROUTE_PATTERN } from 'pulsar/internal';
import { pulsarConfig } from 'src/plugins/config';
import { pulsarDev } from 'src/plugins/dev-server';
import { pulsarServerBuild } from 'src/plugins/server-build';
import { pulsarTransform } from 'src/plugins/transform';
import glob from 'tiny-glob/sync';
import type { Plugin } from 'vite';
import type { Adapter } from './adapters';
import type { Options } from './plugins/types';

// TODO: Error boundaries

export interface PulsarOptions {
	/**
	 * Adapter to use when generating the server entry at build time
	 */
	adapter: Adapter;
	/**
	 * Server entry file
	 *
	 * @default src/root.tsx
	 */
	serverEntry?: string;
	/**
	 * The directory where your routes/pages are located
	 *
	 * @default src/routes
	 */
	// TODO: Allow this to be a function that returns an array of routes and files
	routes?: string;
}

export default function pulsar(options: PulsarOptions): Plugin[] {
	const {
		adapter,
		serverEntry = path.join(process.cwd(), 'src/root.tsx'),
		routes = path.join(process.cwd(), 'src', 'routes'),
	} = options;

	if (!fs.existsSync(serverEntry)) {
		throw new Error(
			`Missing server entry "${serverEntry}". Does the file exist?`
		);
	}

	const routePatterns = path.join(routes, ROUTE_PATTERN);
	const layoutPatterns = path.join(routes, LAYOUT_PATTERN);
	const entries = glob(routePatterns, { absolute: true });
	const layouts = glob(layoutPatterns, { absolute: true });
	const opts: Options = {
		layouts,
		routes: entries,
		routesDir: routes,
		entry: serverEntry,
	};

	return [
		pulsarConfig(),
		pulsarDev(opts),
		pulsarTransform(opts),
		pulsarServerBuild({ ...opts, adapter }),
	];
}
