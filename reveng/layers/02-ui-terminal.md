# Layer 2: Terminal UI

> [← Index](../00-index.md) | Prev: [Entry & CLI](./01-entry-and-cli.md) | Next: [Input Processing](./03-input-processing.md)

---

## Purpose

Render the interactive REPL using a custom **Ink** (React-for-terminal) stack. Handle prompt input, message display, permission dialogs, and spinners.

---

## Key Files

| File | Role |
|------|------|
| `screens/REPL.tsx` | Main screen — prompt, query, messages |
| `components/App.tsx` | Root Ink app, providers |
| `components/TextInput.tsx` | Prompt input widget |
| `components/messages/` | Per-message-type renderers |
| `ink/` | Custom terminal renderer fork |
| `ink/hooks/use-input.ts` | Keyboard input handling |
| `interactiveHelpers.tsx` | Trust dialogs, onboarding |

---

## REPL.tsx Responsibilities

1. **Prompt submission** — `handlePromptSubmit` on Enter
2. **Query execution** — iterate `query()` async generator
3. **Message state** — sync yields to `AppStateStore`
4. **Permission UI** — render dialogs when `canUseTool` returns `ask`
5. **Tool JSX** — some tools render inline UI via `setToolJSX`
6. **Spinner/progress** — show activity during API/tools

### Query integration (simplified)

```typescript
for await (const event of query({
  messages,
  systemPrompt,
  toolUseContext,
  canUseTool,
  querySource: 'repl_main_thread',
})) {
  if (event.type === 'stream_event') {
    // Update partial assistant message
  } else {
    // Append full message to state
    setMessages(prev => [...prev, event]);
  }
}
```

---

## Ink Customization (`src/ink/`)

Claude Code maintains a **fork** of Ink with additions:

| Module | Purpose |
|--------|---------|
| `ink/termio/ansi.ts` | ANSI escape handling |
| `ink/events/dispatcher.ts` | Terminal event dispatch |
| `ink/components/ErrorOverview.tsx` | Error display |
| `ink/hooks/use-input.ts` | Key capture (vim mode hooks in) |

The terminal is not a dumb stdout stream — it's a full TUI with:
- Cursor management
- Partial redraws
- Mouse support (where enabled)
- Alternate screen buffer

---

## Message Rendering

Each `Message` type has a component in `components/messages/`:

| Type | Component |
|------|-----------|
| `user` | `UserMessage.tsx` |
| `assistant` | `AssistantMessage.tsx`, thinking variants |
| `system` | Various system subtypes |
| `progress` | Tool progress indicators |

Assistant messages render:
- Text blocks
- Thinking blocks (collapsible)
- Tool use summaries
- Redacted thinking

---

## Permission Dialogs

When a tool needs approval, `useCanUseTool` sets state that REPL renders:

- `FilePermissionDialog` — file path access
- `BashPermissionDialog` — shell commands
- `AskUserQuestionPermissionRequest` — AskUserQuestion tool
- `MCPServerApprovalDialog` — new MCP servers

In headless mode, the same decisions happen via structured JSON on stdin/stdout.

---

## Input Widget Features

`TextInput` / `PromptInput` support:

- Multi-line input
- Image paste (converted to base64 blocks)
- `@` agent mentions
- `/` slash command autocomplete
- Vim mode (`src/vim/`)
- Voice input (`src/voice/`) when enabled

---

## App State

UI reads from `state/AppStateStore.ts` (React context):

- `messages` — conversation transcript
- `toolPermissionContext` — current permission mode/rules
- `notifications` — banners, errors
- `spinnerState` — loading indicators
- `queuedCommands` — message queue for priority commands

See [topics/state-management.md](../topics/state-management.md).

---

## How to Change This Layer

| Goal | Where |
|------|-------|
| New message type UI | `components/messages/` |
| Change prompt behavior | `components/TextInput.tsx`, `REPL.tsx` |
| New dialog | `components/permissions/` or `components/` |
| Terminal rendering bug | `ink/` |
| Keyboard shortcut | `keybindings/resolver.ts` |

---

## Related

- [03-input-processing.md](./03-input-processing.md) — what happens on submit
- [07-permissions.md](./07-permissions.md) — permission dialog flow
- [topics/messages.md](../topics/messages.md) — message types rendered
