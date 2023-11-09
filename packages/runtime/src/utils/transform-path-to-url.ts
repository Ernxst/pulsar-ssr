// https://github.com/wobsoriano/elysia-autoroutes/blob/0d35c8140cd088dfe8908994162fa77926883dd9/src/utils/transformPathToUrl.ts
export function transformPathToUrl(filePath: string): string {
	let url = `/${filePath}`; // Add leading slash to the URL

	url = url
		.replace('.page', '')
		.replace('.server', '')
		// Replace extension
		.replace(/\.(ts|js|mjs|mts|cjs|cts|jsx|tsx)$/u, '');

	if (url.length === 1) return url; // If the URL is just "/", return it as is

	/**
	 * Replace a single occurrence of a period with a / to support flat routes
	 * Replace a single occurrence so it does not affect rest parameters
	 * This also intentionally does nto match any periods found inside parentheses
	 * or square braces
	 */
	// url = url.replace(/([^(\[.])\.([^.)\]])/g, '$1/$2');
	url = url.replace(/[^.]*\.(?![^[]*\])(?![^(]*\))[^.]*/g, (matches) => {
		const [first, ...rest] = matches.split(".");
		return `${first}/${rest}`
	});

	const resultUrl = url
		// TODO: How to use this so vite doesn't externalise it?
		// .split(path.sep)
		// This will not work on windows
		.split('/')
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
	finalUrl = finalUrl.replace(/\/{2,}/g, '/');

	if (finalUrl === '/*') return '*';
	return finalUrl;
}

// https://github.com/wobsoriano/elysia-autoroutes/blob/0d35c8140cd088dfe8908994162fa77926883dd9/src/utils/handleParameters.ts
export function handleParameters(token: string) {
	const replacements = [
		// Clean the url extensions
		{ regex: /\.(ts|js|mjs|mts|cjs|cts|jsx|tsx)$/u, replacement: '' },

		// Handle layouts - /_layout
		{
			regex: /_layout/gu,
			replacement: ``,
		},

		// Handle breaking out of parent routes - shop.projects.[id].roadmap@(shop)@(projects)
		{
			regex: /@\((.*?)\)/gu,
			replacement: ``,
		},

		// Handle paths with custom extensions - sitemap[.]xml
		{
			regex: /(.*?)\[\.\](.*?)/gu,
			replacement: (_subString: string, match1: string, match2: string) =>
				`${match1}.${match2}`,
		},

		// Handle wild card based routes - users/[...id]/profile.ts -> users/*/profile
		{ regex: /\[\.\.\..+\]/gu, replacement: '*' },

		// Handle generic optional path parameter routes - users/([id])/index.ts -> users/:id?
		{
			regex: /\(\[(.*?)\]\)/gu,
			replacement: (_subString: string, match: string) => `:${match}?`,
		},

		// Handle generic optional segments - users/(id)/index.ts -> users/id?
		{
			regex: /\((.*?)\)/gu,
			replacement: (_subString: string, match: string) => `${match}?`,
		},

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

/**
 * [param] -> /:param - path param
 * (param) -> /param? - optional segment
 * ([param]) -> /:param? - optional path param
 * [...param] -> /* - rest param
 * ([...param]) -> /*? - optional rest param
 */
