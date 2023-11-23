import type { PulsarError } from './errors';
import type { Warning } from './warnings';

const DOCS_URL = 'https://pulsarjs.dev';

function createDocsLink(pathname: string) {
	return new URL(pathname, DOCS_URL).toString();
}

export function createWarning(
	warning: Omit<Warning, 'type' | 'toString'>
): Warning {
	const { docsLink, infoLink, ...rest } = warning;
	return {
		...rest,
		type: 'WARNING',
		docsLink: createDocsLink(docsLink),
		infoLink: infoLink ? createDocsLink(infoLink) : undefined,
		toString() {
			return `${warning.description}
Documentation: ${this.docsLink}
${this.infoLink ? `See ${this.infoLink} for more information.` : ''}
`.trim();
		},
	};
}

export class PulsarException extends Error implements PulsarError {
	public readonly type = 'ERROR';
	public readonly errorCode: string;
	public readonly message: string;
	public readonly description: string;
	public readonly docsLink: string;
	public readonly infoLink?: string | undefined;

	constructor(error: Omit<PulsarError, 'type' | 'toString'>, cause?: unknown) {
		const { docsLink, infoLink, errorCode: code, message, description } = error;

		const raw = `
${code} ${message}
${description}
Documentation: ${docsLink}
${infoLink ? `See ${infoLink} for more information.` : ''}
`.trim();

		super(message, { cause });

		this.message = raw;
		this.description = description;
		this.errorCode = code;
		this.docsLink = createDocsLink(docsLink);
		this.infoLink = infoLink ? createDocsLink(infoLink) : undefined;
	}
}
