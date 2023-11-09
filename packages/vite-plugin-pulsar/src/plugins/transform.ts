import MagicString from 'magic-string';
import type { Plugin } from 'vite';
import { matches } from 'src/utils/matches';
import type { Options } from './types';

/**
 * Plugin to apply any transforms to the components
 */
export function pulsarTransform({ routesDir }: Options): Plugin {
	return {
		name: 'pulsar-transform',
		transform(code, id) {
			/**
			 * Bind the usage of useLoaderData to the outer scope.
			 * This way, we can set the loader data on the outer scope,
			 * which we have access to, and then access it inside
			 * the definition of useLoaderData and then return it
			 *
			 * This means useLoaderData() will only ever return the
			 * loader data from the loader defined in the same file
			 * as the module
			 *
			 * We perform this replacement so the consumer doesn't
			 * have to bind it themselves.
			 */
			if (matches(id, routesDir)) {
				// Use magic string so our transformations don't break the source map
				const string = new MagicString(code);
				const pattern = /useLoaderData([.*?])?\(\)/g;

				let match = pattern.exec(code);
				while (match) {
					const [fullMatch, typeParam] = match;
					const start = match.index;
					const end = start + fullMatch.length;
					const replacement = `useLoaderData${typeParam ?? ''}.bind(this)()`;
					string.overwrite(start, end, replacement);
					match = pattern.exec(code);
				}

				return { code: string.toString(), map: string.generateMap() };
			}
		},
	};
}
