import type MagicString from 'magic-string';
import { PULSAR_FORM_ACTIONS_METHOD } from '@pulsarjs/runtime';
import type { Program } from '@babel/types';
import { getElementProps } from '../utils';
import { validateFormActions } from './validate-form-actions';

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

export function transformFormAction(opts: {
	relativeFilePath: string;
	ast: Program;
	code: string;
	string: MagicString;
}) {
	const { string, relativeFilePath, code, ast } = opts;

	// Add the import so it is transpiled by Vite
	string.prepend('import { createActionUrl } from "@pulsarjs/runtime";\n');

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
					string.overwrite(
						start,
						end,
						`method: "${PULSAR_FORM_ACTIONS_METHOD}"`
					);
				}
			}

			validateFormActions({ ast, code, relativeFilePath, formaction });

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
