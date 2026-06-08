# Topic: Slash Commands & Skills

> [← Index](../00-index.md)

---

## Slash Commands

User-facing `/command` interface for local operations and workflows.

### Registry

`src/commands.ts` — central registry mapping command names to handlers.

### Implementation

Each command in `src/commands/<name>/`:
- `index.ts` or `<name>.tsx` — handler
- May render JSX UI (Ink components)
- Returns `ProcessUserInputBaseResult`

### Examples

| Command | Purpose |
|---------|---------|
| `/compact` | Trigger context compaction |
| `/clear` | Clear conversation |
| `/mcp` | MCP server management |
| `/resume` | Resume previous session |
| `/doctor` | Diagnostics |
| `/login` | OAuth flow |
| `/config` | Settings UI |
| `/help` | List commands |

### Parsing

`utils/slashCommandParsing.ts` — extracts command name and arguments from `/foo bar baz`.

---

## Skills

Reusable prompt workflows invoked as `/skill-name` or via `SkillTool`.

### Bundled skills

`src/skills/bundled/` — built-in skills like remember, verify.

### Skill format

Markdown files with frontmatter defining:
- Description
- Allowed tools
- Prompt template

### SkillTool

Model can invoke skills programmatically:
```json
{ "name": "Skill", "input": { "skill": "verify", "args": "..." } }
```

### MCP skill builders

`src/skills/mcpSkillBuilders.ts` — generate skills from MCP servers.

---

## Local JSX Commands

Some commands render full-screen Ink UI:
- `setToolJSX()` in REPL
- `isLocalJSXCommand` flag
- Examples: `/login`, `/doctor`, plugin wizards

---

## Bridge-Safe Commands

`isBridgeSafeCommand()` — subset of commands allowed in remote control mode (no local-only operations).

---

## How to Add

### New slash command

1. Create `src/commands/mycommand/`
2. Export handler matching command interface
3. Register in `commands.ts`

### New skill

1. Add `.md` skill file to `.claude/skills/` or bundled dir
2. Skill discovery picks it up automatically

---

## Related

- [layers/03-input-processing.md](../layers/03-input-processing.md)
- [topics/extension-points.md](./extension-points.md)
