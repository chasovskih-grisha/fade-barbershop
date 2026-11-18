// Fade Barbershop MCP Server
// Exposes Fade APIs for external tools like Claude Code.
//
// SDK 1.x приймає хендлери за Zod-схемою запиту, а не рядком імені
// ('tools/list'), як було до 1.0. Див. mcp/tools/index.ts — реєстр інструментів.

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  SubscribeRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';
import { TOOLS } from './tools/index.ts';

const API_ORIGIN = process.env.FADE_API_ORIGIN ?? 'http://localhost:13000';

const server = new Server(
  {
    name: 'fade-mcp-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      resources: {
        subscribe: true,
      },
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  if (name === 'getService') {
    const { serviceId } = args as { serviceId: string };
    const response = await fetch(`${API_ORIGIN}/services/${serviceId}`);
    return { content: [{ type: 'text', text: await response.text() }] };
  }
  throw new Error(`Unknown tool: ${name}`);
});

server.setRequestHandler(SubscribeRequestSchema, async () => ({}));

const transport = new StdioServerTransport();
await server.connect(transport);
// Ніколи не писати в stdout: на stdio-транспорті це канал JSON-RPC, і рядок
// «Fade MCP Server running» псував би потік для клієнта. Лише stderr.
process.stderr.write('Fade MCP Server running\n');
