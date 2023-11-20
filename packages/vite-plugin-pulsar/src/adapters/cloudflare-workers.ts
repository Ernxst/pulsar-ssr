import type { Adapter } from './types';

export function cloudflare(): Adapter {
	return {
		name: 'pulsar-cloudflare-workers',
		adapterFunction: 'createCloudflareWorker',
		createServer({ handler }) {
			return `export default {
				fetch: ${handler}
			}`;
		},
	};
}
