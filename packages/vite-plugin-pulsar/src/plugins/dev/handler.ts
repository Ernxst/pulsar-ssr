import type { ReloadMessage } from 'pulsar/internal';
import { matchesLayout, matchesRoute } from 'src/utils/matches';
import type { ViteDevServer } from 'vite';
import { transformPathToUrl } from '@pulsarjs/runtime';
import { getLayoutsForPage } from '../transform/transformers/layouts/utils/get-layouts-for-page';
import { getCurrentPath, isDependencyOf } from './utils';

interface Options {
	vite: ViteDevServer;
	routesDir: string;
	serverEntry: string;
	routes: string[];
}

export function createHandler({
	vite,
	serverEntry,
	routesDir,
	routes,
}: Options) {
	const is = {
		/** @returns true if the `id` is a page */
		page(id: string) {
			return matchesRoute(id, routesDir);
		},
		/** @returns true if the `id` is the  {@linkcode serverEntry} */
		entry(id: string) {
			return id === serverEntry;
		},
		/**
		 * @returns true if the `id` is a file is a layout file, but not the root
		 * layout
		 */
		layout(id: string) {
			return !this.entry(id) && matchesLayout(id, routesDir);
		},
		asset: {
			andDependencyOf: {
				/**
				 * @returns true if the `id` is a file that is imported by
				 * {@linkcode serverEntry}
				 */
				root(id: string) {
					return Boolean(isDependencyOf(id, vite, (file) => is.entry(file)));
				},
				/**
				 * @returns true if the `id` is a file that is imported by a layout that
				 * is used by the current page
				 */
				layout(id: string) {
					const importer = isDependencyOf(id, vite, (file) => is.layout(file));
					// If id wasn't imported by a layout - we don't care here
					if (!importer) return false;

					// Get the current url of the browser
					const url = getCurrentPath(vite);
					if (!url) return false;

					// Get the page associated with the current url of the browser
					const page = routes.find(
						(route) => transformPathToUrl(route) === url.pathname
					);
					if (!page) return false;

					// Return true if the importer is among the layouts that were rendered for the current page
					const layouts = getLayoutsForPage({
						absoluteFilePath: page,
						routesDir,
					});
					return layouts.includes(importer);
				},
				/**
				 * @returns true if the `id` is a file that is imported by the current
				 * page
				 */
				page(id: string) {
					const url = getCurrentPath(vite);
					if (!url) return false;

					return Boolean(
						isDependencyOf(id, vite, (file) => {
							return (
								matchesRoute(file, routesDir) &&
								transformPathToUrl(file) === url.pathname
							);
						})
					);
				},
			},
		},
	};

	const send = {
		reload(id: string, opts: Pick<ReloadMessage, 'force'> = { force: false }) {
			const relative = id.split(routesDir)[1];
			const path = transformPathToUrl(relative);
			// @ts-expect-error our own custom message
			vite.ws.send({ type: 'RELOAD', force: opts.force, path, id });
		},
		async restart(id: string) {
			await vite.restart();
			this.reload(id, { force: true });
		},
	};

	return { is, send };
}
