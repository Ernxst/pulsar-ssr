import type MagicString from 'magic-string';
import { PULSAR_FORM_ACTIONS_METHOD } from '@pulsarjs/runtime';
import { getElementProps } from '../utils';

function findFormPropDefinition(opts: {
	formIndex: number;
	prop: keyof JSX.HtmlFormTag;
	value: string;
	code: string;
}): [number, number] {
	const { formIndex, prop, value, code } = opts;
	const target = `${prop}: "${value}"`;
	const start = code.indexOf(target, formIndex);
	return [start, start + target.length];
}

export function transformFormAction(
	relativeFilePath: string,
	code: string,
	string: MagicString
) {
	// Add the import so it is transpiled by Vite
	string = string.prepend(
		'import { createActionUrl } from "@pulsarjs/runtime";\n'
	);

	const formProps = getElementProps('form', code, [
		'formaction',
		'action',
		'method',
	]);

	formProps.forEach((props, formIndex) => {
		const { formaction, action, method } = props;

		if (formaction) {
			// Action and form action is not allowed
			if (action) {
				console.warn(
					`Found a form in ${relativeFilePath} that uses formaction="${formaction}" and action="${action}". The action="${action}" will be removed.`
				);

				const [start, end] = findFormPropDefinition({
					formIndex,
					code,
					prop: 'action',
					value: action,
				});
				string.overwrite(start, end, '');
			}

			if (method) {
				// We only register POST routes for form actions in the runtime, so replace it here
				if (method.toUpperCase() !== PULSAR_FORM_ACTIONS_METHOD) {
					console.warn(
						`Found a form in ${relativeFilePath} that uses formaction="${formaction}" and method="${method}". The method "${method}" will be replaced with ${PULSAR_FORM_ACTIONS_METHOD}.`
					);

					const [start, end] = findFormPropDefinition({
						formIndex,
						code,
						prop: 'method',
						value: method,
					});
					string.overwrite(start, end, `method: "${PULSAR_FORM_ACTIONS_METHOD}"`);
				}
			}

			const hasActions = /^const actions = /gm.test(code);
			// TODO: Use an AST for this
			const hasExportedActions =
				/^export const actions = /gm.test(code) ||
				/^export { actions }/gm.test(code);

			if (!hasActions && !hasExportedActions) {
				throw new Error(
					`No actions were defined in ${relativeFilePath} but the form action "${formaction}" was referenced in a form on the page.`
				);
			}

			if (!hasExportedActions && hasActions) {
				throw new Error(
					`You did not export the actions variable but are trying to use the form action "${formaction}".`
				);
			}

			// This won't be possible unless we use an AST
			// if (!formActions[formaction]) {
			//   const validActions = Object.keys(formActions).join(', ');
			//   throw new Error(`A form in ${relativeFilePath} references form action "${action}" which does not exist in the exported actions exported in ${relativeFilePath}. The available actions are ${validActions}.`);
			// }

			const [start, end] = findFormPropDefinition({
				formIndex,
				code,
				prop: 'formaction',
				value: formaction,
			});

			string.overwrite(
				start,
				end,
				`action: createActionUrl("${relativeFilePath}", "${formaction}")
					${method ? '' : `, method: "${PULSAR_FORM_ACTIONS_METHOD}"`}
					`
			);
		}
	});

	return string;
}
