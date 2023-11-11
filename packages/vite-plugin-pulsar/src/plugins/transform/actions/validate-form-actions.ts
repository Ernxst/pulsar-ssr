import type {
	ExportNamedDeclaration,
	ObjectExpression,
	Program,
	VariableDeclaration,
} from '@babel/types';
import { match, parse } from '../utils/ast';

// matches const/let actions = {};
const ACTIONS_QUERY = 'VariableDeclaration:has(Identifier[name=actions])';

// This matches export const/let actions = {} and export { actions };
const EXPORTED_ACTIONS_QUERY =
	'ExportNamedDeclaration:has(Identifier[name=actions])';

export function validateFormActions(opts: {
	code: string;
	relativeFilePath: string;
	formaction: string;
	ast: Program;
}) {
	const { code, relativeFilePath, formaction, ast } = opts;
	const [actions] = match<ExportNamedDeclaration>(ast, EXPORTED_ACTIONS_QUERY);
	const hasExportedActions = Boolean(actions);

	// Ensure consumer only references available actions
	if (hasExportedActions) {
		const formActions = getFormActions(code, actions);
		if (!formActions.has(formaction)) {
			const validActions = [...formActions.values()]
				.map((a) => `"${a}"`)
				.join(', ');
			throw new Error(
				`A form in ${relativeFilePath} references form action "${formaction}" which does not exist in the exported actions exported in ${relativeFilePath}. The available actions are: [${validActions}].`
			);
		}
	} else {
		// Check to see if the user forgot to export their actions
		const [nonExportedActions] = match<VariableDeclaration>(ast, ACTIONS_QUERY);
		const hasActions = Boolean(nonExportedActions);

		if (hasActions) {
			throw new Error(
				`You did not export the actions variable but are trying to use the form action "${formaction}".`
			);
		} else {
			throw new Error(
				`No actions were defined in ${relativeFilePath} but the form action "${formaction}" was referenced in a form on the page.`
			);
		}
	}
}
const NAMED_ACTION_QUERY = `ObjectExpression:has(Property > Identifier)`;

function getFormActions(
	code: string,
	node: ExportNamedDeclaration
): Set<string> {
	const ast = parse(code.slice(node.start!, node.end!));
	const [objExpr] = match<ObjectExpression>(ast, NAMED_ACTION_QUERY);
	const props = objExpr.properties.map((node) => (node as any).key.name);

	return new Set(props);
}
