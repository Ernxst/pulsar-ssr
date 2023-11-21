import fs from 'fs';
import MagicString from 'magic-string';
import { matches, matchesRoute } from 'src/utils/matches';
import { type Plugin, type ResolvedConfig, transformWithEsbuild } from 'vite';
import type { Options } from '../types';
import { validateModule } from '../validate';
import { transformFormAction } from './actions';
import { applyLayoutsToPage } from './layouts';
import { transformLoaderData } from './transform-loader-data';
import { parse } from './utils/ast';

/**
 * Plugin to apply any transforms to the components
 */
export function pulsarTransform({
	routesDir,
	entry,
}: Options & { entry: string }): Plugin {
	let resolvedConfig: ResolvedConfig;

	/**
	 * If using a virtual module (i.e, virtual:...) - vite won't be able to
	 * resolve any local assets/files imported in the root layout, so we create
	 * a virtual file that has the same path as the entry (so vite can resolve)
	 * it, but add on a suffix to help us distinguish between it and the original
	 * entry
	 */
	const entryId = `${entry}?virtual`

	return {
		name: 'pulsar-transform',
		configResolved(config) {
			resolvedConfig = config;
		},
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
		resolveId(id, importer) {
			if (id === entryId) {
				return { id: entryId, "meta": { importer } };
			}
		},
		async load(id,) {
			if (id === entryId) {
				// Raw source code
				const code = fs.readFileSync(entry, 'utf8');

				/**
				 * All other pages are bundled by the time they reach the transform
				 * function below, so we bundle it here so the same happens for the
				 * root layout
				 */
				const result = await transformWithEsbuild(code, entry, {
					/**
					 * This is needed so any errors in the root layout are mapped
					 * to the source root layout file and not the virtual module
					 */
					sourcemap: true,
				});

				return result;
			}
		},
		async transform(code, id) {
			const isRootLayout = id === entryId;

			if (matches(id, routesDir) || isRootLayout) {
				// Use the entry as the id
				const filePath = isRootLayout ? entry : id;
				const relativeFilePath = filePath.split(routesDir)[1];

				// Use magic string so our transformations don't break the source map
				let string = new MagicString(code);

				const ast = parse(code);
				validateModule({ ast, relativeFilePath });

				string = transformLoaderData({ ast, relativeFilePath, code, string });
				string = transformFormAction({ ast, relativeFilePath, code, string });

				if (matchesRoute(id, routesDir)) {
					string = await applyLayoutsToPage({
						ast,
						code,
						string,
						routesDir,
						entry: entryId,
						dev: resolvedConfig.command === 'serve',
						absoluteFilePath: filePath,
					});
				}

				return {
					code: string.toString(),
					map: string.generateMap({ source: filePath, hires: 'boundary' }),
				};
			}
		},
	};
}
