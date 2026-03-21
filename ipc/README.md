# IPC Layer

All Electron IPC handlers for the main process live here. The entry point
`ipc/index.js` is the only file imported by `main.js`; everything else is
internal to this directory.

## Directory structure

```
ipc/
├── index.js               # Registers all handler modules with ipcMain
├── handlers/
│   ├── recipe.js          # Recipe-specific handlers
│   └── webpage.js         # Generic web-page handlers
└── utils/
    ├── fetchHTML.js        # HTTP/HTTPS fetch with redirect following
    └── validateUrl.js      # URL protocol validation
```

## Adding a new group of IPC handlers

1. Create `ipc/handlers/<feature>.js` and export a `register(ipcMain)` function
   that calls `ipcMain.handle(...)` for each channel.
2. Add the new module to the `handlers` array in `ipc/index.js`.
3. Expose the new channel(s) in `preload.js` under `window.demmiAPI`.
4. Update this README — add a row to the Handlers table and, if you added a
   utility, a row to the Utils table.

## Handlers

| IPC channel | File | Description | Returns |
|---|---|---|---|
| `fetch-url-metadata` | `handlers/webpage.js` | Fetches a URL and returns structured Open Graph / meta tag data for preview cards | `{ url, title, description, image, siteName, author, date }` |
| `fetch-recipe-content` | `handlers/recipe.js` | Fetches a URL and returns the plain-text content of the main recipe/article element, stripped of nav/header/footer/scripts | `string` |

## Utils

| File | Export | Description |
|---|---|---|
| `utils/fetchHTML.js` | `fetchHTML(url)` | Fetches the raw HTML of a URL. Follows up to 5 redirects; validates that every hop uses `http` or `https`. Rejects on non-2xx responses and times out after 10 s. |
| `utils/validateUrl.js` | `validateUrl(url)` | Throws if the value is not a non-empty string or does not begin with `http://` or `https://`. |
