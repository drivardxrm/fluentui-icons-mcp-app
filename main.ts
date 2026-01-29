import cors from "cors";
import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createServer } from "./server.js";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

const app = express();
app.use(cors());

// Track active transports for cleanup
const transports = new Map<string, SSEServerTransport>();

app.get("/mcp", async (req, res) => {
  const transport = new SSEServerTransport("/mcp/message", res);
  const sessionId = transport.sessionId;
  transports.set(sessionId, transport);

  const server = createServer();
  
  res.on("close", () => {
    transports.delete(sessionId);
  });

  await server.connect(transport);
});

app.post("/mcp/message", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports.get(sessionId);
  
  if (!transport) {
    res.status(404).send("Session not found");
    return;
  }

  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", async () => {
    try {
      await transport.handlePostMessage(req, res, JSON.parse(body));
    } catch {
      res.status(400).send("Invalid JSON");
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Fluent UI Icons MCP Server running at http://localhost:${PORT}/mcp`);
});
