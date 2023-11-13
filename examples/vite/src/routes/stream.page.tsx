import { LiveReload, Suspense } from 'pulsar/components';

export const stream = true;

async function AsyncComponent({ delay = 1000 }: { delay: number }) {
	await new Promise((resolve) => setTimeout(resolve, delay)); // sleep 1s
	return <div>Hi!</div>;
}

export default function Page() {
	return (
		<>
			<html>
				<body>
					<Suspense fallback={<div>loading...</div>}>
						<AsyncComponent delay={2000} />
					</Suspense>
					<LiveReload />
				</body>
			</html>
		</>
	);
}
