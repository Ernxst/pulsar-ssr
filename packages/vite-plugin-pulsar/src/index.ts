import path from 'node:path';
import fs from 'node:fs';
import type { Plugin } from 'vite';
import glob from 'tiny-glob/sync';
import { ROUTE_PATTERN } from 'pulsar/internal';
import { pulsarDev } from 'src/plugins/dev-server';
import { pulsarServerBuild } from 'src/plugins/server-build';
import { pulsarTransform } from 'src/plugins/transform';
import { pulsarConfig } from 'src/plugins/config';
import type { Options } from './plugins/types';
import type { Adapter } from './adapters';

// TODO: Error boundaries and (nested) layouts and response streaming for pages

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

	const patterns = path.join(routes, ROUTE_PATTERN);
	const entries = glob(patterns, { absolute: true });
	const opts: Options = { routes: entries, routesDir: routes };

	return [
		pulsarConfig(),
		pulsarDev(opts),
		pulsarTransform(opts),
		pulsarServerBuild({ entry: serverEntry, adapter, ...opts }),
	];
}
