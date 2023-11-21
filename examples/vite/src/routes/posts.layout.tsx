import type { LayoutProps } from 'pulsar/layouts';

export default function Layout({ children }: LayoutProps) {
	return (
		<>
			<main>
				<section>
					<h1>Posts</h1>
					<div>{children}</div>
				</section>
			</main>
		</>
	);
}
