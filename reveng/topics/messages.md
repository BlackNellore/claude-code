# Topic: Messages & Data Structures

> [← Index](../00-index.md) | See also: [02-data-flow](../02-data-flow-and-transformations.md)

---

## Overview

Claude Code uses an internal **message union** distinct from the Anthropic API format. Messages flow through creation → normalization → API → denormalization → UI.

**Critical gap:** `src/types/message.ts` is **missing** from the leak. Types are inferable from `utils/messages.ts` and SDK schemas.

---

## Message Union (Inferred)

```typescript
type Message =
  | UserMessage
  | AssistantMessage
  | SystemMessage          // many subtypes
  | AttachmentMessage
  | ProgressMessage        // UI-only
  | StreamEvent            // streaming deltas
  | TombstoneMessage
  | ToolUseSummaryMessage
```

---

## UserMessage

```typescript
{
  type: 'user',
  uuid: string,
  timestamp: string,
  message: {
    role: 'user',
    content: string | ContentBlockParam[]
  },
  // optional metadata:
  toolUseResult?: unknown,
  sourceToolAssistantUUID?: string,
  isMeta?: boolean,
}
```

**Created by:** `createUserMessage()`, tool results, interruptions.

---

## AssistantMessage

```typescript
{
  type: 'assistant',
  uuid: string,
  timestamp: string,
  message: {
    role: 'assistant',
    content: ContentBlock[],  // text, thinking, tool_use
    model?: string,
    usage?: Usage,
  },
}
```

**Created by:** `createAssistantMessage()` after stream completes.

Content blocks:
- `{ type: 'text', text: string }`
- `{ type: 'thinking', thinking: string }`
- `{ type: 'tool_use', id, name, input }`
- `{ type: 'redacted_thinking', … }`

---

## SystemMessage Subtypes

| subtype | Purpose |
|---------|---------|
| `compact_boundary` | Marks compaction cutoff |
| `microcompact_boundary` | Micro-compaction marker |
| `local_command` | Slash command output |
| `api_error` | API failure display |
| `informational` | Info banners |
| `permission_retry` | Permission retry prompt |
| `stop_hook_summary` | Stop hook result |
| … | Many more |

---

## AttachmentMessage

Injected context (memory, hooks, skills) — not shown as user chat.

---

## ProgressMessage

Tool execution progress (bash output, MCP status). **Stripped before API.**

---

## Key Factory Functions

| Function | Creates |
|----------|---------|
| `createUserMessage()` | User turn |
| `createAssistantMessage()` | Assistant turn |
| `createSystemMessage()` | System events |
| `createAttachmentMessage()` | Attachments |
| `createProgressMessage()` | Tool progress |
| `createUserInterruptionMessage()` | Ctrl+C interrupt |

All in `utils/messages.ts`.

---

## Normalization Pipeline

```
Message[] (internal)
  → normalizeMessages()        // general cleanup
  → normalizeMessagesForAPI()  // API-ready MessageParam[]
```

### What normalization does

- Strip `ProgressMessage`, `StreamEvent`
- Pair `tool_use` with `tool_result`
- Handle compact boundaries
- Remove empty messages
- Convert thinking/signature blocks for API
- Apply strict tool result pairing (if enabled)

---

## Synthetic Messages

Special messages for edge cases:

| Constant | Use |
|----------|-----|
| `INTERRUPT_MESSAGE` | User cancelled |
| `REJECT_MESSAGE` | Permission denied |
| `SYNTHETIC_TOOL_RESULT_PLACEHOLDER` | Repair missing tool results |
| `NO_RESPONSE_REQUESTED` | Empty response marker |

---

## Persistence Format

Session transcripts: JSONL at `~/.claude/projects/<hash>/<session>.jsonl`

Each line = one serialized `Message` object.

`utils/sessionStorage.ts` — `recordTranscript`, `recordContentReplacement`.

---

## SDK Mapping

Internal messages → `SDKMessage` types via mappers in `entrypoints/sdk/` and `cli/print.ts`.

---

## Related

- [02-data-flow-and-transformations.md](../02-data-flow-and-transformations.md)
- [layers/04-query-engine.md](../layers/04-query-engine.md)
