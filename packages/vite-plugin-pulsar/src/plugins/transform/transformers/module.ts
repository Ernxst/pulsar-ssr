import * as parser from '@pulsarjs/parser';
import type { PulsarTransformer } from '../types';

const Queries = {
	EXPORTED_PAGE: 'ExportDefaultDeclaration',
	GET_HANDLER: 'ExportNamedDeclaration:has(Identifier[name=GET])',
};

export const PulsarModule: PulsarTransformer = {
	validate({ ast, relativeId }) {
		const [page] = parser.match(ast, Queries.EXPORTED_PAGE);
		const [get] = parser.match(ast, Queries.GET_HANDLER);

		if (page && get) {
			throw new Error(
				`Cannot have a page and a GET handler in the same file (${relativeId})`
			);
		}
	},
	transform({ ast }) {
		return ast;
	},
};
