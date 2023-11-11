import babel from '@babel/parser';
import type { Node, Program } from '@babel/types';
import esquery from 'esquery';

export function parse(code: string): Program {
	const result = babel.parse(code, {
		sourceType: 'module',
		plugins: [
			'estree',
			'optionalChaining',
			'importAttributes',
			'importMeta',
			'dynamicImport',
			'jsx',
			'topLevelAwait',
			'classPrivateMethods',
		],
	});

	return result.program;
}

export function match<T extends Node = Node>(
	node: Program,
	selector: string
): Array<T> {
	const sel = esquery.parse(selector);
	return esquery.match(node as any, sel) as unknown as Array<T>;
}
