import type { SourceFile } from 'ts-morph';
import { ts } from 'ts-morph';

export function formatCode(ast: SourceFile) {
	ast.organizeImports();
	ast.formatText({
		semicolons: ts.SemicolonPreference.Insert,
		// indentStyle: ts.IndentStyle.Smart,
		// convertTabsToSpaces: false,
		// tabSize: 4,
		indentSize: 2,
	});

	return ast.getText();
}
