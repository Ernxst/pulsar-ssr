import { defineConfig } from 'vite';
import pulsar from '@pulsarjs/plugin-vite';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [pulsar()],
	// FOR DEBUGGING
	build: {
		minify: false,
	},
});
