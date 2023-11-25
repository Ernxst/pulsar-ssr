import * as parser from '@pulsarjs/parser';
import type { Adapter } from './types';

export function cloudflare(): Adapter {
	return {
		name: 'pulsar-cloudflare-workers',
		package: '@pulsarjs/cloudflare-workers',
		type: 'edge',
		createServer({ handler }) {
			return [
				parser.exportDefaultDeclaration(
					parser.objectExpression([
						parser.objectProperty(parser.identifier('fetch'), handler as any),
					])
				),
			] as parser.Node[];
		},
	};
}
