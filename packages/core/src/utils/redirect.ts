export type RedirectStatus = 301 | 302 | 303 | 307 | 308;

class Redirect {
	constructor(
		readonly path: string | URL,
		readonly status: RedirectStatus
	) {}
}

/**
 * Redirect to a new path. You can either throw or return this.
 * @param path The path to redirect to.
 * @param status The status code to use. Defaults to `302`.
 */
export function redirect(path: string | URL, status: RedirectStatus = 302) {
	throw new Redirect(path, status);
}

export function isRedirect(obj: unknown): obj is Redirect {
	// @ts-expect-error what?
	return (
		typeof obj === 'object' &&
		obj &&
		'path' in obj &&
		'status' in obj &&
		typeof obj.status === 'number'
	);
}
