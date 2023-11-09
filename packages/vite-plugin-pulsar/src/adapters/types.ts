export interface Adapter {
	name: string;
	adapterFunction: string;
	createServer(params: { handler: string }): string;
}
