import { useEffect, useState } from 'react';
import {
  buscarCodandoAgora,
  buscarStatsAoVivo,
  ErroWakaTime,
  type ResultadoCodando,
} from '../lib/wakatime';
import {
  wakatimeStats,
  type ItemWakaTime,
  type RangeWakaTime,
  type StatsWakaTime,
} from '../data/wakatimeStats';

/** Quantos blocos a barra de cada linha tem (igual ao aramuni). */
const SEGMENTOS = 20;

/** De quanto em quanto tempo o "codando agora" pergunta de novo. */
const ATUALIZAR_CODANDO_MS = 60_000;

/** Botões de período (value = range aceito pela API do WakaTime). */
const PERIODOS: { valor: RangeWakaTime; rotulo: string; extenso: string }[] = [
  { valor: 'last_7_days', rotulo: '7d', extenso: 'últimos 7 dias' },
  { valor: 'last_30_days', rotulo: '30d', extenso: 'últimos 30 dias' },
  { valor: 'last_6_months', rotulo: '6m', extenso: 'últimos 6 meses' },
  { valor: 'last_year', rotulo: '1a', extenso: 'último ano' },
  { valor: 'all_time', rotulo: 'tudo', extenso: 'desde sempre' },
];

/** Nomes que o WakaTime manda em inglês → português. */
const CATEGORIAS: Record<string, string> = {
  Coding: 'programando',
  'AI Coding': 'programando com IA',
  'Writing Docs': 'escrevendo docs',
  'Writing Tests': 'escrevendo testes',
  Debugging: 'depurando',
  Building: 'compilando',
  Browsing: 'navegando',
  'Code Reviewing': 'revisando código',
  Designing: 'design',
  Meeting: 'reuniões',
  Researching: 'pesquisando',
  Learning: 'aprendendo',
  Planning: 'planejando',
};
const SISTEMAS: Record<string, string> = { Mac: 'macOS' };

/** 217750 s → "60 h 29 min". */
function duracao(segundos: number): string {
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) return `${resto} min`;
  return resto ? `${horas} h ${resto} min` : `${horas} h`;
}

/** 20.07 → "20,1%". */
function porcentagem(valor: number): string {
  const arredondado = Math.round(valor * 10) / 10;
  if (arredondado > 0 && arredondado < 0.1) return '<0,1%';
  return `${arredondado.toFixed(1).replace('.', ',')}%`;
}

/** "2026-05-14" → "14 de mai. de 2026". */
function data(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const quando = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(quando.getTime())) return null;
  return quando.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** timestamp (ms) → "14:32". */
const hora = (ms: number) =>
  new Date(ms).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

/** Quanto tempo atrás: "agora há pouco" | "há 3 min" | "há 2 h". */
function haQuanto(ms: number, agora: number): string {
  const minutos = Math.max(0, Math.floor((agora - ms) / 60_000));
  if (minutos < 1) return 'agora há pouco';
  if (minutos < 60) return `há ${minutos} min`;
  return `há ${Math.floor(minutos / 60)} h`;
}

/* =====================================================================
   Barras e tabelas
   ===================================================================== */

function Barra({ porcento }: { porcento: number }) {
  const cheios = Math.max(0, Math.min(SEGMENTOS, Math.round((porcento / 100) * SEGMENTOS)));
  return (
    <span className="waka-barra" role="img" aria-label={porcentagem(porcento)}>
      {Array.from({ length: SEGMENTOS }, (_, i) => (
        <span key={i} className={i < cheios ? 'waka-seg ligado' : 'waka-seg'} />
      ))}
    </span>
  );
}

function Linha({ item, resto = false }: { item: ItemWakaTime; resto?: boolean }) {
  return (
    <li className={resto ? 'waka-linha resta' : 'waka-linha'}>
      <span className="waka-nome" title={item.nome}>
        {item.nome}
      </span>
      <Barra porcento={item.porcento} />
      <span className="waka-tempo">{duracao(item.segundos)}</span>
      <span className="waka-pct">{porcentagem(item.porcento)}</span>
    </li>
  );
}

