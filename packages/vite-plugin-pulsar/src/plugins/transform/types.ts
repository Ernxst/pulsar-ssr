import type * as parser from '@pulsarjs/parser';

export interface TransformOptions extends ValidateOptions {
	/**
	 * The server entry file (i.e., src/root.tsx)
	 */
	entry: string;
	/**
	 * The directory where routes are located
	 */
	routesDir: string;
}

export interface ValidateOptions {
	/**
	 * The absolute file path of the module
	 */
	id: string;
	/**
	 * The relative file path of the module
	 */
	relativeId: string;
	ast: parser.Program;
	/**
	 * Raw source code, before any JSX transformations
	 * have been applied
	 */
	code: string;
}

export interface PulsarTransformer {
	/**
	 * Transform the AST as required, returning the updated
	 * AST.
	 */
	transform(options: TransformOptions): parser.Program;
	validate(options: ValidateOptions): void;
}
