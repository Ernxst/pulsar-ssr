import type { LoaderContext } from 'src/loader/types';
import type { QueryParams, UrlPath } from 'src/types';

export interface RouteContext<
	TPath extends UrlPath = UrlPath,
	TQuery extends QueryParams = QueryParams,
	TBody = unknown,
> extends LoaderContext<TPath, TQuery> {
	/**
	 * The parsed request body. If you have supplied a body schema, it
	 * will have been validated against it.
	 */
	body: TBody;
	/**
	 * Sets the response body and content type to `application/json;charset=utf-8`
	 */
	json<const TBody extends object>(body: TBody, status?: number): TBody;
	/**
	 * Sets the response body and content type to `text/html;charset=utf-8`
	 */
	html<THtml extends string>(body: THtml, status?: number): THtml;
	/**
	 * Sets the response body and content type to `text/plain`
	 */
	text<const TString extends string>(body: TString, status?: number): TString;
	/**
	 * Sets the response body and content type to `application/xml`
	 */
	xml<TString extends string>(body: TString, status?: number): TString;
}

export type Route<
	TPath extends UrlPath,
	TQuery extends QueryParams,
	TBody,
	TOut,
> = (context: RouteContext<TPath, TQuery, TBody>) => TOut;

export type inferRouteOutput<TRoute extends Route<any, any, any, any>> =
	TRoute extends Route<infer _TPath, infer _TQuery, infer _Body, infer TData>
		? TData
		: never;