function Secao({
  titulo,
  itens = [],
  limite,
  sufixo,
  renomear = {},
}: {
  titulo: string;
  itens?: ItemWakaTime[];
  limite: number;
  sufixo: string;
  renomear?: Record<string, string>;
}) {
  if (itens.length === 0) return null;

  const nomeados = itens.map((item) => ({ ...item, nome: renomear[item.nome] ?? item.nome }));
  const topo = nomeados.slice(0, limite);
  const sobra = nomeados.slice(limite);
  const resto: ItemWakaTime[] = sobra.length
    ? [
        {
          nome: `+ ${sobra.length} ${sufixo}`,
          segundos: sobra.reduce((soma, item) => soma + item.segundos, 0),
          porcento: sobra.reduce((soma, item) => soma + item.porcento, 0),
        },
      ]
    : [];

  return (
    <section className="waka-secao">
      <h4 className="waka-titulo">{titulo}</h4>
      <ul className="waka-lista">
        {topo.map((item) => (
          <Linha key={item.nome} item={item} />
        ))}
        {resto.map((item) => (
          <Linha key={item.nome} item={item} resto />
        ))}
      </ul>
    </section>
  );
}

/* =====================================================================
   "Codando agora"
   ===================================================================== */

/** Busca agora e repete a cada minuto; para de perguntar se não há token. */
function useCodandoAgora() {
  const [estado, setEstado] = useState<ResultadoCodando | { status: 'carregando' }>({
    status: 'carregando',
  });

  useEffect(() => {
    let vivo = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    const atualizar = () => {
      if (document.visibilityState === 'hidden') return;
      buscarCodandoAgora().then((resultado) => {
        if (!vivo) return;
        // Falha passageira: mantém o que já estava na tela
        setEstado((antes) =>
          resultado.status === 'erro' && antes.status === 'ok' ? antes : resultado,
        );
        if (resultado.status === 'indisponivel' && timer) {
          clearInterval(timer);
          timer = null;
        }
      });
    };

    atualizar();
    timer = setInterval(atualizar, ATUALIZAR_CODANDO_MS);
    document.addEventListener('visibilitychange', atualizar);

    return () => {
      vivo = false;
      if (timer) clearInterval(timer);
      document.removeEventListener('visibilitychange', atualizar);
    };
  }, []);

  return estado;
}

