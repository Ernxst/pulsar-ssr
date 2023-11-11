import { actionDataSymbol } from 'src/internal/constants';
import type { ActionFunction, inferActionOutput } from './types';

export type {
	Actions,
	ActionFunction,
	ActionFunctionArgs,
	inferActionOutput,
} from './types';

export function useActionData<
	TActions extends Record<string, ActionFunction<any, any, any, any>>,
>(action: keyof TActions): Awaited<inferActionOutput<TActions[typeof action]>> {
	// This will be set through function binding at build-time
	// @ts-expect-error it's fine
	// eslint-disable-next-line @typescript-eslint/no-invalid-this
	const actionData = this[actionDataSymbol]
	if (actionData) return actionData[action];

	return undefined as any;
}
