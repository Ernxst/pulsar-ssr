export interface PulsarInternalContext {
	location: PulsarLocation;
	params: Record<string, string>;
	searchParams: URLSearchParams;
}

export interface PulsarPageContext {
	actionData: Map<string, any>;
	loaderData: { value: any };
}

export interface PulsarLocation
	extends Pick<Location, 'search' | 'pathname' | 'hash'> {}

export type Callable = (...args: any[]) => any;
