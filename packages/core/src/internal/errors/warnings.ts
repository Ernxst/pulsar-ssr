import { PULSAR_FORM_ACTIONS_METHOD } from '../utils/url/create-action-url';
import type { ErrorOrWarning } from './types';
import { createWarning } from './utils';

export interface Warning extends ErrorOrWarning {
	readonly type: 'WARNING';
}

interface WarningOptions extends Pick<ErrorOrWarning, 'code' | 'loc'> {
	/**
	 * The source file where the warning was raised
	 */
	filePath: string;
}

/**
 * A warning when a loader is exported, with a page, but there
 * is no `useLoaderData` call which is the only way to use the
 * data returned by the loader.
 *
 * This is not an error because the unused loader will be stripped
 * away at build time. We just want to make sure the user is aware
 * of this.
 */
export function UnusedLoaderWarning({
	filePath,
	...opts
}: WarningOptions): Warning {
	return createWarning({
		...opts,
		errorCode: 'UNUSED_LOADER',
		message: `Unused loader function.`,
		description: `A loader function was exported in file "${filePath}", but no usage of "useLoaderData" was found in the page. The loader will be stripped from the page.`,
		docsLink: '/todo',
	});
}

/**
 * A warning when there is an exported loader in a file, but no default
 * page export.
 *
 * This is not an error - either the user uses the exported
 * loader in another file, or they may have forgotten to export the page
 */
export function LoaderWithoutPageWarning({
	filePath,
	...opts
}: WarningOptions): Warning {
	return createWarning({
		...opts,
		errorCode: 'LOADER_WITHOUT_PAGE',
		message: `Unused loader function`,
		description: `A loader function was exported in a file ("${filePath}") that does not export a page. If this function is for external use only, please consider renaming it.`,
		docsLink: '/todo',
	});
}

/**
 * A warning when a form uses both `formaction` and `action` attributes.
 *
 * This is not an error because the native `action` will be replaced with the
 * contents of `formaction` at build time - we just make sure the user is
 * aware of this behaviour.
 */
export function FormactionAndActionWarning({
	filePath,
	formaction,
	action,
	...opts
}: WarningOptions & { action: string; formaction: string }): Warning {
	return createWarning({
		...opts,
		errorCode: 'FORM_ACTION_AND_ACTION',
		message: `Cannot use both "formaction" and "action" attributes on the same form.`,
		description: `A form in "${filePath}" uses both formaction="${formaction}" and action="${action}" which is not allowed; the action="${action}" will be removed.`,
		docsLink: '/todo',
	});
}

/**
 * A warning when a form uses a `formaction` and a `method` which is not
 * {@linkcode PULSAR_FORM_ACTIONS_METHOD}
 *
 * This is not an error because the native `method` will be replaced with
 * {@linkcode PULSAR_FORM_ACTIONS_METHOD} at build time.
 */
export function FormactionAndUnsupportedMethodWarning({
	filePath,
	formaction,
	method,
	...opts
}: WarningOptions & { formaction: string; method: string }): Warning {
	return createWarning({
		...opts,
		errorCode: 'FORM_ACTION_AND_UNSUPPORTED_METHOD',
		message: `Cannot use method="${method}" when using a form action.`,
		description: `A form in "${filePath}" uses both formaction="${formaction}" and method="${method}" which is not allowed; The method "${method}" will be replaced with ${PULSAR_FORM_ACTIONS_METHOD}.`,
		docsLink: '/todo',
	});
}
