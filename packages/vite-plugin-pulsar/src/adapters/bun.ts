import type { Adapter } from './types';

export function bun({ port }: { port?: number } = { port: 5174 }): Adapter {
	return {
		name: 'pulsar-bun',
		adapterFunction: 'createFetchRequestHandler',
		createServer({ handler }) {
			return `export default {
				port: ${port},
				fetch: ${handler}
			}`;
		},
	};
}
