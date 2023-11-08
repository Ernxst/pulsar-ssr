import type { Runtime } from 'src';

// https://github.com/honojs/hono/blob/88e89a46a82bdeda091f229bedb7ee8761a5e3e7/src/helper/adapter/index.ts#L42C1-L55C2
export function getRuntime(): Runtime {
	const global = globalThis as any;

	if (global?.Deno !== undefined) return 'deno';
	if (global?.Bun !== undefined) return 'bun';
	if (typeof global?.WebSocketPair === 'function') return 'workerd';
	if (typeof global?.EdgeRuntime === 'string') return 'edge-light';
	if (global?.fastly !== undefined) return 'fastly';
	if (global?.__lagon__ !== undefined) return 'lagon';
	if (global?.process?.release?.name === 'node') return 'node';

	return 'other';
}
