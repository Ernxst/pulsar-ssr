import type { LayoutProps } from 'pulsar/layouts';
import { LiveReload } from 'pulsar/components';
import globalCssHref from './global.css?url';
import appCssHref from './app.css?url';

export default function Layout({ children }: LayoutProps) {
	return (
		<>
			<html>
				<head>
					<link rel="stylesheet" href={globalCssHref} />
					<link rel="stylesheet" href={appCssHref} />
				</head>
				<body>
					{children}
					<LiveReload />
				</body>
			</html>
		</>
	);
}
