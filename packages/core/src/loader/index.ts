import type { Loader, inferLoaderData } from './types';

export type { Loader, LoaderContext, inferLoaderData } from './types';

export function useLoaderData<
	TLoader extends Loader<any, any, any>,
>(): inferLoaderData<TLoader> {
	// This is replaced at build time
	return {} as any;
}
