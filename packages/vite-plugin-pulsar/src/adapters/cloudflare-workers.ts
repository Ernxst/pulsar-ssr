import * as parser from '@pulsarjs/parser';
import type { Adapter } from './types';

export function cloudflare(): Adapter {
	return {
		name: 'pulsar-cloudflare-workers',
		adapterFunction: 'createCloudflareWorker',
		createServer({ handler }) {
			return parser.exportDefaultDeclaration(
				parser.objectExpression([
					parser.objectProperty(parser.stringLiteral('fetch'), handler as any),
				])
			) as parser.Node;
		},
	};
}
