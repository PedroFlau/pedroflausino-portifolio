import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
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
import { CabecalhoSecao } from './CabecalhoSecao';
import { ICONE_TEMA } from './IconesTema';
import { useTema, NOME_TEMA, proximoTema, type Tema } from '../hooks/useTema';
import { comandos, curriculo, monitoria, viagens } from '../data/portfolio';
import { useCurriculo } from '../hooks/useCurriculo';

type ItemHistorico = {
  id: number;
  comando: string;
  /** Comando base resolvido (null = não encontrado / saída avulsa). */
  nome: string | null;
  saida: ReactNode;
};

/** Comandos que abrem uma seção: ganham #hash na URL e não se repetem na tela. */
const SECOES = [
  'sobre',
  'projetos',
  'habilidades',
  'contato',
  'cv',
  'monitoria',
  'viagens',
  'biblioteca',
  'wakatime',
] as const;

const ehSecao = (nome: string | null): boolean =>
  nome !== null && (SECOES as readonly string[]).includes(nome);

/** Mouse/trackpad: focar o input ao clicar não abre teclado virtual. */
const ponteiroFino = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const movimentoReduzido = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    const nomes = [c.nome, ...c.aliases, ...(c.aliasesOcultos ?? [])].map(normalizar);
    if (nomes.includes(alvo)) return normalizar(c.nome);
  }
  return null;
}

