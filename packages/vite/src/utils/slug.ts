import path, { win32 } from 'node:path';

/**
 * Convert a file URL into an API endpoint
 */
export function fileToPathname(filePath: string): string {
	filePath = filePath
		.replace('.page', '')
		.replace('.server', '')
		.replace(path.extname(filePath), '')
		.replace(/\[(.*?)\]/g, (match, placeholder) => `:${placeholder}`);

	const slug = buildReactRemixRoutePath(filePath) ?? '';
	return `/${slug}`.replace(/\/index$/, '/').replaceAll('//', '/');
}

const replaceIndexRE = /\/?index$/;

// From vite-plugin-pages
export function buildReactRemixRoutePath(node: string): string | undefined {
	const escapeStart = '[';
	const escapeEnd = ']';
	let result = '';
	let rawSegmentBuffer = '';

	let inEscapeSequence = 0;
	let skipSegment = false;
	for (let i = 0; i < node.length; i++) {
		const char = node.charAt(i);
		const lastChar = i > 0 ? node.charAt(i - 1) : undefined;
		const nextChar = i < node.length - 1 ? node.charAt(i + 1) : undefined;

		function isNewEscapeSequence() {
			return (
				!inEscapeSequence && char === escapeStart && lastChar !== escapeStart
			);
		}

		function isCloseEscapeSequence() {
			return inEscapeSequence && char === escapeEnd && nextChar !== escapeEnd;
		}

		function isStartOfLayoutSegment() {
			return char === '_' && nextChar === '_' && !rawSegmentBuffer;
		}

		if (skipSegment) {
			if (char === '/' || char === '.' || char === win32.sep)
				skipSegment = false;

			continue;
		}

		if (isNewEscapeSequence()) {
			inEscapeSequence++;
			continue;
		}

		if (isCloseEscapeSequence()) {
			inEscapeSequence--;
			continue;
		}

		if (inEscapeSequence) {
			result += char;
			continue;
		}

		if (char === '/' || char === win32.sep || char === '.') {
			if (rawSegmentBuffer === 'index' && result.endsWith('index'))
				result = result.replace(replaceIndexRE, '');
			else result += '/';

			rawSegmentBuffer = '';
			continue;
		}

		if (isStartOfLayoutSegment()) {
			skipSegment = true;
			continue;
		}

		rawSegmentBuffer += char;

		if (char === '$') {
			result += typeof nextChar === 'undefined' ? '*' : ':';
			continue;
		}

		result += char;
	}

	if (rawSegmentBuffer === 'index' && result.endsWith('index'))
		result = result.replace(replaceIndexRE, '');

	return result || undefined;
}
