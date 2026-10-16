import { perfil } from '../data/portfolio';
import { Terminal } from '../components/terminal';

export function Hero() {
  return (
    <section id="top" className="hero">
      <div className="hero-texto">
        <p className="hero-comando">
          <span className="text-green">pedro@portfolio</span>
          <span className="text-gray">:~$ </span>
          <span className="text-blue">whoami</span>
        </p>

        <h1 className="hero-nome">
          {perfil.primeiroNome} <span className="text-green">Flausino Mendonça</span>
        </h1>

        <p className="hero-titulo">
          {perfil.titulo} · {perfil.subtitulo}
        </p>

        <p className="hero-descricao">
          {perfil.idade} anos · {perfil.cidade}. Construindo minha base em programação
          e transformando estudo em projetos reais.
        </p>

        <div className="hero-botoes">
          <a className="botao botao-primario" href="#projetos">
            ver projetos
          </a>
          <a
            className="botao"
            href={perfil.links.github}
            target="_blank"
            rel="noopener noreferrer"
          >
            github ↗
          </a>
          <a
            className="botao"
            href={`mailto:${perfil.links.email}`}
          >
            contato ↗
          </a>
        </div>
      </div>

      <div className="hero-terminal">
        <Terminal />
      </div>
    </section>
  );
}
