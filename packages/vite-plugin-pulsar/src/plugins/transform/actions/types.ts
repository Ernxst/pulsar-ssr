import type { ExportNamedDeclaration, Program } from '@babel/types';
import type MagicString from 'magic-string';

export interface ActionOptions {
	ast: Program;
	code: string;
	string: MagicString;
	relativeFilePath: string;
	actions?: {
		node: ExportNamedDeclaration;
		namedActions: Set<string>;
	};
}
