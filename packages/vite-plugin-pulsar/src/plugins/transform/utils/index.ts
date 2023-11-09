import type MagicString from 'magic-string';
import type JSX from 'pulsar/components';

/**
 * Replace all occurrences of a pattern in a {@linkcode MagicString}
 */
export function replaceAll({
	code,
	string,
	pattern,
	replace,
}: {
	code: string;
	string: MagicString;
	pattern: RegExp;
	replace: (match: RegExpMatchArray) => string | null;
}) {
	let match = pattern.exec(code);
	while (match) {
		const [fullMatch] = match;
		const start = match.index;
		const end = start + fullMatch.length;
		const replacement = replace(match);
		if (typeof replacement === 'string') {
			string = string.overwrite(start, end, replacement);
		}
		match = pattern.exec(code);
	}

	return string;
}

export function getElementProps<
	const TElement extends keyof JSX.IntrinsicElements,
	const TProps extends string & keyof JSX.IntrinsicElements[TElement],
>(
	element: TElement,
	code: string,
	propsToExtract: TProps[]
): Record<TProps, string | null>[] {
	// This is after the JSX has been transformed, so everything will in object syntax
	const regexString = `Html.createElement\\("(?<element>${element})", (?<props>\{.*?\})`;
	const regex = new RegExp(regexString, 'g');
	return getObject(code, regex, propsToExtract);
}

/**
 * @param code
 * @param regex Must be a {@linkcode Regex} which a named capture group `props`
 * @param propsToExtract
 */
export function getObject<const TProps extends string>(
	code: string,
	regex: RegExp,
	propsToExtract: TProps[]
): Record<TProps, string | null>[] {
	return [...code.matchAll(regex)].map((match) => {
		const { props } = match.groups!;
		return Object.fromEntries(
			propsToExtract.map((prop) => {
				return [prop, getProp(props, prop)];
			})
		);
	}) as any;
}

function getProp(objectString: string, propName: string) {
	// Create a regular expression pattern to match the property and its value
	const regex = new RegExp(`\\s${propName}:\\s*"([^"]+)"`, 'i');

	// Use the regular expression to extract the property value
	const match = objectString.match(regex);

	if (match) {
		return match[1]; // The property value is captured in the first capture group
	} else {
		return null;
	}
}
