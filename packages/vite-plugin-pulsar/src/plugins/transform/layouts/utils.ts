import path from 'node:path';
import type MagicString from 'magic-string';
import { LAYOUT_PATTERN, transformPathToUrl } from 'pulsar/internal';
import glob from 'tiny-glob/sync';
import type { Options } from '.';

const NAMESPACE_LAYOUT_REGEX = /(?<prefix>.*?)\.layout\./;

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

export function removeDefaultExport(
	string: MagicString,
	code: string,
	[start, end]: [number, number]
) {
	const target = 'default';
	const substringIndex = code.slice(start!, end!).indexOf(target);
	const defaultKeywordStart = start! + substringIndex;

	string.overwrite(
		defaultKeywordStart,
		defaultKeywordStart + target.length,
		''
	);
}

export function addLayoutImports(
	string: MagicString,
	files: string[],
	filePath: string,
	entry: string
) {
	return files.map((layout, idx) => {
		let importPath;
		let identifier;

		if (layout === entry) {
			identifier = 'Pulsar_Root_Layout';
			importPath = entry;
		} else {
			identifier = `Pulsar_Layout_${idx}`;
			const relative = path.relative(path.dirname(filePath), layout);
			const transformed = relative.startsWith('.') ? relative : `./${relative}`;
			importPath = transformed.replace(path.extname(transformed), '.js');
		}

		string.prepend(`import ${identifier} from "${importPath}";\n`);

		return { identifier };
	});
}
