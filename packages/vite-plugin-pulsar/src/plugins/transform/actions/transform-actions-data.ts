import type { StringLiteral } from '@babel/types';
import { match, parse } from '../utils/ast';
import { bindFunctionUsage } from '../utils/bind-function';
import type { ActionOptions } from './types';

const USE_ACTION_QUERY = `CallExpression:has(Identifier[name=useActionData])`;

/**
 * Validate and transform usages of `useActionData`
 */
export function transformActionData({
	code,
	string,
	ast,
	relativeFilePath,
	actions,
}: ActionOptions) {
	const nodes = match(ast, USE_ACTION_QUERY);
	if (nodes.length) {
		if (actions) {
			const unknownActions = nodes
				.flatMap((node) => {
					const subAst = parse(code.slice(node.start!, node.end!));
					return match<StringLiteral>(subAst, 'Literal')
				})
				.filter((literal) => !actions.namedActions.has(literal.value))
				.map((action) => `"${action.value}"`)

			if (unknownActions.length) {
				throw new Error(
					`useActionData was called ${unknownActions.length} times with unknown actions: ${unknownActions} in ${relativeFilePath}`
				);
			}
		} else {
			throw new Error(
				`You cannot call useActionData without exporting any actions in ${relativeFilePath}`
			);
		}
	}

	return bindFunctionUsage(code, string, 'useActionData');
}
