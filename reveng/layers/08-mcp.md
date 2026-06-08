# Layer 8: MCP (Model Context Protocol)

> [← Index](../00-index.md) | Prev: [Permissions](./07-permissions.md) | Next: [Memory](./09-memory-and-dreams.md)

---

## Purpose

Connect external tool servers via MCP — extend Claude's capabilities with user-defined or bundled servers.

---

## Key Files

| File | Role |
|------|------|
| `services/mcp/client.ts` | MCP client (~3.3K lines) |
| `services/mcp/types.ts` | Connection types |
| `tools/MCPTool/` | Wrap MCP tools for agent |
| `tools/ListMcpResourcesTool/` | List resources |
| `tools/ReadMcpResourceTool/` | Read resources |
| `entrypoints/mcp.ts` | Run Claude as MCP server |

---

## Connection Types

MCP servers connect via:
- **stdio** — spawn subprocess
- **SSE** — HTTP server-sent events
- **HTTP** — streamable HTTP transport

Configured in settings:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["-y", "my-mcp-server"],
      "env": {}
    }
  }
}
```

---

## Client Lifecycle

1. Load MCP configs from settings at startup
2. `MCPServerConnection` — connect, handshake, list tools
3. MCP tools merged into tool pool via `assembleToolPool()`
4. Tool names prefixed/namespaced to avoid collisions
5. On tool call: route to MCP server, return result

---

## MCP Tool Proxy

When the model calls an MCP tool:
```
tool_use name: "mcp__my-server__tool_name"
  → MCPTool.call()
  → mcpClient.callTool(server, name, input)
  → result serialized to tool_result
```

---

## Claude as MCP Server

`claude mcp serve` — exposes Claude Code capabilities to external clients via `entrypoints/mcp.ts`.

---

## IDE Integration

VS Code extension connects via MCP. `services/mcp/vscodeSdkMcp.ts` — VS Code SDK bridge.

---

## Approval Flow

New MCP servers may require user approval:
- `MCPServerApprovalDialog` in interactive mode
- Structured prompt in headless mode

---

## How to Change This Layer

| Goal | Where |
|------|-------|
| New transport | `services/mcp/client.ts` |
| Tool name mapping | `assembleToolPool()` in `tools.ts` |
| MCP CLI commands | `commands/mcp/` |

---

## Related

- [06-tools.md](./06-tools.md) — tool pool assembly
- [12-configuration.md](./12-configuration.md) — mcpServers settings
