/* eslint-disable @typescript-eslint/no-namespace */
export { memo } from './memo';
export { createContext, useContext } from './context';

export type { ComponentProps, HtmlEscapedString, Props } from './types';
export type { Children, Component, PropsWithChildren } from '@kitajs/html';

export { Html as default } from '@kitajs/html';

export { LiveReload } from './LiveReload';

// eslint-disable-next-line @typescript-eslint/ban-types
type AnyString = string & {};

declare global {
	namespace JSX {
		interface HtmlFormTag {
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
