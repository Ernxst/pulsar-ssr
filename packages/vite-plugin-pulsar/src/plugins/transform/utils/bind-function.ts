import type MagicString from 'magic-string';
import { replaceAll } from '.';

/**
 * Given a function, `foo`, invoked as `foo()`, transform the source code
 * into `foo.bind(this)()`, taking care of type parameters.
 */
export function bindFunctionUsage(
	code: string,
	string: MagicString,
	functionName: string
) {
	const pattern = new RegExp(`${functionName}(\\[.*?\\])?\\(\\)`, 'g');
	return replaceAll({
		code,
		string,
		pattern,
		replace: ([, typeParam]) =>
			`${functionName}${typeParam ?? ''}.bind(this)()`,
	});
}
