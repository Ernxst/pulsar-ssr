import { getActionData } from 'src/internal/utils/data';
import type { ActionFunction, inferActionOutput } from './types';

export type {
	ActionFunction,
	ActionFunctionArgs,
	Actions,
	inferActionOutput,
} from './types';

export function useActionData<
	TActions extends Record<string, ActionFunction<any, any, any, any>>,
>(action: keyof TActions): Awaited<inferActionOutput<TActions[typeof action]>> {
	// This will be set through function binding at build-time
	// @ts-expect-error it's fine
	// eslint-disable-next-line @typescript-eslint/no-invalid-this
	return getActionData.bind(this)(this, action);
}
