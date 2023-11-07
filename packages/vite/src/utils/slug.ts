import path from 'node:path';
import slugify from 'slugify';
import type { TransformedPage } from 'src/transform-page/transform-page';

/**
 * Convert a file URL into an API endpoint
 */
export function fileToPathname(filename: string): string {
	filename = getFilename(filename);
	const slug = slugify(filename, { lower: true });
	return replaceFileTypeSuffix(`/${slug}`, '')
		.replace(/\/index$/, '/')
		.replaceAll('//', '/');
}

function replaceFileTypeSuffix(filename: string, replacement: string) {
	return filename.replace('.page', replacement).replace('.server', replacement);
}

export function getOutputFilename(file: string, type: keyof TransformedPage) {
	return replaceFileTypeSuffix(file, `.${type}`).replace(
		path.extname(file),
		'.mjs'
	);
}

function getFilename(filename: string) {
	return path.basename(filename, path.extname(filename));
}
