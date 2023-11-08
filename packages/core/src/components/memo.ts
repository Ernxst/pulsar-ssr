import type { Children, Component } from '@kitajs/html';
import type { HtmlEscapedString, Props } from './types';

/**
 * Wrap a component in memo to get a memoized version of that component. This
 * memoized version of your component will usually not be re-rendered when its
 * parent component is re-rendered as long as its props have not changed
 */
export function memo<TProps extends Props>(
	component: Component<TProps>,
	propsAreEqual: (
		prevProps: Readonly<TProps>,
		nextProps: Readonly<TProps>
	) => boolean = shallowEqual
): Component<TProps> {
	let computed;
	let prevProps: TProps | undefined;

	return ((props: TProps & { children?: Children }): HtmlEscapedString => {
		if (prevProps && !propsAreEqual(prevProps, props)) {
			computed = undefined;
		}
		prevProps = props;
		return (computed ||= component(props));
	}) as Component<TProps>;
}

function shallowEqual(a: Props, b: Props): boolean {
	if (a === b) {
		return true;
	}

	const aKeys = Object.keys(a);
	const bKeys = Object.keys(b);
	if (aKeys.length !== bKeys.length) {
		return false;
	}

	for (let i = 0, len = aKeys.length; i < len; i++) {
		if (a[aKeys[i]] !== b[aKeys[i]]) {
			return false;
		}
	}

	return true;
}
