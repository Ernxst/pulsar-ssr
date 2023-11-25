/// <reference lib="dom" />
import type { WsMessage } from 'src/internal/hmr/types';

function liveReloadConnect(config?: { onOpen: () => any }) {
	console.debug('[vite] connecting...');

	const protocol = String(process.env.PULSAR_HMR_PROTOCOL);
	const hostname = window.location.hostname;
	const url = new URL(`${protocol}//${hostname}/socket`);
	url.port = String(process.env.PULSAR_HMR_PORT);

	const ws = new WebSocket(url.href);
	ws.onmessage = (message) => {
		const event = JSON.parse(message.data) as WsMessage;
		if (event.type === 'connected') {
			console.debug('[vite] connected.');
		} else if (event.type === 'LOG') {
			console.log(event.message);
		} else if (event.type === 'RELOAD') {
			if (event.force || window.location.pathname === event.path) {
				console.log('💿 Reloading window ...');
				window.location.reload();
			} else {
				console.log(`💿 file://${event.path} updated. Will not reload`);
			}
		} else if (event.type === 'HMR') {
			// @ts-expect-error it's fine
			if (!window.__hmr__ || !window.__hmr__.contexts) {
				console.log('💿 [HMR] No HMR context, reloading window ...');
				window.location.reload();
			}
		}
	};

	ws.onopen = () => {
		if (config && typeof config.onOpen === 'function') {
			config.onOpen();
		}
	};

	ws.onclose = (event) => {
		if (event.code === 1006) {
			console.log('Pulsar dev asset server web socket closed. Reconnecting...');
			setTimeout(
				() =>
					liveReloadConnect({
						onOpen: () => window.location.reload(),
					}),
				1000
			);
		}
	};

	ws.onerror = (error) => {
		console.log('Pulsar dev asset server web socket error:');
		console.error(error);
	};
}

// Dead Code Elimination magic for production builds.
// This way devs don't have to worry about doing the NODE_ENV check themselves.
export const LiveReload =
	process.env.NODE_ENV !== 'development'
		? () => <></>
		: function LiveReload() {
				const js = String.raw;

				return (
					<>
						<script
							dangerouslySetInnerHTML={{
								__html: js`
${liveReloadConnect.toString()}
liveReloadConnect()
`,
							}}
						></script>
					</>
				);
		  };
