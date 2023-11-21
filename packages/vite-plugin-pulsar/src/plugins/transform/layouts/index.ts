import type {
	ExportDefaultDeclaration,
	Identifier,
	Program,
} from '@babel/types';
import type MagicString from 'magic-string';
import { transformWithEsbuild } from 'vite';
import { match, parse } from '../utils/ast';
import {
	addLayoutImports,
	getLayoutsForPage,
	removeDefaultExport,
} from './utils';

export interface Options {
	ast: Program;
	code: string;
	string: MagicString;
	absoluteFilePath: string;
	dev: boolean;
	entry: string,
	routesDir: string;
}

const EXPORTED_PAGE_QUERY = 'ExportDefaultDeclaration';

export async function applyLayoutsToPage({
	ast,
	code,
	string,
	dev,
	entry,
	routesDir,
	absoluteFilePath,
}: Options) {
	const [page] = match<ExportDefaultDeclaration>(ast, EXPORTED_PAGE_QUERY);
	const layouts = getLayoutsForPage({ absoluteFilePath, routesDir });
	layouts.unshift(entry);

	if (layouts.length && page) {
		const start = page.start!;
		const end = page.end!;
		removeDefaultExport(string, code, [start, end]);

		const pageProgram = parse(code.slice(start, end));
		const [identifier] = match<Identifier>(pageProgram, 'Identifier');
		const pageIdentifier = identifier.name;
		const layoutModules = addLayoutImports(string, layouts, absoluteFilePath, entry);

		const wrapped = await wrapPageInParentLayouts(
			absoluteFilePath,
			pageIdentifier,
			layoutModules,
			dev
		);
		string.append(wrapped);
	}

	return string;
}

async function wrapPageInParentLayouts(
	filename: string,
	pageIdentifier: string,
	layoutModules: { identifier: string }[],
	dev: boolean
) {
	const openComponents = layoutModules
		.map(({ identifier }, idx) => {
			/** +3 because there's 3 indents inside the JSX fragment in the return  */
			const indent = '  '.repeat(idx + 3);
			return `${indent}<${identifier}>`;
		})
		.join('\n')
		.trimStart();

	/**
	 * We need to bind it because the return values of useLoaderData and
	 * useActionData will be set on the function. Now that we are exporting a
	 * different function, we make sure the page is bound to the same scope
	 */
	const modifiedPageIdentifier = `Page__${pageIdentifier}_1`;
	const pageIndent = '  '.repeat(layoutModules.length);

	const closedComponents = layoutModules
		.reverse()
		.map(({ identifier }, idx) => {
			/** Plus two because we use one line for the page component */
			const indent = '  '.repeat(layoutModules.length - idx + 2);
			return `${indent}</${identifier}>`;
		})
		.join('\n');

	const code = `
export default function __Pulsar__Page__() {
	const ${modifiedPageIdentifier} = ${pageIdentifier}.bind(this);
  return (
		<>
		${openComponents}
		${pageIndent}<${modifiedPageIdentifier} />
		${closedComponents}
	</>
  )
}`;

	const transformed = await transformWithEsbuild(code, filename, {
		loader: 'jsx',
		jsx: 'automatic',
		jsxImportSource: 'pulsar/jsx',
		jsxDev: dev,
		sourcemap: false,
	});

	/** Remove the imports as these will already exist in the code we are appending to */
	return transformed.code.replaceAll(/^import { Fragment, .* } from .*$/gm, '');
}
