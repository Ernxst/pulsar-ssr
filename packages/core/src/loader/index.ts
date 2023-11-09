import { loaderDataSymbol } from 'src/internal/constants';
import type { LoaderFunction, inferLoaderData } from './types';

export type {
	LoaderFunction,
	LoaderFunctionArgs,
	inferLoaderData,
} from './types';

export function useLoaderData<
	TLoader extends LoaderFunction<any, any, any>,
>(): inferLoaderData<TLoader> {
	// This will be set through function binding at build-time
	// @ts-expect-error it's fine
	// eslint-disable-next-line @typescript-eslint/no-invalid-this
	return this[loaderDataSymbol];
}
