import path from 'node:path';
import * as parser from '@pulsarjs/parser';

export function addLayoutImports(
	ast: parser.Program,
	files: string[],
	filePath: string,
	entry: string
) {
	return files.map((layout, idx) => {
		let importPath;
		let identifier;

		if (layout === entry) {
			identifier = 'Pulsar_Root_Layout';
			importPath = entry;
		} else {
			identifier = `Pulsar_Layout_${idx}`;
			const relative = path.relative(path.dirname(filePath), layout);
			const transformed = relative.startsWith('.') ? relative : `./${relative}`;
			importPath = transformed.replace(path.extname(transformed), '.js');
		}

		const importNode = parser.importDeclaration(
			[parser.importDefaultSpecifier(parser.identifier(identifier))],
			parser.stringLiteral(importPath)
		);

		// @ts-expect-error babel has slightly different types to Acorn
		ast.body.unshift(importNode);

		return { identifier };
	});
}
