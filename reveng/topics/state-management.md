# Topic: State Management

> [← Index](../00-index.md)

---

## Two State Layers

Claude Code splits state between **global session singleton** and **React app state**.

---

## Global State (`bootstrap/state.ts`)

Mutable singleton for session-wide data. Comment in source: *"DO NOT ADD MORE STATE HERE"*.

### Key fields

| Field | Purpose |
|-------|---------|
| `sessionId` | Current session UUID |
| `cwd` / `projectRoot` | Working directory |
| `totalCostUSD` | Cumulative API cost |
| `modelUsage` | Per-model token counts |
| `mainLoopModelOverride` | Model override |
| `isInteractive` | REPL vs headless |
| `strictToolResultPairing` | Fail on tool result mismatch |
| `clientType` | sdk-ts, claude-vscode, etc. |

### Access pattern

```typescript
import { getSessionId, setCwd, … } from './bootstrap/state.js';
```

Many getters/setters exported.

---

## React App State (`state/AppStateStore.ts`)

Provider for UI components.

### AppState shape (key fields)

| Field | Purpose |
|-------|---------|
| `messages` | Conversation transcript |
| `toolPermissionContext` | Permission mode + rules |
| `notifications` | Banners, toasts |
| `spinnerState` | Loading state |
| `queuedCommands` | Priority command queue |
| `teammateView` | Multi-agent layout |

### Store

`state/store.ts` — Zustand or similar store pattern.

---

## ToolUseContext (per-query)

Passed through query loop and tools:

| Field | Purpose |
|-------|---------|
| `options.tools` | Active tool set |
| `options.mcpClients` | MCP connections |
| `abortController` | Cancel signal |
| `readFileState` | File read cache |
| `messages` | Reference to conversation |

Mutated during tool execution (context modifiers).

---

## Persistence

| Data | Location |
|------|----------|
| Transcripts | `~/.claude/projects/<hash>/*.jsonl` |
| Settings | `~/.claude/settings.json`, `.claude/settings.json` |
| Memory | `~/.claude/projects/<hash>/memory/MEMORY.md` |
| Images | `~/.claude/` image store |
| Tool results (spill) | `~/.claude/tool-results/` |

`utils/sessionStorage.ts` — transcript read/write.

---

## State Flow per Turn

```
User submit
  → AppState.messages += UserMessage
  → query() reads messages from params
  → query loop mutates state.messages internally
  → yields back to REPL
  → REPL updates AppState.messages
  → sessionStorage appends to JSONL
  → bootstrap/state cost counters updated
```

---

## Related

- [layers/02-ui-terminal.md](../layers/02-ui-terminal.md)
- [layers/04-query-engine.md](../layers/04-query-engine.md)
