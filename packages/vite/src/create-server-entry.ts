import { Project, VariableDeclarationKind } from 'ts-morph';
import { formatCode } from './utils/format-code';

export function createServerEntry({ routes }: { routes: string[] }) {
	const project = new Project({ skipAddingFilesFromTsConfig: true });
	const ast = project.createSourceFile('temp.ts', '');
	ast.addImportDeclaration({
		defaultImport: 'Elysia',
		moduleSpecifier: 'elysia',
	});

	ast.addImportDeclaration({
		namedImports: ['html'],
		// TODO: Pulsar should probably bundle this?
		moduleSpecifier: '@elysiajs/html',
	});

	const identifier = 'server';
	ast.addVariableStatement({
		declarationKind: VariableDeclarationKind.Const,
		declarations: [
			// Disable aot so it works on Cloudflare workers
			{ name: identifier, initializer: `new Elysia({ aot: false })` },
		],
	});

	ast.addStatements([`${identifier}.use(html())`]);

	routes.forEach((file, idx) => {
		const importName = `routes_${idx}`;

		ast.addImportDeclaration({
			defaultImport: importName,
			moduleSpecifier: file,
		});

		ast.addStatements([`${identifier}.use(${importName})`]);
	});

	ast.addExportAssignment({ expression: identifier, isExportEquals: false });
	return formatCode(ast);
}
