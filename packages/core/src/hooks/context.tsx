/// <reference lib="dom" />
import { createContext, useContext } from 'hono/jsx';
import type { LoaderFunctionArgs } from 'src/loader';
import type { PulsarInternalContext, PulsarPageContext } from './types';

const PulsarContext = createContext<PulsarInternalContext | null>(null);
const PageDataContext = createContext<PulsarPageContext | null>(null);
export const RouterContext = createContext<LoaderFunctionArgs | null>(null);

export function usePulsarContext(): PulsarInternalContext {
	const context = useContext(PulsarContext);
	if (!context) throw new Error('No internal context found');

	return context;
}

export function usePageContext(): PulsarPageContext {
	const context = useContext(PageDataContext);
	if (!context) throw new Error('No page context found');

	return context;
}

export function useRouterContext(): LoaderFunctionArgs {
	const context = useContext(RouterContext);
	if (!context) throw new Error('No router context found');

	return context;
}

export function RootContext({ children }: { children: any }) {
	const { request, params } = useRouterContext();
	const location = new URL(request.url);
	return (
		<>
			<PulsarContext.Provider
				value={{
					params,
					location,
					searchParams: location.searchParams,
				}}
			>
				{children}
			</PulsarContext.Provider>
		</>
	);
}

export function PageContext({
	children,
	loaderData,
}: {
	children: any;
	loaderData: any;
}) {
	const context = useContext(PageDataContext);
	if (context) {
		loaderData ??= context.loaderData.value;
	}

	return (
		<>
			<PageDataContext.Provider
				value={{ actionData: new Map(), loaderData: { value: loaderData } }}
			>
				{children}
			</PageDataContext.Provider>
		</>
	);
}
