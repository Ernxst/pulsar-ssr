/* eslint-disable @typescript-eslint/no-invalid-this */
/// <reference lib="dom" />
import { getContext } from './internal';

export interface PulsarLocation
	extends Pick<Location, 'search' | 'pathname' | 'hash'> {}

/**
 * @returns the current location object.
 */
export function useLocation(): PulsarLocation {
	// @ts-expect-error it's fine
	return getContext.bind(this)(this).location;
}

export function useParams(): Record<string, string> {
	// @ts-expect-error it's fine
	return getContext.bind(this)(this).params;
}

type StateHook<T> = [T, Setter<T>];
type Setter<T> = (updater: T | ((prev: T) => T)) => void;

/**
 * The first value returned is a Web {@linkcode URLSearchParams} object.
 * The second value returned is a function to set new search params and causes
 * a navigation when called.
 */
export function useSearchParams(): StateHook<URLSearchParams> {
	const getQuery = () =>
		// @ts-expect-error it's fine
		getContext.bind(this)(this).searchParams;

	return [
		getQuery(),
		(updater) => {
			let queryParams: URLSearchParams;

			if (typeof updater === 'function') {
				queryParams = updater(getQuery());
			} else {
				queryParams = updater;
			}

			if (typeof window === 'undefined') {
				// TODO: Do we also want to navigate?
				const params = getQuery();
				queryParams.forEach((value, key) => params.append(key, value));
				// @ts-expect-error it's fine
				useLocation.bind(this)().search = `?${params.toString()}`;
				return;
			}

			const url = new URL(window.location.href);
			queryParams.forEach((value, key) => url.searchParams.append(key, value));
			window.history.pushState({}, '', url.toString());
		},
	];
}
