import * as parser from '@pulsarjs/parser';
import type { Adapter } from 'src/adapters/types';
import { ManifestIdentifiers } from './create-server-manifest';

interface Options {
	adapter: Adapter;
}

export const MANIFEST_ID = 'virtual:pulsar_manifest';

export function createServerEntry({ adapter }: Options): string {
	const adapterIdentifier = parser.identifier('createRequestHandler');
	const importNode = parser.importDeclaration(
		[parser.importSpecifier(adapterIdentifier, adapterIdentifier)],
		parser.stringLiteral(adapter.package)
	);

	const buildId = parser.identifier(ManifestIdentifiers.BUILD);
	const buildImport = parser.importDeclaration(
		[parser.importDefaultSpecifier(buildId)],
		parser.stringLiteral(MANIFEST_ID)
	);

	const callExpr = parser.callExpression(adapterIdentifier, [
		parser.objectExpression([
			parser.objectProperty(parser.identifier('build'), buildId),
		]),
	]) as parser.CallExpression;

	const serverNodes = adapter.createServer({ handler: callExpr });

	const ast = parser.parse('');
	// @ts-expect-error it's fine
	ast.body.push(importNode, buildImport, ...serverNodes);

	return parser.generate(ast);
}
