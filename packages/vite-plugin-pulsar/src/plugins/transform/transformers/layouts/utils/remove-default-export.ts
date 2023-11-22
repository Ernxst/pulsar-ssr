import type * as parser from '@pulsarjs/parser';

export function removeDefaultExport(node: parser.ExportDefaultDeclaration) {
	(node as unknown as parser.ExportNamedDeclaration).type =
		'ExportNamedDeclaration';
}
