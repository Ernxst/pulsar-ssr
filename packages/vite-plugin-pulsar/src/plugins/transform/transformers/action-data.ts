import * as parser from '@pulsarjs/parser';
import type { PulsarTransformer } from '../types';
import { bindFunctionUsage } from './loader-data';

const Queries = {
	USE_ACTION_DATA: `CallExpression:has(Identifier[name=useActionData])`,
	NAMED_ACTIONS: 'ObjectExpression:has(Property > Identifier)',
	// This matches export const/let actions = {} and export { actions };
	EXPORTED_ACTIONS: 'ExportNamedDeclaration:has(Identifier[name=actions])',
};

/**
 * Validate and transform usages of `useActionData`
 */
export const ActionData: PulsarTransformer = {
	validate({ ast, code, relativeId }) {
		const actions = getNamedFormActions(ast, code);
		const nodes = parser.match(ast, Queries.USE_ACTION_DATA);

		if (nodes.length) {
			if (actions.size) {
				const unknownActions = nodes
					.flatMap((node) => {
						const subAst = parser.parse(code.slice(node.start, node.end));
						return parser.match<parser.Literal>(subAst, 'Literal');
					})
					.filter((literal) => !actions.has(literal.value as string))
					.map((action) => `"${action.value}"`);

				if (unknownActions.length) {
					throw new Error(
						`useActionData was called ${unknownActions.length} times with unknown actions: ${unknownActions} in ${relativeId}`
					);
				}
			} else {
				throw new Error(
					`You cannot call useActionData without exporting any actions in ${relativeId}`
				);
			}
		}
	},
	transform({ ast, string }) {
		return bindFunctionUsage(ast, Queries.USE_ACTION_DATA, string);
	},
};

export function getNamedFormActions(
	ast: parser.Program,
	code: string
): Set<string> {
	const [actionsNode] = parser.match<parser.ExportNamedDeclaration>(
		ast,
		Queries.EXPORTED_ACTIONS
	);
	if (actionsNode) {
		const subNode = parser.parse(
			code.slice(actionsNode.start, actionsNode.end)
		);
		const [objExpr] = parser.match<parser.ObjectExpression>(
			subNode,
			Queries.NAMED_ACTIONS
		);

		// TODO: Support spread properties
		const props = objExpr.properties.map((node) => (node as any).key.name);
		return new Set(props);
	}

	return new Set();
}
