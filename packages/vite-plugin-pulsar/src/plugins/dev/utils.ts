import type { ModuleNode, ViteDevServer } from 'vite';

export function getCurrentPath(vite: ViteDevServer) {
	// TODO: Might have to ping the socket to get the url
	const urls = [...vite.ws.clients].map(({ socket }) => {
		return socket.url;
	});
	// Browser not open
	if (!urls[0]) return null;

	return new URL(urls[0]);
}

// TODO: Handle nested importers e.g., page > lib file > change in lib file
export function isDependencyOf(
	id: string,
	vite: ViteDevServer,
	matches: (file: string) => boolean
) {
	const modules = vite.moduleGraph.fileToModulesMap.get(id);

	if (modules) {
		for (const module of modules.values()) {
			for (const { file } of module.importers) {
				if (file && isTransitiveDependency(vite, id, file)) return file;
				// if (file && matches(file)) return file;
			}
		}
	}

	return undefined;
}

function isTransitiveDependency(
	vite: ViteDevServer,
	sourceFilePath: string,
	targetFilePath: string
) {
	function hasDependency(moduleId: string, targetFilePath: string) {
		const moduleInfo = vite.moduleGraph.idToModuleMap.get(moduleId);
		if (!moduleInfo) return false;

		for (const dep of moduleInfo.importers) {
			if (
				dep.id &&
				(dep.id === targetFilePath || hasDependency(dep.id, targetFilePath))
			) {
				return true;
			}
		}

		return false;
	}

	return hasDependency(sourceFilePath, targetFilePath);
}
