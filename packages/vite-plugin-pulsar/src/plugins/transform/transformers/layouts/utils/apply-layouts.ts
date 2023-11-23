import * as parser from '@pulsarjs/parser';
import type MagicString from 'magic-string';

export function applyLayouts(
	pageIdentifier: string,
	layoutModules: { identifier: string }[],
	string: MagicString
) {
	const openComponents = layoutModules
		.map(({ identifier }, idx) => {
			/** +3 because there's 3 indents inside the JSX fragment in the return  */
			const indent = '  '.repeat(idx + 3);
			return `${indent}<${identifier}>`;
		})
		.join('\n')
		.trimStart();

	/**
	 * We need to bind it because the return values of useLoaderData and
	 * useActionData will be set on the function. Now that we are exporting a
	 * different function, we make sure the page is bound to the same scope
	 */
	const modifiedPageIdentifier = `Page__${pageIdentifier}_1`;
	const pageIndent = '  '.repeat(layoutModules.length);

	const closedComponents = layoutModules
		.reverse()
		.map(({ identifier }, idx) => {
			/** Plus two because we use one line for the page component */
			const indent = '  '.repeat(layoutModules.length - idx + 2);
			return `${indent}</${identifier}>`;
		})
		.join('\n');

	const code = `
export default function __Pulsar__Page__() {
	const ${modifiedPageIdentifier} = ${pageIdentifier}.bind(this);
  return (
	<>
		${openComponents}
		${pageIndent}<${modifiedPageIdentifier} />
		${closedComponents}
	</>
  )
}`;
	string.append(code);
	return parser.parse(code);
}
