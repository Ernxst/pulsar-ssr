import type MagicString from 'magic-string';
import { bindFunctionUsage } from '../utils/bind-function';

export function transformActionData(code: string, string: MagicString) {
	return bindFunctionUsage(code, string, 'useActionData');
}
