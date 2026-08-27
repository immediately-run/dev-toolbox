# Dev toolbox

The developer's Swiss-army knife in the browser: JSON, regex, encoders, hashes,
diffs, UUIDs — nothing leaves your tab.

An [immediately.run](https://immediately.run) app: React + TypeScript, loaded
straight from this repo and transpiled in the browser. Every tool is pure
client-side code with **no npm runtime dependencies beyond React** — the MD5,
Myers diff, JSON validator, color math and so on are small implementations in
[`src/lib/`](./src/lib).

## Try it

**Open on immediately.run:**
<https://immediately.run/present/github/immediately-run/dev-toolbox/main/files/src/App.tsx>

Press **⌘K / Ctrl+K** anywhere to switch tools. On phones the tool list is a
bottom sheet behind the current-tool button in the top bar.

## Tools

| Tool | What it does |
| --- | --- |
| **JSON** | Format (2/4 spaces, sort keys), minify, validate with exact line/column and a "jump to it" link, collapsible tree, JSON → TypeScript interfaces (merges array-of-object shapes, marks missing keys optional), JSON → CSV for arrays. |
| **Regex tester** | JavaScript pattern + flags, live highlighted matches, table of numbered and named groups, replace preview (`$1`, `$<name>`), cheat sheet of common patterns and tokens. |
| **Encode / decode** | Base64 (standard and URL-safe), URL (component or whole-URI), HTML entities, hex, Unicode escapes — both directions shown at once. JWT decoder with header/payload trees and a live `exp` countdown (no signature verification). |
| **Hashes** | MD5 (pure JS), SHA-1/256/512 and HMAC-SHA256 via WebCrypto; detects a missing `crypto.subtle` at runtime and says so. |
| **Text diff** | Line-level Myers diff with side-by-side and unified views, +/− stats, copyable unified patch, optional trailing-whitespace ignore. |
| **Generators** | UUID v4 and passwords from `crypto.getRandomValues` (rejection-sampled, entropy estimate), lorem ipsum, Unix ↔ ISO/human timestamp converter with a live clock. |
| **Text utils** | camel/Pascal/snake/kebab/CONSTANT/dot/Title/Sentence case, sort (natural), dedupe, reverse, shuffle, trim, number lines, live counts (chars, words, lines, sentences, bytes). |
| **Color** | hex ↔ rgb ↔ hsl with HSL sliders and a tint/shade ramp; WCAG contrast checker with AA/AAA badges and a live preview. |
| **Character map** | Curated Unicode sets (arrows, math, box drawing, currency, Greek, typography) searchable by name or code point; click to copy. |

## How data is stored

Each tool remembers its last input. The app opens its **private, per-user
store** (`openSettings()` from `@immediately-run/sdk/mounts`) at boot and
writes `<private>/last/<toolId>.json` with a short debounce after every change;
the currently selected tool is kept the same way. Nothing is ever sent to a
server and there is no shared/multi-user mode — all data stays with you.

If the private store isn't available (not signed in, host declined, running
outside the host) everything still works from memory; the sidebar footer says
which mode you're in. `localStorage` is never used (it throws at the app's
opaque origin).

Under `vite dev` the same code writes to `./devfs-playground/` (git-ignored)
via `@immediately-run/dev-fs`.

## Local development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc + vite build
npm run lint     # eslint, incl. the React Fast Refresh rule
```

To run the working tree inside the real host (SDK channel, capability gate):

```bash
immediately.run dev . --origin https://local.immediately.run
```

## Layout

- `src/App.tsx` — shell: sidebar / bottom-sheet picker, ⌘K switcher, tool pane
- `src/tools/*` — one component per tool
- `src/components/*` — shared UI (fields, outputs, copy button, JSON tree, picker)
- `src/lib/*` — pure algorithms (`json`, `regex`, `encode`, `md5`, `hash`, `diff`, `generators`, `text`, `color`), `store.ts` (platform fs), `persist.ts` (per-tool last-input persistence)
- `src/hooks/*` — `useToolState` (persisted state), `useIsNarrow`, `useCopy`, `useTheme`
- `src/data/*` — tool registry, regex cheat sheet, character map, lorem words

MIT — see [LICENSE](./LICENSE).
