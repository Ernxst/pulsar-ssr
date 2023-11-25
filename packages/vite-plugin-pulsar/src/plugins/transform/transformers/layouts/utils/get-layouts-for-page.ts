import path from 'node:path';
import { LAYOUT_PATTERN } from 'pulsar/internal';
import glob from 'tiny-glob/sync';
import { transformPathToUrl } from '@pulsarjs/runtime';
import type { Options } from '..';

const NAMESPACE_LAYOUT_REGEX = /(?<prefix>.*?)\.layout\./;

/**
 * Given an absolute file path, return all the layouts in the routes directory
 * that should be rendered.
 */
export function getLayoutsForPage({
	absoluteFilePath,
	routesDir,
}: Pick<Options, 'absoluteFilePath' | 'routesDir'>) {
	const layoutFilesPattern = path.join(routesDir, LAYOUT_PATTERN);
	const relativePagePath = absoluteFilePath.split(routesDir)[1];
	const pagePath = transformPathToUrl(relativePagePath);

	const files = glob(layoutFilesPattern, { absolute: true });
	return files
		.map((file) => {
			/** Handle namespaced layouts */
			const match = file.match(NAMESPACE_LAYOUT_REGEX);
			if (match) {
				const prefix = match.groups!.prefix;
				const relativeLayoutPath = prefix.split(routesDir)[1];
				const layoutPath = transformPathToUrl(relativeLayoutPath);
				/** Namespaced layouts should only be applied to routes with the same (sub)path */
				return pagePath.startsWith(layoutPath) ? [file] : [];
			}

			/** Non-namespaced layout */
			return [file];
		})
		.flat()
		.sort((a, b) => sortLayouts(routesDir, a, b));
}

/**
 * Sort the array of layouts such that:
 *
 * - Paths with less segments appear before paths with more segments
 * - Namespaced layouts appear after general layouts
 */
function sortLayouts(routesDir: string, a: string, b: string) {
	const aRelative = a.split(routesDir)[1];
	const bRelative = b.split(routesDir)[1];

	const aPath = transformPathToUrl(aRelative);
	const bPath = transformPathToUrl(bRelative);

	const aSegments = aPath.split(path.sep);
	const bSegments = bPath.split(path.sep);

	const aLength = aSegments.length;
	const bLength = bSegments.length;

	if (aLength !== bLength) return aLength - bLength;

	const aIsNamespaced = NAMESPACE_LAYOUT_REGEX.test(aPath);
	const bIsNamespaced = NAMESPACE_LAYOUT_REGEX.test(bPath);

	if (aIsNamespaced) {
		return bIsNamespaced ? 0 : 1;
	}

	return bIsNamespaced ? -1 : 0;
}
