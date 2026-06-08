# Layer 9: Memory & Dreams

> [← Index](../00-index.md) | Prev: [MCP](./08-mcp.md) | Next: [Multi-Agent](./10-multi-agent.md)

---

## Purpose

Persist durable context across sessions via `MEMORY.md` and background consolidation ("dreams").

---

## Auto-Memory (`memdir/`)

| File | Role |
|------|------|
| `memdir/memdir.ts` | Core memory system |
| `memdir/paths.ts` | Path resolution, `isAutoMemoryEnabled()` |
| `memdir/memoryAge.ts` | Memory freshness |
| `memdir/teamMemPrompts.ts` | Team memory prompts |

### MEMORY.md

Stored per-project. Injected into context via attachments before API calls.

```
~/.claude/projects/<hash>/memory/MEMORY.md
```

Content is written by:
- User `/remember` command
- Dream consolidation subagent
- `extractMemories` service

---

## Attachment Injection

`utils/attachments.ts`:

```typescript
getAttachmentMessages(context, messages)
  → reads relevant MEMORY.md chunks
  → creates AttachmentMessage with memoryHeader
```

`startRelevantMemoryPrefetch()` — async prefetch at query start (non-blocking).

`filterDuplicateMemoryAttachments()` — dedupe across turns.

---

## Dream System (`services/autoDream/`)

Background subagent that consolidates memory:

1. **Orient** — read `MEMORY.md`
2. **Gather** — scan daily logs for new signals
3. **Consolidate** — update durable memory files
4. **Prune** — remove stale content

`autoDream.ts` — orchestrates the dream task as a background session.

---

## Extract Memories

`services/extractMemories/extractMemories.ts` — extract memory-worthy facts from conversation.

---

## Compact vs Memory

| System | Purpose |
|--------|---------|
| Compaction | Shrink **conversation** context |
| Memory | Persist **facts** across sessions |

Compaction summarizes chat history; memory stores durable project knowledge.

---

## Disable Memory

Env: `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`  
Settings: `autoMemory` flag

---

## How to Change This Layer

| Goal | Where |
|------|-------|
| Memory file format | `memdir/memdir.ts` |
| Injection logic | `utils/attachments.ts` |
| Dream prompts | `services/autoDream/` |
| Memory commands | `commands/remember/` |

---

## Related

- [04-query-engine.md](./04-query-engine.md) — attachment prefetch
- [topics/commands-and-skills.md](../topics/commands-and-skills.md) — `/remember`
