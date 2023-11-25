import * as parser from '@pulsarjs/parser';
import type { Adapter } from './types';

export function bun({ port = 4173 }: { port?: number } = {}): Adapter {
	return {
		name: 'pulsar-bun',
		package: '@pulsarjs/bun',
		type: 'node',
		createServer({ handler }) {
			return [
				parser.exportDefaultDeclaration(
					parser.objectExpression([
						parser.objectProperty(
							parser.identifier('port'),
							parser.numericLiteral(port)
						),
						parser.objectProperty(parser.identifier('fetch'), handler as any),
					])
				),
			] as parser.Node[];
		},
	};
}
