const { Ollama } = require('ollama');
const store = require('../utils/store');

/**
 * Register all Ollama-related IPC handlers.
 *
 * Streaming vs. non-streaming (chat / generate)
 * ─────────────────────────────────────────────
 * Both `ollama:chat` and `ollama:generate` inspect `payload.stream`:
 *
 *   • `stream: false` (default) — awaits the full response and returns it
 *     directly as the resolved value of the `invoke()` call.
 *
 *   • `stream: true` — sends incremental chunks back to the renderer via
 *     push events and resolves the `invoke()` with `null`:
 *       - `ollama:chunk`  { type, content, done, raw }
 *       - `ollama:done`   { type }
 *       - `ollama:error`  { type, error }
 *
 * @param {Electron.IpcMain} ipcMain
 */
function register(ipcMain) {
	// ── Config ────────────────────────────────────────────────────────────────

	/**
	 * config:get-ollama-url
	 * Returns the currently stored Ollama base URL.
	 */
	ipcMain.handle('config:get-ollama-url', () => {
		return store.get('ollamaBaseUrl');
	});

	/**
	 * config:set-ollama-url
	 * Persists a new Ollama base URL.
	 */
	ipcMain.handle('config:set-ollama-url', (_event, url) => {
		store.set('ollamaBaseUrl', url);
		return true;
	});

	/**
	 * config:test-ollama-url
	 * Checks whether the given URL responds like an Ollama server.
	 * Returns { ok: boolean, error?: string }.
	 */
	ipcMain.handle('config:test-ollama-url', async (_event, url) => {
		try {
			const res = await fetch(`${url}/api/tags`, {
				signal: AbortSignal.timeout(3000),
			});
			return { ok: res.ok };
		} catch (e) {
			return { ok: false, error: e.message };
		}
	});

	// ── Health ────────────────────────────────────────────────────────────────

	/**
	 * ollama:health
	 * Pings the stored Ollama base URL.
	 * Returns { ok: boolean, error?: string }.
	 */
	ipcMain.handle('ollama:health', async () => {
		const baseUrl = store.get('ollamaBaseUrl');
		try {
			const res = await fetch(`${baseUrl}/api/tags`, {
				signal: AbortSignal.timeout(3000),
			});
			return { ok: res.ok };
		} catch (e) {
			return { ok: false, error: e.message };
		}
	});

	// ── Models ────────────────────────────────────────────────────────────────

	/**
	 * ollama:list-models
	 * Returns the array of locally available Ollama models.
	 */
	ipcMain.handle('ollama:list-models', async () => {
		const baseUrl = store.get('ollamaBaseUrl');
		const ollama = new Ollama({ host: baseUrl });
		const result = await ollama.list();
		return result.models;
	});

	// ── Chat ──────────────────────────────────────────────────────────────────

	/**
	 * ollama:chat
	 * Sends a chat request to Ollama.
	 *
	 * Pass `stream: false` (or omit it) in the payload to receive the full
	 * ChatResponse object as the return value of `invoke()`.
	 *
	 * Pass `stream: true` to receive incremental chunks via push events:
	 *   - `ollama:chunk`  { type: 'chat', content, done, raw }
	 *   - `ollama:done`   { type: 'chat' }
	 *   - `ollama:error`  { type: 'chat', error }
	 * The `invoke()` call resolves with `null` in this mode.
	 */
	ipcMain.handle('ollama:chat', async (event, payload) => {
		const { stream = false, ...chatPayload } = payload;
		const baseUrl = store.get('ollamaBaseUrl');
		const ollama = new Ollama({ host: baseUrl });

		if (stream) {
			try {
				const streamResponse = await ollama.chat({ ...chatPayload, stream: true });
				for await (const chunk of streamResponse) {
					event.sender.send('ollama:chunk', {
						type: 'chat',
						content: chunk.message?.content ?? '',
						done: chunk.done,
						raw: chunk,
					});
				}
				event.sender.send('ollama:done', { type: 'chat' });
			} catch (e) {
				event.sender.send('ollama:error', { type: 'chat', error: e.message });
			}
			return null;
		}

		return ollama.chat({ ...chatPayload, stream: false });
	});

	// ── Generate ──────────────────────────────────────────────────────────────

	/**
	 * ollama:generate
	 * Sends a text-generation request to Ollama.
	 *
	 * Pass `stream: false` (or omit it) in the payload to receive the full
	 * GenerateResponse object as the return value of `invoke()`.
	 *
	 * Pass `stream: true` to receive incremental chunks via push events:
	 *   - `ollama:chunk`  { type: 'generate', content, done, raw }
	 *   - `ollama:done`   { type: 'generate' }
	 *   - `ollama:error`  { type: 'generate', error }
	 * The `invoke()` call resolves with `null` in this mode.
	 */
	ipcMain.handle('ollama:generate', async (event, payload) => {
		const { stream = false, ...generatePayload } = payload;
		const baseUrl = store.get('ollamaBaseUrl');
		const ollama = new Ollama({ host: baseUrl });

		if (stream) {
			try {
				const streamResponse = await ollama.generate({ ...generatePayload, stream: true });
				for await (const chunk of streamResponse) {
					event.sender.send('ollama:chunk', {
						type: 'generate',
						content: chunk.response ?? '',
						done: chunk.done,
						raw: chunk,
					});
				}
				event.sender.send('ollama:done', { type: 'generate' });
			} catch (e) {
				event.sender.send('ollama:error', { type: 'generate', error: e.message });
			}
			return null;
		}

		return ollama.generate({ ...generatePayload, stream: false });
	});
}

module.exports = { register };
