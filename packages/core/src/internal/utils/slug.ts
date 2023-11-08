import path from 'node:path';

/**
 * Convert a file URL into an API endpoint
 */
export function fileToPathname(filePath: string): string {
	filePath = filePath
		.replace('.page', '')
		.replace('.server', '')
		.replace(path.extname(filePath), '')

	return transformPathToUrl(filePath);
}

// https://github.com/wobsoriano/elysia-autoroutes/blob/0d35c8140cd088dfe8908994162fa77926883dd9/src/utils/transformPathToUrl.ts
export function transformPathToUrl(filePath: string): string {
	const url = `/${filePath}`; // Add leading slash to the URL

	if (url.length === 1) return url; // If the URL is just "/", return it as is

	const resultUrl = url
		.split(path.sep)
		.map((part) => handleParameters(part))
		.join('/'); // Map and join the URL parts using handleParameters function

	// Remove 'index' from the end of the URL if it exists
	let finalUrl = resultUrl.endsWith('index')
		? resultUrl.replace(/\/?index$/, '')
		: resultUrl;

	// Remove the trailing slash from the URL if it exists
	finalUrl = finalUrl.replace(/\/$/, '');

	// If the URL is empty, replace it with the root path "/"
	if (finalUrl.length === 0) return '/';

	// Replace multiple slashes with a single slash
	return finalUrl.replace(/\/{2,}/g, '/');
}

// https://github.com/wobsoriano/elysia-autoroutes/blob/0d35c8140cd088dfe8908994162fa77926883dd9/src/utils/handleParameters.ts
function handleParameters(token: string) {
	const replacements = [
		// Clean the url extensions
		{ regex: /\.(ts|js|mjs|cjs|jsx|tsx)$/u, replacement: '' },

		// Handle wild card based routes - users/[...id]/profile.ts -> users/*/profile
		{ regex: /\[\.\.\..+\]/gu, replacement: '*' },

		// Handle generic square bracket based routes - users/[id]/index.ts -> users/:id
		{
			regex: /\[(.*?)\]/gu,
			replacement: (_subString: string, match: string) => `:${match}`,
		},

		// Handle the case when multiple parameters are present in one file
		// users / [id] - [name].ts to users /: id -:name and users / [id] - [name] / [age].ts to users /: id -: name /: age
		{ regex: /\]-\[/gu, replacement: '-:' },
		{ regex: /\]\//gu, replacement: '/' },
		{ regex: /\[/gu, replacement: '' },
		{ regex: /\]/gu, replacement: '' },
	];

	let url = token;

	for (const { regex, replacement } of replacements)
		url = url.replace(regex, replacement as any);

	return url;
}
