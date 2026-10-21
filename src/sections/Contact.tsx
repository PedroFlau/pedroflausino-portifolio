import { perfil } from '../data/portfolio';

export function Contact() {
  const { github, linkedin, email } = perfil.links;

  const canais = [
    { rotulo: 'e-mail', valor: email, href: `mailto:${email}` },
    { rotulo: 'github', valor: github.replace('https://', ''), href: github },
    { rotulo: 'linkedin', valor: linkedin.replace('https://', ''), href: linkedin },
  ];

  return (
    <section className="secao">
      <h2 className="secao-titulo">
        contato
      </h2>

      <p className="contato-intro">
        Aberto a oportunidades de estágio, projetos e trocas de conhecimento.
        Me chama em qualquer um dos canais abaixo 👇
      </p>

      <div className="contato-grid">
        {canais.map((c) => (
          <a
            key={c.rotulo}
            className="contato-card"
            href={c.href}
            target={c.href.startsWith('mailto') ? undefined : '_blank'}
            rel="noopener noreferrer"
          >
            <span className="text-gray">{c.rotulo}</span>
            <span className="text-accent">{c.valor} ↗</span>
          </a>
        ))}
      </div>
    </section>
  );
}
