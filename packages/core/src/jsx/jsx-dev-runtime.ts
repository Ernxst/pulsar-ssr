import './index';
import './intrinsic-elements';

// Need to manually redeclare the namespace so Hono doesn't overwrite it
declare global {
	namespace JSX {
		interface IntrinsicElements extends Pulsar.IntrinsicElements {}
	}
}

export * from 'hono/jsx/jsx-dev-runtime';
