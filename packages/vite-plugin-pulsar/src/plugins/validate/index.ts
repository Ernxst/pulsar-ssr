import type { Program } from '@babel/types';
import { match } from '../transform/utils/ast';

const EXPORTED_PAGE_QUERY = 'ExportDefaultDeclaration';
const EXPORTED_GET_HANDLER_QUERY =
	'ExportNamedDeclaration:has(Identifier[name=GET])';

export function validateModule({
	ast,
	relativeFilePath,
}: {
	ast: Program;
	relativeFilePath: string;
}) {
	const [page] = match(ast, EXPORTED_PAGE_QUERY);
	const [get] = match(ast, EXPORTED_GET_HANDLER_QUERY);

	if (page && get) {
		throw new Error(
			`Cannot have a page and a GET handler in the same file (${relativeFilePath})`
		);
	}
}
