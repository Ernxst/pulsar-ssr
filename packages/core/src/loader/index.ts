import { getLoaderData } from 'src/hooks/internal';
import type { LoaderFunction, inferLoaderData } from './types';

export type {
	LoaderFunction,
	LoaderFunctionArgs,
	inferLoaderData,
} from './types';

export function useLoaderData<
	TLoader extends LoaderFunction<any, any, any>,
>(): inferLoaderData<TLoader> {
	// @ts-expect-error it's fine
	// eslint-disable-next-line @typescript-eslint/no-invalid-this
	return getLoaderData.bind(this)(this);
}
