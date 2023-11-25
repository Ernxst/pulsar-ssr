import * as parser from '@pulsarjs/parser';
import type MagicString from 'magic-string';
import { matchesRoute } from 'src/utils/matches';
import type { PulsarTransformer } from '../../types';
import { addImport } from '../layouts/utils/add-layout-imports';
import { removeDefaultExportKeyword } from '../layouts/utils/remove-default-export';

const EXPORTED_PAGE_QUERY = 'ExportDefaultDeclaration';

export const PulsarContext: PulsarTransformer = {
	validate() { },
	transform({ ast, code, string, id, routesDir }) {
		const isPage = matchesRoute(id, routesDir)
		const [page] = parser.match<parser.ExportDefaultDeclaration>(
			ast,
			EXPORTED_PAGE_QUERY
		);

		if (page && isPage) {
			addContextImports(ast, string);
			removeDefaultExportKeyword(ast, code, string);
			wrapInContext({ ast, string, page });
		}

		return ast;
	},
};

function addContextImports(ast: parser.Program, string: MagicString) {
	const node = parser.importDeclaration(
		[
			parser.importSpecifier(
				parser.identifier('Page'),
				parser.identifier('Page')
			),
			parser.importSpecifier(
				parser.identifier('Route'),
				parser.identifier('Route')
			),
			parser.importSpecifier(
				parser.identifier('Url'),
				parser.identifier('Url')
			),
		],
		parser.stringLiteral('pulsar/internal')
	);

	addImport(ast, node as parser.Node, string);
}

function indent(text: string, tabs: number) {
	const spaceString = '  '.repeat(tabs);
	return text
		.split('\n')
		.map((line) => spaceString + line)
		.join('\n');
}

function wrapInContext({
	ast,
	string,
	page,
}: {
	ast: parser.Program;
	string: MagicString;
	page: parser.ExportDefaultDeclaration;
}) {
	const [{ name }] = parser.match<parser.Identifier>(page, 'Identifier');
	const raw = [];
	const componentJsx = `<${name}>{children}</${name}>`;

	raw.push(
		`export default function Page_${name}({ children, context, loaderData }) {`
	);
	raw.push(indent(`console.log({ context, loaderData })`, 1));
	raw.push(indent(`return (`, 1));
	raw.push(indent('<Route.Provider value={context}>', 2));
	raw.push(indent('<Url.Provider>', 3));
	raw.push(indent('<Page.Provider value={loaderData}>', 4));
	raw.push(indent(componentJsx, 5));
	raw.push(indent('</Page.Provider>', 4));
	raw.push(indent('</Url.Provider>', 3));
	raw.push(indent('</Route.Provider>', 2));
	raw.push(indent(')', 1));
	raw.push('}');

	const code = raw.join('\n');

	string.append(`\n\n${code}`);
	const { body } = parser.parse(code);
	ast.body.push(...body);
}
