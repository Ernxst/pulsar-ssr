import * as parser from '@pulsarjs/parser';
import type { PulsarTransformer } from '../../types';
import { addLayoutImports } from './utils/add-layout-imports';
import { applyLayouts } from './utils/apply-layouts';
import { getLayoutsForPage } from './utils/get-layouts-for-page';
import { removeDefaultExport } from './utils/remove-default-export';

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
	transform({ ast, entry, routesDir, id, string }) {
		const [page] = parser.match<parser.ExportDefaultDeclaration>(
			ast,
			EXPORTED_PAGE_QUERY
		);
		const layouts = getLayoutsForPage({ absoluteFilePath: id, routesDir });
		layouts.unshift(entry);

		if (layouts.length && page) {
			removeDefaultExport(page, string);

			const [identifier] = parser.match<parser.Identifier>(page, 'Identifier');
			const layoutModules = addLayoutImports(ast, layouts, id, entry, string);
			const wrapped = applyLayouts(identifier.name, layoutModules, string);
			ast.body.push(...wrapped.body);
		}

		return ast;
	},
};
