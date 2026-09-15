import { useState, useEffect, Fragment } from "react";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";

export default function Sightings() {
  const { user } = useAuth();
  const [sightings, setSightings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSighting, setEditingSighting] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", lat: "", lng: "" });
  const [commentDrafts, setCommentDrafts] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSightings();
  }, []);

  async function loadSightings() {
    try {
      const res = await api.get("/sightings");
      setSightings(res.data);
    } catch (error) {
      console.error("Erro ao carregar avistamentos:", error);
    }
  }

  function openCreate() {
    setEditingSighting(null);
    setForm({ title: "", description: "", lat: "", lng: "" });
    setShowModal(true);
  }

  function handleEdit(sighting) {
    setEditingSighting(sighting);
    setForm({
      title: sighting.title,
      description: sighting.description,
      lat: String(sighting.lat),
      lng: String(sighting.lng),
    });
    setShowModal(true);
  }

  async function handleDelete(id) {
    if (!window.confirm("Tem certeza que deseja deletar este avistamento?")) return;
    try {
      await api.delete(`/sightings/${id}`);
      loadSightings();
    } catch (error) {
      alert(error.response?.data?.error || "Erro ao deletar");
    }
  }

  async function handleAddComment(sightingId) {
    const content = (commentDrafts[sightingId] || "").trim();

    if (!content) {
      alert("Escreva um comentário antes de enviar.");
      return;
    }

    try {
      await api.post(`/sightings/${sightingId}/comments`, { content });
      setCommentDrafts((prev) => ({ ...prev, [sightingId]: "" }));
      loadSightings();
    } catch (error) {
      alert(error.response?.data?.error || "Erro ao enviar comentário");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingSighting) {
        await api.put(`/sightings/${editingSighting.id}`, {
          title: form.title,
          description: form.description,
          lat: parseFloat(form.lat),
          lng: parseFloat(form.lng),
        });
      } else {
        await api.post("/sightings", {
          title: form.title,
          description: form.description,
          lat: parseFloat(form.lat),
          lng: parseFloat(form.lng),
        });
      }
      setShowModal(false);
      setForm({ title: "", description: "", lat: "", lng: "" });
      setEditingSighting(null);
      loadSightings();
    } catch (error) {
      alert(error.response?.data?.error || "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  function closeModal() {
    setShowModal(false);
    setEditingSighting(null);
    setForm({ title: "", description: "", lat: "", lng: "" });
  }

  const filteredSightings = sightings.filter((s) => {
    const matchesSearch =
      !searchTerm ||
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.user?.name || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterMode === "all" ||
      (filterMode === "recent" && new Date(s.createdAt) >= new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)) ||
      (filterMode === "comments" && (s.comments || []).length > 0);

    return matchesSearch && matchesFilter;
  });

  const totalComments = sightings.reduce((sum, sighting) => sum + (sighting.comments?.length || 0), 0);

  function exportCsv() {
    const headers = ["ID", "Título", "Descrição", "Latitude", "Longitude", "Data", "Registrado por"];
    const rows = filteredSightings.map((sighting) => [
      sighting.id,
      sighting.title,
      sighting.description,
      sighting.lat,
      sighting.lng,
      new Date(sighting.date).toLocaleDateString("pt-BR"),
      sighting.user?.name || "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "little-ville-avistamentos.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="page-header">
        <div className="eyebrow">ARQUIVO CENTRAL  /  REGISTROS</div>
        <h1>Todos os avistamentos</h1>
        <p>Consulte, edite e organize as evidências registradas pelos moradores.</p>
      </div>

      <div className="section-header">
        <h2>Lista completa</h2>
        <div className="section-actions">
          <button className="btn btn-secondary btn-sm" onClick={exportCsv} disabled={!filteredSightings.length}>↓ Exportar CSV</button>
          <button className="btn btn-primary btn-sm" onClick={openCreate}>+ Registrar avistamento</button>
        </div>
      </div>

      <div className="sightings-toolbar">
        <div className="search-box">
          <span>🔎</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, descrição ou autor"
          />
        </div>

        <div className="filter-pills">
          <button className={filterMode === "all" ? "filter-pill active" : "filter-pill"} onClick={() => setFilterMode("all")}>
            Todos ({sightings.length})
          </button>
          <button className={filterMode === "recent" ? "filter-pill active" : "filter-pill"} onClick={() => setFilterMode("recent")}>
            Recentes
          </button>
          <button className={filterMode === "comments" ? "filter-pill active" : "filter-pill"} onClick={() => setFilterMode("comments")}>
            Com comentários ({sightings.filter((s) => (s.comments || []).length > 0).length})
          </button>
        </div>
      </div>

      <div className="activity-row">
        <div className="activity-card">
          <span className="activity-label">Total de comentários</span>
          <strong>{totalComments}</strong>
        </div>
        <div className="activity-card">
          <span className="activity-label">Resultado atual</span>
          <strong>{filteredSightings.length} avistamentos</strong>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Título</th>
              <th>Descrição</th>
              <th>Lat</th>
              <th>Lng</th>
              <th>Data</th>
              <th>Registrado por</th>
            </tr>
          </thead>
          <tbody>
            {filteredSightings.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>
                  Nenhum avistamento encontrado com os filtros atuais. 👣
                </td>
              </tr>
            ) : (
              filteredSightings.map((s) => (
                <Fragment key={s.id}>
                  <tr>
                    <td style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>#{s.id}</td>
                    <td style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                      {s.title}
                      {(s.comments || []).length > 0 && <span className="comment-badge">{(s.comments || []).length}💬</span>}
                    </td>
                    <td>{s.description.length > 40 ? s.description.substring(0, 40) + "..." : s.description}</td>
                    <td>{s.lat.toFixed(4)}</td>
                    <td>{s.lng.toFixed(4)}</td>
                    <td>{new Date(s.date).toLocaleDateString("pt-BR")}</td>
                    <td>{s.user?.name || "—"}</td>
                  </tr>
                  <tr>
                    <td colSpan="7" className="comment-cell">
                      <div className="comment-box">
                        <div className="comment-list">
                          {(s.comments || []).length === 0 ? (
                            <p className="comment-empty">Nenhum comentário ainda. Seja o primeiro a responder.</p>
                          ) : (
                            (s.comments || []).map((comment) => (
                              <div key={comment.id} className="comment-item">
                                <div className="comment-header">
                                  <strong>{comment.user?.name || "Usuário"}</strong>
                                  <span>{new Date(comment.createdAt).toLocaleDateString("pt-BR")}</span>
                                </div>
                                <p>{comment.content}</p>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="comment-form">
                          <input
                            type="text"
                            placeholder="Adicionar comentário..."
                            value={commentDrafts[s.id] || ""}
                            onChange={(e) =>
                              setCommentDrafts((prev) => ({ ...prev, [s.id]: e.target.value }))
                            }
                          />
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => handleAddComment(s.id)}>
                            Comentar
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingSighting ? "✏️ Editar Avistamento" : "📌 Novo Avistamento"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Título</label>
                <input
                  type="text"
                  placeholder="Ex: Pé Grande avistado na floresta"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Descrição</label>
                <input
                  type="text"
                  placeholder="Descreva o que foi avistado..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Latitude</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="-23.5505"
                    value={form.lat}
                    onChange={(e) => setForm({ ...form, lat: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Longitude</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="-46.6333"
                    value={form.lng}
                    onChange={(e) => setForm({ ...form, lng: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Salvando..." : editingSighting ? "Atualizar" : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
