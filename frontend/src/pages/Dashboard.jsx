import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import { Link } from "react-router-dom";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import L from "leaflet";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import "leaflet/dist/leaflet.css";

// Fix para os ícones do Leaflet não aparecerem
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Ícone personalizado para avistamentos (vermelho)
const sightingIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Ícone para novo marcador (verde)
const newMarkerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Componente para capturar cliques no mapa
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [sightings, setSightings] = useState([]);
  const [stats, setStats] = useState({ totalSightings: 0, totalUsers: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editingSighting, setEditingSighting] = useState(null);
  const [newMarker, setNewMarker] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", lat: "", lng: "" });
  const [loading, setLoading] = useState(false);

  function canManage(sighting) {
    if (!sighting) return false;
    return user?.role === "ADMIN" || user?.id === sighting.userId;
  }

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [sightingsRes, statsRes] = await Promise.all([
        api.get("/sightings"),
        api.get("/sightings/stats"),
      ]);
      setSightings(sightingsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  }

  function handleMapClick(latlng) {
    setNewMarker(latlng);
    setForm({ title: "", description: "", lat: latlng.lat.toFixed(6), lng: latlng.lng.toFixed(6) });
    setEditingSighting(null);
    setShowModal(true);
  }

  function handleEdit(sighting) {
    if (!canManage(sighting)) {
      alert("Você só pode editar os seus próprios avistamentos.");
      return;
    }

    setEditingSighting(sighting);
    setForm({
      title: sighting.title,
      description: sighting.description,
      lat: String(sighting.lat),
      lng: String(sighting.lng),
    });
    setNewMarker(null);
    setShowModal(true);
  }

  async function handleDelete(id) {
    const sighting = sightings.find((item) => item.id === id);

    if (!canManage(sighting)) {
      alert("Você só pode deletar os seus próprios avistamentos ou pedir ajuda do administrador.");
      return;
    }

    if (!window.confirm("Tem certeza que deseja deletar este avistamento?")) return;
    try {
      await api.delete(`/sightings/${id}`);
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || "Erro ao deletar");
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
      setNewMarker(null);
      setForm({ title: "", description: "", lat: "", lng: "" });
      setEditingSighting(null);
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  function closeModal() {
    setShowModal(false);
    setNewMarker(null);
    setEditingSighting(null);
    setForm({ title: "", description: "", lat: "", lng: "" });
  }

  const recentSightings = [...sightings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const mySightings = sightings.filter((sighting) => String(sighting.userId) === String(user?.id));
  const myComments = sightings.reduce(
    (total, sighting) => total + (sighting.comments || []).filter((comment) => comment.userId === user?.id).length,
    0,
  );
  const activityData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const dayKey = date.toISOString().slice(0, 10);
    return {
      name: date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
      total: sightings.filter((sighting) => sighting.createdAt && new Date(sighting.createdAt).toISOString().slice(0, 10) === dayKey).length,
    };
  });

  return (
    <>
      <div className="page-header">
        <div className="eyebrow">PAINEL DE MONITORAMENTO  /  24H</div>
        <h1>Mapa de avistamentos</h1>
        <p>Registre uma ocorrência, acompanhe os pontos ativos e ajude a montar o arquivo de Little Ville.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">↯</div>
          <div className="stat-value">{stats.totalSightings}</div>
          <div className="stat-label">Avistamentos</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">◎</div>
          <div className="stat-value">{stats.totalUsers}</div>
          <div className="stat-label">Moradores</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⌖</div>
          <div className="stat-value">{sightings.length}</div>
          <div className="stat-label">Locais Marcados</div>
        </div>
      </div>

      <div className="dashboard-insights">
        <section className="insight-panel">
          <div className="section-header">
            <div>
              <span className="activity-label">RITMO DA COMUNIDADE</span>
              <h2>Atividade nos últimos 7 dias</h2>
            </div>
            <strong className="insight-total">{sightings.filter((sighting) => new Date(sighting.createdAt) >= new Date(Date.now() - 7 * 86400000)).length}</strong>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c9ee76" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#c9ee76" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#82918a", fontSize: 11 }} />
                <Tooltip cursor={{ stroke: "#dce4db" }} contentStyle={{ border: "0", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="total" stroke="#1f4a3d" strokeWidth={3} fill="url(#activityFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="insight-panel personal-panel">
          <span className="activity-label">SUA CONTRIBUIÇÃO</span>
          <h2>Você está deixando rastros.</h2>
          <div className="personal-metrics">
            <div><strong>{mySightings.length}</strong><span>avistamentos</span></div>
            <div><strong>{myComments}</strong><span>comentários</span></div>
          </div>
          <Link className="btn btn-primary btn-sm" to="/sightings">Explorar arquivo →</Link>
        </section>
      </div>

      {/* Mapa */}
      <div className="map-section">
        <div className="section-header">
          <h2>Mapa de ocorrências <span>• AO VIVO</span></h2>
        </div>
        <div className="map-container">
          <MapContainer
            center={[-15.7801, -47.9292]}
            zoom={4}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onMapClick={handleMapClick} />

            {/* Marcadores dos avistamentos existentes */}
            {sightings.map((s) => (
              <Marker key={s.id} position={[s.lat, s.lng]} icon={sightingIcon}>
                <Popup>
                  <div style={{ minWidth: 180 }}>
                    <strong style={{ fontSize: 14 }}>{s.title}</strong>
                    <p style={{ margin: "6px 0", fontSize: 12, color: "#666" }}>{s.description}</p>
                    <p style={{ fontSize: 11, color: "#999" }}>
                      📅 {new Date(s.date).toLocaleDateString("pt-BR")}
                    </p>
                    {s.user && (
                      <p style={{ fontSize: 11, color: "#999" }}>👤 {s.user.name}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Marcador do novo avistamento (verde) */}
            {newMarker && (
              <Marker position={[newMarker.lat, newMarker.lng]} icon={newMarkerIcon}>
                <Popup>📌 Novo avistamento aqui</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      </div>

      {/* Tabela de Avistamentos */}
      <div className="section-header">
        <h2>Avistamentos recentes</h2>
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Descrição</th>
              <th>Data</th>
              <th>Registrado por</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {recentSightings.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>
                  Nenhum avistamento recente ainda. Clique no mapa para adicionar! 🗺️
                </td>
              </tr>
            ) : (
              recentSightings.map((s) => (
                <tr key={s.id}>
                  <td style={{ color: "var(--text-primary)", fontWeight: 600 }}>{s.title}</td>
                  <td>{s.description.length > 60 ? s.description.substring(0, 60) + "..." : s.description}</td>
                  <td>{new Date(s.date).toLocaleDateString("pt-BR")}</td>
                  <td>{s.user?.name || "—"}</td>
                  <td className="actions">
                    {canManage(s) && (
                      <>
                        <button className="btn-edit" onClick={() => handleEdit(s)}>✏️ Editar</button>
                        <button className="btn-delete" onClick={() => handleDelete(s.id)}>🗑️ Deletar</button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de criação/edição */}
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
