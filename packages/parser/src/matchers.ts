import * as babel from '@babel/types';
import type * as types from './types';

export function isLiteral(node: any | null | undefined): node is types.Literal {
	return node?.type === 'Literal' || babel.isLiteral(node);
}

export function isJSXElement(node: any): node is types.JSXElement {
	return babel.isJSXElement(node);
}

export function isJSXExpressionContainer(
	node: any
): node is types.JSXExpressionContainer {
	return babel.isJSXExpressionContainer(node);
}

export function isJSXFragment(node: any): node is types.JSXFragment {
	return babel.isJSXFragment(node);
}

export function isJSXIdentifier(node: any): node is types.JSXIdentifier {
	return babel.isJSXIdentifier(node);
}

export function isNode(node: any): node is types.Node {
	return babel.isNode(node);
}

export function isJSXAttribute(node: any): node is types.JSXAttribute {
	return babel.isJSXAttribute(node);
}

export function isCallExpression(node: any): node is types.CallExpression {
	return babel.isCallExpression(node);
}

export function isIdentifier(node: any): node is types.Identifier {
	return babel.isIdentifier(node);
}

export function isExportDefaultDeclaration(
	node: any
): node is types.ExportDefaultDeclaration {
	return babel.isExportDefaultDeclaration(node);
}
