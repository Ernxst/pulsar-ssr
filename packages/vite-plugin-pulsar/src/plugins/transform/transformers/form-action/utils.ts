import * as parser from '@pulsarjs/parser';
import type MagicString from 'magic-string';
import { nodeToLocation } from 'src/utils';
import type { Logger } from '../../types';
import { Queries } from '.';

export function updateChildNode(
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

export function isPropNode(
	node: parser.Node,
	prop: string
): node is parser.JSXAttribute {
	return (
		parser.isJSXAttribute(node) &&
		parser.isJSXIdentifier(node.name) &&
		node.name.name === prop
	);
}

export function validateFormActions({
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
