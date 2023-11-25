import type { LoaderFunctionArgs } from 'src/loader';
import type { QueryParams, UrlPath } from 'src/types';
import { usePage } from './internal/context/hooks';

// eslint-disable-next-line @typescript-eslint/ban-types
type AnyString = string & {};

/**
 * Define a record of form actions the current page supports. Each
 * key is a different named action.
 */
export type Actions =
	| Record<'default' | AnyString, ActionFunction<any, any, any, any>>
	| Record<AnyString, ActionFunction<any, any, any, any>>;

export interface ActionFunctionArgs<
	TPath extends UrlPath = any,
	TQuery extends QueryParams = QueryParams,
	TBody = unknown,
> extends LoaderFunctionArgs<TPath, TQuery> {
	/**
	 * The parsed request body. If you have supplied a body schema, it
	 * will have been validated against it.
	 */
	body: TBody;
}

export type ActionFunction<
	TPath extends UrlPath,
	TQuery extends QueryParams,
	TBody,
	TOut,
> = (context: ActionFunctionArgs<TPath, TQuery, TBody>) => TOut;

export type inferActionOutput<
	TAction extends ActionFunction<any, any, any, any>,
> = TAction extends ActionFunction<
	infer _TPath,
	infer _TQuery,
	infer _Body,
	infer TData
>
	? TData
	: never;

export function useActionData<
	TActions extends Record<string, ActionFunction<any, any, any, any>>,
>(
	action: string & keyof TActions
): Awaited<inferActionOutput<TActions[typeof action]>> {
	return usePage().actionData.get(action);
}
