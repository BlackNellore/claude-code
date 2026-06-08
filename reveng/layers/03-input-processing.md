# Layer 3: Input Processing

> [← Index](../00-index.md) | Prev: [UI Terminal](./02-ui-terminal.md) | Next: [Query Engine](./04-query-engine.md)

---

## Purpose

Transform raw terminal input into `Message[]` and decide whether to invoke the API query loop.

**Entry point:** `utils/processUserInput/processUserInput.ts`

---

## Routing Decision Tree

```
processUserInput(input)
  │
  ├─ Empty input? → return { messages: [], shouldQuery: false }
  │
  ├─ Slash command (/foo)? → findCommand() → command handler
  │     └─ may return shouldQuery: true or false
  │
  ├─ Bash prefix (!cmd)? → local shell execution
  │
  ├─ Image paste? → resize, store, create image blocks
  │
  ├─ @agent mention? → attachment + text
  │
  ├─ Ultraplan keyword? → remote Opus planning session
  │
  └─ Default → processTextPrompt() → UserMessage, shouldQuery: true
```

---

## Return Type

```typescript
type ProcessUserInputBaseResult = {
  messages: (UserMessage | AssistantMessage | AttachmentMessage | …)[];
  shouldQuery: boolean;      // true = call query()
  allowedTools?: string[];   // restrict tools for this turn
  model?: string;            // override model
  effort?: EffortValue;
  resultText?: string;       // for -p mode non-query commands
  nextInput?: string;        // chain to another command
};
```

---

## Slash Commands

Parsed by `parseSlashCommand` → looked up in `commands.ts` registry.

Commands live in `src/commands/<name>/` and can:

- Mutate local state only (`/clear`, `/config`)
- Trigger compaction (`/compact`)
- Launch JSX UI (`/login`, `/doctor`)
- Start a query with special context (`/remember`)

**Bridge-safe commands:** `isBridgeSafeCommand()` — subset allowed in remote control mode.

See [topics/commands-and-skills.md](../topics/commands-and-skills.md).

---

## Hooks on Input

Before creating messages, `executeUserPromptSubmitHooks()` may:

- Block the prompt (return early with message)
- Modify the prompt text
- Inject hook output as attachments

---

## Image Handling

1. `isValidImagePaste()` — validate pasted image
2. `maybeResizeAndDownsampleImageBlock()` — size limits
3. `storeImages()` — persist to `~/.claude/`
4. Create `ImageBlockParam` in user message content

---

## Attachments

`getAttachmentMessages()` may add before query:

- Relevant memory chunks
- IDE selection context
- Skill discovery results
- Agent mention metadata

---

## Example: `/compact` vs plain text

| Input | shouldQuery | messages produced |
|-------|-------------|-------------------|
| `hello` | `true` | `[UserMessage]` |
| `/compact` | `false` | `[SystemCompactBoundaryMessage, …]` |
| `/help` | `false` | `[SystemLocalCommandMessage]` |
| `!ls` | `false` | `[UserMessage with bash output]` |

---

## handlePromptSubmit

Orchestrates the full submit path in `utils/handlePromptSubmit.ts`:

1. Check if already processing (queue or reject)
2. Call `processUserInput`
3. Append messages to state
4. If `shouldQuery`, invoke `onQuery` callback (REPL wires this to `query()`)
5. Handle `nextInput` chaining

---

## How to Change This Layer

| Goal | Where |
|------|-------|
| New input prefix type | `processUserInput.ts` |
| New slash command | `commands/<name>/` + register in `commands.ts` |
| Change image limits | `utils/imageResizer.ts`, `utils/imageValidation.ts` |
| Block/modify prompts | User hooks or `utils/hooks.ts` |

---

## Related

- [04-query-engine.md](./04-query-engine.md) — what happens when `shouldQuery: true`
- [topics/commands-and-skills.md](../topics/commands-and-skills.md)
- [topics/hooks.md](../topics/hooks.md) — UserPromptSubmit hooks
