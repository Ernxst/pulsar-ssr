import * as parser from '@pulsarjs/parser';
import {
	FormactionAndActionWarning,
	FormactionAndUnsupportedMethodWarning,
	PULSAR_FORM_ACTIONS_METHOD,
	createActionUrl,
} from 'pulsar/internal';
import type MagicString from 'magic-string';
import { nodeToLocation } from 'src/utils';
import type { Logger, PulsarTransformer } from '../types';
import { getElementProps } from '../utils';
import { getNamedFormActions } from './action-data';

const Queries = {
	FORM_ACTIONS: 'VariableDeclaration:has(Identifier[name=actions])',
};

export const FormAction: PulsarTransformer = {
	validate(_options) {},
	transform({ ast, relativeId, string, logger }) {
		const actions = getNamedFormActions(ast);
		const formProps = getElementProps('form', ast, [
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
				validateFormActions({
					ast,
					filePath: relativeId,
					formaction,
					actions,
					logger,
					node,
				});
				let updateEntireNode = false;

				// Action and form action is not allowed
				if (action) {
					const warning = FormactionAndActionWarning({
						filePath: relativeId,
						formaction,
						action,
						loc: nodeToLocation(props.action!.propNode),
					});

					logger.warn(warning);

					node.openingElement.attributes =
						node.openingElement.attributes.filter(
							// @ts-expect-error slightly different types to Acorn
							(attr) => !isPropNode(attr, 'method')
						);

					updateEntireNode = true;
				}

				if (method) {
					// We only register POST routes for form actions in the runtime, so replace it here
					if (method.toUpperCase() !== PULSAR_FORM_ACTIONS_METHOD) {
						const warning = FormactionAndUnsupportedMethodWarning({
							filePath: relativeId,
							formaction,
							method,
							loc: nodeToLocation(props.method!.propNode),
						});

						logger.warn(warning);

						parser.replace(ast, (node) => {
							if (isPropNode(node, 'method')) {
								updateChildNode(node, PULSAR_FORM_ACTIONS_METHOD, string);
							}
						});
					}
				} else {
					const methodAttribute = parser.jsxAttribute(
						parser.jsxIdentifier('method'),
						parser.stringLiteral(PULSAR_FORM_ACTIONS_METHOD)
					);

					node.openingElement.attributes.push(methodAttribute);
					updateEntireNode = true;
				}

				parser.replace(ast, (node) => {
					if (isPropNode(node, 'formaction')) {
						const actionEndpoint = createActionUrl(relativeId, formaction);
						updateChildNode(node, actionEndpoint, string);
					}
				});

				/**
				 * Updates to the entire node must happen after we've replaced the individual
				 * JSX attributes as magic string wont allow us to do otherwise as we
				 * would have already replaced the string we are trying to update
				 */
				if (updateEntireNode) {
					string.overwrite(node.start, node.end, parser.generate(node));
				}
			}
		});

		return ast;
	},
};

function updateChildNode(
	parent: parser.JSXAttribute,
	value: string,
	string: MagicString
) {
	const { start, end } = parent.value!;

	const valueNode = parser.stringLiteral(value) as unknown as parser.Literal;
	valueNode.start = start;
	valueNode.end = end;

	parent.value = valueNode;
	string.overwrite(start, end, parser.generate(valueNode));
}

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
	logger,
	node,
}: {
	ast: parser.Program;
	formaction: string;
	filePath: string;
	actions: Set<string>;
	logger: Logger;
	node: parser.JSXElement;
}) {
	const [formActionsNode] = parser.match<parser.JSXAttribute>(
		node,
		'JSXAttribute[name.name=formaction]'
	);

	// Ensure consumer only references available actions
	if (actions.size) {
		if (!actions.has(formaction)) {
			const validActions = [...actions.values()]
				.map((a) => `"${a}"`)
				.join(', ');

			return logger.error({
				message: `A form in ${filePath} references form action "${formaction}" which does not exist in the exported actions exported in ${filePath}. The available actions are: [${validActions}].`,
				loc: nodeToLocation(formActionsNode),
			});
		}
	} else {
		// Check to see if the user forgot to export their actions
		const [nonExportedActions] = parser.match<parser.VariableDeclaration>(
			ast,
			Queries.FORM_ACTIONS
		);

		if (nonExportedActions) {
			return logger.error({
				message: `You did not export the actions variable but are trying to use the form action "${formaction}".`,
				loc: nodeToLocation(formActionsNode),
			});
		} else {
			return logger.error({
				message: `No actions were defined in ${filePath} but the form action "${formaction}" was referenced in a form on the page.`,
				loc: nodeToLocation(formActionsNode),
			});
		}
	}
}
