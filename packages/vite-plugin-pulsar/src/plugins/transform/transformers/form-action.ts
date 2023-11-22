import * as parser from '@pulsarjs/parser';
import {
	FormactionAndActionWarning,
	FormactionAndUnsupportedMethodWarning,
	PULSAR_FORM_ACTIONS_METHOD,
	createActionUrl,
	warnToConsole,
} from 'pulsar/internal';
import type { PulsarTransformer } from '../types';
import { getElementProps } from '../utils';
import { getNamedFormActions } from './action-data';

const Queries = {
	FORM_ACTIONS: 'VariableDeclaration:has(Identifier[name=actions])',
};

export const FormAction: PulsarTransformer = {
	validate(_options) {},
	transform({ code, ast, relativeId }) {
		const actions = getNamedFormActions(ast, code);
		const formProps = getElementProps('form', code, ast, [
			'formaction',
			'action',
			'method',
		]);

		// TODO: Handle JSX Spread attributes

		formProps.forEach(({ node, props }) => {
			const formaction = props.formaction?.value;
			const action = props.action?.value;
			const method = props.method?.value;

			if (formaction) {
				validateFormActions({ ast, filePath: relativeId, formaction, actions });

				// Action and form action is not allowed
				if (action) {
					const warning = FormactionAndActionWarning({
						filePath: relativeId,
						formaction,
						action,
					});

					warnToConsole(warning);

					node.openingElement.attributes =
						node.openingElement.attributes.filter(
							// @ts-expect-error slightly different types to Acorn
							(attr) => !isPropNode(attr, 'method')
						);
				}

				if (method) {
					// We only register POST routes for form actions in the runtime, so replace it here
					if (method.toUpperCase() !== PULSAR_FORM_ACTIONS_METHOD) {
						const warning = FormactionAndUnsupportedMethodWarning({
							filePath: relativeId,
							formaction,
							method,
						});
						warnToConsole(warning);

						parser.replace(ast, (node) => {
							if (isPropNode(node, 'method')) {
								// @ts-expect-error slightly different types to Acorn
								node.value = parser.stringLiteral(PULSAR_FORM_ACTIONS_METHOD);
							}
						});
					}
				} else {
					const methodAttribute = parser.jsxAttribute(
						parser.jsxIdentifier('method'),
						parser.stringLiteral(PULSAR_FORM_ACTIONS_METHOD)
					);

					node.openingElement.attributes.push(methodAttribute);
				}

				parser.replace(ast, (node) => {
					if (isPropNode(node, 'formaction')) {
						const actionEndpoint = createActionUrl(relativeId, formaction);
						// @ts-expect-error slightly different types to Acorn
						node.value = parser.stringLiteral(actionEndpoint);
					}
				});
			}
		});

		return ast;
	},
};

function isPropNode(
	node: parser.Node,
	prop: string
): node is parser.JSXAttribute {
	return (
		parser.isJSXAttribute(node) &&
		parser.isJSXIdentifier(node.name) &&
		node.name.name === prop
	);
}

function validateFormActions({
	filePath,
	formaction,
	ast,
	actions,
}: {
	ast: parser.Program;
	formaction: string;
	filePath: string;
	actions: Set<string>;
}) {
	// Ensure consumer only references available actions
	if (actions.size) {
		if (!actions.has(formaction)) {
			const validActions = [...actions.values()]
				.map((a) => `"${a}"`)
				.join(', ');

			throw new Error(
				`A form in ${filePath} references form action "${formaction}" which does not exist in the exported actions exported in ${filePath}. The available actions are: [${validActions}].`
			);
		}
	} else {
		// Check to see if the user forgot to export their actions
		const [nonExportedActions] = parser.match<parser.VariableDeclaration>(
			ast,
			Queries.FORM_ACTIONS
		);

		if (nonExportedActions) {
			throw new Error(
				`You did not export the actions variable but are trying to use the form action "${formaction}".`
			);
		} else {
			throw new Error(
				`No actions were defined in ${filePath} but the form action "${formaction}" was referenced in a form on the page.`
			);
		}
	}
}
