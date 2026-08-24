import { useEffect, useMemo, useState } from "react";

const initialForm = {
  name: "",
  client: "cursor",
  version: "1.0.0",
  description: "",
  capabilities: "",
  mcpServer: "filesystem",
  mcpTools: "list_files, read_file"
};

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Request failed");
  }

  if (response.status === 204) return null;
  return response.json();
}

export default function App() {
  const [packs, setPacks] = useState([]);
  const [clients, setClients] = useState([]);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [packData, clientData] = await Promise.all([
        api("/api/skill-packs"),
        api("/api/clients")
      ]);
      setPacks(packData);
      setClients(clientData);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const visiblePacks = useMemo(
    () => filter === "all" ? packs : packs.filter(p => p.client === filter),
    [packs, filter]
  );

  async function createPack(event) {
    event.preventDefault();
    setMessage("");

    try {
      await api("/api/skill-packs", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          client: form.client,
          version: form.version,
          description: form.description,
          capabilities: form.capabilities.split(",").map(s => s.trim()).filter(Boolean),
          mcp: {
            enabled: true,
            server: form.mcpServer,
            tools: form.mcpTools.split(",").map(s => s.trim()).filter(Boolean)
          }
        })
      });

      setForm(initialForm);
      setMessage("Skill pack created.");
      await load();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function testPack(id) {
    try {
      const result = await api(`/api/skill-packs/${id}/test`, { method: "POST" });
      setMessage(result.message);
      await load();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function deletePack(id) {
    if (!confirm("Delete this skill pack?")) return;

    try {
      await api(`/api/skill-packs/${id}`, { method: "DELETE" });
      setMessage("Skill pack deleted.");
      await load();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">MCP • AGENT EXTENSIONS</p>
          <h1>Skill Pack Hub</h1>
          <p className="subtitle">
            Build, test and compare capability packs for non-Claude agent clients.
          </p>
        </div>
        <div className="heroBadge">S1 Build</div>
      </header>

      <main className="container">
        {message && <div className="notice">{message}</div>}

        <section className="stats">
          <div className="stat">
            <span>Total packs</span>
            <strong>{packs.length}</strong>
          </div>
          <div className="stat">
            <span>Tested</span>
            <strong>{packs.filter(p => p.status === "tested").length}</strong>
          </div>
          <div className="stat">
            <span>MCP enabled</span>
            <strong>{packs.filter(p => p.mcp?.enabled).length}</strong>
          </div>
        </section>

        <section className="panel">
          <div className="panelHeader">
            <div>
              <h2>Skill packs</h2>
              <p>Each pack is adapted to its target client.</p>
            </div>
            <select value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">All clients</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {loading ? (
            <p className="empty">Loading...</p>
          ) : visiblePacks.length === 0 ? (
            <p className="empty">No skill packs found.</p>
          ) : (
            <div className="cards">
              {visiblePacks.map(pack => (
                <article className="card" key={pack.id}>
                  <div className="cardTop">
                    <div>
                      <span className="client">{pack.client}</span>
                      <h3>{pack.name}</h3>
                    </div>
                    <span className={`status ${pack.status}`}>{pack.status}</span>
                  </div>

                  <p>{pack.description}</p>

                  <div className="chips">
                    {pack.capabilities.map(cap => <span key={cap}>{cap}</span>)}
                  </div>

                  <div className="mcp">
                    <strong>MCP</strong>
                    <span>{pack.mcp?.enabled ? "Enabled" : "Disabled"}</span>
                    {pack.mcp?.server && <span>server: {pack.mcp.server}</span>}
                  </div>

                  <div className="actions">
                    <button onClick={() => testPack(pack.id)}>Test pack</button>
                    <button className="danger" onClick={() => deletePack(pack.id)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panelHeader">
            <div>
              <h2>Create a pack</h2>
              <p>Add a client-specific capability pack.</p>
            </div>
          </div>

          <form className="form" onSubmit={createPack}>
            <label>
              Name
              <input required value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                placeholder="Documentation Assistant" />
            </label>

            <div className="grid2">
              <label>
                Client
                <select value={form.client}
                  onChange={e => setForm({...form, client: e.target.value})}>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>

              <label>
                Version
                <input value={form.version}
                  onChange={e => setForm({...form, version: e.target.value})} />
              </label>
            </div>

            <label>
              Description
              <textarea required value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                placeholder="What this skill pack enables..." />
            </label>

            <label>
              Capabilities
              <input value={form.capabilities}
                onChange={e => setForm({...form, capabilities: e.target.value})}
                placeholder="search, summarize, review" />
            </label>

            <div className="grid2">
              <label>
                MCP server
                <input value={form.mcpServer}
                  onChange={e => setForm({...form, mcpServer: e.target.value})} />
              </label>

              <label>
                MCP tools
                <input value={form.mcpTools}
                  onChange={e => setForm({...form, mcpTools: e.target.value})} />
              </label>
            </div>

            <button className="primary" type="submit">Create skill pack</button>
          </form>
        </section>

        <section className="panel differences">
          <h2>Client differences</h2>
          <div className="differenceGrid">
            {clients.map(client => (
              <div key={client.id}>
                <h3>{client.name}</h3>
                <p>{client.description}</p>
                <ul>
                  {client.conventions.map(item => <li key={item}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
