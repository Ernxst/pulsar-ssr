import * as parser from '@pulsarjs/parser';
import 'pulsar/jsx';

type MatchedProps<
	TElement extends string & keyof Pulsar.IntrinsicElements,
	TProps extends string & keyof Pulsar.IntrinsicElements[TElement],
> = {
	[K in TProps]: {
		value?: Pulsar.IntrinsicElements[TElement][K];
		start: number;
		end: number;
		propNode: parser.JSXAttribute;
	};
};

export function createHookESQuery(hookName: string) {
	return `CallExpression:has(Identifier[name=${hookName}])`;
}

export function getElementProps<
	const TElement extends string & keyof Pulsar.IntrinsicElements,
	const TProps extends string & keyof Pulsar.IntrinsicElements[TElement],
>(
	element: TElement,
	root: parser.Node,
	propsToExtract: TProps[]
): {
	node: parser.JSXElement;
	props: Partial<MatchedProps<TElement, TProps>>;
}[] {
	const jsxQuery = makeCreateElementQuery(element);
	const propQuery = makeElementPropQuery(propsToExtract);

	const elementNodes = parser.match<parser.JSXElement>(root, jsxQuery);
	return elementNodes.map((elementNode) => {
		const nodeStart = elementNode.start;
		const attrNodes = parser.match<parser.JSXAttribute>(elementNode, propQuery);
		const props = {} as MatchedProps<TElement, TProps>;

		for (const propNode of attrNodes) {
			if (propNode.value) {
				const name = getPropertyName(propNode.name) as TProps;
				const value = getPropertyValue(element, name, propNode.value) as any;
				const start = nodeStart + propNode.value.start + 1;
				const end = start + (value ? value.length : 0);
				props[name] = { value, start, end, propNode };
			}
		}

		return { node: elementNode, props };
	});
}

function makeCreateElementQuery(element: string) {
	return `JSXElement[openingElement.name.name=${element}]`;
}

function makeElementPropQuery(props: string[]) {
	return props.map((prop) => `JSXAttribute[name.name=${prop}]`).join(', ');
}

function getPropertyName(
	node: parser.JSXIdentifier | parser.JSXNamespacedName
): string {
	if (parser.isJSXIdentifier(node)) return node.name;
	return node.name.name;
}

function getPropertyValue(
	element: string,
	prop: string,
	node: parser.JSXAttribute['value']
) {
	if (parser.isLiteral(node)) return node.value;
	if (parser.isJSXExpressionContainer(node)) {
		throw new Error(
			`These value of ${element}.${prop} is a JSX expression which is currently not supported`
		);
	}

	if (parser.isJSXElement(node) || parser.isJSXFragment(node)) {
		throw new Error(
			`Cannot retrieve value of ${element}.${prop} when it is JSX`
		);
	}

	return node;
}
