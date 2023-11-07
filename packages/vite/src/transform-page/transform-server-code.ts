import path from 'node:path';
import { ast, includes, match, replace } from '@phenomnomnominal/tsquery';
import { removeByQueries } from 'src/utils/remove-by-queries';
import { getOutputFilename } from 'src/utils/slug';
import { Project, VariableDeclarationKind, Writers } from 'ts-morph';
import type ts from 'typescript';
import { Identifiers } from 'src/constants';
import { METHOD_QUERY, transformRouteHandlers } from './transform-routes';
import { PAGE_QUERY } from './transform-shared-code';

export const LOADER_QUERY = [
	`VariableStatement:has(ExportKeyword):has(Identifier[name=loader])`,
	`FunctionDeclaration:has(ExportKeyword):has(Identifier[name=loader])`,
].join(', ');

export function transformServerCode(filename: string, sourceFile: ts.Node) {
	let code = sourceFile.getFullText();
	// Add a no-op loader function
	if (!hasLoader(filename, sourceFile)) {
		console.debug(`No loader found in ${filename}`);
		code += 'const loader = (loaderContext) => {}';
	}

	code = removeByQueries(code, [PAGE_QUERY]);
	const serverCode = addServerCode(code, filename);
	if (serverCode) {
		return removeNamedExportKeywords(serverCode);
	}

	return null;
}

function removeNamedExportKeywords(code: string) {
	const query = [LOADER_QUERY, METHOD_QUERY].join(", ")

	return replace(code, query, (node) => {
		const source = node.getText();
		if (includes(node, 'DefaultKeyword')) {
			return source;
		}

		return replace(source, 'ExportKeyword', () => '');
	});
}

function hasLoader(filename: string, ast: ts.Node) {
	const [loaderFunction] = match(ast, LOADER_QUERY);
	const usages = match(ast, `CallExpression > Identifier[name=useLoaderData]`);

	if (usages.length === 0 && loaderFunction) {
		console.warn(
			`You've defined a loader in ${filename} but do not use it in your page component - the loader will be stripped from the output`
		);

		return false;
	}

	if (usages.length > 0 && !loaderFunction) {
		throw new Error(
			`You cannot call useLoaderData without defining and exporting a "loader" function in ${filename}`
		);
	}

	return Boolean(loaderFunction);
}

function addServerCode(code: string, file: string) {
	code += `\n${createPageFunction()}`;

	const project = new Project({ skipAddingFilesFromTsConfig: true });
	const sourceFile = project.createSourceFile('temp.ts', code);
	const outputFile = getOutputFilename(file, 'shared');
	const filename = path.basename(outputFile);
	sourceFile.addImportDeclaration({
		defaultImport: 'Page',
		moduleSpecifier: `./${filename}`,
	});

	code = sourceFile.getText();
	return transformRouteHandlers(file, ast(code));
}

/** Create the GET route function that renders the page */
function createPageFunction() {
	const project = new Project({ skipAddingFilesFromTsConfig: true });
	const ast = project.createSourceFile('handler.ts', '');

	const handlerParamName = 'routeContext';
	const fn = ast.addFunction({
		name: 'GET',
		isAsync: true,
		isExported: true,
		parameters: [{ name: handlerParamName }],
	});

	fn.addVariableStatement({
		declarationKind: VariableDeclarationKind.Const,
		declarations: [
			{
				name: Identifiers.PAGE_LOADER_DATA,
				initializer: `await loader(${handlerParamName})`,
			},
		],
	});

	fn.addStatements(
		Writers.returnStatement(`await Page(${Identifiers.PAGE_LOADER_DATA})`)
	);

	return fn.getText();
}
