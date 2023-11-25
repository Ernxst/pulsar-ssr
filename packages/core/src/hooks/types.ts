/// <reference lib="dom" />
import type { RouteFunctionArgs } from 'src/route';

/** State set at the top level */
export interface UrlData {
	location: PulsarLocation;
	params: Record<string, string>;
	searchParams: URLSearchParams;
}

/** State set at the top level */
export interface RouteData {
	context: RouteFunctionArgs;
}

/** State only available to pages */
export interface PageData {
	actionData: Map<string, any>;
	loaderData: { value: any };
}

export interface PulsarLocation
	extends Pick<Location, 'search' | 'pathname' | 'hash' | 'origin'> {}

export type Callable = (...args: any[]) => any;
