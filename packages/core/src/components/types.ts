import type { Component } from '@kitajs/html';

export type Props = Record<string, any>;

export interface HtmlEscaped {
	isEscaped: true;
}

export type HtmlEscapedString = string & HtmlEscaped;

export type ComponentProps<TComponent extends Component<any>> =
	TComponent extends Component<infer TProps> ? TProps : never;
