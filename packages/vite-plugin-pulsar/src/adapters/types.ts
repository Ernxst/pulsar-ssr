import type * as parser from '@pulsarjs/parser';

export interface Adapter {
	name: string;
	package: string;
	/** When type is edge, node modules are not allowed */
	type: 'edge' | 'node';
	createServer(params: { handler: parser.CallExpression }): parser.Node[];
}
