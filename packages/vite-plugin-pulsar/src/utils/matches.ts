import path from 'node:path';
import { minimatch } from 'minimatch';
import { ROUTE_PATTERN } from 'pulsar/internal';

export function matches(id: string, routesDir: string): boolean {
	const patterns = path.join(routesDir, ROUTE_PATTERN);
	return minimatch(id, patterns);
}
