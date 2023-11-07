import { describe, expect, test } from 'bun:test';
import { ast } from '@phenomnomnominal/tsquery';
import { transformServerCode } from './transform-server-code';

describe('transformServerCode', () => {
	describe('arrow function', () => {
		test('should transform loader function', () => {
			const result = transformServerCode(
				'users.page.ts',
				ast(`
        import { useLoaderData } from 'pulsar/loader';
        import type { RouteContext } from 'pulsar/route';

        export function POST({ json }: RouteContext) {
          return json({ foo: '' });
        }

        export const loader = async () => {
          return [{ id: 1, name: 'John' }];
        }

        export default async function Page() {
          const data = await useLoaderData<typeof loader>();

          return (
            <ul>
              {data.map((user) => (
                <li key={user.id}>{user.name}</li>
              ))}
            </ul>
          );
        }
`)
			);

			expect(result).toEqual(
				`import { createRouteContext } from "pulsar/internal";
import Page from "./users.shared.mjs";
function POST({ json }) {
  return json({ foo: '' });
}
const loader = async () => {
  return [{ id: 1, name: 'John' }];
};
async function GET(routeContext) {
  const loaderData = await loader(routeContext);
  return await Page(loaderData);
}
export default function routes(server) {
  server.post('/users', async function handle(elysia) {
    const context = createRouteContext(elysia);
    return await POST(context);
  });
  server.get('/users', async function handle(elysia) {
    const context = createRouteContext(elysia);
    return await GET(context);
  });
  return server;
}`
			);
		});
	});

	describe('function statement', () => {
		test('should transform loader function', () => {
			const result = transformServerCode(
				'users.page.ts',
				ast(`
        import { useLoaderData } from 'pulsar/loader';
        import type { RouteContext } from 'pulsar/route';
        
        export function POST({ json }: RouteContext) {
          return json({ foo: '' });
        }
        
        export function loader() {
          return [{ id: 1, name: 'John Doe' }];
        }
        
        export default async function Page() {
          const data = await useLoaderData<typeof loader>();
        
          return (
            <ul>
              {data.map((user) => (
                <li key={user.id}>{user.name}</li>
              ))}
            </ul>
          );
        }
`)
			);

			expect(result)
				.toEqual(`import { createRouteContext } from "pulsar/internal";
import Page from "./users.shared.mjs";
function POST({ json }) {
  return json({ foo: '' });
}
function loader() {
  return [{ id: 1, name: 'John Doe' }];
}
async function GET(routeContext) {
  const loaderData = await loader(routeContext);
  return await Page(loaderData);
}
export default function routes(server) {
  server.post('/users', async function handle(elysia) {
    const context = createRouteContext(elysia);
    return await POST(context);
  });
  server.get('/users', async function handle(elysia) {
    const context = createRouteContext(elysia);
    return await GET(context);
  });
  return server;
}`);
		});
	});
});