/** Relógio de 30 em 30 s, para "há 2 min" não ficar parado entre as buscas. */
function useAgora() {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setAgora(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  return agora;
}

function CodandoAgora() {
  const estado = useCodandoAgora();
  const agora = useAgora();

  // Carregando, sem token ou erro: o bloco simplesmente não aparece
  if (estado.status !== 'ok') return null;

  const { ativo, ultimo, hojeSegundos } = estado.dados;
  const nomeado = Boolean(ultimo?.publico && ultimo.projeto);
  const projeto = nomeado ? ultimo!.projeto! : 'projeto privado';

  /* ---------- Parado: uma linha discreta ---------- */
  if (!ativo || !ultimo) {
    return (
      <section className="waka-agora parado" aria-label="Codando agora">
        <span className="waka-agora-status">
          <span className="waka-agora-ponto" aria-hidden="true" />
          parado
        </span>
        <span className="waka-agora-texto">
          {ultimo ? (
            <>
              última atividade {haQuanto(ultimo.em, agora)} em{' '}
              <span className="waka-agora-destaque">{projeto}</span>
              {ultimo.linguagem && ` · ${ultimo.linguagem}`}
            </>
          ) : (
            'nenhuma atividade no editor hoje'
          )}
          {hojeSegundos >= 60 && ` · ${duracao(hojeSegundos)} hoje`}
        </span>
      </section>
    );
  }

  /* ---------- Codando: bloco completo ---------- */
  const sessaoSegundos = (ultimo.em - ultimo.inicioSessao) / 1000;

  return (
    <section className="waka-agora ativo" aria-label="Codando agora" aria-live="polite">
      <div className="waka-agora-topo">
        <span className="waka-agora-status">
          <span className="waka-agora-ponto" aria-hidden="true" />
          codando agora
        </span>
        <span className="waka-agora-sinal">último sinal {haQuanto(ultimo.em, agora)}</span>
      </div>

      <p className="waka-agora-projeto">
        <span className="waka-agora-nome" title={projeto}>
          <span className="waka-agora-prompt" aria-hidden="true">
            {nomeado ? '~/' : '🔒 '}
          </span>
          {projeto}
        </span>
        {nomeado && ultimo.branch && (
          <span className="waka-agora-branch" title={`branch ${ultimo.branch}`}>
            <span aria-hidden="true">⎇ </span>
            {ultimo.branch}
          </span>
        )}
      </p>

      <ul className="waka-agora-meta">
        {ultimo.linguagem && <li>{ultimo.linguagem}</li>}
        {ultimo.editor && <li>{ultimo.editor}</li>}
        {sessaoSegundos >= 60 && (
          <li>
            sessão de {duracao(sessaoSegundos)} (desde {hora(ultimo.inicioSessao)})
          </li>
        )}
        {ultimo.projetoHojeSegundos >= 60 && (
          <li>{duracao(ultimo.projetoHojeSegundos)} hoje neste projeto</li>
        )}
      </ul>
    </section>
  );
}

/* =====================================================================
   Estatísticas por período
   ===================================================================== */

type EstadoStats = {
  porPeriodo: Partial<Record<RangeWakaTime, StatsWakaTime>>;
  erros: Partial<Record<RangeWakaTime, ErroWakaTime>>;
  /** Últimos dados que chegaram (ficam na tela enquanto outro período carrega). */
  exibido: StatsWakaTime;
};

function useStats(range: RangeWakaTime) {
  // Começa com a foto gerada no build (aparece na hora) e troca pelos dados
  // ao vivo quando /api/wakatime responder.
  const [estado, setEstado] = useState<EstadoStats>({
    porPeriodo: { all_time: wakatimeStats },
    erros: {},
    exibido: wakatimeStats,
  });

  useEffect(() => {
    let ativo = true;

    buscarStatsAoVivo(range)
      .then((novos) => {
        if (!ativo) return;
        setEstado((antes) => ({
          porPeriodo: { ...antes.porPeriodo, [range]: novos },
          erros: { ...antes.erros, [range]: undefined },
          exibido: novos,
        }));
      })
      .catch((erro: unknown) => {
        if (!ativo) return;
        setEstado((antes) => ({
          ...antes,
          erros: {
            ...antes.erros,
            [range]:
              erro instanceof ErroWakaTime
                ? erro
                : new ErroWakaTime('rede', 'Sem conexão com o servidor.'),
          },
        }));
      });

    return () => {
      ativo = false;
    };
  }, [range]);

  /** Chamado ao clicar num período: some com o erro antigo e tenta de novo. */
  const limparErro = (periodo: RangeWakaTime) =>
    setEstado((antes) => ({ ...antes, erros: { ...antes.erros, [periodo]: undefined } }));

  const doPeriodo = estado.porPeriodo[range];
  const erro = estado.erros[range] ?? null;
  // all_time já tem a foto do build; os outros esperam a API
  const aoVivo = doPeriodo?.fonte === 'api';
  const carregando = !aoVivo && !erro;

  return { doPeriodo, exibido: estado.exibido, erro, carregando, limparErro };
}

export function WakaTime() {
  const [range, setRange] = useState<RangeWakaTime>('all_time');
  const { doPeriodo, exibido, carregando, erro, limparErro } = useStats(range);

  // Enquanto o novo período carrega, os números antigos ficam apagadinhos
  const dados = doPeriodo ?? (carregando ? exibido : null);
  const atualizando = !doPeriodo && carregando;
  const periodo = PERIODOS.find((p) => p.valor === range)!;

  // Sem a rota (site estático) só a foto do build existe: sem seletor
  const semApi = erro?.codigo === 'sem_api' || erro?.codigo === 'rede';
  const mostrarPeriodos = !(semApi && range === 'all_time');

  if (range === 'all_time' && !dados?.totalSegundos) {
    return (
      <div className="waka">
        <CodandoAgora />
        <p className="cmd-aviso">
          🚧 Ainda não consegui os dados do WakaTime. Rode <code>npm run wakatime</code>{' '}
          e tente de novo.
        </p>
      </div>
    );
  }

  const aoVivo = dados?.fonte === 'api';
  const inicio = range === 'all_time' ? data(dados?.desde) : null;
  const atualizado = data(dados?.geradoEm);
  const melhorDia = dados?.melhorDia;

  return (
    <div className="waka" aria-busy={carregando}>
      <CodandoAgora />

      {mostrarPeriodos && (
        <div className="waka-periodos" role="group" aria-label="Período">
          {PERIODOS.map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              className={opcao.valor === range ? 'waka-periodo ativo' : 'waka-periodo'}
              aria-pressed={opcao.valor === range}
              aria-label={opcao.extenso}
              title={opcao.extenso}
              onClick={() => {
                limparErro(opcao.valor);
                setRange(opcao.valor);
              }}
            >
              {opcao.rotulo}
            </button>
          ))}
        </div>
      )}

      {erro && !doPeriodo && range !== 'all_time' && (
        <p className="cmd-aviso" role="alert">
          {erro.codigo === 'sem_permissao'
            ? `⚠ ${periodo.extenso}: período indisponível na conta do WakaTime.`
            : erro.codigo === 'calculando'
              ? '⏳ O WakaTime ainda está calculando este período. Tente de novo em instantes.'
              : `⚠ ${erro.message}`}
        </p>
      )}

      {dados && (
        <div className={atualizando ? 'waka-corpo atualizando' : 'waka-corpo'}>
          <dl className="waka-info">
            <div className="waka-kv">
              <dt>total</dt>
              <dd>{duracao(dados.totalSegundos)}</dd>
            </div>
            <div className="waka-kv">
              <dt>média por dia</dt>
              <dd>{duracao(dados.mediaDiariaSegundos)}</dd>
            </div>
            {aoVivo && dados.hojeSegundos != null && (
              <div className="waka-kv">
                <dt>hoje</dt>
                <dd>{duracao(dados.hojeSegundos)}</dd>
              </div>
            )}
            {dados.diasAtivos != null && (
              <div className="waka-kv">
                <dt>dias ativos</dt>
                <dd>
                  {dados.diasAtivos}
                  {dados.diasTotais != null && ` / ${dados.diasTotais}`}
                </dd>
              </div>
            )}
            {melhorDia && melhorDia.segundos > 0 && (
              <div className="waka-kv">
                <dt>melhor dia</dt>
                <dd>
                  {duracao(melhorDia.segundos)}
                  <span className="waka-kv-nota">{data(melhorDia.data)}</span>
                </dd>
              </div>
            )}
            {inicio && (
              <div className="waka-kv">
                <dt>desde</dt>
                <dd>{inicio}</dd>
              </div>
            )}
          </dl>

          {dados.linguagens.length > 0 ? (
            <div className="waka-tabela">
              <Secao titulo="linguagens" itens={dados.linguagens} limite={8} sufixo="linguagens" />
              <Secao titulo="projetos" itens={dados.projetos} limite={6} sufixo="projetos" />
              <Secao titulo="editores" itens={dados.editores} limite={4} sufixo="outros" />
              <Secao
                titulo="categorias"
                itens={dados.categorias}
                limite={5}
                sufixo="outras"
                renomear={CATEGORIAS}
              />
              <Secao
                titulo="sistemas"
                itens={dados.sistemas}
                limite={3}
                sufixo="outros"
                renomear={SISTEMAS}
              />
            </div>
          ) : (
            <p className="cmd-aviso">Nenhuma atividade registrada em {periodo.extenso}.</p>
          )}

          <p className="cmd-aviso waka-rodape">
            <a
              className="cmd-link"
              href={dados.perfil}
              target="_blank"
              rel="noopener noreferrer"
            >
              wakatime.com/@{dados.usuario} ↗
            </a>
            {aoVivo ? (
              <span className="waka-vivo"> · ao vivo</span>
            ) : (
              atualizado && ` · foto de ${atualizado}`
            )}
          </p>
        </div>
      )}
    </div>
  );
}
