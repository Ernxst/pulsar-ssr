import type * as parser from '@pulsarjs/parser';
import type MagicString from 'magic-string';
import type { Plugin } from 'vite';

export interface TransformOptions extends ValidateOptions {
	/**
	 * The server entry file (i.e., src/root.tsx)
	 */
	entry: string;
	/**
	 * The directory where routes are located
	 */
	routesDir: string;
	/**
	 * When modifying the AST, you must also update this to ensure the
	 * source map is built correctly.
	 *
	 * Maybe in the future I'll find a way to have AST transformations
	 * that build the sourcemap correctly
	 */
	string: MagicString;
}

/** Do this instead of importing from rollup as it's not actually a dependency */
type ThisArgument<T> = Extract<T, Callable> extends (
	this: infer U,
	...args: any[]
) => any
	? U
	: unknown;
type Callable = (...args: any[]) => any;
type TransformPluginContext = ThisArgument<Plugin['transform']>;

export type Logger = Pick<
	TransformPluginContext,
	'error' | 'info' | 'warn' | 'debug'
>;

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
	logger: Logger;
}

export interface PulsarTransformer {
	/**
	 * Transform the AST as required, returning the updated
	 * AST.
	 */
	transform(options: TransformOptions): parser.Program;
	validate(options: ValidateOptions): void;
}
