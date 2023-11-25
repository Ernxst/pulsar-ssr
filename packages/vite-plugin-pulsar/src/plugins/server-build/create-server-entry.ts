import * as parser from '@pulsarjs/parser';
import { transformPathToUrl } from 'pulsar/internal';
import type { Adapter } from 'src/adapters/types';

interface Options {
	adapter: Adapter;
	routes: { input: string; relative: string }[];
	assetsDir: string;
	assets: string[];
}

export function createServerEntry({
	routes,
	adapter,
	assetsDir,
	assets,
}: Options): string {
	const routeIds = routes.map(({ input, relative }, idx) => ({
		importUrl: input,
		pathname: relative,
		identifier: `routes_${idx}`,
		endpoint: transformPathToUrl(relative),
	}));

	const adapterIdentifier = parser.identifier('createRequestHandler');
	const importNode = parser.importDeclaration(
		[parser.importSpecifier(adapterIdentifier, adapterIdentifier)],
		parser.stringLiteral(adapter.package)
	);

	const routeImports = routeIds.map(({ importUrl, identifier }) =>
		parser.importDeclaration(
			[parser.importNamespaceSpecifier(parser.identifier(identifier))],
			parser.stringLiteral(importUrl)
		)
	);

	const buildIdentifier = parser.identifier('build');
	const buildNode = parser.variableDeclaration('const', [
		parser.variableDeclarator(
			buildIdentifier,
			parser.objectExpression([
				parser.objectProperty(
					parser.identifier('assets'),
					parser.objectExpression([
						parser.objectProperty(
							parser.identifier('url'),
							parser.stringLiteral(assetsDir)
						),
						parser.objectProperty(
							parser.identifier('files'),
							parser.arrayExpression(assets.map(parser.stringLiteral))
						),
					])
				),
				parser.objectProperty(
					parser.identifier('routes'),
					parser.objectExpression(
						routeIds.map(({ pathname, identifier, endpoint }) => {
							const keyNode = parser.stringLiteral(pathname);
							const valueNode = parser.objectExpression([
								parser.objectProperty(
									parser.identifier('endpoint'),
									parser.stringLiteral(endpoint)
								),
								parser.objectProperty(
									parser.identifier('loadModule'),
									parser.arrowFunctionExpression(
										[],
										parser.identifier(identifier)
									)
								),
							]);

							return parser.objectProperty(keyNode, valueNode);
						})
					)
				),
			])
		),
	]);

	const callExpr = parser.callExpression(adapterIdentifier, [
		parser.objectExpression([
			parser.objectProperty(parser.identifier('build'), buildIdentifier),
		]),
	]) as parser.CallExpression;

	const serverNodes = adapter.createServer({ handler: callExpr });

	const ast = parser.parse('');
	// @ts-expect-error it's fine
	ast.body.push(importNode, ...routeImports, buildNode, ...serverNodes);

	return parser.generate(ast);
}
