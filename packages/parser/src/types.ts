import type * as babel from '@babel/types';
import type * as acorn from 'acorn';

export interface JSXElement extends babel.JSXElement {
	start: number;
	end: number;
}

export type JSXAttribute = Omit<
	babel.JSXAttribute,
	'name' | 'value' | 'start' | 'number'
> & {
	name: JSXIdentifier | JSXNamespacedName;
	value?:
		| JSXElement
		| JSXFragment
		| acorn.Literal
		| JSXExpressionContainer
		| null;
	start: number;
	end: number;
};

export interface JSXIdentifier extends babel.JSXIdentifier {
	start: number;
	end: number;
}

export interface JSXNamespacedName extends babel.JSXNamespacedName {
	start: number;
	end: number;
}

export interface JSXExpressionContainer extends babel.JSXExpressionContainer {
	start: number;
	end: number;
}

export interface JSXFragment extends babel.JSXFragment {
	start: number;
	end: number;
}

export interface JSXNode {
	JSXElement: JSXElement;
	JSXIdentifier: JSXIdentifier;
	JSXNamespacedName: JSXNamespacedName;
	JSXExpressionContainer: JSXExpressionContainer;
	JSXFragment: JSXFragment;
	JSXAttribute: JSXAttribute;
}

export type {
	Program,
	Node,
	Literal,
	Identifier,
	CallExpression,
	ExportDefaultDeclaration,
	ExportNamedDeclaration,
	ObjectExpression,
	VariableDeclaration,
} from 'acorn';
