export interface ErrorOrWarning {
	message: string;
	/**
	 * User friendly error/warning message
	 */
	readonly description: string;
	/**
	 * Source code
	 */
	readonly code?: string;
	readonly loc?: { line: number; column: number };
	readonly errorCode: string;
	/**
	 * Link to the docs, explaining the error or warning in
	 * more detail and what can be done to fix it
	 */
	readonly docsLink: string;
	/**
	 * Relevant documentation to provide extra education.
	 */
	readonly infoLink?: string;
	/**
	 * Renders the warning in a human-friendly format.
	 */
	toString(): string;
}
