import { existsSync } from 'fs';
import { getMimeType } from 'hono/utils/mime';
import { mergePath } from 'hono/utils/url';
import type { AssetHandler } from 'src';

export function createAssetHandler(
	readFile: (file: string) => any
): AssetHandler {
	return async function handleAssetNode(filePath) {
		const directory = import.meta ? import.meta.dir : __dirname;
		filePath = mergePath(directory, filePath);

		if (existsSync(filePath)) {
			const asset = await readFile(filePath);
			const mimeType = getMimeType(filePath);
			return new Response(asset, { headers: { 'Content-Type': mimeType! } });
		}

		return null;
	};
}
