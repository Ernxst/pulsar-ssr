import type MagicString from 'magic-string';
import type { Program } from '@babel/types';
import {
	LoaderWithoutPageWarning,
	UnusedLoaderWarning,
	warnToConsole,
} from 'pulsar/internal';
import { bindFunctionUsage } from './utils/bind-function';
import { match } from './utils/ast';

// TODO: Consolidate validation logic with action validator into a common form

const USE_LOADER_QUERY = `CallExpression:has(Identifier[name=useLoaderData])`;

const EXPORTED_LOADER_QUERY =
	'ExportNamedDeclaration:has(Identifier[name=loader])';

const LOCAL_LOADER_QUERY =
	'VariableDeclaration:has(Identifier[name=loader]):has(ArrowFunctionExpression), FunctionDeclaration:has(Identifier[name=loader])';

const EXPORTED_PAGE_QUERY = 'ExportDefaultDeclaration';

export function transformLoaderData({
	ast,
	code,
	string,
	relativeFilePath,
}: {
	ast: Program;
	code: string;
	string: MagicString;
	relativeFilePath: string;
}) {
	const [loader] = match(ast, EXPORTED_LOADER_QUERY);
	const nodes = match(ast, USE_LOADER_QUERY);

	if (loader) {
		const [page] = match(ast, EXPORTED_PAGE_QUERY);
		if (!page) {
			const warning = LoaderWithoutPageWarning({ filePath: relativeFilePath });
			warnToConsole(warning);
		}
	}

	if (nodes.length) {
		if (!loader) {
			const [nonExportedLoader] = match(ast, LOCAL_LOADER_QUERY);
			if (nonExportedLoader) {
				throw new Error(
					`You are trying to call useLoaderData in ${relativeFilePath} but have not exported the loader function.`
				);
			} else {
				throw new Error(
					`You cannot call useLoaderData without exporting a loader function in ${relativeFilePath}`
				);
			}
		}
	} else if (loader) {
		const warning = UnusedLoaderWarning({ filePath: relativeFilePath });
		warnToConsole(warning);
	}

	return bindFunctionUsage(code, string, 'useLoaderData');
}
