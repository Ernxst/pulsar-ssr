import type { LoaderFunctionArgs } from 'src/loader';
import type { QueryParams, UrlPath } from 'src/types';

export interface RouteFunctionArgs<
	TPath extends UrlPath = any,
	TQuery extends QueryParams = QueryParams,
	TBody = unknown,
> extends LoaderFunctionArgs<TPath, TQuery> {
	/**
	 * The parsed request body. If you have supplied a body schema, it
	 * will have been validated against it.
	 */
	body: TBody;
}

export type RouteFunction<
	TPath extends UrlPath,
	TQuery extends QueryParams,
	TBody,
	TOut,
> = (context: RouteFunctionArgs<TPath, TQuery, TBody>) => TOut;

export type inferRouteOutput<TRoute extends RouteFunction<any, any, any, any>> =
	TRoute extends RouteFunction<
		infer _TPath,
		infer _TQuery,
		infer _Body,
		infer TData
	>
		? TData
		: never;
