import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const signals = [
  { number: "01", title: "Registre sinais", text: "Marque no mapa o que acontece ao seu redor." },
  { number: "02", title: "Conecte relatos", text: "Leia, comente e encontre padrões na vizinhança." },
  { number: "03", title: "Mantenha a memória", text: "Construa um arquivo vivo da cidade." },
];

export default function Welcome() {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`@littleville:welcome-visited:${user.id}`, "true");
    }
  }, [user]);

  return (
    <main className="welcome-page">
      <nav className="welcome-nav">
        <Link className="welcome-brand" to="/welcome">
          <span className="logo-icon">LV</span>
          <span>Little Ville</span>
        </Link>
        <div className="welcome-nav-actions">
          <Link className="welcome-login" to="/login">Entrar</Link>
          <Link className="btn btn-primary btn-sm" to="/register">Criar conta</Link>
        </div>
      </nav>

      <section className="welcome-hero">
        <div className="welcome-copy">
          <div className="eyebrow">CENTRAL DE EVIDÊNCIAS / 2026</div>
          <h1>A cidade tem histórias. <em>Vamos observá-las.</em></h1>
          <p>Little Ville é o ponto de encontro para registrar avistamentos, conversar sobre sinais estranhos e preservar o que não deveria ser esquecido.</p>
          <div className="welcome-actions">
            <Link className="btn btn-primary" to="/register">Entrar para a comunidade <span>→</span></Link>
            <Link className="welcome-text-link" to="/login">Já tenho uma conta</Link>
          </div>
        </div>
        <div className="welcome-scene" aria-label="Mapa ilustrado de Little Ville">
          <div className="scene-label">MAPA DE CAMPO <span>● AO VIVO</span></div>
          <div className="scene-grid" />
          <div className="scene-route route-one" />
          <div className="scene-route route-two" />
          <div className="scene-pin pin-one"><b>01</b><span>Floresta norte</span></div>
          <div className="scene-pin pin-two"><b>02</b><span>Rua das luzes</span></div>
          <div className="scene-coordinate">21° 14' 08" S<br />47° 48' 12" W</div>
          <div className="scene-stamp">LV<br /><small>FIELD NOTES</small></div>
        </div>
      </section>

      <section className="welcome-signals">
        <div className="welcome-section-heading">
          <span className="activity-label">COMO FUNCIONA</span>
          <h2>Uma cidade mais atenta.</h2>
        </div>
        <div className="signal-grid">
          {signals.map((signal) => (
            <article className="signal-item" key={signal.number}>
              <span>{signal.number}</span>
              <h3>{signal.title}</h3>
              <p>{signal.text}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="welcome-footer">LITTLE VILLE <span>ARQUIVO ABERTO PARA QUEM PRESTA ATENÇÃO</span></footer>
    </main>
  );
}
