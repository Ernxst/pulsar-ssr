import type MagicString from 'magic-string';
import { bindFunctionUsage } from './utils/bind-function';

export function transformLoaderData(code: string, string: MagicString) {
	// TODO: Validate there's a loader
	return bindFunctionUsage(code, string, 'useLoaderData');
}
