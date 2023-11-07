import type { CookieOptions } from 'elysia';
import type { cacheHeader } from 'pretty-cache-header';
import type { QueryParams, UrlPath, inferPathParams } from 'src/types';

export type RedirectStatus = 301 | 302 | 303 | 307 | 308;

export type CacheOptions = Parameters<typeof cacheHeader>[0];

export type Runtime =
	| 'other'
	| 'node'
	| 'deno'
	| 'bun'
	| 'workerd'
	| 'fastly'
	| 'edge-light'
	| 'lagon';

export interface CookieHandler {
	get(name: string): unknown | undefined;
	set(name: string, value: unknown, options?: CookieOptions): void;
	delete(name: string): void;
}

export interface LoaderArgs<
	TPath extends UrlPath = UrlPath,
	TQuery extends QueryParams = QueryParams,
> {
	/**
	 * The runtime the request is running on. This is set by the adapter used.
	 */
	readonly runtime: Runtime;
	/**
	 * The original, unmodified {@linkcode Request} object.
	 */
	readonly request: Request;
	readonly response: Pick<Response, 'headers' | 'status' | 'statusText'>;
	/**
	 * The (relative) path of the request. This is not the same as the request
	 * endpoint (i.e., {@linkcode URL.pathname}). This is the path that was
	 * matched by the router. For example, if you have a route with the path
	 * `/foo/:bar`, and the request URL is `/foo/baz`, then this will be
	 * `/foo/:bar`. If you want the request URL, use {@linkcode Request.url}.
	 */
	readonly path: TPath;
	/**
	 * The dynamic URL parameters, parsed from the {@linkcode path}.
	 */
	readonly params: inferPathParams<TPath>;
	/**
	 * The query parameters, parsed from the URL, as an object. To access the
	 * query string as a string, use {@linkcode Request.url.search}
	 */
	readonly query: TQuery;
	readonly cookies: CookieHandler;
	/**
	 * Redirect to a new path. You can either throw or return this.
	 * @param path The path to redirect to.
	 * @param status The status code to use. Defaults to `302`.
	 */
	redirect(path: string | URL, status?: RedirectStatus): void;
	/**
	 * Set the response status code.
	 */
	status(status: number): void;
	/**
	 * Apply a cache header to the response. This will append to any existing
	 * cache headers.
	 * Note: when used in a loader - this caches the page.
	 */
	cache(options: CacheOptions): void;
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

export type Loader<TPath extends UrlPath, TQuery extends QueryParams, TOut> = (
	context: LoaderArgs<TPath, TQuery>
) => TOut;

export type inferLoaderData<TLoader extends Loader<any, any, any>> = Awaited<
	ReturnType<TLoader>
>;
