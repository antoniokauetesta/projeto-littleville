import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
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
        <h2>Avistamentos registrados</h2>
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
            {sightings.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>
                  Nenhum avistamento registrado ainda. Clique no mapa para adicionar! 🗺️
                </td>
              </tr>
            ) : (
              sightings.map((s) => (
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
