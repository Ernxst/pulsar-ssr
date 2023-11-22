import * as parser from '@pulsarjs/parser';
import {
	LoaderWithoutPageWarning,
	UnusedLoaderWarning,
	warnToConsole,
} from 'pulsar/internal';
import type { PulsarTransformer } from '../types';

// TODO: Use plugin context (this.error/this.warn)

const Queries = {
	USE_LOADER_DATA: `CallExpression:has(Identifier[name=useLoaderData])`,
	LOADER_FUNCTION: `ExportNamedDeclaration:has(Identifier[name=loader])`,
	LOCAL_LOADER:
		'VariableDeclaration:has(Identifier[name=loader]):has(ArrowFunctionExpression), FunctionDeclaration:has(Identifier[name=loader])',
	PAGE: 'ExportDefaultDeclaration',
};

export const LoaderData: PulsarTransformer = {
	validate({ ast, relativeId }) {
		const [loader] = parser.match(ast, Queries.LOADER_FUNCTION);
		const nodes = parser.match(ast, Queries.USE_LOADER_DATA);

		if (loader) {
			const [page] = parser.match(ast, Queries.PAGE);
			if (!page) {
				const warning = LoaderWithoutPageWarning({ filePath: relativeId });
				warnToConsole(warning);
			}
		}

		if (nodes.length) {
			if (!loader) {
				const [nonExportedLoader] = parser.match(ast, Queries.LOCAL_LOADER);
				if (nonExportedLoader) {
					throw new Error(
						`You are trying to call useLoaderData in ${relativeId} but have not exported the loader function.`
					);
				} else {
					throw new Error(
						`You cannot call useLoaderData without exporting a loader function in ${relativeId}`
					);
				}
			}
		} else if (loader) {
			const warning = UnusedLoaderWarning({ filePath: relativeId });
			warnToConsole(warning);
		}
	},
	transform({ ast }) {
		return bindFunctionUsage(ast, Queries.USE_LOADER_DATA);
	},
};

export function bindFunctionUsage(ast: parser.Program, query: string) {
	const nodes = parser.match(ast, query);
	nodes.forEach((node) => {
		const [callSite] = parser.match<parser.CallExpression>(
			node,
			'CallExpression'
		);

		parser.replace(ast, (node) => {
			if (parser.isCallExpression(node) && node === callSite) {
				const boundNode = createBoundFunction(callSite);
				node.callee = boundNode.callee as any;
				node.arguments = boundNode.arguments as any;
				// @ts-expect-error babel has slightly different types to Acorn
				node.typeParameters = boundNode.typeParameters as any;
			}
		});
	});

	return ast;
}

function createBoundFunction(node: parser.CallExpression) {
	const identifier = (node.callee as parser.Identifier).name;
	const memberExpression = parser.memberExpression(
		parser.identifier(identifier),
		parser.identifier('bind')
	);

	const bindExpression = parser.callExpression(memberExpression, [
		parser.thisExpression(),
	]);

	/**
	 * The only usages of bindFunctionUsage is to transform useLoaderData and
	 * useActionData. Therefore, if the arg is a literal, it is only possible for
	 * it to be a string literal (in useActionData)
	 *
	 * This transform is required because the
	 */
	const args = node.arguments.map((n) =>
		parser.isLiteral(n) ? parser.stringLiteral(n.value as string) : n
	);

	// @ts-expect-error babel has slightly different types to Acorn
	const expr = parser.callExpression(bindExpression, args);
	// @ts-expect-error babel has slightly different types to Acorn
	expr.typeParameters = node.typeParameters;

	return expr;
}
