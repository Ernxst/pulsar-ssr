import type { Context } from 'elysia';
import { cacheHeader } from 'pretty-cache-header';
import type { CookieHandler, Runtime } from 'src/loader/types';
import type { RouteArgs } from 'src/route/types';
import type { QueryParams, UrlPath } from 'src/types';
import { getRuntime } from './get-runtime';

export function createRouteContext<
	TPath extends UrlPath,
	TQuery extends QueryParams,
	TBody,
>({
	set,
	request,
	path,
	query,
	params,
	body,
	cookie,
}: Context): RouteArgs<TPath, TQuery, TBody> {
	return {
		get path() {
			return path as TPath;
		},

		get query() {
			return query as TQuery;
		},

		get params() {
			return params;
		},

		get body() {
			return body as TBody;
		},

		get runtime(): Runtime {
			return getRuntime();
		},

		get request() {
			return request;
		},

		get response(): RouteArgs<TPath, TQuery, TBody>['response'] {
			const status = set.status;
			const resStatus = typeof status === 'number' ? status : 200;
			const headers = new Headers(set.headers);

			headers.set = (name, value) => {
				set.headers[name] = value;
			};

			headers.append = (name, value) => {
				if (set.headers[name]) {
					set.headers[name] += value;
				} else {
					headers.set(name, value);
				}
			};

			return { status: resStatus, headers };
		},

		get cookies(): CookieHandler {
			return {
				set: (name, value, options) => cookie[name].set({ ...options, value }),
				get: (name) => cookie[name]?.value,
				delete: (name) => cookie[name]?.remove(),
			};
		},

		redirect(url, status = 302) {
			set.redirect = url.toString();
			set.status = status;
		},

		cache(options) {
			const headers = cacheHeader(options);
			set.headers['Cache-Control'] = headers;
		},

		status(status) {
			set.status = status;
		},

		json(body = {} as any, status = 200 as any) {
			set.status = status;
			set.headers['Content-Type'] = 'application/json';
			return body;
		},

		text(body, status = 200 as any) {
			set.status = status;
			set.headers['Content-Type'] = 'text/plain';
			return body;
		},

		html(body, status = 200 as any) {
			set.status = status;
			set.headers['Content-Type'] = 'text/html';
			return body;
		},

		xml(body, status = 200 as any) {
			set.status = status;
			set.headers['Content-Type'] = 'text/xml';
			return body;
		},
	};
}
