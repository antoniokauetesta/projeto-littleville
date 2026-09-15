import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

function formatDate(value) {
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(" de ", " ");
}

export default function Community() {
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCommunity() {
      try {
        const response = await api.get("/sightings");
        setSightings(response.data);
      } catch (requestError) {
        setError(requestError.response?.data?.error || "Não foi possível carregar a comunidade");
      } finally {
        setLoading(false);
      }
    }

    loadCommunity();
  }, []);

  const members = useMemo(() => {
    const totals = new Map();

    sightings.forEach((sighting) => {
      const member = sighting.user;
      if (!member) return;
      const current = totals.get(member.id) || { id: member.id, name: member.name, sightings: 0, comments: 0 };
      current.sightings += 1;
      current.comments += (sighting.comments || []).length;
      totals.set(member.id, current);
    });

    return [...totals.values()].sort((first, second) => {
      if (second.sightings !== first.sightings) return second.sightings - first.sightings;
      return second.comments - first.comments;
    });
  }, [sightings]);

  const featuredSightings = [...sightings]
    .sort((first, second) => (second.comments?.length || 0) - (first.comments?.length || 0))
    .slice(0, 3);
  const recentComments = sightings
    .flatMap((sighting) => (sighting.comments || []).map((comment) => ({ ...comment, sightingTitle: sighting.title })))
    .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
    .slice(0, 5);

  return (
    <>
      <div className="page-header">
        <div className="eyebrow">REDE LOCAL / COMUNIDADE</div>
        <h1>Quem está observando?</h1>
        <p>Veja quem mantém o arquivo vivo, quais relatos movimentam a cidade e as conversas mais recentes.</p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {loading ? (
        <div className="community-empty">Carregando atividade da comunidade...</div>
      ) : (
        <div className="community-grid">
          <section className="community-panel leaderboard-panel">
            <div className="section-header">
              <div>
                <span className="activity-label">PLACAR DE CONTRIBUIÇÕES</span>
                <h2>Moradores em destaque</h2>
              </div>
              <span className="community-count">{members.length} ativos</span>
            </div>
            {members.length === 0 ? <p className="community-empty">Ainda não há contribuições registradas.</p> : (
              <div className="leaderboard-list">
                {members.slice(0, 6).map((member, index) => (
                  <div className="leaderboard-row" key={member.id}>
                    <span className={`rank rank-${index + 1}`}>{String(index + 1).padStart(2, "0")}</span>
                    <div className="member-avatar">{member.name.charAt(0).toUpperCase()}</div>
                    <div className="member-copy"><strong>{member.name}</strong><span>{member.comments} comentários na rede</span></div>
                    <strong className="member-score">{member.sightings}<small> registros</small></strong>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="community-panel">
            <span className="activity-label">RADAR DO ARQUIVO</span>
            <h2>Relatos que estão movimentando a cidade</h2>
            <div className="featured-list">
              {featuredSightings.length === 0 ? <p className="community-empty">Nenhum relato em destaque.</p> : featuredSightings.map((sighting) => (
                <div className="featured-item" key={sighting.id}>
                  <div><strong>{sighting.title}</strong><span>{sighting.user?.name || "Morador"} · {formatDate(sighting.date)}</span></div>
                  <b>{sighting.comments?.length || 0}</b>
                </div>
              ))}
            </div>
          </section>

          <section className="community-panel comments-panel">
            <div className="section-header"><div><span className="activity-label">CONVERSAS RECENTES</span><h2>O que estão dizendo</h2></div></div>
            {recentComments.length === 0 ? <p className="community-empty">As primeiras conversas aparecerão aqui.</p> : (
              <div className="recent-comments">
                {recentComments.map((comment) => (
                  <article className="community-comment" key={comment.id}>
                    <div className="comment-header"><strong>{comment.user?.name || "Morador"}</strong><span>{formatDate(comment.createdAt)}</span></div>
                    <p>{comment.content}</p>
                    <small>em {comment.sightingTitle}</small>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
