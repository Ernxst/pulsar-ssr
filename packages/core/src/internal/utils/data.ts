const loaderDataSymbol = 'pulsar:loaderData'; // Symbol('pulsar:loaderData')
const actionDataSymbol = 'pulsar:actionData'; // Symbol('pulsar:actionData')

export function setLoaderData(Page: () => any, loaderData: any) {
	(Page as any)[loaderDataSymbol] = loaderData;
}

export function getLoaderData(this: any) {
	return this[loaderDataSymbol];
}

export function setActionData(Page: () => any, key: string, actionData: any) {
	(Page as any)[actionDataSymbol] ??= {};
	(Page as any)[actionDataSymbol][key] = actionData;
}

/**
 * This assumes that this function has already been bound to
 * a page
 */
export function getActionData(this: any, actionKey: string) {
	const actionData = this[actionDataSymbol];
	if (actionData) return actionData[actionKey];

	return undefined as any;
}
