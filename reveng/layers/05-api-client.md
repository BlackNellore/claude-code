# Layer 5: API Client

> [← Index](../00-index.md) | Prev: [Query Engine](./04-query-engine.md) | Next: [Tools](./06-tools.md)

---

## Purpose

Communicate with the Anthropic Messages API — streaming, retries, model selection, beta headers, usage tracking.

**Primary file:** `src/services/api/claude.ts` (~3.4K lines)

---

## Key Responsibilities

1. Build `BetaMessageStreamParams` from internal state
2. Open streaming connection to Anthropic API
3. Parse SSE stream into `StreamEvent`s
4. Handle retries, fallbacks, rate limits
5. Track token usage and cost
6. Apply beta feature headers

---

## Request Construction

Inputs from query loop:

```typescript
{
  model: getRuntimeMainLoopModel(),
  system: systemPrompt,           // SystemPrompt blocks
  messages: MessageParam[],       // normalized
  tools: ToolDefinition[],      // from getTools()
  max_tokens: …,
  thinking: ThinkingConfig,     // extended thinking
  // beta headers for features
}
```

Helpers:
- `prependUserContext()` — user context prefix
- `appendSystemContext()` — system context suffix
- `normalizeToolInputForAPI()` — tool schema formatting

---

## Streaming

The client yields events as they arrive:

| Event | Use |
|-------|-----|
| `message_start` | Begin assistant message |
| `content_block_start` | New text/thinking/tool_use block |
| `content_block_delta` | Partial content |
| `content_block_stop` | Block complete |
| `message_delta` | Usage updates |
| `message_stop` | Message complete |

REPL consumes these for live typing effect.

---

## Model Routing

| Function | Purpose |
|----------|---------|
| `getMainLoopModel()` | Default model from settings |
| `getRuntimeMainLoopModel()` | With overrides |
| `renderModelName()` | Display name |

Models configured in settings, CLI `--model`, or mid-session commands.

Fallback: on certain errors, `FallbackTriggeredError` triggers retry with `fallbackModel`.

---

## Beta Headers & Features

The client sets beta headers for:
- Extended thinking
- Interleaved thinking
- Computer use
- Prompt caching
- Other Anthropic beta features

Gated by settings and `feature()` flags.

---

## Error Types (`services/api/errors.ts`)

| Error | Meaning |
|-------|---------|
| `PROMPT_TOO_LONG` | Context exceeds limit |
| Rate limit | Retry with backoff |
| Overloaded | Retry |
| Invalid request | Surface to user |

`withRetry.ts` wraps API calls with exponential backoff.

---

## Usage & Cost

Each response includes `usage` (input/output tokens). Tracked in:
- `bootstrap/state.ts` → `modelUsage`, `totalCostUSD`
- Per-message `usage` on `AssistantMessage`

---

## Dump Prompts (Debug)

`--dump-prompts` / `createDumpPromptsFetch()` — intercept and log full prompts for debugging (internal).

---

## How to Change This Layer

| Goal | Where |
|------|-------|
| Add beta header | `claude.ts` request builder |
| Change retry logic | `withRetry.ts` |
| New error handling | `errors.ts` + query loop catch |
| Model list | `utils/model/` |

---

## Related

- [04-query-engine.md](./04-query-engine.md) — caller of API client
- [12-configuration.md](./12-configuration.md) — model settings
