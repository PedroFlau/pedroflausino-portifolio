import { useEffect, useState } from 'react';
import { buscarStatsAoVivo } from '../lib/wakatime';
import { wakatimeStats, type ItemWakaTime, type StatsWakaTime } from '../data/wakatimeStats';

/** Quantos blocos a barra de cada linha tem (igual ao aramuni). */
const SEGMENTOS = 20;

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
function data(iso: string | null): string | null {
  if (!iso) return null;
  const quando = new Date(`${iso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(quando.getTime())) return null;
  return quando.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

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
  itens,
  limite,
  sufixo,
}: {
  titulo: string;
  itens: ItemWakaTime[];
  limite: number;
  sufixo: string;
}) {
  if (itens.length === 0) return null;

  const topo = itens.slice(0, limite);
  const sobra = itens.slice(limite);
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

export function WakaTime() {
  // Começa com a foto gerada no build (aparece na hora) e troca pelos dados
  // ao vivo quando /api/wakatime responder.
  const [dados, setDados] = useState<StatsWakaTime>(wakatimeStats);

  useEffect(() => {
    let ativo = true;
    buscarStatsAoVivo()
      .then((novos) => {
        if (ativo) setDados(novos);
      })
      .catch(() => {
        /* sem a rota: segue com a foto do build */
      });
    return () => {
      ativo = false;
    };
  }, []);

  const {
    usuario,
    perfil,
    totalSegundos,
    mediaDiariaSegundos,
    diasAtivos,
    diasTotais,
    linguagens,
    editores,
    categorias,
    sistemas,
    desde,
    geradoEm,
    fonte,
  } = dados;

  if (!totalSegundos) {
    return (
      <p className="cmd-aviso">
        🚧 Ainda não consegui os dados do WakaTime. Rode <code>npm run wakatime</code>{' '}
        e tente de novo.
      </p>
    );
  }

  const inicio = data(desde);
  const atualizado = data(geradoEm);
  const aoVivo = fonte === 'api';

  return (
    <div className="waka">
      <dl className="waka-info">
        <div className="waka-kv">
          <dt>total</dt>
          <dd>{duracao(totalSegundos)}</dd>
        </div>
        <div className="waka-kv">
          <dt>média por dia</dt>
          <dd>{duracao(mediaDiariaSegundos)}</dd>
        </div>
        {diasAtivos != null && (
          <div className="waka-kv">
            <dt>dias ativos</dt>
            <dd>
              {diasAtivos}
              {diasTotais != null && ` / ${diasTotais}`}
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

      <div className="waka-tabela">
        <Secao titulo="linguagens" itens={linguagens} limite={8} sufixo="linguagens" />
        <Secao titulo="editores" itens={editores} limite={4} sufixo="outros" />
        <Secao titulo="categorias" itens={categorias} limite={5} sufixo="outros" />
        <Secao titulo="sistemas" itens={sistemas} limite={3} sufixo="outros" />
      </div>

      <p className="cmd-aviso waka-rodape">
        <a
          className="cmd-link"
          href={perfil}
          target="_blank"
          rel="noopener noreferrer"
        >
          wakatime.com/@{usuario} ↗
        </a>
        {aoVivo ? (
          <span className="waka-vivo"> · ao vivo</span>
        ) : (
          atualizado && ` · foto de ${atualizado}`
        )}
      </p>
    </div>
  );
}
