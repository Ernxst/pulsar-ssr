import { type LoaderFunctionArgs, useLoaderData } from 'pulsar/loader';
import type { RouteFunctionArgs } from 'pulsar/route';
import Html from 'pulsar/components';
import globalCssHref from '../global.css?url';
import Button from '../components/Button';

export function POST({
	request,
	response,
	runtime,
	cache,
	json,
}: RouteFunctionArgs) {
	cache({ maxAge: '2h' });
	response.headers.set('x-powered-by', runtime);
	return json({ runtime, userAgent: request.headers.get('user-agent') });
}

export function PUT({ json }: RouteFunctionArgs) {
	return json({ foo: '' });
}

export async function PATCH({ json }: RouteFunctionArgs) {
	return json({ foo: '' });
}

export function loader({ request, runtime }: LoaderFunctionArgs) {
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
					<p>Served on the {runtime} runtime</p>
					<Button>Click me</Button>

					<ul>
						{users.map((user) => (
							<li safe>{user.name}</li>
						))}
					</ul>
				</body>
			</html>
		</>
	);
}
