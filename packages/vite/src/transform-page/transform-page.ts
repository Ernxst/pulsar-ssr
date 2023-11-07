import { ast } from '@phenomnomnominal/tsquery';
import { transformClientCode } from './transform-client-code';
import { transformServerCode } from './transform-server-code';
import { transformSharedCode } from './transform-shared-code';

export interface TransformedPage {
	/**
	 * Code that runs only on the server. This typically includes the loader data
	 */
	server: string | null;
	/**
	 * This is run on both client and server - will usually just be the template
	 * and it's data as a prop
	 */
	shared: string | null;
	/**
	 * Code that runs only on the client - this is null if the
	 * page is server only and does not need to be hydrated
	 */
	client: string | null;
}

export function transformPage(filename: string, code: string): TransformedPage {
	const sourceFile = ast(code);
	const serverCode = transformServerCode(filename, sourceFile);
	const sharedCode = transformSharedCode(filename, sourceFile);
	const clientCode = transformClientCode(filename, sourceFile);

	return {
		server: serverCode,
		shared: sharedCode,
		client: clientCode,
	};
}
