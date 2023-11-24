import * as parser from '@pulsarjs/parser';
import { LoaderWithoutPageWarning, UnusedLoaderWarning } from 'pulsar/internal';
import { nodeToLocation } from 'src/utils';
import type { PulsarTransformer } from '../types';
import { createHookESQuery } from '../utils';

const Queries = {
	USE_LOADER_DATA: createHookESQuery('useLoaderData'),
	LOADER_FUNCTION: `ExportNamedDeclaration:has(Identifier[name=loader])`,
	LOCAL_LOADER:
		'VariableDeclaration:has(Identifier[name=loader]):has(ArrowFunctionExpression), FunctionDeclaration:has(Identifier[name=loader])',
	PAGE: 'ExportDefaultDeclaration',
};

export const LoaderData: PulsarTransformer = {
	validate({ ast, relativeId, logger }) {
		const [loader] = parser.match(ast, Queries.LOADER_FUNCTION);
		const nodes = parser.match(ast, Queries.USE_LOADER_DATA);

		if (loader) {
			const [page] = parser.match(ast, Queries.PAGE);
			if (!page) {
				const warning = LoaderWithoutPageWarning({
					filePath: relativeId,
					loc: nodeToLocation(loader),
				});

				logger.warn(warning);
			}
		}

		if (nodes.length) {
			if (!loader) {
				const [nonExportedLoader] = parser.match(ast, Queries.LOCAL_LOADER);
				if (nonExportedLoader) {
					return logger.error({
						message: `You are trying to call useLoaderData in ${relativeId} but have not exported the loader function.`,
						loc: nodeToLocation(nodes[0]),
					});
				} else {
					return logger.error({
						message: `You cannot call useLoaderData without exporting a loader function in ${relativeId}`,
						loc: nodeToLocation(nodes[0]),
					});
				}
			}
		} else if (loader) {
			const warning = UnusedLoaderWarning({
				filePath: relativeId,
				loc: nodeToLocation(loader),
			});

			return logger.warn(warning);
		}
	},
	transform({ ast }) {
		return ast;
	},
};
