import fs from 'fs';
import * as parser from '@pulsarjs/parser';
import MagicString from 'magic-string';
import { matches, matchesRoute } from 'src/utils/matches';
import type { Plugin } from 'vite';
import type { Options } from '../types';
import { ActionData } from './transformers/action-data';
import { FormAction } from './transformers/form-action';
import { PulsarLayouts } from './transformers/layouts';
import { LoaderData } from './transformers/loader-data';
import { PulsarModule } from './transformers/module';
import type { TransformOptions } from './types';
import { PulsarContext } from './transformers/context';

/**
 * Plugin to apply any transforms to the components
 */
export function pulsarTransform({ routesDir, entry }: Options): Plugin {
	/**
	 * If using a virtual module (i.e, virtual:...) - vite won't be able to
	 * resolve any local assets/files imported in the root layout, so we create
	 * a virtual file that has the same path as the entry (so vite can resolve)
	 * it, but add on a suffix to help us distinguish between it and the original
	 * entry
	 */
	const virtualServerEntryId = `${entry}?virtual`;

	return {
		name: 'pulsar-transform',
		/** Run early so we transform the raw JSX, before it has been transformed */
		enforce: 'pre',
		/**
		 * The server entry is actually the root layout.
		 * - We need a server entry so vite knows what to build
		 * - The root layout is inherited by all pages
		 * - The server build replaces the contents of this file with a bundled router
		 * 		- This is what causes all the pages to be rendered
		 *
		 * So the issue is that we have one file that needs to behave:
		 * 1. like a server
		 * 2. like a layout
		 *
		 * To solve this, we use a virtual module for the layout functionality -
		 * whenever it is referenced, we use the original source code from the root
		 * layout.
		 *
		 * Another solution is making the entry just a server entry and not
		 * a root layout, but this would mean the file would only need something
		 * like `export {};` which does not convey its importance at all.
		 */
		resolveId(id) {
			if (id === virtualServerEntryId) {
				return { id: virtualServerEntryId };
			}
		},
		async load(id) {
			if (id === virtualServerEntryId) {
				const code = fs.readFileSync(entry, 'utf8');
				return { code };
			}
		},
		async transform(code, id) {
			const isRootLayout = id === virtualServerEntryId;
			const isRoute = matchesRoute(id, routesDir);

			if (matches(id, routesDir) || isRootLayout) {
				const filePath = isRootLayout ? entry : id;
				const relativeId = filePath.split(routesDir)[1];

				const transformers = [PulsarModule, LoaderData, ActionData, FormAction];
				if (isRoute) transformers.push(PulsarLayouts);
				transformers.push(PulsarContext);

				let ast = parser.parse(code);

				const string = new MagicString(code);
				const options: TransformOptions = {
					ast,
					relativeId,
					id,
					code,
					entry: virtualServerEntryId,
					routesDir,
					string,
					logger: this,
				};

				for (const transformer of transformers) {
					transformer.validate(options);
					ast = transformer.transform(options);
				}

				let transformed = string.toString();
				/**
				 * When transforming a route, we add a default export when applying layouts
				 * and when applying context - two default exports which is not allowed.
				 *
				 * In magic-string, there is no way to target generated code, only the
				 * original, so there's no way of removing the export produced by
				 * applying layouts, so we do it manually instead.
				 */
				if (isRoute) {
					transformed = transformed.replace(/^export default/m, 'export');
				}

				const map = string.generateMap({ hires: true, file: filePath });
				return { code: transformed, map, ast };
			}
		},
	};
}
