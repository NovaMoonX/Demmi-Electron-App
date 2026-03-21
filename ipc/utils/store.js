const Store = require('electron-store');

/**
 * Persistent app configuration store.
 *
 * Schema / defaults:
 * @property {string} ollamaBaseUrl — Base URL of the Ollama server used by all
 *   Ollama IPC handlers. Default: 'http://localhost:11434'.
 *
 * When adding new config keys, update the defaults object below and add a row
 * for `utils/store.js` in ipc/README.md.
 */
const store = new Store({
	defaults: {
		ollamaBaseUrl: 'http://localhost:11434',
	},
});

module.exports = store;
