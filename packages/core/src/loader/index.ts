import { usePageContext } from 'src/hooks/context';
import type { LoaderFunction, inferLoaderData } from './types';

export type {
	LoaderFunction,
	LoaderFunctionArgs,
	inferLoaderData,
} from './types';

export function useLoaderData<
	TLoader extends LoaderFunction<any, any, any>,
>(): inferLoaderData<TLoader> {
	return usePageContext().loaderData.value;
}
