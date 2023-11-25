import * as parser from '@pulsarjs/parser';
import type MagicString from 'magic-string';
import { matchesRoute } from 'src/utils/matches';
import type { PulsarTransformer } from '../../types';
import { addImport } from '../layouts/utils/add-layout-imports';
import { removeDefaultExportKeyword } from '../layouts/utils/remove-default-export';

const EXPORTED_PAGE_QUERY = 'ExportDefaultDeclaration';
const IDENTIFIER = '$pulsar';

export const PulsarContext: PulsarTransformer = {
	validate() {},
	transform({ ast, code, string, id, routesDir }) {
		if (matchesRoute(id, routesDir)) {
			const [page] = parser.match<parser.ExportDefaultDeclaration>(
				ast,
				EXPORTED_PAGE_QUERY
			);

			if (page) {
				addContextImports(ast, string);
				removeDefaultExportKeyword(ast, code, string);
				wrapInContext({ ast, string, page });
			}
		}

		return ast;
	},
};

function addContextImports(ast: parser.Program, string: MagicString) {
	const node = parser.importDeclaration(
		[parser.importNamespaceSpecifier(parser.identifier(IDENTIFIER))],
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

function namespaced(value: string) {
	return `${IDENTIFIER}.${value}`;
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
	const lines = [];

	const routeProvider = namespaced('Route.Provider');
	const urlProvider = namespaced('Url.Provider');
	const pageProvider = namespaced('Page.Provider');

	lines.push(`export default function Page_${name}(props) {`);
	lines.push(indent(`return (`, 1));
	lines.push(indent(`<${routeProvider} value={props.context}>`, 2));
	lines.push(indent(`<${urlProvider}>`, 3));
	lines.push(indent(`<${pageProvider} value={props.loaderData}>`, 4));
	lines.push(indent(`<${name}>{props.children}</${name}>`, 5));
	lines.push(indent(`</${pageProvider}>`, 4));
	lines.push(indent(`</${urlProvider}>`, 3));
	lines.push(indent(`</${routeProvider}>`, 2));
	lines.push(indent(`)`, 1));
	lines.push('}');

	const code = lines.join('\n');
	const { body } = parser.parse(code);

	string.append(`\n\n${code}`);
	ast.body.push(...body);
}
