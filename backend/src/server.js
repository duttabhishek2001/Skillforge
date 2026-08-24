import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const clients = [
  {
    id: "cursor",
    name: "Cursor",
    description: "IDE-oriented agent client",
    conventions: ["Project rules", "MCP servers", "workspace context"]
  },
  {
    id: "gemini",
    name: "Gemini",
    description: "Google Gemini agent workflow",
    conventions: ["Tool declarations", "system instructions", "MCP-compatible tooling"]
  }
];

let skillPacks = [
  {
    id: 1,
    name: "Repository Explorer",
    client: "cursor",
    version: "1.0.0",
    description: "Explore a repository, locate relevant files and summarize implementation paths.",
    capabilities: ["file-search", "code-navigation", "summary"],
    mcp: {
      enabled: true,
      server: "filesystem",
      tools: ["list_files", "read_file", "search_files"]
    },
    status: "tested",
    lastTested: "2026-08-24T00:00:00.000Z"
  },
  {
    id: 2,
    name: "Code Review Assistant",
    client: "gemini",
    version: "1.0.0",
    description: "Review changed code and return actionable findings with severity.",
    capabilities: ["diff-review", "risk-detection", "suggestions"],
    mcp: {
      enabled: true,
      server: "git",
      tools: ["git_diff", "git_status", "git_log"]
    },
    status: "tested",
    lastTested: "2026-08-24T00:00:00.000Z"
  }
];

function nextId() {
  return skillPacks.length ? Math.max(...skillPacks.map(p => p.id)) + 1 : 1;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "skill-pack-hub-backend" });
});

app.get("/api/clients", (_req, res) => {
  res.json(clients);
});

app.get("/api/skill-packs", (req, res) => {
  const client = req.query.client;
  const result = client
    ? skillPacks.filter(pack => pack.client === client)
    : skillPacks;
  res.json(result);
});

app.get("/api/skill-packs/:id", (req, res) => {
  const pack = skillPacks.find(p => p.id === Number(req.params.id));
  if (!pack) return res.status(404).json({ message: "Skill pack not found" });
  res.json(pack);
});

app.post("/api/skill-packs", (req, res) => {
  const { name, client, version = "1.0.0", description = "", capabilities = [], mcp } = req.body;

  if (!name || !client) {
    return res.status(400).json({ message: "name and client are required" });
  }

  if (!clients.some(c => c.id === client)) {
    return res.status(400).json({ message: "Unknown client" });
  }

  const pack = {
    id: nextId(),
    name,
    client,
    version,
    description,
    capabilities,
    mcp: mcp || { enabled: false, server: null, tools: [] },
    status: "untested",
    lastTested: null
  };

  skillPacks.push(pack);
  res.status(201).json(pack);
});

app.put("/api/skill-packs/:id", (req, res) => {
  const index = skillPacks.findIndex(p => p.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ message: "Skill pack not found" });

  skillPacks[index] = {
    ...skillPacks[index],
    ...req.body,
    id: skillPacks[index].id
  };

  res.json(skillPacks[index]);
});

app.delete("/api/skill-packs/:id", (req, res) => {
  const id = Number(req.params.id);
  const exists = skillPacks.some(p => p.id === id);
  if (!exists) return res.status(404).json({ message: "Skill pack not found" });

  skillPacks = skillPacks.filter(p => p.id !== id);
  res.status(204).send();
});

app.post("/api/skill-packs/:id/test", (req, res) => {
  const pack = skillPacks.find(p => p.id === Number(req.params.id));
  if (!pack) return res.status(404).json({ message: "Skill pack not found" });

  pack.status = "tested";
  pack.lastTested = new Date().toISOString();

  res.json({
    success: true,
    message: `${pack.name} passed the simulated client test`,
    pack
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
