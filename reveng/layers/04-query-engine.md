# Layer 4: Query Engine

> [← Index](../00-index.md) | Prev: [Input Processing](./03-input-processing.md) | Next: [API Client](./05-api-client.md)

---

## Purpose

The **agent loop** — the core of Claude Code. Manages multi-turn API calls, tool execution, compaction, and stop conditions.

**Primary file:** `src/query.ts`  
**Headless wrapper:** `src/QueryEngine.ts`

---

## Public API

```typescript
export async function* query(params: QueryParams): AsyncGenerator<
  StreamEvent | RequestStartEvent | Message | TombstoneMessage | ToolUseSummaryMessage,
  Terminal
>
```

`QueryEngine.submitMessage()` wraps this for SDK consumers.

---

## QueryParams (key fields)

| Field | Purpose |
|-------|---------|
| `messages` | Conversation history |
| `systemPrompt` | System prompt blocks |
| `userContext` / `systemContext` | Extra context strings |
| `toolUseContext` | Tools, MCP, abort, caches |
| `canUseTool` | Permission gate function |
| `querySource` | Analytics tag (repl, sdk, agent, …) |
| `maxTurns` | Optional turn limit |
| `fallbackModel` | Model fallback on error |
| `deps` | Injectable deps (testing) |

---

## queryLoop State Machine

Mutable state per loop (`let state: State`):

```typescript
{
  messages: Message[],
  toolUseContext: ToolUseContext,
  autoCompactTracking: AutoCompactTrackingState | undefined,
  stopHookActive: boolean | undefined,
  maxOutputTokensRecoveryCount: number,
  hasAttemptedReactiveCompact: boolean,
  turnCount: number,
  pendingToolUseSummary: …,
  transition: Continue | undefined,
}
```

Each iteration:

### 1. Pre-flight checks
- Token budget (`checkTokenBudget`)
- Auto-compact threshold (`calculateTokenWarningState`)
- Pending tool use summary generation

### 2. Build messages for API
- `getMessagesAfterCompactBoundary(messages)`
- Apply tool result budget (`applyToolResultBudget`)
- History snip (`snipModule`) if enabled
- `normalizeMessagesForAPI(messages)`

### 3. Attachments & context
- `getAttachmentMessages()` — memory, hooks
- `prependUserContext()` / `appendSystemContext()`
- Start memory prefetch (`startRelevantMemoryPrefetch`)

### 4. API call
- Stream via `deps.streamAssistantResponse()` (production → `claude.ts`)
- Yield `StreamEvent`s for live UI
- Assemble `AssistantMessage`

### 5. Tool execution
- Extract `tool_use` blocks from assistant content
- `runTools(toolUseBlocks, …)` — see [06-tools.md](./06-tools.md)
- Append tool result `UserMessage`s to state

### 6. Post-turn
- Stop hooks (`handleStopHooks`)
- Auto-compact if triggered
- Check `maxTurns`, abort signal, terminal conditions

### 7. Continue or exit
- Return `Terminal` with reason (completed, error, aborted, max_turns)
- Or `continue` to next iteration

---

## Compaction Integration

| Trigger | Module |
|---------|--------|
| Auto-compact (token threshold) | `services/compact/autoCompact.ts` |
| Manual `/compact` | `services/compact/compact.ts` |
| Micro-compact | `services/compact/microCompact.ts` |
| Reactive compact | `services/compact/reactiveCompact.ts` |
| History snip | `services/compact/snipCompact.ts` |

Compaction inserts `SystemCompactBoundaryMessage` and replaces old messages with a summary.

---

## Stop Hooks

When the model stops (no more tool calls), `handleStopHooks` runs user-configured Stop hooks. If a hook returns "continue", the loop resumes.

---

## Error Handling

| Error | Behavior |
|-------|----------|
| `Prompt too long` | User-facing error, may trigger compact |
| `FallbackTriggeredError` | Retry with fallback model |
| `ImageSizeError` | Reject with message |
| User abort (Ctrl+C) | `yieldMissingToolResultBlocks` with interrupt message |
| API error | `createAssistantAPIErrorMessage` |

---

## QueryEngine (Headless)

`QueryEngine.ts` provides:

```typescript
class QueryEngine {
  submitMessage(content): AsyncGenerator<SDKMessage>
  // Manages conversation lifecycle, permission protocol, transcript
}
```

Used by `cli/print.ts` for `-p` mode and external SDK clients.

---

## How to Change This Layer

| Goal | Where |
|------|-------|
| Change loop behavior | `query.ts` → `queryLoop` |
| Add pre-API step | Before `normalizeMessagesForAPI` call |
| Change compact triggers | `services/compact/autoCompact.ts` |
| New stop condition | `query/stopHooks.ts` |
| Inject test doubles | `query/deps.ts` |

---

## Related

- [05-api-client.md](./05-api-client.md) — streaming API calls
- [06-tools.md](./06-tools.md) — tool execution
- [02-data-flow](../02-data-flow-and-transformations.md) — worked examples
