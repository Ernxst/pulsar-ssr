import { usePulsarContext } from './context';
import type { PulsarLocation } from './types';

/**
 * Resolves a full URL against the current location to be used as an href to a
 * link. If a relative path is supplied, it will resolve to a full URL.
 */
export function useHref(to: string): string {
	const { origin } = useLocation();
	to = to.startsWith('/') ? to : `/${to}`;
	return `${origin}${to}`;
}

/** @returns the current {@linkcode PulsarLocation} object. */
export function useLocation(): PulsarLocation {
	return usePulsarContext().location;
}

export function useParams(): Record<string, string> {
	return usePulsarContext().params;
}

type State<T> = [T, Setter<T>];
type Setter<T> = (updater: T | ((prev: T) => T)) => void;

function isServer() {
	return typeof window === 'undefined';
}

function getQueryIsomorphic() {
	return usePulsarContext().searchParams;
}

function updateQuery(updated: URLSearchParams) {
	const existing = getQueryIsomorphic();
	updated.forEach((value, key) => existing.append(key, value));
	const search = `?${updated.toString()}`;
	useLocation().search = search;
	return search;
}

/**
 * The first value returned is a Web {@linkcode URLSearchParams} object.
 * The second value returned is a function to set new search params and causes
 * a navigation when called.
 */
export function useSearchParams(): State<URLSearchParams> {
	return [
		getQueryIsomorphic(),
		(updater) => {
			/**
			 * ! This won't cause a reactive update as we'd need hydration
			 */
			let queryParams: URLSearchParams;

			if (typeof updater === 'function') {
				queryParams = updater(getQueryIsomorphic());
			} else {
				queryParams = updater;
			}

			const search = updateQuery(queryParams);
			if (isServer()) {
				// TODO: Do we also want to navigate?
				return;
			}

			const url = new URL(window.location.href);
			url.search = search;
			window.history.pushState({}, '', url.toString());
		},
	];
}
