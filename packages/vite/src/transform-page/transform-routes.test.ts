import { describe, expect, test } from 'bun:test';
import { ast } from '@phenomnomnominal/tsquery';
import { transformRouteHandlers } from './transform-routes';

describe('transformRoutes', () => {
	describe('arrow function', () => {
		test('should transform routes', () => {
			const result = transformRouteHandlers(
				'users.ts',
				ast(`
export const GET = async () => {
	return [{ id: 1, name: 'John' }];
}`)
			);

			expect(result).toEqual(
				`import { createRouteContext } from "pulsar/internal";

export const GET = async () => {
  return [{ id: 1, name: 'John' }];
};

export default function routes(server) {
  server.get('/users', async function handle(elysia) {
    const context = createRouteContext(elysia);
    return await GET(context);
  });
  return server;
}
`
			);
		});
	});
});
