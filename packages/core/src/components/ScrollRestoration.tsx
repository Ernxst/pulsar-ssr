/// <reference lib="dom" />
import { useLocation } from 'src';
import 'src/jsx';

const STORAGE_KEY = 'positions';

export interface ScrollRestorationProps extends Pick<Pulsar.HTMLScriptAttributes, 'nonce'> {}

export function ScrollRestoration({ nonce }: ScrollRestorationProps) {
	function restoreScroll(STORAGE_KEY: string, restoreKey: string) {
		if (!window.history.state || !window.history.state.key) {
			const key = Math.random().toString(32).slice(2);
			window.history.replaceState({ key }, '');
		}

		try {
			const positions = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
			const storedY = positions[restoreKey ?? window.history.state.key];
			if (typeof storedY === 'number') {
				window.scrollTo(0, storedY);
			}
		} catch (error) {
			console.error(error);
			sessionStorage.removeItem(STORAGE_KEY);
		}
	}

	const js = String.raw;
	const location = useLocation();
	const key = location.pathname;

	return (
		<>
			<script
				nonce={nonce ?? undefined}
				dangerouslySetInnerHTML={{
					__html: js`
${restoreScroll.toString()}		
restoreScroll(${STORAGE_KEY}, ${key})
`,
				}}
			/>
		</>
	);
}
