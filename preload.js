const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('demmiAPI', {
	/**
	 * Fetch metadata for a given URL (title, description, image, etc.)
	 * Returns an object with fields such as: url, title, description, image, siteName, author, date
	 * @param {string} url
	 * @returns {Promise<object>}
	 */
	fetchUrlMetadata: (url) => ipcRenderer.invoke('fetch-url-metadata', url),

	/**
	 * Fetch and return the plain-text recipe content from a given URL.
	 * Looks for <article> or main content elements and returns their text.
	 * @param {string} url
	 * @returns {Promise<string>}
	 */
	fetchRecipeContent: (url) => ipcRenderer.invoke('fetch-recipe-content', url),
});
