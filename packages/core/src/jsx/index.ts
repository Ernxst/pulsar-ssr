/* eslint-disable @typescript-eslint/ban-types */
import './intrinsic-elements';

export * from './intrinsic-elements';

type AnyString = string & {};

declare global {
	namespace Pulsar {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		interface HTMLAttributes<T extends EventTarget> {
			children?: any;
			__dangerouslySetInnerHTML?: {
				__html?: string;
			};
		}

		interface HTMLFormAttributes {
			/**
			 * Choose which action, in your route file, this form will submit to.
			 * Note that you can only submit to actions defined in the same route file.
			 *
			 * Note that if you set this, a `POST` submission will always be made.
			 */
			formaction?: 'default' | AnyString;
		}
	}

	namespace JSX {
		interface IntrinsicElements extends Pulsar.IntrinsicElements {}
	}
}
