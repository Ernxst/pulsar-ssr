import type { Context } from 'hono/jsx';
import { useContext } from 'hono/jsx';
import type * as types from 'src/hooks/types';
import { PageContext, RouteContext, UrlContext } from './context';

function getContextOrThrow<T>(context: Context<T>, name: string) {
	const data = useContext<T>(context);
	if (!data) throw new Error(`No ${name} context found`);

	return data;
}

export function useURL(): types.UrlData {
	return getContextOrThrow(UrlContext, 'url');
}

export function useRoute(): types.RouteData {
	return getContextOrThrow(RouteContext, 'route');
}

export function usePage(): types.PageData {
	return getContextOrThrow(PageContext, 'page');
}

export function setActionData(key: string, actionData: any) {
	usePage().actionData.set(key, actionData);
}
