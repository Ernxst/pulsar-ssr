/* eslint-disable no-case-declarations */
type Init = Pick<Response, 'status' | 'headers'>;

/**
 * Return a response, inferring the correct `Content-Type` header and wraps
 * the body in the necessary structure.
 */
export function createResponse(body: unknown, init: Init): Response {
	switch (body?.constructor?.name) {
		case 'String':
		case 'Blob':
			return new Response(body as string | Blob, init);

		case 'Object':
		case 'Array':
			init.headers.set('Content-Type', 'application/json');
			return new Response(JSON.stringify(body), init);

		case 'ReadableStream':
			init.headers.set('Content-Type', 'text/event-stream; charset=utf-8');
			return new Response(body as ReadableStream, init);

		case undefined:
			if (!body) return new Response('', init);

			init.headers.set('Content-Type', 'application/json');
			return new Response(JSON.stringify(body), init);

		case 'Response':
			return body as Response;

		case 'Error':
			return errorToResponse(body as Error, init);

		// ? Maybe response or Blob
		case 'Function':
			// eslint-disable-next-line @typescript-eslint/ban-types
			return createResponse((body as Function)(), init);

		case 'Number':
		case 'Boolean':
			return new Response((body as number | boolean, init).toString());

		default:
			const string = JSON.stringify(body);
			if (string.charCodeAt(0) === 123) {
				init.headers.set('Content-Type', 'application/json');
				return new Response(string, init);
			}

			return new Response(string, init);
	}
}

function errorToResponse(error: Error, init: Init) {
	return new Response(
		JSON.stringify({
			name: error.name,
			message: error.message,
			cause: error.cause,
		}),
		{
			status: init.status < 400 ? 500 : init.status,
			headers: init.headers,
		}
	);
}
