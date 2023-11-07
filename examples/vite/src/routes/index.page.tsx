import { type LoaderArgs, useLoaderData } from 'pulsar/loader';
import type { RouteArgs } from 'pulsar/route';
import globalCssHref from '../global.css?url';

export function POST({ request, response, runtime, cache, json }: RouteArgs) {
	cache({ maxAge: '2h' });
	response.headers.set('x-powered-by', runtime);
	return json({ runtime, userAgent: request.headers.get('user-agent') });
}

export function PUT({ json }: RouteArgs) {
	return json({ foo: '' });
}

export async function PATCH({ json }: RouteArgs) {
	return json({ foo: '' });
}

export function loader({ request, runtime }: LoaderArgs) {
	const users = [
		{ id: 1, name: 'John Doe', cookie: request.headers.get('cookie') },
	];
	return { users, runtime };
}

export default function Page() {
	const { users, runtime } = useLoaderData<typeof loader>();
	console.log('I am run on the server!');

	return (
		<>
			<html>
				<head>
					<link rel="stylesheet" href={globalCssHref} />
				</head>
				<body>
					<h1>Hello World</h1>
					<p>Served on {runtime}</p>
					<ul>
						{users.map((user) => (
							<li key={user.id}>{user.name}</li>
						))}
					</ul>
				</body>
			</html>
		</>
	);
}
