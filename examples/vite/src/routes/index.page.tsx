import { type LoaderContext, useLoaderData } from 'pulsar/loader';
import type { RouteContext } from 'pulsar/route';

export function POST({ json }: RouteContext) {
	return json({ foo: '' });
}

export function PUT({ json }: RouteContext) {
	return json({ foo: '' });
}

export async function PATCH({ json }: RouteContext) {
	return json({ foo: '' });
}

export function loader({ request }: LoaderContext) {
	return [{ id: 1, name: 'John Doe', cookie: request.headers.get('cookie') }];
}

export default function Page() {
	const data = useLoaderData<typeof loader>();
	return (
		<>
			<h1>Hello World</h1>
			<ul>
				{data.map((user) => (
					<li key={user.id}>{user.name}</li>
				))}
			</ul>
		</>
	);
}
