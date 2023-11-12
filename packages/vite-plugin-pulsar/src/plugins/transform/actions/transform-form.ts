import { PULSAR_FORM_ACTIONS_METHOD, createActionUrl } from 'pulsar/internal';
import { getElementProps } from '../utils';
import type { ActionOptions } from './types';
import { validateFormActions } from './validate';

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

/**
 * Transform the form actions by changing the `formaction` prop
 * to a generated endpoint
 *
 * This will also change all the methods of named action forms to
 * {@linkcode PULSAR_FORM_ACTIONS_METHOD}
 */
export function transformForm(options: ActionOptions) {
	const { string, code, relativeFilePath } = options;

	const formProps = getElementProps('form', code, [
		'formaction',
		'action',
		'method',
	]);

	formProps.forEach((props, formIndex) => {
		const { formaction, action, method } = props;

		if (formaction) {
			validateFormActions({ ...options, formaction });

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

			const [start, end] = findFormPropDefinition({
				formIndex,
				code,
				prop: 'formaction',
				value: formaction,
			});

			const actionEndpoint = createActionUrl(relativeFilePath, formaction);
			string.overwrite(
				start,
				end,
				`action: "${actionEndpoint}"
					${method ? '' : `, method: "${PULSAR_FORM_ACTIONS_METHOD}"`}
					`
			);
		}
	});
}
