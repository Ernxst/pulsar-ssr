import esquery from 'esquery';
import * as acorn from 'acorn';
import typescript from 'acorn-typescript';
import babelGenerate from '@babel/generator';
import type * as babel from '@babel/types';
import type { State } from 'estree-util-to-js';
import { jsx, toJs } from 'estree-util-to-js';
import { visit } from 'estree-util-visit';

const parser = acorn.Parser.extend(
	// @ts-expect-error No clue
	typescript({
		jsx: { allowNamespacedObjects: true, allowNamespaces: true },
	})
);

export function parse(code: string): acorn.Program {
	return parser.parse(code, {
		sourceType: 'module',
		ecmaVersion: 'latest',
		locations: true,
	});
}

export function match<T extends acorn.Node = acorn.Node>(
	node: acorn.Node | acorn.Program,
	selector: string
): Array<T> {
	const sel = esquery.parse(selector);
	return esquery.match(node as any, sel) as Array<T>;
}

export function replace(
	ast: acorn.Node | acorn.Program,
	replacer: (node: acorn.Node) => void
) {
	// @ts-expect-error - all these different libraries, SLIGHTLY different types
	visit(ast, {
		enter(node, _parent) {
			return replacer(node as any);
		},
	});
}

// fix your types ...
const gen = (babelGenerate as any).default as typeof babelGenerate;

const generator = {
	...jsx,
	/**
	 * Handle the string literal that comes from babel
	 */

	StringLiteral(node: babel.StringLiteral, state: State) {
		const { code } = gen(node, {});
		state.write(code, node as any);
	},

	ObjectProperty(node: babel.ObjectProperty, state: State) {
		const { code } = gen(node, {});
		state.write(code, node as any);
	},
};

export function generate(ast: acorn.Node | acorn.Program) {
	const result = toJs(ast as any, {
		handlers: generator,
	});

	return result.value;
}

export * from './matchers';
export * from './types';

export {
	arrayExpression,
	importDefaultSpecifier,
	importDeclaration,
	importSpecifier,
	importNamespaceSpecifier,
	arrowFunctionExpression,
	identifier,
	stringLiteral,
	jsxAttribute,
	jsxIdentifier,
	jsxFragment,
	assignmentExpression,
	objectExpression,
	objectProperty,
	numericLiteral,
	blockStatement,
	returnStatement,
	variableDeclaration,
	exportDefaultDeclaration,
	functionDeclaration,
	variableDeclarator,
	jsxElement,
	jsxOpeningElement,
	jsxClosingElement,
	jsxOpeningFragment,
	jsxClosingFragment,
	jsxExpressionContainer,
	memberExpression,
	callExpression,
	thisExpression,
	typeParameterInstantiation,
	tsTypeQuery,
} from '@babel/types';
