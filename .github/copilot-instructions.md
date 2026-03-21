# Copilot instructions

## IPC layer — keeping the README current

The `ipc/` directory has a README at `ipc/README.md` that is the authoritative
reference for the IPC layer. **Any change to the IPC layer must include a
corresponding update to that README.**

Specifically, update `ipc/README.md` when you:

- **Add a handler file** — add a row for every new `ipc.handle` channel in the
  Handlers table.
- **Remove or rename a handler** — remove or update the corresponding row.
- **Change what a handler returns** — update the Returns column.
- **Add, remove, or rename a utility** — add, remove, or update the row in the
  Utils table.
- **Change the directory structure** — update the directory tree at the top of
  the README.
- **Update `preload.js`** — if the exposed API surface changes, reflect that in
  the handler description or add a usage note.

The README must always stay in sync with the actual code. Do not merge or
approve changes to `ipc/` that leave the README stale.
