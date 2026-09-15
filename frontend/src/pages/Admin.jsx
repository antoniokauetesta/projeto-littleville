import { useEffect, useState } from "react";
import api from "../services/api";

const emptyForm = { name: "", email: "", password: "", role: "USER" };

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [sightings, setSightings] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    try {
      setLoading(true);
      const [usersResponse, sightingsResponse] = await Promise.all([
        api.get("/admin/users"),
        api.get("/sightings"),
      ]);
      setUsers(usersResponse.data);
      setSightings(sightingsResponse.data);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Não foi possível carregar a administração");
    } finally {
      setLoading(false);
    }
  }

  function startEditing(user) {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, password: "", role: user.role });
  }

  function cancelEditing() {
    setEditingUser(null);
    setForm(emptyForm);
  }

  async function saveUser(event) {
    event.preventDefault();
    try {
      await api.put(`/admin/users/${editingUser.id}`, form);
      cancelEditing();
      await loadAdminData();
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Não foi possível atualizar o usuário");
    }
  }

  async function removeUser(user) {
    if (!window.confirm(`Excluir a conta de ${user.name}? Os avistamentos dela também serão removidos.`)) return;
    try {
      await api.delete(`/admin/users/${user.id}`);
      await loadAdminData();
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Não foi possível excluir o usuário");
    }
  }

  async function removeSighting(sighting) {
    if (!window.confirm(`Excluir o avistamento \"${sighting.title}\"?`)) return;
    try {
      await api.delete(`/admin/sightings/${sighting.id}`);
      await loadAdminData();
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Não foi possível excluir o avistamento");
    }
  }

  return (
    <>
      <div className="page-header">
        <div className="eyebrow">CONTROLE DO SISTEMA  /  ADMIN</div>
        <h1>Administração</h1>
        <p>Gerencie usuários, papéis e registros de Little Ville.</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="admin-summary">
        <div className="stat-card"><div className="stat-icon">◎</div><div className="stat-value">{users.length}</div><div className="stat-label">Usuários</div></div>
        <div className="stat-card"><div className="stat-icon">↯</div><div className="stat-value">{sightings.length}</div><div className="stat-label">Avistamentos</div></div>
        <div className="stat-card"><div className="stat-icon">◈</div><div className="stat-value">{users.filter((user) => user.role === "ADMIN").length}</div><div className="stat-label">Administradores</div></div>
      </div>

      <section className="admin-section">
        <div className="section-header"><h2>Usuários e permissões</h2></div>
        <div className="table-container">
          <table className="data-table admin-table">
            <thead><tr><th>Usuário</th><th>E-mail</th><th>Papel</th><th>Avistamentos</th><th>Ações</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="5" className="table-empty">Carregando usuários...</td></tr> : users.map((user) => (
                <tr key={user.id}>
                  <td><strong>{user.name}</strong></td>
                  <td>{user.email}</td>
                  <td><span className={`role-badge role-${user.role.toLowerCase()}`}>{user.role === "ADMIN" ? "Administrador" : "Morador"}</span></td>
                  <td>{user.sightingsCount}</td>
                  <td className="actions"><button className="btn-edit" onClick={() => startEditing(user)}>Editar</button><button className="btn-delete" onClick={() => removeUser(user)}>Excluir</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section">
        <div className="section-header"><h2>Todos os avistamentos</h2></div>
        <div className="table-container">
          <table className="data-table admin-table">
            <thead><tr><th>Título</th><th>Registrado por</th><th>Data</th><th>Ações</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="4" className="table-empty">Carregando avistamentos...</td></tr> : sightings.map((sighting) => (
                <tr key={sighting.id}><td><strong>{sighting.title}</strong><small>{sighting.description}</small></td><td>{sighting.user?.name || "-"}</td><td>{new Date(sighting.date).toLocaleDateString("pt-BR")}</td><td className="actions"><button className="btn-delete" onClick={() => removeSighting(sighting)}>Excluir</button></td></tr>
              ))}
              {!loading && sightings.length === 0 && <tr><td colSpan="4" className="table-empty">Nenhum avistamento registrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {editingUser && <div className="modal-overlay" onClick={cancelEditing}><div className="modal" onClick={(event) => event.stopPropagation()}><h2>Editar usuário</h2><form onSubmit={saveUser}><div className="form-group"><label>Nome</label><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></div><div className="form-group"><label>E-mail</label><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></div><div className="form-group"><label>Nova senha (opcional)</label><input type="password" minLength="6" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></div><div className="form-group"><label>Papel</label><select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option value="USER">Morador</option><option value="ADMIN">Administrador</option></select></div><div className="form-actions"><button type="button" className="btn btn-secondary" onClick={cancelEditing}>Cancelar</button><button className="btn btn-primary" type="submit">Salvar alterações</button></div></form></div></div>}
    </>
  );
}
