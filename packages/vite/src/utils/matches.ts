import path from 'node:path';
import { minimatch } from 'minimatch';

export const PATTERN = '**/*.{page,server}.{ts,js,tsx,jsx}';

export function matches(id: string, routesDir: string): boolean {
	const patterns = path.join(routesDir, PATTERN);
	return minimatch(id, patterns);
}
