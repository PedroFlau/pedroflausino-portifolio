import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Hero } from '../sections/Hero';
import { About } from '../sections/About';
import { Skills } from '../sections/Skills';
import { Contact } from '../sections/Contact';
import { Projects } from '../sections/Projects';
import { useTema, type Tema } from '../hooks/useTema';
import {
  comandos,
  curriculo,
  jogos,
  lattes,
  monitoria,
  premios,
  recomendacoes,
  viagens,
  wakatime,
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

export function Terminal() {
  const { tema, definirTema, alternarTema } = useTema();
  const [input, setInput] = useState('');
  const [historico, setHistorico] = useState<ItemHistorico[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const claro = tema === 'light';

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
    inputRef.current?.focus();
  }, []);

  function renderizarSaida(
    nome: string | null,
    entrada: string,
    temaAtual: Tema,
  ): ReactNode {
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
          <Card titulo="monitoria">
            <p>
              <strong>{monitoria.disciplina}</strong>
              {monitoria.professor && (
                <span className="text-gray"> · {monitoria.professor}</span>
              )}
            </p>
            <ul className="cmd-lista">
              {monitoria.horarios.map((h, i) => (
                <li key={i}>
                  <span className="text-accent">{h.dia}</span>
                  <span>
                    {h.hora}
                    {h.local && <span className="text-gray"> · {h.local}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
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
            <ul className="cmd-lista">
              {viagens.map((v, i) => (
                <li key={i}>
                  <span className="text-accent">📍 {v.lugar}</span>
                  {v.ano && <span className="text-gray">{v.ano}</span>}
                </li>
              ))}
            </ul>
          </Card>
        );

      // ---- Steam / Xbox ----
      case 'steam':
        return <ListaJogos lista={jogos.steam} plataforma="Steam" />;
      case 'xbox':
        return <ListaJogos lista={jogos.xbox} plataforma="Xbox" />;

      // ---- WakaTime ----
      case 'wakatime':
        if (!wakatime.url && !wakatime.resumo) {
          return (
            <Vazio>
              WakaTime ainda não configurado. Preencha <code>wakatime</code> em{' '}
              <code>src/data/portfolio.ts</code>.
            </Vazio>
          );
        }
        return (
          <Card titulo="wakatime">
            {wakatime.resumo && <p>{wakatime.resumo}</p>}
            {wakatime.url && (
              <a
                className="cmd-link"
                href={wakatime.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                ver meu perfil no WakaTime ↗
              </a>
            )}
          </Card>
        );

      // ---- Tema ----
      case 'tema':
        return (
          <Card titulo="tema">
            <p>
              tema atual: <span className="text-accent">{temaAtual}</span>
            </p>
            <p className="text-gray">
              use <span className="text-accent">tema claro</span> ou{' '}
              <span className="text-accent">tema escuro</span>
            </p>
          </Card>
        );

      default:
        return null;
    }
  }

  function executar(entradaBruta: string) {
    const entrada = entradaBruta.trim();
    const [token, ...args] = entrada.split(/\s+/);
    const nome = token ? resolver(token) : null;

    // limpar
    if (nome === 'limpar') {
      setHistorico([]);
      return;
    }

    // tema [claro|escuro]
    let temaAtual = tema;
    if (nome === 'tema') {
      const alvo = normalizar(args[0] ?? '');
      if (alvo === 'claro' || alvo === 'light') {
        definirTema('light');
        temaAtual = 'light';
      } else if (alvo === 'escuro' || alvo === 'dark') {
        definirTema('dark');
        temaAtual = 'dark';
      }
    }

    setHistorico((h) => [
      ...h,
      { comando: entrada, saida: renderizarSaida(nome, entrada, temaAtual) },
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
      {/* Barra superior: bolinhas · título · botão de tema */}
      <header className="terminal-bar">
        <div className="terminal-bar-dots">
          <span className="terminal-dot" style={{ background: '#ff5f56' }} />
          <span className="terminal-dot" style={{ background: '#ffbd2e' }} />
          <span className="terminal-dot" style={{ background: '#27c93f' }} />
        </div>

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
            aria-label={claro ? 'Ativar modo escuro' : 'Ativar modo claro'}
            title={claro ? 'Ativar modo escuro' : 'Ativar modo claro'}
          >
            {claro ? <IconeLua /> : <IconeSol />}
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
          <span className="text-accent">tema claro</span>.
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
    </div>
  );
}
