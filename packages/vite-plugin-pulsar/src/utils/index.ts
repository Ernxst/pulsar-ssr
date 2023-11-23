import type * as parser from '@pulsarjs/parser';

export function nodeToLocation(node: parser.Node): {
	line: number;
	column: number;
} {
	return node.loc!.start;
}
