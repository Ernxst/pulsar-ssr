import path from 'node:path';
import { fileToPathname } from 'src/internal/utils/slug';
import glob from 'tiny-glob';
import { PATTERN } from './matches';

export async function getRoutes(routesDir: string) {
	const patterns = path.join(routesDir, PATTERN);
	return await glob(patterns, { absolute: true });
}

export async function getRoutesMap(
	routesDir: string
): Promise<Record<string, string>> {
	const routeFiles = await getRoutes(routesDir);
	const map: any = {};

	for (const file of routeFiles) {
		map[file] = fileToPathname(file);
	}

	return map;
}
