import * as parser from '@pulsarjs/parser';
import { nodeToLocation } from 'src/utils';
import type { PulsarTransformer } from '../types';
import { bindFunctionUsage } from './loader-data';
import { createHookESQuery } from './hooks';

const Queries = {
	USE_ACTION_DATA: createHookESQuery('useActionData'),
	NAMED_ACTIONS: 'ObjectExpression:has(Property > Identifier)',
	// This matches export const/let actions = {} and export { actions };
	EXPORTED_ACTIONS: 'ExportNamedDeclaration:has(Identifier[name=actions])',
};

/**
 * Validate and transform usages of `useActionData`
 */
export const ActionData: PulsarTransformer = {
	validate({ ast, relativeId, logger }) {
		const actions = getNamedFormActions(ast);
		const nodes = parser.match(ast, Queries.USE_ACTION_DATA);

		if (nodes.length) {
			if (actions.size) {
				const unknownActions = nodes
					.flatMap((node) => parser.match<parser.Literal>(node, 'Literal'))
					.filter((literal) => !actions.has(literal.value as string))
					.map((action) => `"${action.value}"`);

				if (unknownActions.length) {
					return logger.error({
						message: `useActionData was called ${unknownActions.length} times with unknown actions: ${unknownActions} in ${relativeId}`,
						loc: nodeToLocation(nodes[0]),
					});
				}
			} else {
				return logger.error({
					message: `You cannot call useActionData without exporting any actions in ${relativeId}`,
					loc: nodeToLocation(nodes[0]),
				});
			}
		}
	},
	transform({ ast, string }) {
		return bindFunctionUsage(ast, Queries.USE_ACTION_DATA, string);
	},
};

export function getNamedFormActions(ast: parser.Program): Set<string> {
	const [node] = parser.match<parser.ExportNamedDeclaration>(
		ast,
		Queries.EXPORTED_ACTIONS
	);

	if (node) {
		const [objExpr] = parser.match<parser.ObjectExpression>(
			node,
			Queries.NAMED_ACTIONS
		);

		// TODO: Support spread properties
		const props = objExpr.properties.map((node) => (node as any).key.name);
		return new Set(props);
	}

	return new Set();
}
