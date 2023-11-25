import { transformPathToUrl } from 'pulsar/internal';
import type { Adapter } from 'src/adapters/types';
import * as parser from '@pulsarjs/parser';

interface Options {
	adapter: Adapter;
	routes: { input: string; relative: string }[];
}

export function createServerEntry({ routes, adapter }: Options): string {
	const routeIds = routes.map(({ input, relative }, idx) => ({
		importUrl: input,
		pathname: relative,
		identifier: `routes_${idx}`,
		endpoint: transformPathToUrl(relative),
	}));

	const adapterIdentifier = parser.identifier(adapter.adapterFunction);
	const importNode = parser.importDeclaration(
		[parser.importSpecifier(adapterIdentifier, adapterIdentifier)],
		parser.stringLiteral('@pulsarjs/runtime/adapters')
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
					parser.identifier('routes'),
					parser.objectExpression(
						routeIds.map(({ pathname, identifier, endpoint }) => {
							const keyNode = parser.stringLiteral(pathname);
							const valueNode = parser.objectExpression([
								parser.objectProperty(
									parser.stringLiteral('endpoint'),
									parser.stringLiteral(endpoint)
								),
								parser.objectProperty(
									parser.stringLiteral('loadModule'),
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
			parser.objectProperty(parser.stringLiteral('build'), buildIdentifier),
		]),
	]) as parser.CallExpression;

	const serverNode = adapter.createServer({ handler: callExpr });

	const ast = parser.parse('');
	// @ts-expect-error it's fine
	ast.body.push(importNode, ...routeImports, buildNode, serverNode);

	return parser.generate(ast);
}
