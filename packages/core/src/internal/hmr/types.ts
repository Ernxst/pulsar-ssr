export interface LogMessage {
	type: 'LOG';
	message: string;
}

/** Message to perform a full browser reload */
export interface ReloadMessage {
	type: 'RELOAD';
	id: string;
	path: string;
	force: boolean;
}

export interface HmrMessage {
	type: 'HMR';
}

export interface ConnectedMessage {
	type: 'connected';
}

export type WsMessage =
	| LogMessage
	| ReloadMessage
	| HmrMessage
	| ConnectedMessage;
