class NotFoundError extends Error {
	constructor(readonly path: string | URL) {
		super(`Could not find the route at ${path.toString()}`);

		this.name = 'NotFoundError';
	}
}

export function notFound(path: string | URL) {
	throw new NotFoundError(path);
}

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
