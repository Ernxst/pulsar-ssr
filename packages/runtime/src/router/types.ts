import type { Actions } from 'pulsar/actions';
import type { LoaderFunction } from 'pulsar/loader';
import type { RouteFunction } from 'pulsar/route';

type HTTPMethod =
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
}

export interface ServerBuildConfig {
	/**
	 * For every route found, also register
	 */
	addHtmlRoutes: boolean;
	addIndexRoutes: boolean;
	addIndexHtmlRoutes: boolean;
}

export type PulsarModule = {
	[K in HTTPMethod]?: RouteFunction<any, any, any, any>;
} & {
	actions?: Actions;
	loader?: LoaderFunction<any, any, any>;
	/**
	 * page component
	 */
	default?: () => any;
};

export type ModuleLoader = (filePath: string) => Promise<PulsarModule>;
