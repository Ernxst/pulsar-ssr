import { replace } from '@phenomnomnominal/tsquery';

/**
 * Remove nodes in the code that match the queries
 */
export function removeByQueries(code: string, queries: string[]) {
	for (const query of queries) {
		code = replace(code, query, () => '');
	}

	return code;
}
