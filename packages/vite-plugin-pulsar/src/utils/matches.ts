import path from 'node:path';
import { minimatch } from 'minimatch';
import { LAYOUT_PATTERN, ROUTE_PATTERN } from 'pulsar/internal';

export function matchesRoute(id: string, routesDir: string): boolean {
	const patterns = path.join(routesDir, ROUTE_PATTERN);
	return minimatch(id, patterns);
}

export function matchesLayout(id: string, routesDir: string): boolean {
	const patterns = path.join(routesDir, LAYOUT_PATTERN);
	return minimatch(id, patterns);
}

export function matches(id: string, routesDir: string): boolean {
	return matchesLayout(id, routesDir) || matchesRoute(id, routesDir);
}
