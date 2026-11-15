import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Hero } from '../sections/Hero';
import { About } from '../sections/About';
import { Skills } from '../sections/Skills';
import { Biblioteca } from './Biblioteca';
import { Contact } from '../sections/Contact';
import { Projects } from '../sections/Projects';
import { MapaViagens } from './MapaViagens';
import { Monitoria } from './Monitoria';
import { SeletorTemas } from './SeletorTemas';
import { WakaTime } from './WakaTime';
import { ICONE_TEMA } from './IconesTema';
import { useTema, NOME_TEMA, proximoTema, type Tema } from '../hooks/useTema';
import { comandos, monitoria, viagens } from '../data/portfolio';

type ItemHistorico = { comando: string; saida: ReactNode };

/** Remove acentos e deixa minúsculo (aceita "monitória" e "monitoria"). */
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

/** Todos os nomes aceitos (comandos + aliases), já normalizados. */
const NOMES_ACEITOS = comandos.flatMap((c) =>
  [c.nome, ...c.aliases].map((n) => ({ nome: normalizar(n), base: c.nome })),
);

/** Distância de edição (Levenshtein) — usada só para sugerir comandos. */
function distancia(a: string, b: string): number {
  const linha = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = linha[0];
    linha[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const acima = linha[j];
      linha[j] = Math.min(
        linha[j] + 1,
        linha[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = acima;
    }
  }
  return linha[b.length];
}

/** Comando mais parecido com o que foi digitado (ou null se nada chegar perto). */
function sugerir(token: string): string | null {
  const alvo = normalizar(token);
  if (!alvo) return null;
  let melhor: { base: string; d: number } | null = null;
  for (const { nome, base } of NOMES_ACEITOS) {
    const d = nome.startsWith(alvo) ? 0 : distancia(alvo, nome);
    if (!melhor || d < melhor.d) melhor = { base, d };
  }
  return melhor && melhor.d <= 2 ? melhor.base : null;
}

/** Comandos que começam com o prefixo digitado (para o Tab). */
function completar(prefixo: string): string[] {
  const alvo = normalizar(prefixo);
  if (!alvo) return [];
  const principais = comandos.map((c) => c.nome).filter((n) => normalizar(n).startsWith(alvo));
  if (principais.length > 0) return principais;
  return [...new Set(NOMES_ACEITOS.filter((n) => n.nome.startsWith(alvo)).map((n) => n.base))];
}

/** Nome de comando clicável: executa o comando como se tivesse sido digitado. */
function Atalho({ comando, aoExecutar }: { comando: string; aoExecutar: (c: string) => void }) {
  return (
    <button
      type="button"
      className="cmd-atalho text-accent"
      onClick={(e) => {
        e.stopPropagation();
        aoExecutar(comando);
      }}
    >
      {comando}
    </button>
  );
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

export function Terminal() {
  const { tema, definirTema, alternarTema } = useTema();
  const [input, setInput] = useState('');
  const [historico, setHistorico] = useState<ItemHistorico[]>([]);
  const [temasAberto, setTemasAberto] = useState(false);
  const [comandoTemas, setComandoTemas] = useState<string | null>(null);
  // Comandos já digitados (para navegar com ↑/↓) e a posição atual nessa lista
  const [digitados, setDigitados] = useState<string[]>([]);
  const [posicao, setPosicao] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const proximo = proximoTema(tema);
  const rotuloProximo = NOME_TEMA[proximo];
  const IconeProximo = ICONE_TEMA[proximo];

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
      case null: {
        const sugestao = sugerir(entrada.split(/\s+/)[0] ?? '');
        return (
          <span className="cmd-erro">
            comando não encontrado: "{entrada}".{' '}
            {sugestao ? (
              <>
                Você quis dizer <Atalho comando={sugestao} aoExecutar={executar} />?
              </>
            ) : (
              <>
                Digite <Atalho comando="ajuda" aoExecutar={executar} /> para ver
                os comandos.
              </>
            )}
          </span>
        );
      }

      case 'ajuda':
        return (
          <ul className="cmd-lista cmd-lista-ajuda">
            {comandos.map((c) => (
              <li key={c.nome}>
                <span>
                  <Atalho comando={c.nome} aoExecutar={executar} />
                  {c.aliases.length > 0 && (
                    <span className="text-accent">, {c.aliases.join(', ')}</span>
                  )}
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
          return <Vazio>essa seção ainda está vazia.</Vazio>;
        }
        return (
          <Monitoria
            disciplina={monitoria.disciplina}
            professor={monitoria.professor}
            horarios={monitoria.horarios}
          />
        );
      }

      // ---- Viagens ----
      case 'viagens':
        if (viagens.length === 0) {
          return <Vazio>essa seção ainda está vazia.</Vazio>;
        }
        return (
          <Card titulo="viagens">
            <MapaViagens />
          </Card>
        );

      // ---- Biblioteca ----
      case 'biblioteca':
        return (
          <Card titulo="biblioteca">
            <Biblioteca />
          </Card>
        );

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
    if (entrada === '') return;
    setDigitados((d) => (d[d.length - 1] === entrada ? d : [...d, entrada]));
    setPosicao(null);
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
    switch (e.key) {
      case 'Enter': {
        const valor = input;
        setInput('');
        executar(valor);
        return;
      }

      // Histórico: ↑ volta para comandos anteriores, ↓ avança
      case 'ArrowUp': {
        if (digitados.length === 0) return;
        e.preventDefault();
        const nova = posicao === null ? digitados.length - 1 : Math.max(posicao - 1, 0);
        setPosicao(nova);
        setInput(digitados[nova]);
        return;
      }
      case 'ArrowDown': {
        if (posicao === null) return;
        e.preventDefault();
        const nova = posicao + 1;
        if (nova >= digitados.length) {
          setPosicao(null);
          setInput('');
        } else {
          setPosicao(nova);
          setInput(digitados[nova]);
        }
        return;
      }

      case 'Escape':
        setPosicao(null);
        setInput('');
        return;

      // Autocompletar: 1 opção completa; várias são listadas
      case 'Tab': {
        if (input.trim() === '' || /\s/.test(input.trim())) return;
        e.preventDefault();
        const opcoes = completar(input);
        if (opcoes.length === 1) {
          setInput(opcoes[0]);
        } else if (opcoes.length > 1) {
          setHistorico((h) => [
            ...h,
            {
              comando: input,
              saida: (
                <p className="cmd-opcoes">
                  {opcoes.map((o, i) => (
                    <span key={o}>
                      {i > 0 && '  '}
                      <Atalho comando={o} aoExecutar={executar} />
                    </span>
                  ))}
                </p>
              ),
            },
          ]);
        }
        return;
      }
    }
  }

  // Clicar no terminal foca o input, mas não atrapalha quem está selecionando texto
  function focarInput() {
    if (window.getSelection()?.toString()) return;
    inputRef.current?.focus();
  }

  return (
    <div className="terminal-full" onClick={focarInput}>
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
            <IconeProximo />
          </button>
        </div>
      </header>

      {/* Conteúdo rolável: abertura (nome + foto) + saída dos comandos */}
      <div className="terminal-scroll" ref={scrollRef} role="log" aria-label="Saída do terminal">
        <Hero onComando={executar} />

        <p className="terminal-hint">
          Digite <Atalho comando="ajuda" aoExecutar={executar} /> e pressione
          Enter (ou clique) para ver os comandos. Ex.:{' '}
          <Atalho comando="sobre" aoExecutar={executar} />,{' '}
          <Atalho comando="projetos" aoExecutar={executar} />,{' '}
          <Atalho comando="habilidades" aoExecutar={executar} />,{' '}
          <Atalho comando="temas" aoExecutar={executar} />. Use Tab para
          completar e ↑/↓ para o histórico.
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
