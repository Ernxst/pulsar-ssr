import * as parser from '@pulsarjs/parser';
import type MagicString from 'magic-string';

export function removeDefaultExport(
	node: parser.ExportDefaultDeclaration,
	string: MagicString
) {
	(node as unknown as parser.ExportNamedDeclaration).type =
		'ExportNamedDeclaration';

	string.overwrite(node.start, node.end, parser.generate(node));
}
