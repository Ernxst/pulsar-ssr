import { actionDataSymbol } from 'src/internal/constants';
import type { ActionFunction, inferActionOutput } from './types';

export type {
	Actions,
	ActionFunction,
	ActionFunctionArgs,
	inferActionOutput,
} from './types';

export function useActionData<
	TAction extends ActionFunction<any, any, any, any>,
>(): Awaited<inferActionOutput<TAction>> {
	// This will be set through function binding at build-time
	// @ts-expect-error it's fine
	// eslint-disable-next-line @typescript-eslint/no-invalid-this
	return this[actionDataSymbol];
}
