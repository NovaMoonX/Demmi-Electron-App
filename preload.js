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

	// ── Ollama config ────────────────────────────────────────────────────────

	/** Returns the stored Ollama base URL string. */
	ollamaGetBaseUrl: () => ipcRenderer.invoke('config:get-ollama-url'),

	/** Persists a new Ollama base URL. Returns true on success. */
	ollamaSetBaseUrl: (url) => ipcRenderer.invoke('config:set-ollama-url', url),

	/** Tests whether the given URL responds like an Ollama server. Returns { ok, error? }. */
	ollamaTestBaseUrl: (url) => ipcRenderer.invoke('config:test-ollama-url', url),

	// ── Ollama health ────────────────────────────────────────────────────────

	/** Pings the stored Ollama base URL. Returns { ok, error? }. */
	ollamaHealth: () => ipcRenderer.invoke('ollama:health'),

	// ── Ollama models ────────────────────────────────────────────────────────

	/** Returns an array of locally available Ollama model objects. */
	ollamaListModels: () => ipcRenderer.invoke('ollama:list-models'),

	// ── Ollama chat / generate ───────────────────────────────────────────────

	/**
	 * Send a chat request to Ollama.
	 * If payload.stream is false (default), resolves with the full ChatResponse.
	 * If payload.stream is true, resolves with null and emits streaming events
	 * — subscribe with ollamaOnChunk / ollamaOnDone / ollamaOnError.
	 * @param {{ model: string, messages: object[], stream?: boolean, [key: string]: any }} payload
	 * @returns {Promise<object|null>}
	 */
	ollamaChat: (payload) => ipcRenderer.invoke('ollama:chat', payload),

	/**
	 * Send a generate request to Ollama.
	 * If payload.stream is false (default), resolves with the full GenerateResponse.
	 * If payload.stream is true, resolves with null and emits streaming events
	 * — subscribe with ollamaOnChunk / ollamaOnDone / ollamaOnError.
	 * @param {{ model: string, prompt: string, stream?: boolean, [key: string]: any }} payload
	 * @returns {Promise<object|null>}
	 */
	ollamaGenerate: (payload) => ipcRenderer.invoke('ollama:generate', payload),

	// ── Streaming event listeners ────────────────────────────────────────────
	// Call these before invoking ollamaChat/ollamaGenerate with stream:true.
	// Always call the matching remove* method in component cleanup to prevent
	// listener leaks.

	/** Subscribe to streamed content chunks. cb receives { type, content, done, raw }. */
	ollamaOnChunk: (cb) => ipcRenderer.on('ollama:chunk', (_event, data) => cb(data)),

	/** Subscribe to stream completion. cb receives { type }. */
	ollamaOnDone: (cb) => ipcRenderer.on('ollama:done', (_event, data) => cb(data)),

	/** Subscribe to stream errors. cb receives { type, error }. */
	ollamaOnError: (cb) => ipcRenderer.on('ollama:error', (_event, data) => cb(data)),

	/** Remove all ollama:chunk listeners (call in component cleanup). */
	ollamaRemoveChunkListener: () => ipcRenderer.removeAllListeners('ollama:chunk'),

	/** Remove all ollama:done listeners (call in component cleanup). */
	ollamaRemoveDoneListener: () => ipcRenderer.removeAllListeners('ollama:done'),

	/** Remove all ollama:error listeners (call in component cleanup). */
	ollamaRemoveErrorListener: () => ipcRenderer.removeAllListeners('ollama:error'),
});

