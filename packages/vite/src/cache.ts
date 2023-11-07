import path from 'node:path';
import { minimatch } from 'minimatch';
import type { TransformResult } from 'vite';
import type { TransformedPage } from './transform-page/transform-page';
import { transformPage } from './transform-page/transform-page';

const extensions = ['ts', 'js', 'tsx', 'jsx'];
const types = ['page', 'server'];
const PATTERNS = extensions.flatMap((ext) =>
	types.map((t) => `**/*.${t}.${ext}`)
);

function isMatch(id: string, patterns: string[]) {
	return patterns.some((pattern) => minimatch(id, pattern));
}

export function useCache({ routes }: { routes: string }) {
	const cache = new Map<string, TransformedPage>();
	const patterns = PATTERNS.map((pattern) => path.join(routes, pattern));

	return {
		get cache() {
			return cache;
		},
		get globPatterns() {
			return patterns;
		},
		createEntry({
			id,
			code,
			ssr,
		}: {
			id: string;
			code: string;
			ssr?: boolean;
		}): TransformResult | undefined {
			if (ssr) return;
			if (!isMatch(id, patterns)) return;

			if (!cache.has(id)) {
				const page = transformPage(id, code);
				cache.set(id, page);
			}
		},
	};
}
