# T-2000 · Platform MCP Server (Assistant Extension)

- **Stage**: M7 (phase 28) · **Tags**: backend, integration, experimental · **Complexity**: middle · **Depends on**: T-280, T-283
- **StoryPoints**: 20

## What

Model Context Protocol (MCP) server that exports **secure** platform operations for external AI assistants (Claude, Cursor, custom agents): query client schedule, check appointment status, search catalog, retrieve revenue metrics, read logs. Authentication via scoped tokens, rate limiting, audit logging of all AI tool calls.

## Why

Enables developers and operators to interact with the platform safely using AI assistants without direct database access or manual UI clicking.

## Sources
- `platform/mcp/README.md`
- MCP security and scope (the decision record is not written yet)

## Done
- [ ] MCP server implementation with read/write tools and scoped permissions
- [ ] Authentication and rate-limiting middleware
- [ ] Audit log for all assistant operations
- [ ] Documentation and example client configurations
- [ ] Integration tests for MCP tools
