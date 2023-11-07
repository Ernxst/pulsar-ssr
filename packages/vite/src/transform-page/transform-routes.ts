import { match } from '@phenomnomnominal/tsquery';
import type { HttpMethod } from 'src/constants';
import { HTTP_METHODS, Identifiers } from 'src/constants';
import { formatCode } from 'src/utils/format-code';
import { removeByQueries } from 'src/utils/remove-by-queries';
import { fileToPathname } from 'src/utils/slug';
import type { FunctionDeclaration, SourceFile } from 'ts-morph';
import { Project, VariableDeclarationKind, Writers } from 'ts-morph';
import type ts from 'typescript';
import { PAGE_QUERY } from './transform-shared-code';

// TODO: Don't allow a GET route in the same file as a page

interface RegisterRouteOptions {
	pathname: string;
	sourceFile: FunctionDeclaration;
}

interface CreateRoutesFunctionOptions {
	pathname: string;
	methods: { httpMethod: HttpMethod; handler: string }[];
	sourceFile: SourceFile;
}

export const METHOD_QUERY = HTTP_METHODS.flatMap((method) => {
	return [
		`VariableStatement:has(ExportKeyword) VariableDeclaration:has(Identifier[name=${method}])`,
		`FunctionDeclaration:has(ExportKeyword):has(Identifier[name=${method}])`,
	];
}).join(',');

const METHOD_IDENTIFIERS_QUERY = HTTP_METHODS.flatMap((method) => {
	return [
		`VariableStatement:has(ExportKeyword) VariableDeclaration > Identifier[name=${method}]`,
		`FunctionDeclaration:has(ExportKeyword) > Identifier[name=${method}]`,
	];
}).join(',');

/**
 * Registers all route handlers with the underlying router and exports a setup
 * function to be used in the server entry to register these routes with the
 * rest of the app
 */
export function transformRouteHandlers(filename: string, sourceFile: ts.Node) {
	const methods = match(sourceFile, METHOD_IDENTIFIERS_QUERY).map((node) =>
		node.getFullText().trim()
	) as HttpMethod[];

	if (methods.length > 0) {
		const project = new Project({ skipAddingFilesFromTsConfig: true });
		const code = removeByQueries(sourceFile.getText(), [PAGE_QUERY]);
		const ast = project.createSourceFile('temp.ts', code);

		ast.addImportDeclaration({
			namedImports: ['createRouteContext'],
			moduleSpecifier: 'pulsar/internal',
		});

		createRoutesFunction({
			pathname: fileToPathname(filename),
			sourceFile: ast,
			methods: methods.map((m) => ({ handler: m, httpMethod: m })),
		});

		const transformed = formatCode(ast);
		// console.log(transformed);
		return transformed;
	}

	console.debug(`No routes found in ${filename}`);
	return null;
}

function createRoutesFunction({
	pathname,
	methods,
	sourceFile,
}: CreateRoutesFunctionOptions) {
	const fn = sourceFile.addFunction({
		name: Identifiers.ROUTES_FUNCTION,
		isDefaultExport: true,
	});

	fn.addParameter({ name: Identifiers.ROUTES_FUNCTION_PARAM });
	methods.forEach(({ httpMethod, handler }) =>
		registerRoute(handler, httpMethod, {
			pathname,
			sourceFile: fn,
		})
	);

	fn.addStatements(Writers.returnStatement(Identifiers.ROUTES_FUNCTION_PARAM));
}

function registerRoute(
	handler: string,
	httpMethod: HttpMethod,
	options: RegisterRouteOptions
) {
	const handle = createRouteHandler(handler);
	options.sourceFile.addStatements([
		`${Identifiers.ROUTES_FUNCTION_PARAM}.${httpMethod.toLowerCase()}('${
			options.pathname
		}', ${handle});`,
	]);
}

function createRouteHandler(method: string) {
	const project = new Project({ skipAddingFilesFromTsConfig: true });
	const ast = project.createSourceFile('handler.ts', '');

	const contextParamName = 'elysia';
	const fn = ast.addFunction({
		name: 'handle',
		isAsync: true,
		parameters: [{ name: contextParamName }],
	});

	const identifier = 'context';
	fn.addVariableStatement({
		declarationKind: VariableDeclarationKind.Const,
		declarations: [
			{
				name: identifier,
				initializer: `createRouteContext(${contextParamName})`,
			},
		],
	});

	fn.addStatements(Writers.returnStatement(`await ${method}(${identifier})`));

	return fn.getText();
}