/** Todos os nomes aceitos (comandos + aliases), já normalizados. */
const NOMES_ACEITOS = comandos.flatMap((c) =>
  [c.nome, ...c.aliases, ...(c.aliasesOcultos ?? [])].map((n) => ({
    nome: normalizar(n),
    base: c.nome,
  })),
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

/** Saída com o cabeçalho padrão de seção e o conteúdo dentro de um painel. */
function Card({
  titulo,
  subtitulo,
  meta,
  children,
}: {
  titulo: string;
  subtitulo?: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="secao">
      <CabecalhoSecao titulo={titulo} subtitulo={subtitulo} meta={meta} />
      <div className="cmd-card">{children}</div>
    </section>
  );
}


export function Terminal() {
  const { tema, definirTema, alternarTema } = useTema();
  const temCurriculo = useCurriculo();
  const [input, setInput] = useState('');
  const [historico, setHistorico] = useState<ItemHistorico[]>([]);
  const [temasAberto, setTemasAberto] = useState(false);
  const [comandoTemas, setComandoTemas] = useState<string | null>(null);
  // Comandos já digitados (para navegar com ↑/↓) e a posição atual nessa lista
  const [digitados, setDigitados] = useState<string[]>([]);
  const [posicao, setPosicao] = useState<number | null>(null);
  // Saída para onde rolar (o contador força a rolagem mesmo repetindo o alvo)
  const [alvo, setAlvo] = useState<{ id: number; vez: number } | null>(null);
  const proximoId = useRef(0);
  // Seções já na tela (nome → id da saída), atualizado na hora (sem esperar o render)
  const secoesAbertas = useRef(new Map<string, number>());
  const inputRef = useRef<HTMLInputElement>(null);

  const rotuloAtual = NOME_TEMA[tema];
  const rotuloProximo = NOME_TEMA[proximoTema(tema)];
  const IconeAtual = ICONE_TEMA[tema];

  /** Comandos que não têm o que mostrar ficam fora da lista e do resolver. */
  const disponivel = useCallback(
    (nome: string | null) => {
      if (nome === 'cv') return temCurriculo;
      if (nome === 'monitoria') return Boolean(monitoria.disciplina || monitoria.horarios.length);
      if (nome === 'viagens') return viagens.length > 0;
      return true;
    },
    [temCurriculo],
  );

  // Rola até o INÍCIO da saída do comando (o cabeçalho da seção fica visível)
  useEffect(() => {
    if (!alvo) return;
    const id = requestAnimationFrame(() => {
      document.getElementById(`saida-${alvo.id}`)?.scrollIntoView({
        block: 'start',
        behavior: movimentoReduzido() ? 'auto' : 'smooth',
      });
    });
    return () => cancelAnimationFrame(id);
  }, [alvo]);

  // No celular, focar sozinho abriria o teclado e esconderia metade da tela
  useEffect(() => {
    if (temasAberto) {
      inputRef.current?.blur();
    } else if (ponteiroFino()) {
      inputRef.current?.focus();
    }
  }, [temasAberto]);

  // #projetos na URL abre a seção (ao carregar e ao trocar o hash)
  const executarRef = useRef<(c: string) => void>(() => {});
  useEffect(() => {
    executarRef.current = executar;
  });
  const hashCvPendente = useRef(false);
  useEffect(() => {
    const abrirDoHash = () => {
      const nome = resolver(decodeURIComponent(window.location.hash.slice(1)));
      if (!nome || !ehSecao(nome)) return;
      // O cv depende da verificação do arquivo: tenta de novo quando ela terminar
      if (nome === 'cv' && !temCurriculo) {
        hashCvPendente.current = true;
        return;
      }
      executarRef.current(nome);
    };
    abrirDoHash();
    window.addEventListener('hashchange', abrirDoHash);
    return () => window.removeEventListener('hashchange', abrirDoHash);
    // Só no carregamento; o cv é tratado no efeito abaixo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (temCurriculo && hashCvPendente.current) {
      hashCvPendente.current = false;
      executarRef.current('cv');
    }
  }, [temCurriculo]);

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
            {comandos.filter((c) => disponivel(c.nome)).map((c) => (
              <li key={c.nome}>
                <span>
                  <Atalho comando={c.nome} aoExecutar={executar} />
                  {c.aliases.length > 0 && (
                    <span className="cmd-aliases">, {c.aliases.join(', ')}</span>
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

      // ---- Currículo ----
      case 'cv':
        return (
          <section className="secao">
            <CabecalhoSecao titulo="cv" subtitulo="Currículo em PDF, atualizado com este site" />
            <p className="cv-linha">
              <span className="text-accent">$</span> wget {window.location.host}{curriculo.arquivo}
            </p>
            <a
              className="botao botao-primario cv-baixar"
              href={curriculo.arquivo}
              download={curriculo.nomeDownload}
            >
              baixar cv.pdf
            </a>
          </section>
        );

      // ---- Monitoria ----
      case 'monitoria':
        return (
          <section className="secao">
            <CabecalhoSecao
              titulo="monitoria"
              subtitulo="Horários de atendimento da disciplina que monitoro"
              meta={`${monitoria.horarios.length} horários por semana`}
            />
            <Monitoria
              disciplina={monitoria.disciplina}
              professor={monitoria.professor}
              horarios={monitoria.horarios}
            />
          </section>
        );

      // ---- Viagens ----
      case 'viagens':
        return (
          <Card titulo="viagens" subtitulo="Lugares que já visitei">
            <MapaViagens />
          </Card>
        );

      // ---- Biblioteca ----
      case 'biblioteca':
        return (
          <Card titulo="biblioteca" subtitulo="O que estou lendo, já li e quero ler">
            <Biblioteca />
          </Card>
        );

      // ---- WakaTime ----
      case 'wakatime':
        return (
          <Card titulo="wakatime" subtitulo="Meu tempo de código, medido pelo editor">
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
      adicionar(comando, null, (
            <p className="temas-resultado">
              <span className="text-accent" aria-hidden="true">
                ✔
              </span>{' '}
              tema <span className="text-accent">{NOME_TEMA[temaEscolhido]}</span> aplicado.
            </p>
      ));
      return;
    }

    adicionar(comando, null, <span className="text-gray">seletor de temas fechado.</span>);
  }

  /** Acrescenta uma saída ao histórico e rola até o começo dela. */
  function adicionar(comando: string, nome: string | null, saida: ReactNode) {
    const id = proximoId.current++;
    if (nome && ehSecao(nome)) secoesAbertas.current.set(nome, id);
    setHistorico((h) => [...h, { id, comando, nome, saida }]);
    setAlvo((a) => ({ id, vez: (a?.vez ?? 0) + 1 }));
  }

  /** Grava a seção na URL (#projetos) para dar para mandar o link direto. */
  function marcarUrl(nome: string | null) {
    const hash = nome ? `#${nome}` : '';
    if (window.location.hash !== hash) {
      history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
    }
  }

  function executar(entradaBruta: string) {
    const entrada = entradaBruta.trim();
    if (entrada === '') return;
    setDigitados((d) => (d[d.length - 1] === entrada ? d : [...d, entrada]));
    setPosicao(null);
    const [token] = entrada.split(/\s+/);
    const resolvido = token ? resolver(token) : null;
    const nome = disponivel(resolvido) ? resolvido : null;

    // limpar
    if (nome === 'limpar') {
      secoesAbertas.current.clear();
      setHistorico([]);
      marcarUrl(null);
      return;
    }

    // temas: abre o seletor interativo
    if (nome === 'temas') {
      setComandoTemas(entrada);
      setTemasAberto(true);
      return;
    }

    if (ehSecao(nome)) {
      marcarUrl(nome);
      // Seção já aberta: volta até ela em vez de repetir tudo
      const existente = nome ? secoesAbertas.current.get(nome) : undefined;
      if (existente !== undefined) {
        setAlvo((a) => ({ id: existente, vez: (a?.vez ?? 0) + 1 }));
        return;
      }
    }

    adicionar(entrada, nome, renderizarSaida(nome, entrada));
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
          adicionar(input, null, (
                <p className="cmd-opcoes">
                  {opcoes.map((o, i) => (
                    <span key={o}>
                      {i > 0 && '  '}
                      <Atalho comando={o} aoExecutar={executar} />
                    </span>
                  ))}
                </p>
          ));
        }
        return;
      }
    }
  }

  // Clicar no terminal foca o input, mas não atrapalha quem está selecionando texto
  function focarInput() {
    if (!ponteiroFino() || window.getSelection()?.toString()) return;
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
            type="button"
            className="tema-toggle"
            onClick={(e) => {
              e.stopPropagation();
              alternarTema();
            }}
            aria-label={`Tema atual: ${rotuloAtual}. Trocar para ${rotuloProximo}`}
            title={`Tema ${rotuloAtual} · clique para ${rotuloProximo}`}
          >
            <IconeAtual />
          </button>
        </div>
      </header>

      {/* Conteúdo rolável: abertura (nome + crachá) + saída dos comandos */}
      <main className="terminal-scroll">
        <Hero onComando={executar} temCurriculo={temCurriculo} />

        <p className="terminal-hint">
          Digite <Atalho comando="ajuda" aoExecutar={executar} /> e pressione
          Enter (ou clique) para ver os comandos. Ex.:{' '}
          <Atalho comando="sobre" aoExecutar={executar} />,{' '}
          <Atalho comando="projetos" aoExecutar={executar} />,{' '}
          <Atalho comando="habilidades" aoExecutar={executar} />,{' '}
          <Atalho comando="temas" aoExecutar={executar} />. Use Tab para
          completar e ↑/↓ para o histórico.
        </p>

        <div role="log" aria-label="Saída do terminal" aria-relevant="additions">
          {historico.map((item) => (
            <div key={item.id} id={`saida-${item.id}`} className="terminal-item">
              <div className="terminal-prompt">
                <span className="text-accent">visitante@portfolio</span>
                <span className="text-gray">:~$ </span>
                <span>{item.comando}</span>
              </div>
              {item.saida && <div className="terminal-saida">{item.saida}</div>}
            </div>
          ))}
        </div>
      </main>

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
          autoCapitalize="off"
          autoCorrect="off"
          enterKeyHint="go"
          aria-label="Digite um comando"
          style={{ width: `${Math.max(input.length, 1)}ch` }}
        />
        <span className="cursor" aria-hidden="true" />
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
