import type * as parser from '@pulsarjs/parser';

export interface Adapter {
	name: string;
	adapterFunction: string;
	createServer(params: { handler: parser.CallExpression }): parser.Node;
}
