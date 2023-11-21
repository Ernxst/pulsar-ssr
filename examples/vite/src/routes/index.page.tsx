import { type LoaderFunctionArgs, useLoaderData } from 'pulsar/loader';
import type { RouteFunctionArgs } from 'pulsar/route';
import Button from '../components/Button';
import pulsarLogo from '../assets/pulsar.svg';
import viteLogo from '/vite.svg';

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

export function loader({ runtime }: LoaderFunctionArgs) {
	return { runtime };
}

export default function Page() {
	const { runtime } = useLoaderData<typeof loader>();
	console.log('I am run on the server!');

	return (
		<>
			<div>
				<a href="https://vitejs.dev" target="_blank">
					<img src={viteLogo} class="logo" alt="Vite logo" />
				</a>
				<a href="https://react.dev" target="_blank">
					<img src={pulsarLogo} class="logo pulsar" alt="Pulsar logo" />
				</a>
			</div>
			<h1>Vite + Pulsar</h1>
			<div class="card">
				<p>Served on the {runtime} runtime</p>
				<Button>Click me</Button>
				<p>
					Edit <code>src/routes/index.page.tsx</code> and save to test hot reloading
				</p>
			</div>
			<p class="read-the-docs">
				Click on the Vite and Pulsar logos to learn more
			</p>
		</>
	);
}
