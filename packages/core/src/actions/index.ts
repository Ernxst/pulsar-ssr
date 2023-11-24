import { usePageContext } from 'src/hooks/context';
import type { ActionFunction, inferActionOutput } from './types';

export type {
	ActionFunction,
	ActionFunctionArgs,
	Actions,
	inferActionOutput,
} from './types';

export function useActionData<
	TActions extends Record<string, ActionFunction<any, any, any, any>>,
>(
	action: string & keyof TActions
): Awaited<inferActionOutput<TActions[typeof action]>> {
	return usePageContext().actionData.get(action);
}
