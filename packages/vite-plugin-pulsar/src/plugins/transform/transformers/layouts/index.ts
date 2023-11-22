import * as parser from '@pulsarjs/parser';
import { addLayoutImports } from './utils/add-layout-imports';
import { applyLayouts } from './utils/apply-layouts';
import { getLayoutsForPage } from './utils/get-layouts-for-page';
import { removeDefaultExport } from './utils/remove-default-export';
import { PulsarTransformer } from '../../types';

export interface Options {
	ast: parser.Program;
	code: string;
	absoluteFilePath: string;
	entry: string;
	routesDir: string;
}

const EXPORTED_PAGE_QUERY = 'ExportDefaultDeclaration';

export const PulsarLayouts: PulsarTransformer = {
	validate(_options) {},
	transform({ ast, code, entry, routesDir, id }) {
		const [page] = parser.match<parser.ExportDefaultDeclaration>(
			ast,
			EXPORTED_PAGE_QUERY
		);
		const layouts = getLayoutsForPage({ absoluteFilePath: id, routesDir });
		layouts.unshift(entry);

		if (layouts.length && page) {
			removeDefaultExport(page);

			const pageProgram = parser.parse(code.slice(page.start, page.end));
			const [identifier] = parser.match<parser.Identifier>(
				pageProgram,
				'Identifier'
			);
			const pageIdentifier = identifier.name;
			const layoutModules = addLayoutImports(ast, layouts, id, entry);

			const wrapped = applyLayouts(pageIdentifier, layoutModules);
			ast.body.push(...wrapped.body);
		}

		return ast;
	},
};
