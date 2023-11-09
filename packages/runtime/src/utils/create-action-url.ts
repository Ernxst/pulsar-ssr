export function createActionUrl(pathname: string, actionName: string) {
	return `${pathname}/__action/${encodeURIComponent(actionName)}`;
}
