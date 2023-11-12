class NotFoundError extends Error {
	constructor(readonly path: string | URL) {
		super(`Could not find the route at ${path.toString()}`);

		this.name = 'NotFoundError';
	}
}

/**
 * @throws {NotFoundError} to indicate to the router to render the 404 error
 * @internal
 */
export function notFound(path: string | URL) {
	throw new NotFoundError(path);
}

/**
 * `instanceof` checks don't seem to work - this will
 */
export function isNotFound(obj: unknown): obj is NotFoundError {
	// @ts-expect-error what?
	return (
		typeof obj === 'object' &&
		obj &&
		'path' in obj &&
		'name' in obj &&
		obj.name === 'NotFoundError'
	);
}
