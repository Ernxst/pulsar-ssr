/* eslint-disable @typescript-eslint/no-namespace */
export { memo, createContext, useContext, Fragment } from 'hono/jsx';
export type { HtmlEscaped, HtmlEscapedString } from 'hono/utils/html'

export type { FC, FC as Component } from 'hono/jsx';
export type {
	ComponentProps,
	Props,
	PropsWithChildren,
	Children,
} from './types';

export { LiveReload } from './LiveReload';

// eslint-disable-next-line @typescript-eslint/ban-types
type AnyString = string & {};

declare global {
	namespace Hono {
		interface FormHTMLAttributes {
			/**
			 * Choose which action, in your route file, this form will submit to.
			 * Note that you can only submit to actions defined in the same route file.
			 *
			 * Note that if you set this, a `POST` submission will always be made.
			 */
			formaction?: 'default' | AnyString;
		}
	}
}
