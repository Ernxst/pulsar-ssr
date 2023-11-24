/// <reference lib="dom" />
import { getContext } from './internal';

export interface PulsarLocation
	extends Pick<Location, 'search' | 'pathname' | 'hash'> {}

/**
 * @returns the current location object.
 */
export function useLocation(): PulsarLocation {
	// @ts-expect-error it's fine
	// eslint-disable-next-line @typescript-eslint/no-invalid-this
	return getContext.bind(this)(this).location;
}

export function useParams(): Record<string, string> {
	// @ts-expect-error it's fine
	// eslint-disable-next-line @typescript-eslint/no-invalid-this
	return getContext.bind(this)(this).params;
}
