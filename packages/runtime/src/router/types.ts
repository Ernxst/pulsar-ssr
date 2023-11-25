import type { Actions } from 'pulsar/actions';
import type { LoaderFunction } from 'pulsar/loader';
import type { RouteFunction, RouteFunctionArgs } from 'pulsar/route';

export interface RouteHandler {
	path: string;
	handle: (context: RouteFunctionArgs) => Promise<any>;
}

/** Return null for  */
export type AssetHandler = (
	filePath: string,
	context: RouteFunctionArgs
) => Response | null | Promise<Response | null>;

export type HTTPMethod =
	| 'DELETE'
	| 'GET'
	| 'HEAD'
	| 'OPTIONS'
	| 'PATCH'
	| 'POST'
	| 'PUT'
	| 'ALL';

export interface ServerBuild {
	/** Map of source file URL to the built module */
	routes: Record<
		string,
		{ endpoint: string; loadModule: () => Promise<PulsarModule> }
	>;
	assets: {
		files: string[];
		url: string;
	};
}

export type PulsarModule = {
	[K in HTTPMethod]?: RouteFunction<any, any, any, any>;
} & {
	actions?: Actions;
	stream?: boolean;
	loader?: LoaderFunction<any, any, any>;
	/**
	 * page component
	 */
	default?: (params: { context: RouteFunctionArgs; loaderData: any }) => any;
};
