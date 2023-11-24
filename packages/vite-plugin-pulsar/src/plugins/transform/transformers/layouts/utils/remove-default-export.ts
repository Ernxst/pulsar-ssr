import * as parser from '@pulsarjs/parser';
import type MagicString from 'magic-string';

const target = 'export default';

export function removeDefaultExportKeyword(
	ast: parser.Program,
	code: string,
	string: MagicString
) {
	parser.replace(ast, (node) => {
		if (parser.isExportDefaultDeclaration(node)) {
			const index = code.indexOf('export default');
			string.overwrite(index, index + target.length, 'export');

			(node as unknown as parser.ExportNamedDeclaration).type =
				'ExportNamedDeclaration';
		}
	});
}
