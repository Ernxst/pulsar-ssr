import type { VariableDeclaration } from '@babel/types';
import { match } from '../utils/ast';
import type { ActionOptions } from './types';

// matches const/let actions = {};
const ACTIONS_QUERY = 'VariableDeclaration:has(Identifier[name=actions])';

export function validateFormActions(
	opts: Omit<ActionOptions, 'string' | 'code'> & {
		formaction: string;
	}
) {
	const { relativeFilePath, formaction, ast, actions } = opts;

	// Ensure consumer only references available actions
	if (actions) {
		if (!actions.namedActions.has(formaction)) {
			const validActions = [...actions.namedActions.values()]
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
