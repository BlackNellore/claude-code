# Topic: Extension Points

> [← Index](../00-index.md)

---

## How to Extend Claude Code

This guide maps extension mechanisms to their entry points.

---

## 1. Custom Tools (MCP)

**Best for:** External integrations, databases, APIs.

Configure in `settings.json`:
```json
{ "mcpServers": { "my-tool": { "command": "node", "args": ["server.js"] } } }
```

MCP tools auto-merge into the tool pool. See [layers/08-mcp.md](../layers/08-mcp.md).

---

## 2. Slash Commands

**Best for:** User-facing workflows, local operations.

Add `src/commands/mycommand/` + register in `commands.ts`.  
Or user-level: `.claude/commands/mycommand.md`

See [topics/commands-and-skills.md](./commands-and-skills.md).

---

## 3. Skills

**Best for:** Reusable prompt templates with tool restrictions.

Add `.claude/skills/myskill/SKILL.md` with frontmatter.

---

## 4. Hooks

**Best for:** Policy enforcement, logging, input/output mutation.

Configure in settings `hooks` key. See [topics/hooks.md](./hooks.md).

---

## 5. Custom Agents

**Best for:** Specialized sub-agents.

Add `.claude/agents/my-agent.md`:
```markdown
---
name: my-agent
description: Does X
tools: Read, Grep, Glob
---

System prompt here...
```

Or pass `--agents` JSON at CLI.

---

## 6. Plugins

**Best for:** Marketplace-distributed extensions.

`src/plugins/`, `utils/plugins/` — plugin loading, marketplace CLI.

Commands: `claude plugin install`, `claude plugin marketplace`

---

## 7. CLAUDE.md / Project Context

**Best for:** Project-specific instructions.

Add `CLAUDE.md` to project root — injected into system prompt.

---

## 8. Output Styles

**Best for:** Response formatting preferences.

`src/outputStyles/` — configurable output style presets.

---

## 9. Keybindings

**Best for:** Custom keyboard shortcuts.

`src/keybindings/resolver.ts` + user keybinding config.

---

## 10. Build-Time Features

**Best for:** Internal Anthropic builds only.

```typescript
if (feature('MY_FEATURE')) { … }
```

Requires Bun build with feature flags — not for end-user extension.

---

## Extension Comparison

| Mechanism | Requires code change | User-configurable | Affects API tools |
|-----------|---------------------|-------------------|-------------------|
| MCP | No (external server) | Yes | Yes |
| Slash commands | Optional | Yes (.claude/) | No |
| Skills | No | Yes | Via SkillTool |
| Hooks | No | Yes | Indirect |
| Custom agents | No | Yes | Via AgentTool |
| Plugins | Marketplace | Yes | Varies |
| CLAUDE.md | No | Yes | No (system prompt) |

---

## Related

- [layers/12-configuration.md](../layers/12-configuration.md)
- [03-file-locator.md](../03-file-locator.md)
