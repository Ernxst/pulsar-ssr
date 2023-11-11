import type JSX from 'pulsar/components';
import type { CallExpression, ObjectExpression } from '@babel/types';
import type MagicString from 'magic-string';
import { match, parse } from './ast';

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

// This is after the JSX has been transformed, so everything will in object syntax
export function getElementProps<
	const TElement extends keyof JSX.IntrinsicElements,
	const TProps extends string & keyof JSX.IntrinsicElements[TElement],
>(
	element: TElement,
	code: string,
	propsToExtract: TProps[]
): Partial<Pick<JSX.IntrinsicElements[TElement], TProps>>[] {
	const createElementQuery = makeCreateElementQuery(element);
	const propQuery = makeElementPropQuery(propsToExtract);

	const root = parse(code);
	const usages = match<CallExpression>(root, createElementQuery);

	return usages.map((node) => {
		const nodeCode = code.slice(node.start!, node.end!);
		const ast = parse(nodeCode);
		// A Html.createElement expression should only have one props object
		const [objNode] = match<ObjectExpression>(ast, propQuery);

		const props: any = {};

		for (const propNode of objNode.properties) {
			const { key, value } = propNode as any;
			props[key.name] = value.value;
		}

		return props;
	});
}

function makeCreateElementQuery(element: string) {
	const htmlQuery = `MemberExpression:has(Identifier[name=Html]):has(Identifier[name=createElement])`;
	const elQuery = `Literal[value=${element}]`;

	return `CallExpression:has(${htmlQuery}):has(${elQuery})`;
}

function makeElementPropQuery(props: string[]) {
	return props
		.map(
			(prop) => `ObjectExpression:has(Property:has(Identifier[name=${prop}]))`
		)
		.join(', ');
}
