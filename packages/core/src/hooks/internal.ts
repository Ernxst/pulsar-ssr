import { usePageContext } from './context';

export function setActionData(key: string, actionData: any) {
	usePageContext().actionData.set(key, actionData);
}
