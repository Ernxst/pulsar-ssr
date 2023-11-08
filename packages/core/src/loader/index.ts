import type { Loader, inferLoaderData } from './types';

export type { Loader, LoaderArgs, inferLoaderData } from './types';

export const loaderDataSymbol = 'pulsar:loaderData'; // Symbol('pulsar:loaderData')

export function useLoaderData<
	TLoader extends Loader<any, any, any>,
>(): inferLoaderData<TLoader> {
	// This will be set through function binding at build-time
	// @ts-expect-error it's fine
	// eslint-disable-next-line @typescript-eslint/no-invalid-this
	return this[loaderDataSymbol];
}
