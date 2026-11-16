import { useEffect, useState } from 'react';
import type { IconType } from 'react-icons';
import { FiCheck, FiCopy, FiMail } from 'react-icons/fi';
import { SiGithub } from 'react-icons/si';
import { FaLinkedin } from 'react-icons/fa';
import { perfil } from '../data/portfolio';
import { CabecalhoSecao } from '../components/CabecalhoSecao';

type Canal = {
  rotulo: string;
  valor: string;
  href: string;
  icone: IconType;
  /** Texto copiável (só o e-mail). */
  copiar?: string;
};

/** Botão "copiar" com feedback "copiado ✓" por 2 s. */
function BotaoCopiar({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!copiado) return;
    const t = setTimeout(() => setCopiado(false), 2000);
    return () => clearTimeout(t);
  }, [copiado]);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
    } catch {
      // Sem permissão de área de transferência: o link mailto continua funcionando
    }
  };

  return (
    <button
      type="button"
      className={`contato-copiar${copiado ? ' contato-copiar--ok' : ''}`}
      onClick={copiar}
      aria-label={copiado ? 'E-mail copiado' : 'Copiar e-mail'}
    >
      {copiado ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}
      <span>{copiado ? 'copiado' : 'copiar'}</span>
    </button>
  );
}

export function Contact() {
  const { github, linkedin, email } = perfil.links;

  // Rótulos curtos e legíveis; o href continua com a URL completa.
  const canais: Canal[] = [
    { rotulo: 'e-mail', valor: email, href: `mailto:${email}`, icone: FiMail, copiar: email },
    { rotulo: 'github', valor: 'github.com/PedroFlau', href: github, icone: SiGithub },
    { rotulo: 'linkedin', valor: 'in/pedro-flausino-mendonca', href: linkedin, icone: FaLinkedin },
  ];

  return (
    <section className="secao">
      <CabecalhoSecao
        titulo="contato"
        subtitulo="Respondo rápido por qualquer um dos canais"
        meta={
          <span className="selo selo--ok">
            <span className="selo-ponto" aria-hidden="true" />
            aberto a estágio
          </span>
        }
      />

      <p className="contato-intro texto-corrido">
        Estou procurando meu primeiro estágio. Se você tem uma vaga, um projeto ou só
        quer trocar uma ideia sobre código, me chama.
      </p>

      <div className="contato-grid">
        {canais.map((c) => {
          const Icone = c.icone;
          return (
            <div key={c.rotulo} className="contato-card">
              <span className="contato-icone" aria-hidden="true">
                <Icone />
              </span>
              <span className="contato-textos">
                <span className="contato-rotulo">{c.rotulo}</span>
                <a
                  className="contato-link"
                  href={c.href}
                  target={c.href.startsWith('mailto') ? undefined : '_blank'}
                  rel="noopener noreferrer"
                >
                  {c.valor}
                </a>
              </span>
              {c.copiar && <BotaoCopiar texto={c.copiar} />}
            </div>
          );
        })}
      </div>
    </section>
  );
}
