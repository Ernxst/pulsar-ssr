import { match, replace } from '@phenomnomnominal/tsquery';
import { minimatch } from 'minimatch';
import { HTTP_METHODS, Identifiers } from 'src/constants';
import { formatCode } from 'src/utils/format-code';
import { removeByQueries } from 'src/utils/remove-by-queries';
import { Project } from 'ts-morph';
import type ts from 'typescript';
import { removeExports } from 'src/utils/remove-exports';
import { METHOD_QUERY } from './transform-routes';
import { LOADER_QUERY } from './transform-server-code';

export const PAGE_QUERY = `ExportAssignment, FunctionDeclaration:has(ExportKeyword):has(DefaultKeyword)`;

/**
 * Extracts the pre-renderable template and converts usages of
 * `useLoaderData` into a function parameter of the component
 * 
 * NOTE: **The HTTP and loader methods are stripped unconditionally from shared code.
 * If the consumer calls one of the HTTP methods or loader directly, this
 * produces an invalid bundle**
 */
export function transformSharedCode(
	filename: string,
	sourceFile: ts.Node
): string | null {
	if (hasPage(filename, sourceFile)) {
		let code = sourceFile.getFullText();
		code = removeByQueries(code, [LOADER_QUERY, METHOD_QUERY]);
		code = removeExports(code, ['loader', ...HTTP_METHODS]);
		code = replace(
			code,
			`AwaitExpression:has(CallExpression > Identifier[name=useLoaderData])`,
			() => Identifiers.PAGE_LOADER_DATA
		);
		code = replace(
			code,
			`CallExpression:has(Identifier[name=useLoaderData])`,
			() => Identifiers.PAGE_LOADER_DATA
		);

		const project = new Project({ skipAddingFilesFromTsConfig: true });
		const ast = project.createSourceFile('temp.ts', code);
		const functions = ast.getFunctions();
		const component = functions.find((node) => node.isDefaultExport())!;
		component.addParameter({ name: Identifiers.PAGE_LOADER_DATA });

		return formatCode(ast);
	}

	console.debug(`No page found in ${filename}`);
	return null;
}

function hasPage(filename: string, sourceFile: ts.Node) {
	const [pageFunction] = match(sourceFile, PAGE_QUERY);

	// Just for best practices
	if (minimatch(filename, '*.page.*')) {
		// TODO: Do the same for .server with no API routes (in transform-server-code)
		console.warn(
			`No page was found in ${filename}, yet it is suffixed with page.ts, it is recommended you use .page.ts for pages.`
		);
	}

	// TODO: Validate export default Page is a function
	return Boolean(pageFunction);
}
