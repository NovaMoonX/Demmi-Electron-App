# IPC Layer

All Electron IPC handlers for the main process live here. The entry point
`ipc/index.js` is the only file imported by `main.js`; everything else is
internal to this directory.

## Directory structure

```
ipc/
├── index.js               # Registers all handler modules with ipcMain
├── handlers/
│   ├── ollama.js          # Ollama AI handlers (config, health, models, chat, generate)
│   ├── recipe.js          # Recipe-specific handlers
│   └── webpage.js         # Generic web-page handlers
└── utils/
    ├── fetchHTML.js        # HTTP/HTTPS fetch with redirect following
    ├── store.js            # electron-store wrapper for persistent config
    └── validateUrl.js      # URL protocol validation
```

## Adding a new group of IPC handlers

1. Create `ipc/handlers/<feature>.js` and export a `register(ipcMain)` function
   that calls `ipcMain.handle(...)` for each channel.
2. Add the new module to the `handlers` array in `ipc/index.js`.
3. Expose the new channel(s) in `preload.js` under `window.demmiAPI`.
4. Update this README — add a row to the Handlers table and, if you added a
   utility, a row to the Utils table.

## Updating the persistent config store

When adding a new configuration key to `ipc/utils/store.js`:

1. Add the key and its default value to the `defaults` object in `store.js`.
2. Update the JSDoc comment in `store.js` to document the new key, its type,
   and its default value.
3. Update the `utils/store.js` row in the Utils table below.

## Handlers

| IPC channel | File | Description | Returns |
|---|---|---|---|
| `fetch-url-metadata` | `handlers/webpage.js` | Fetches a URL and returns structured Open Graph / meta tag data for preview cards | `{ url, title, description, image, siteName, author, date }` |
| `fetch-recipe-content` | `handlers/recipe.js` | Fetches a URL and returns the plain-text content of the main recipe/article element, stripped of nav/header/footer/scripts | `string` |
| `config:get-ollama-url` | `handlers/ollama.js` | Returns the stored Ollama base URL | `string` |
| `config:set-ollama-url` | `handlers/ollama.js` | Persists a new Ollama base URL | `true` |
| `config:test-ollama-url` | `handlers/ollama.js` | Tests whether a URL responds like an Ollama server (3 s timeout) | `{ ok: boolean, error?: string }` |
| `ollama:health` | `handlers/ollama.js` | Pings the stored Ollama base URL | `{ ok: boolean, error?: string }` |
| `ollama:list-models` | `handlers/ollama.js` | Returns the locally available Ollama models | `OllamaModel[]` |
| `ollama:chat` | `handlers/ollama.js` | Chat request. `stream: false` (default) → full `ChatResponse`. `stream: true` → pushes `ollama:chunk` / `ollama:done` / `ollama:error` events, resolves with `null` | `ChatResponse \| null` |
| `ollama:generate` | `handlers/ollama.js` | Text-generation request. `stream: false` (default) → full `GenerateResponse`. `stream: true` → pushes `ollama:chunk` / `ollama:done` / `ollama:error` events, resolves with `null` | `GenerateResponse \| null` |

### Streaming push events (sent by `ollama:chat` / `ollama:generate` when `stream: true`)

| Event channel | Payload | Description |
|---|---|---|
| `ollama:chunk` | `{ type: 'chat'\|'generate', content: string, done: boolean, raw: object }` | One streamed token chunk |
| `ollama:done` | `{ type: 'chat'\|'generate' }` | Stream completed successfully |
| `ollama:error` | `{ type: 'chat'\|'generate', error: string }` | Stream failed |

## Utils

| File | Export | Description |
|---|---|---|
| `utils/fetchHTML.js` | `fetchHTML(url)` | Fetches the raw HTML of a URL. Follows up to 5 redirects; validates that every hop uses `http` or `https`. Rejects on non-2xx responses and times out after 10 s. |
| `utils/store.js` | `store` (electron-store instance) | Persistent key-value config store. Default: `ollamaBaseUrl = 'http://localhost:11434'`. |
| `utils/validateUrl.js` | `validateUrl(url)` | Throws if the value is not a non-empty string or does not begin with `http://` or `https://`. |

