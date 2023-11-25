import { createContext } from 'hono/jsx';
import type { PageData, RouteData, UrlData } from 'src/hooks/types';
import { useRoute } from './hooks';

interface Props {
	children: any;
}

export const UrlContext = createContext<UrlData | null>(null);
export const RouteContext = createContext<RouteData | null>(null);
export const PageContext = createContext<PageData | null>(null);

export const Route = {
	Provider({ children, value }: Props & { value: RouteData['context'] }) {
		return (
			<>
				<RouteContext.Provider value={{ context: value }}>
					{children}
				</RouteContext.Provider>
			</>
		);
	},
};

export const Url = {
	Provider({ children }: Props) {
		const { request, params } = useRoute().context;
		const location = new URL(request.url);
		return (
			<>
				<UrlContext.Provider
					value={{
						params,
						location,
						searchParams: location.searchParams,
					}}
				>
					{children}
				</UrlContext.Provider>
			</>
		);
	},
};

export const Page = {
	Provider({ children, value }: Props & { value: RouteData['context'] }) {
		return (
			<>
				<PageContext.Provider
					value={{ actionData: new Map(), loaderData: { value } }}
				>
					{children}
				</PageContext.Provider>
			</>
		);
	},
};
