import type { Route } from 'pulsar/route';
import type { Loader } from 'pulsar/loader';
import type { HTTPMethod } from 'elysia';

export type RouteFile = {
	[K in HTTPMethod]: Route<any, any, any, any>;
} & {
	loader: Loader<any, any, any>;
	/**
	 * page component
	 */
	default: () => any;
};
