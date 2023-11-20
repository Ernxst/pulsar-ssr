import type { Child, FC } from 'hono/jsx';

type Props = Record<string, any>;

export type ComponentProps<TComponent extends FC<any>> = TComponent extends FC<
	infer TProps
>
	? TProps
	: never;

// eslint-disable-next-line @typescript-eslint/ban-types
export type PropsWithChildren<TProps extends Props = {}> = {
	children?: Child;
} & TProps;

export {
	Fragment,
	JSXNode,
	Child as Children,
	FC as Component,
} from 'hono/jsx';
