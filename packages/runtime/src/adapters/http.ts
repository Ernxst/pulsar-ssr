import type { IncomingMessage, ServerResponse } from 'node:http';
import { createPulsarRequest, sendPulsarResponse } from 'src/utils/http';
import type { ServerBuild } from 'src/router/types';
import { createFetchRequestHandler } from './fetch';

export function createHttpRequestHandler({ build }: { build: ServerBuild }) {
	// creates a Fetch API request handler from the server build
	const handleRequest = createFetchRequestHandler({ build });

	// returns an express.js specific handler for the express server
	return async (req: IncomingMessage, res: ServerResponse<IncomingMessage>) => {
		// adapts the express.req to a Fetch API request
		const request = createPulsarRequest(req);

		// calls the app handler and receives a Fetch API response
		const response = await handleRequest(request);

		// adapts the Fetch API response to the express.res
		sendPulsarResponse(res, response);
	};
}
