import MagicString from 'magic-string';
import { matches } from 'src/utils/matches';
import type { Plugin } from 'vite';
import type { Options } from '../types';
import { transformFormAction } from './actions';
import { transformLoaderData } from './transform-loader-data';
import { parse } from './utils/ast';

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
				const relativeFilePath = id.split(routesDir)[1];

				// Use magic string so our transformations don't break the source map
				let string = new MagicString(code);

				const ast = parse(code);
				string = transformLoaderData(code, string);
				string = transformFormAction({ ast, relativeFilePath, code, string });

				return { code: string.toString(), map: string.generateMap() };
			}
		},
	};
}
