import type { LayoutProps } from 'pulsar/layouts';

export default function Layout({ children }: LayoutProps) {
	return (
		<>
			{children}
			<footer>Pulsar</footer>
		</>
	);
}
