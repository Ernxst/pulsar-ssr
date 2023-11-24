import * as parser from '@pulsarjs/parser';
import type MagicString from 'magic-string';
import { matchesRoute } from 'src/utils/matches';
import type { PulsarTransformer } from '../../types';
import { addImport } from '../layouts/utils/add-layout-imports';
import { removeDefaultExportKeyword } from '../layouts/utils/remove-default-export';

const EXPORTED_PAGE_QUERY = 'ExportDefaultDeclaration';

export const PulsarContext: PulsarTransformer = {
	validate() {},
	transform({ ast, code, string, id, entry, routesDir }) {
		const [page] = parser.match<parser.ExportDefaultDeclaration>(
			ast,
			EXPORTED_PAGE_QUERY
		);

		if (page) {
			addContextImports(ast, string);
			removeDefaultExportKeyword(ast, code, string);
			wrapInContext({
				ast,
				string,
				page,
				type:
					id === entry
						? 'ROOT'
						: matchesRoute(id, routesDir)
						? 'PAGE'
						: 'LAYOUT',
			});
		}

		return ast;
	},
};

function addContextImports(ast: parser.Program, string: MagicString) {
	const node = parser.importDeclaration(
		[
			parser.importSpecifier(
				parser.identifier('PageContext'),
				parser.identifier('PageContext')
			),
			parser.importSpecifier(
				parser.identifier('RootContext'),
				parser.identifier('RootContext')
			),
			parser.importSpecifier(
				parser.identifier('RouterContext'),
				parser.identifier('RouterContext')
			),
			parser.importSpecifier(
				parser.identifier('useRouterContext'),
				parser.identifier('useRouterContext')
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
	type,
}: {
	ast: parser.Program;
	string: MagicString;
	page: parser.ExportDefaultDeclaration;
	type: 'ROOT' | 'PAGE' | 'LAYOUT';
}) {
	const [{ name }] = parser.match<parser.Identifier>(page, 'Identifier');
	const raw = [];
	const componentJsx = `<RootContext>
	<PageContext loaderData={loaderData}>
		<${name}>
			{children}
		</${name}>
	</PageContext>
</RootContext>`;

	raw.push(
		`export default function Pulsar${name}({ context, loaderData, children }) {`
	);
	raw.push(indent(`context = context ?? useRouterContext()`, 1));
	raw.push(indent(`return (`, 1));

	if (type === 'ROOT') {
		raw.push(indent(componentJsx, 2));
	} else {
		raw.push(indent('<RouterContext.Provider value={context}>', 2));
		raw.push(indent(componentJsx, 3));
		raw.push(indent('</RouterContext.Provider>', 2));
	}

	raw.push(indent(')', 1));
	raw.push('}');

	const code = raw.join('\n');

	string.append(`\n\n${code}`);
	const wrapped = parser.parse(code);
	ast.body.push(...wrapped.body);
}
