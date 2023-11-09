import type { Adapter } from './types';

export function cloudflare(): Adapter {
	return {
		name: 'pulsar-cloudflare-workers',
		adapterFunction: 'createFetchRequestHandler',
		createServer({ handler }) {
			return `export default {
				fetch: ${handler}
			}`;
		},
	};
}
