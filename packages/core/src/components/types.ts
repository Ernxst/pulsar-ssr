import type { FC, JSXNode } from 'hono/jsx';

export type Props = Record<string, any>;

export type ComponentProps<TComponent extends FC<any>> = TComponent extends FC<
	infer TProps
>
	? TProps
	: never;

// eslint-disable-next-line @typescript-eslint/ban-types
export type PropsWithChildren<TProps extends object = {}> = {
	children?: Children;
} & TProps;

export type Children = string | number | JSXNode | Children[];
