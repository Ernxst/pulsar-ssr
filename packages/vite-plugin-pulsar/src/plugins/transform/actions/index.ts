import type { ExportNamedDeclaration, ObjectExpression } from '@babel/types';
import { match, parse } from '../utils/ast';
import { transformActionData } from './transform-actions-data';
import { transformForm } from './transform-form';
import type { ActionOptions } from './types';

// This matches export const/let actions = {} and export { actions };
const EXPORTED_ACTIONS_QUERY =
	'ExportNamedDeclaration:has(Identifier[name=actions])';

const NAMED_ACTION_QUERY = `ObjectExpression:has(Property > Identifier)`;

/**
 * Perform the necessary build-time transformations to support
 * form actions.
 */
export function transformFormAction(
	opts: Omit<ActionOptions, 'namedFormActions'>
) {
	const { string, code, ast } = opts;
	const [node] = match<ExportNamedDeclaration>(ast, EXPORTED_ACTIONS_QUERY);

	const options: ActionOptions = {
		...opts,
		actions: node
			? {
					node,
					namedActions: getNamedFormActions(code, node),
			  }
			: undefined,
	};

	transformForm(options);
	transformActionData(options);

	return string;
}

function getNamedFormActions(
	code: string,
	node: ExportNamedDeclaration
): Set<string> {
	const ast = parse(code.slice(node.start!, node.end!));
	const [objExpr] = match<ObjectExpression>(ast, NAMED_ACTION_QUERY);
	const props = objExpr.properties.map((node) => (node as any).key.name);

	return new Set(props);
}
