export const HTTP_METHODS = [
	'POST',
	'GET',
	'PUT',
	'PATCH',
	'DELETE',
	'OPTIONS',
	'HEAD',
] as const;

export type HttpMethod = (typeof HTTP_METHODS)[number];

export const Identifiers = {
	ROUTES_FUNCTION: 'routes',
	ROUTES_FUNCTION_PARAM: 'server',
	PAGE_LOADER_DATA: 'loaderData',
};
