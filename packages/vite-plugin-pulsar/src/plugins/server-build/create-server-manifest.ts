import * as parser from '@pulsarjs/parser';
import { transformPathToUrl } from '@pulsarjs/runtime';

interface Options {
	routes: { input: string; relative: string }[];
	assetsDir: string;
	assets: string[];
}

export const ManifestIdentifiers = {
	BUILD: 'build',
};

export function createServerManifest({
	routes,
	assetsDir,
	assets,
}: Options): string {
	const routeIds = routes.map(({ input, relative }, idx) => ({
		importUrl: input,
		pathname: relative,
		identifier: `routes_${idx}`,
		endpoint: transformPathToUrl(relative),
	}));

	const routeImports = routeIds.map(({ importUrl, identifier }) =>
		parser.importDeclaration(
			[parser.importNamespaceSpecifier(parser.identifier(identifier))],
			parser.stringLiteral(importUrl)
		)
	);

	const buildNode = parser.objectExpression([
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
							parser.arrowFunctionExpression([], parser.identifier(identifier))
						),
					]);

					return parser.objectProperty(keyNode, valueNode);
				})
			)
		),
	]);

	const exportNode = parser.exportDefaultDeclaration(buildNode);
	const ast = parser.parse('');
	// @ts-expect-error it's fine
	ast.body.push(...routeImports, exportNode);

	return parser.generate(ast);
}
