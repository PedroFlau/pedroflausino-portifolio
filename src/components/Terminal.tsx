import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Hero } from '../sections/Hero';
import { About } from '../sections/About';
import { Skills } from '../sections/Skills';
import { Contact } from '../sections/Contact';
import { Projects } from '../sections/Projects';
import { MapaViagens } from './MapaViagens';
import { Monitoria } from './Monitoria';
import { SeletorTemas } from './SeletorTemas';
import { WakaTime } from './WakaTime';
import { useTema, ORDEM_TEMAS, type Tema } from '../hooks/useTema';
import {
  comandos,
  curriculo,
  jogos,
  lattes,
  monitoria,
  premios,
  recomendacoes,
  viagens,
  type JogoConquistas,
} from '../data/portfolio';

type ItemHistorico = { comando: string; saida: ReactNode };

/** Remove acentos e deixa minúsculo (aceita "curriculo" e "currículo"). */
const normalizar = (texto: string) =>
  texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/** Descobre o comando base a partir de um token (aceita aliases). */
function resolver(token: string): string | null {
  const alvo = normalizar(token);
  for (const c of comandos) {
    const nomes = [c.nome, ...c.aliases].map(normalizar);
    if (nomes.includes(alvo)) return normalizar(c.nome);
  }
  return null;
}

/** Barra de progresso de conquistas estilo terminal. */
function barra(feitas: number, total: number): string {
  const pct = total > 0 ? Math.round((feitas / total) * 100) : 0;
  const cheios = Math.max(0, Math.min(10, Math.round(pct / 10)));
  return `${'█'.repeat(cheios)}${'░'.repeat(10 - cheios)}  ${feitas}/${total}  (${pct}%)`;
}

function Card({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="cmd-card">
      <h3 className="card-titulo">{titulo}</h3>
      {children}
    </div>
  );
}

function Vazio({ children }: { children: ReactNode }) {
  return <p className="cmd-aviso">🚧 {children}</p>;
}

