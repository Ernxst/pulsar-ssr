import * as parser from '@pulsarjs/parser';
import type { Adapter } from './types';

export function bun({ port = 5174 }: { port?: number } = {}): Adapter {
	return {
		name: 'pulsar-bun',
		adapterFunction: 'createFetchRequestHandler',
		createServer({ handler }) {
			return parser.exportDefaultDeclaration(
				parser.objectExpression([
					parser.objectProperty(
						parser.stringLiteral('port'),
						parser.numericLiteral(port)
					),
					parser.objectProperty(parser.stringLiteral('fetch'), handler as any),
				])
			) as parser.Node;
		},
	};
}
