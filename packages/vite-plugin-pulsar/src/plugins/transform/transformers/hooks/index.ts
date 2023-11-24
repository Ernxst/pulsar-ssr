import type { PulsarTransformer } from '../../types';
import { bindFunctionUsage } from '../loader-data';

export function createHookESQuery(hookName: string) {
	return `CallExpression:has(Identifier[name=${hookName}])`;
}

const Queries = {
	USE_LOCATION: createHookESQuery('useLocation'),
	USE_PARAMS: createHookESQuery('useParams'),
};

/**
 * Transform usages of all hooks
 */
export const PulsarHooks: PulsarTransformer = {
	validate() {},
	transform({ ast, string }) {
		for (const query of Object.values(Queries)) {
			ast = bindFunctionUsage(ast, query, string);
		}

		return ast;
	},
};
