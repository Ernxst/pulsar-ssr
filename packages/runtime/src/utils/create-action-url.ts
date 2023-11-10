export const PULSAR_FORM_ACTIONS_ENDPOINT =
	'/__pulsar-form-actions__/:filename/:action';
export const PULSAR_FORM_ACTIONS_METHOD = 'POST';

export function createActionUrl(filename: string, actionName: string) {
	const pathname = filename.startsWith("/") ? filename.slice(1) : filename
	return `/__pulsar-form-actions__/${pathname}/${actionName}`;
}