function ListaJogos({
  lista,
  plataforma,
}: {
  lista: JogoConquistas[];
  plataforma: string;
}) {
  if (lista.length === 0) {
    return (
      <Vazio>
        Nenhum jogo de {plataforma} cadastrado ainda.
        <br />
        Preencha <code>jogos.{plataforma.toLowerCase()}</code> em{' '}
        <code>src/data/portfolio.ts</code>.
      </Vazio>
    );
  }

  return (
    <ul className="cmd-lista">
      {lista.map((jogo) => (
        <li key={jogo.nome}>
          <span className="cmd-jogo">{jogo.nome}</span>
          <span className="cmd-barra">
            {barra(jogo.conquistas.feitas, jogo.conquistas.total)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function IconeSol() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function IconeLua() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function IconeSistema() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="13" rx="1" />
      <path d="M8 21h8M12 17v4M7 8h4M7 11h7" />
    </svg>
  );
}

function IconeImperio() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M12 5v4.4M12 14.6V19M5 12h4.4M14.6 12H19M7.05 7.05l3.1 3.1M13.85 13.85l3.1 3.1M7.05 16.95l3.1-3.1M13.85 10.15l3.1-3.1" />
    </svg>
  );
}

export function Terminal() {
  const { tema, definirTema, alternarTema } = useTema();
  const [input, setInput] = useState('');
  const [historico, setHistorico] = useState<ItemHistorico[]>([]);
  const [temasAberto, setTemasAberto] = useState(false);
  const [comandoTemas, setComandoTemas] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const NOME_TEMA: Record<Tema, string> = {
    dark: 'escuro',
    light: 'claro',
    system: 'system',
    galactic_empire: 'galactic_empire',
  };
  const proximoTema =
    ORDEM_TEMAS[(ORDEM_TEMAS.indexOf(tema) + 1) % ORDEM_TEMAS.length];
  const rotuloProximo = NOME_TEMA[proximoTema];

  // Rola o conteúdo do terminal para o fim a cada comando (sem mexer na página)
  useEffect(() => {
    if (historico.length === 0) return;
    const el = scrollRef.current;
    if (!el) return;
    const id = requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
    return () => cancelAnimationFrame(id);
  }, [historico]);

  useEffect(() => {
    if (temasAberto) {
      inputRef.current?.blur();
    } else {
      inputRef.current?.focus();
    }
  }, [temasAberto]);

  function renderizarSaida(nome: string | null, entrada: string): ReactNode {
    switch (nome) {
      case null:
        return (
          <span className="cmd-erro">
            comando não encontrado: "{entrada}". Digite "ajuda" para ver os
            comandos.
          </span>
        );

      case 'ajuda':
        return (
          <ul className="cmd-lista cmd-lista-ajuda">
            {comandos.map((c) => (
              <li key={c.nome}>
                <span className="text-accent">
                  {[c.nome, ...c.aliases].join(', ')}
                </span>
                <span className="text-gray">{c.desc}</span>
              </li>
            ))}
          </ul>
        );

      // ---- Conteúdo reaproveitado das seções ----
      case 'sobre':
        return <About />;
      case 'habilidades':
        return <Skills />;
      case 'contato':
        return <Contact />;
      case 'projetos':
        return <Projects />;

      // ---- Monitoria ----
      case 'monitoria': {
        const temDados = monitoria.disciplina || monitoria.horarios.length > 0;
        if (!temDados) {
          return (
            <Vazio>
              Monitoria ainda não cadastrada. Preencha <code>monitoria</code> em{' '}
              <code>src/data/portfolio.ts</code>.
            </Vazio>
          );
        }
        return (
          <Monitoria
            disciplina={monitoria.disciplina}
            professor={monitoria.professor}
            horarios={monitoria.horarios}
          />
        );
      }

      // ---- Currículo ----
      case 'curriculo':
        return (
          <Card titulo="currículo">
            <a
              className="cmd-link"
              href={curriculo.arquivo}
              target="_blank"
              rel="noopener noreferrer"
            >
              abrir meu currículo (PDF) ↗
            </a>
            <p className="cmd-aviso">
              Obs.: coloque o arquivo do seu currículo em{' '}
              <code>public/cv.pdf</code>.
            </p>
          </Card>
        );

      // ---- Lattes ----
      case 'lattes':
        if (!lattes.url) {
          return (
            <Vazio>
              Lattes ainda não cadastrado. Preencha <code>lattes.url</code> em{' '}
              <code>src/data/portfolio.ts</code>.
            </Vazio>
          );
        }
        return (
          <Card titulo="lattes">
            {lattes.resumo && <p>{lattes.resumo}</p>}
            <a
              className="cmd-link"
              href={lattes.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              abrir meu Lattes ↗
            </a>
          </Card>
        );

      // ---- Recomendações ----
      case 'recomendacoes':
        if (recomendacoes.length === 0) {
          return (
            <Vazio>
              Nenhuma recomendação cadastrada ainda. Preencha{' '}
              <code>recomendacoes</code> em <code>src/data/portfolio.ts</code>.
            </Vazio>
          );
        }
        return (
          <ul className="cmd-lista">
            {recomendacoes.map((r, i) => (
              <li key={i} className="cmd-card">
                <p className="cmd-citacao">"{r.texto}"</p>
                <span className="text-accent">
                  {r.autor}
                  {r.cargo && <span className="text-gray"> — {r.cargo}</span>}
                </span>
              </li>
            ))}
          </ul>
        );

      // ---- Prêmios ----
      case 'premios':
        if (premios.length === 0) {
          return (
            <Vazio>
              Nenhum prêmio cadastrado ainda. Preencha <code>premios</code> em{' '}
              <code>src/data/portfolio.ts</code>.
            </Vazio>
          );
        }
        return (
          <ul className="cmd-lista">
            {premios.map((p, i) => (
              <li key={i} className="cmd-card">
                <span className="text-accent">
                  🏆 {p.titulo}
                  {p.ano && <span className="text-gray"> · {p.ano}</span>}
                </span>
                {p.descricao && <span>{p.descricao}</span>}
              </li>
            ))}
          </ul>
        );

      // ---- Viagens ----
      case 'viagens':
        if (viagens.length === 0) {
          return (
            <Vazio>
              Nenhuma viagem cadastrada ainda. Preencha <code>viagens</code> em{' '}
              <code>src/data/portfolio.ts</code>.
            </Vazio>
          );
        }
        return (
          <Card titulo="viagens">
            <MapaViagens />
          </Card>
        );

      // ---- Steam / Xbox ----
      case 'steam':
        return <ListaJogos lista={jogos.steam} plataforma="Steam" />;
      case 'xbox':
        return <ListaJogos lista={jogos.xbox} plataforma="Xbox" />;

      // ---- WakaTime ----
      case 'wakatime':
        return (
          <Card titulo="wakatime">
            <WakaTime />
          </Card>
        );

      default:
        return null;
    }
  }

  function finalizarTemas(temaEscolhido: Tema | null) {
    const comando = comandoTemas;
    setTemasAberto(false);
    setComandoTemas(null);
    if (!comando) return;

    if (temaEscolhido) {
      definirTema(temaEscolhido);
      setHistorico((h) => [
        ...h,
        {
          comando,
          saida: (
            <p className="temas-resultado">
              <span className="text-accent" aria-hidden="true">
                ✔
              </span>{' '}
              tema <span className="text-accent">{temaEscolhido}</span> aplicado.
            </p>
          ),
        },
      ]);
      return;
    }

    setHistorico((h) => [
      ...h,
      {
        comando,
        saida: <span className="text-gray">seletor de temas fechado.</span>,
      },
    ]);
  }

  function executar(entradaBruta: string) {
    const entrada = entradaBruta.trim();
    const [token] = entrada.split(/\s+/);
    const nome = token ? resolver(token) : null;

    // limpar
    if (nome === 'limpar') {
      setHistorico([]);
      return;
    }

    // temas: abre o seletor interativo
    if (nome === 'temas') {
      setComandoTemas(entrada);
      setTemasAberto(true);
      return;
    }

    setHistorico((h) => [
      ...h,
      { comando: entrada, saida: renderizarSaida(nome, entrada) },
    ]);
  }

  function aoTeclar(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    const valor = input;
    setInput('');
    if (valor.trim() !== '') executar(valor);
  }

  return (
    <div className="terminal-full" onClick={() => inputRef.current?.focus()}>
      <div className="imperial-watermark" aria-hidden="true" />

      {/* Barra superior: título · botão de tema */}
      <header className="terminal-bar">
        <span className="terminal-bar-titulo">
          FLAUSINO<span className="text-accent">.DEV</span>
        </span>

        <div className="terminal-bar-acoes">
          <button
            className="tema-toggle"
            onClick={(e) => {
              e.stopPropagation();
              alternarTema();
            }}
            aria-label={`Ativar tema ${rotuloProximo}`}
            title={`Ativar tema ${rotuloProximo}`}
          >
            {tema === 'dark' ? (
              <IconeSol />
            ) : tema === 'light' ? (
              <IconeSistema />
            ) : tema === 'system' ? (
              <IconeImperio />
            ) : (
              <IconeLua />
            )}
          </button>
        </div>
      </header>

      {/* Conteúdo rolável: abertura (nome + foto) + saída dos comandos */}
      <div className="terminal-scroll" ref={scrollRef}>
        <Hero onComando={executar} />

        <p className="terminal-hint">
          Digite <span className="text-accent">ajuda</span> e pressione Enter
          para ver os comandos disponíveis. Ex.:{' '}
          <span className="text-accent">sobre</span>,{' '}
          <span className="text-accent">projetos</span>,{' '}
          <span className="text-accent">temas</span>.
        </p>

        {historico.map((item, i) => (
          <div key={i} className="terminal-item">
            <div className="terminal-prompt">
              <span className="text-accent">visitante@portfolio</span>
              <span className="text-gray">:~$ </span>
              <span>{item.comando}</span>
            </div>
            {item.saida && <div className="terminal-saida">{item.saida}</div>}
          </div>
        ))}
      </div>

      {/* Barra de digitação fixa embaixo */}
      <div className="terminal-prompt-bar">
        <span className="text-accent">visitante@portfolio</span>
        <span className="text-gray">:~$ </span>
        <input
          ref={inputRef}
          type="text"
          className="terminal-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={aoTeclar}
          spellCheck={false}
          autoComplete="off"
          aria-label="Digite um comando"
          style={{ width: `${Math.max(input.length, 1)}ch` }}
        />
        <span className="cursor" />
      </div>

      {temasAberto && (
        <SeletorTemas
          temaAtual={tema}
          aoAplicar={finalizarTemas}
          aoFechar={() => finalizarTemas(null)}
        />
      )}
    </div>
  );
}
