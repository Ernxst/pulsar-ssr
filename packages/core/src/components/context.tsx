import type { Component } from '@kitajs/html';
import Html from '@kitajs/html';
import type { HtmlEscapedString } from './types';

export interface Context<TData> {
	values: TData[];
	Provider: Component<{ value: TData }>;
}

export function createContext<TData>(defaultValue: TData): Context<TData> {
	const values = [defaultValue];
	return {
		values,
		Provider(props): HtmlEscapedString {
			values.push(props.value);

			console.log(props.value);

			// eslint-disable-next-line no-new-wrappers
			const res = new String(
				props.children
					? (Array.isArray(props.children)
							? Html.Fragment({ children: props.children }) //  new JSXNode('', {}, props.children)
							: props.children
					  ).toString()
					: ''
			) as HtmlEscapedString;
			res.isEscaped = true;

			console.log('!!! L-30 createContext - res', res);
			console.log('!!! L-31 createContext - values', values);

			values.pop();
			console.log('!!! L-34 createContext - values', values);

			return res;
		},
	};
}

export function useContext<TData>(context: Context<TData>): TData {
	console.log('!!! L-42 useContext - context', context);
	return context.values[context.values.length - 1];
}
