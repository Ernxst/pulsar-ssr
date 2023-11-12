import type { ErrorOrWarning } from './types';

export interface PulsarError extends ErrorOrWarning, Error {
	readonly type: 'ERROR';
}
