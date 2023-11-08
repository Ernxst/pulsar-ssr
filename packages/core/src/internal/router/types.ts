import type { HTTPMethod } from 'elysia';
import type { Route } from 'src/route/types';
import type { Loader } from 'src/loader/types';

export type PulsarModule = {
	[K in HTTPMethod]: Route<any, any, any, any>;
} & {
	loader: Loader<any, any, any>;
	/**
	 * page component
	 */
	default: () => any;
};

export interface ModuleLoader {
	ssrLoadModule(filePath: string): Promise<Partial<PulsarModule>>;
}
