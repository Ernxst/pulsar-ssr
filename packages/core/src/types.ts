export type UrlPath = '' | `/${string}`;

export type QueryParams =
	| Record<string, string>
	| Record<string, string | null>;

export type inferPathParams<TPath extends UrlPath> = {
	[K in ParamKeys<TPath>]: string;
	// eslint-disable-next-line @typescript-eslint/ban-types
} & {};

// https://github.com/honojs/hono/blob/9cb6b37fa3484eda479f9fb5f9c16757009c841a/src/types.ts#L523-L538
export type ParamKeys<Path> = Path extends `${infer Component}/${infer Rest}`
	? ParamKey<Component> | ParamKeys<Rest>
	: ParamKey<Path>;

export type ParamKeyToRecord<T extends string> = T extends `${infer R}?`
	? Record<R, string | undefined>
	: { [K in T]: string };

type ParamKeyName<NameWithPattern> =
	NameWithPattern extends `${infer Name}{${infer _Pattern}`
		? Name
		: NameWithPattern;

type ParamKey<Component> = Component extends `:${infer NameWithPattern}`
	? ParamKeyName<NameWithPattern>
	: never;
