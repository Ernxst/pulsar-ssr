import { transformPathToUrl } from '@pulsarjs/runtime';
import type { Adapter } from 'src/adapters/types';

interface Options {
	adapter: Adapter;
	routes: { input: string; relative: string }[];
}

export function createServerEntry({ routes, adapter }: Options): string {
	const buildIdentifier = 'build';
	const routeIds = routes.map(({ input, relative }, idx) => ({
		importUrl: input,
		pathname: relative,
		identifier: `routes_${idx}`,
		endpoint: transformPathToUrl(relative),
	}));

	return `
	import "@kitajs/html/register";
	import { ${adapter.adapterFunction} } from "@pulsarjs/runtime/adapters";
	${routeIds
		.map(
			// Star import so all exported functions are included in module
			({ importUrl, identifier }) =>
				`import * as ${identifier} from "${importUrl}";`
		)
		.join('\n')}

	const ${buildIdentifier} = {
		routes: {
			${routeIds
				.map(
					({ pathname, identifier, endpoint }) => `"${pathname}": {
						endpoint: "${endpoint}",
						loadModule:	() => ${identifier},
					},`
				)
				.join('\n')}
		}
	}

${adapter.createServer({
	handler: `${adapter.adapterFunction}({ build: ${buildIdentifier} })`,
})}
	`;
}
