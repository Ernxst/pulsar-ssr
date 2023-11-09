import qs from 'fast-querystring';
import { type Runtime, getRuntimeKey } from 'hono/adapter';
import { parseBody } from 'hono/utils/body';
import { parse, serialize } from 'hono/utils/cookie';
import { cacheHeader } from 'pretty-cache-header';
import type { QueryParams, UrlPath, inferPathParams } from 'src/types';
import type { RouteFunctionArgs } from 'src/route';
import type { CookieHandler } from 'src/loader/types';

interface Options {
	path: string;
	request: Request;
	params: Record<string, string>;
}

export async function createRouteContext<
	TPath extends UrlPath,
	TQuery extends QueryParams,
	TBody,
>({
	request,
	path,
	params,
}: Options): Promise<RouteFunctionArgs<TPath, TQuery, TBody>> {
	const body = await parseBody(request);
	const resHeaders = new Headers();
	let resStatus = 200;

	return {
		get path() {
			return path as TPath;
		},

		get query() {
			return qs.parse(request.url) as TQuery;
		},

		get params() {
			return params as inferPathParams<TPath>;
		},

		get body() {
			return body as TBody;
		},

		get runtime(): Runtime {
			return getRuntimeKey();
		},

		get request() {
			return request;
		},

		get response(): RouteFunctionArgs<TPath, TQuery, TBody>['response'] {
			return { status: resStatus, headers: resHeaders };
		},

		get cookies(): CookieHandler {
			// TODO: Should we be using signed cookies instead?
			return {
				set(name, value, options) {
					const cookie = serialize(name, value, options);
					resHeaders.append('Cookie', cookie);
				},
				get(name) {
					const cookie = request.headers.get('Cookie');
					if (!cookie) return undefined;

					const obj = parse(cookie);
					return obj[name];
				},
				delete(name, options) {
					this.set(name, '', { ...options, maxAge: 0 });
				},
			};
		},

		redirect(url, status = 302) {
			resHeaders.set('Location', url.toString());
			resStatus = status;
		},

		cache(options) {
			const headers = cacheHeader(options);
			resHeaders.append('Cache-Control', headers);
		},

		status(status) {
			resStatus = status;
		},

		json(body = {} as any, status = 200 as any) {
			resStatus = status;
			resHeaders.set('Content-Type', 'application/json; charset=utf8');
			return body;
		},

		text(body, status = 200 as any) {
			resStatus = status;
			resHeaders.set('Content-Type', 'text/plain; charset=utf8');
			return body;
		},

		html(body, status = 200 as any) {
			resStatus = status;
			resHeaders.set('Content-Type', 'text/html; charset=utf8');
			return body;
		},

		xml(body, status = 200 as any) {
			resStatus = status;
			resHeaders.set('Content-Type', 'text/xml; charset=utf8');
			return body;
		},
	};
}
