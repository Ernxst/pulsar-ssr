import type { CookieOptions } from 'hono/utils/cookie';
import type { cacheHeader } from 'pretty-cache-header';
import type { QueryParams, UrlPath, inferPathParams } from 'src/types';
import type { Runtime } from 'hono/adapter';

export type CacheOptions = Parameters<typeof cacheHeader>[0];

export interface PulsarCookieOptions extends CookieOptions {
	/**
	 * Set this to sign your cookies
	 */
	secret?: string;
}

export interface CookieHandler {
	get(name: string, secret?: string): Promise<unknown | undefined>;
	set(
		name: string,
		value: string,
		options?: PulsarCookieOptions
	): Promise<void>;
	delete(name: string, options?: PulsarCookieOptions): void;
}

export interface LoaderFunctionArgs<
	TPath extends UrlPath = any,
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
	readonly response: Pick<Response, 'headers' | 'status'>;
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
	 * query string as a string, use {@linkcode URL.search}
	 */
	readonly query: TQuery;
	readonly cookies: CookieHandler;
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
	json<const TBody extends object>(
		body: TBody,
		options?: { status?: number }
	): TBody;
	/**
	 * Sets the response body and content type to `text/html;charset=utf-8`
	 */
	html<THtml extends string>(body: THtml, options?: { status?: number }): THtml;
	/**
	 * Sets the response body and content type to `text/plain`
	 */
	text<const TString extends string>(
		body: TString,
		options?: { status?: number }
	): TString;
	/**
	 * Sets the response body and content type to `application/xml`
	 */
	xml<TString extends string>(
		body: TString,
		options?: { status?: number }
	): TString;
}

export type LoaderFunction<
	TPath extends UrlPath = any,
	TQuery extends QueryParams = QueryParams,
	TOut = any,
> = (context: LoaderFunctionArgs<TPath, TQuery>) => TOut;

export type inferLoaderData<TLoader extends LoaderFunction<any, any, any>> =
	Awaited<ReturnType<TLoader>>;
