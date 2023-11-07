import { ast, match, replace } from '@phenomnomnominal/tsquery';
import type ts from 'typescript';
import { removeByQueries } from './remove-by-queries';

/**
 * Removes the exports from the code, as well as any imports, function or
 * variable declaration the exports used (that are not also used by
 * other parts of the code)
 */
export function removeExports(code: string, exportsToRemove: string[]): string {
	const queries = exportsToRemove.flatMap((name) => [
		`VariableStatement:has(ExportKeyword):has(Identifier[name=${name}])`,
		`FunctionDeclaration:has(ExportKeyword):has(Identifier[name=${name}])`,
		`ExportDeclaration:has(Identifier[name=${name}])`,
	]);

	code = removeByQueries(code, queries);
	return cleanupCode(code);
}

function cleanupCode(code: string) {
	const TRANSFORMATIONS = [
		removeUnusedDeclarations,
		removeUnusedFunctions,
		removeUnusedImports,
		// Remove unused declarations again
		removeUnusedDeclarations,
		(input: string) => input.replaceAll('{ }', '{}'),
		(input: string) => input.trim(),
	];

	for (const transform of TRANSFORMATIONS) {
		code = transform(code);
	}

	return code;
}

/**
 * Helper to remove unused nodes from the source code
 */
function removeUnused(
	code: string,
	identifierQuery: string,
	callback: (
		identifier: string,
		node: ts.Node,
		sourceFile: ts.SourceFile
	) => string | undefined
) {
	const sourceFile = ast(code);
	const queries = new Set<string>();

	const imports = match(sourceFile, identifierQuery);
	imports.forEach((node) => {
		const identifier = node.getText();
		const query = callback(identifier, node, sourceFile);
		if (query) queries.add(query);
	});

	for (const query of queries) {
		code = replace(code, query, () => '');
	}

	return code;
}

function removeUnusedImports(code: string) {
	return removeUnused(
		code,
		'ImportDeclaration Identifier, ImportDeclaration ImportClause Identifier, ImportDeclaration NamespaceImport Identifier',
		(identifier, _node, sourceFile) => {
			const usages = match(
				sourceFile,
				// Match any usages of the import that is not the import declaration itself
				`Identifier[name=${identifier}]:not(ImportDeclaration *)`
			);

			if (usages.length === 0) {
				return `ImportDeclaration:has(Identifier[name=${identifier}])`;
			}
		}
	);
}

function removeUnusedDeclarations(code: string) {
	return removeUnused(
		code,
		'VariableDeclaration Identifier',
		(identifier, _node, sourceFile) => {
			const queries = [
				// Match exports that use the variable
				`VariableStatement:has(ExportKeyword):has(Identifier[name=${identifier}])`,
				// Match any non-exported usage of the variable
				`Identifier[name=${identifier}]:not(VariableDeclaration > Identifier[name=${identifier}])`,
			].join(',');

			const usages = match(sourceFile, queries);

			if (usages.length === 0) {
				return `VariableStatement:has(Identifier[name=${identifier}])`;
			}
		}
	);
}

function removeUnusedFunctions(code: string) {
	return removeUnused(
		code,
		'FunctionDeclaration Identifier',
		(identifier, _node, sourceFile) => {
			const queries = [
				// Match exports that use the function
				`FunctionDeclaration:has(ExportKeyword):has(Identifier[name=${identifier}])`,
				// Match any non-exported usage of the function
				`Identifier[name=${identifier}]:not(FunctionDeclaration > Identifier[name=${identifier}])`,
			].join(',');

			const usages = match(sourceFile, queries);

			if (usages.length === 0) {
				return `FunctionDeclaration:has(Identifier[name=${identifier}])`;
			}
		}
	);
}
