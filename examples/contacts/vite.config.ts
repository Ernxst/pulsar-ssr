import pulsar from '@pulsarjs/vite-plugin-pulsar';
import { bun } from '@pulsarjs/vite-plugin-pulsar/adapters';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [pulsar({ adapter: bun() })],
});
