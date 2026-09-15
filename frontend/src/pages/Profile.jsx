import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    bio: "",
    avatarUrl: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        bio: user.bio || "",
        avatarUrl: user.avatarUrl || "",
        password: "",
      });
    }
  }, [user]);

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Selecione um arquivo de imagem válido.");
      return;
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 900;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const compressed = canvas.toDataURL("image/jpeg", 0.78);
        setForm((prev) => ({ ...prev, avatarUrl: compressed }));
        setMessage("Imagem local carregada com sucesso!");
      };

      img.src = reader.result;
    };

    reader.readAsDataURL(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await updateProfile({
        name: form.name,
        email: form.email,
        bio: form.bio,
        avatarUrl: form.avatarUrl,
        password: form.password || undefined,
      });

      setMessage("Perfil atualizado com sucesso!");
      setForm((prev) => ({ ...prev, password: "" }));
    } catch (error) {
      setMessage(error.response?.data?.error || "Erro ao atualizar perfil");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-header" style={{ maxWidth: 900 }}>
      <div className="eyebrow">PERFIL  /  IDENTIDADE</div>
      <h1>Meu perfil</h1>
      <p>Atualize seus dados, bio e foto para representar melhor sua presença no Little Ville.</p>

      <div className="profile-card">
        <div className="profile-preview">
          {form.avatarUrl ? (
            <img src={form.avatarUrl} alt="Avatar do usuário" className="profile-avatar" />
          ) : (
            <div className="profile-avatar placeholder">{user?.name?.charAt(0)?.toUpperCase() || "U"}</div>
          )}
          <div>
            <h3>{form.name || "Seu nome"}</h3>
            <p>{form.bio || "Adicione uma bio para apresentar quem você é."}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label>Nome</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea
              rows="4"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Escreva uma pequena descrição sobre você"
            />
          </div>

          <div className="form-group">
            <label>Foto de perfil do computador</label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </div>

          <div className="form-group">
            <label>Ou use uma URL da imagem</label>
            <input
              type="url"
              value={form.avatarUrl}
              onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
              placeholder="https://imagem.exemplo.com/foto.jpg"
            />
          </div>

          <div className="form-group">
            <label>Nova senha (opcional)</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Deixe em branco para manter a atual"
            />
          </div>

          {message && (
            <div className={message.includes("sucesso") ? "success-message" : "error-message"}>{message}</div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Salvando..." : "Salvar perfil"}
          </button>
        </form>
      </div>
    </div>
  );
}
