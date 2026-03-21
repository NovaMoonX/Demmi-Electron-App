const recipe = require('./handlers/recipe');
const webpage = require('./handlers/webpage');

// Add new handler modules here as the app grows.
// Each module must export a `register(ipcMain)` function.
const handlers = [webpage, recipe];

/**
 * Register all IPC handlers with the provided ipcMain instance.
 * @param {Electron.IpcMain} ipcMain
 */
function registerIpcHandlers(ipcMain) {
	for (const handler of handlers) {
		handler.register(ipcMain);
	}
}

module.exports = { registerIpcHandlers };
