import type { LoaderArgs } from 'src/loader/types';
import type { QueryParams, UrlPath } from 'src/types';

export interface RouteArgs<
	TPath extends UrlPath = any,
	TQuery extends QueryParams = QueryParams,
	TBody = unknown,
> extends LoaderArgs<TPath, TQuery> {
	/**
	 * The parsed request body. If you have supplied a body schema, it
	 * will have been validated against it.
	 */
	body: TBody;
}

export type Route<
	TPath extends UrlPath,
	TQuery extends QueryParams,
	TBody,
	TOut,
> = (context: RouteArgs<TPath, TQuery, TBody>) => TOut;

export type inferRouteOutput<TRoute extends Route<any, any, any, any>> =
	TRoute extends Route<infer _TPath, infer _TQuery, infer _Body, infer TData>
		? TData
		: never;
