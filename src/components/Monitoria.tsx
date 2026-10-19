import { useEffect, useMemo, useState } from 'react';

type Horario = { dia: string; hora: string; local?: string };

/** Sessão já interpretada a partir dos dados (dia da semana + minutos do dia). */
type Sessao = {
  diaIndice: number;
  diaNome: string;
  inicio: number;
  fim: number;
  local?: string;
};

/** Sessão posicionada numa data concreta. */
type Ocorrencia = Sessao & { dataInicio: Date; dataFim: Date };

const DIA_CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIA_LONGO = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
];

const DIA_SEMANA: Record<string, number> = {
  domingo: 0,
  segunda: 1,
  terca: 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  sabado: 6,
};

const MINUTO = 60_000;
const DIA = 24 * 60 * MINUTO;

/** Remove acentos e caixa para comparar nomes de dias. */
function normalizar(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/-feira$/, '');
}

/** Interpreta "15:20 - 18:20" (aceita hífen, en dash e travessão). */
function lerHorario(hora: string): { inicio: number; fim: number } | null {
  const m = hora.match(/(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const inicio = Number(m[1]) * 60 + Number(m[2]);
  const fim = Number(m[3]) * 60 + Number(m[4]);
  if (fim <= inicio) return null;
  return { inicio, fim };
}

function analisar(horarios: Horario[]): Sessao[] {
  const sessoes: Sessao[] = [];
  for (const h of horarios) {
    const diaIndice = DIA_SEMANA[normalizar(h.dia)];
    const faixa = lerHorario(h.hora);
    if (diaIndice === undefined || !faixa) continue;
    sessoes.push({
      diaIndice,
      diaNome: DIA_LONGO[diaIndice],
      inicio: faixa.inicio,
      fim: faixa.fim,
      local: h.local,
    });
  }
  return sessoes;
}

/** Projeta as sessões nas próximas duas semanas, em ordem cronológica. */
function ocorrencias(sessoes: Sessao[], base: Date): Ocorrencia[] {
  const out: Ocorrencia[] = [];
  const inicioHoje = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  for (let i = 0; i < 14; i++) {
    const dia = new Date(inicioHoje);
    dia.setDate(dia.getDate() + i);
    for (const s of sessoes) {
      if (dia.getDay() !== s.diaIndice) continue;
      const dataInicio = new Date(dia);
      dataInicio.setHours(Math.floor(s.inicio / 60), s.inicio % 60, 0, 0);
      const dataFim = new Date(dia);
      dataFim.setHours(Math.floor(s.fim / 60), s.fim % 60, 0, 0);
      out.push({ ...s, dataInicio, dataFim });
    }
  }
  return out.sort((a, b) => a.dataInicio.getTime() - b.dataInicio.getTime());
}

function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** "3h", "2h 40min", "45min" */
function duracao(ms: number): string {
  const totalMin = Math.max(0, Math.ceil(ms / MINUTO));
  const h = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  if (h && min) return `${h}h ${min}min`;
  if (h) return `${h}h`;
  return `${min}min`;
}

/** "2 dias", "3h 40min", "12min" */
function distancia(ms: number): string {
  const dias = Math.floor(ms / DIA);
  if (dias >= 1) return dias === 1 ? '1 dia' : `${dias} dias`;
  return duracao(ms);
}

/** "Hoje", "Amanhã" ou o nome do dia. */
function diaRelativo(data: Date, agora: Date): string {
  const a = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const b = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  const diff = Math.round((b.getTime() - a.getTime()) / DIA);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  return DIA_LONGO[data.getDay()];
}

/** Ícone de manhã (sol nascente). */
function IconeManha() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1" />
    </svg>
  );
}

/** Ícone de tarde (sol se pondo no horizonte). */
function IconeTarde() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 18a5 5 0 0 0-10 0" />
      <path d="M12 9V4M4.2 10.2l1.4 1.4M19.8 10.2l-1.4 1.4M2 18h20M22 22H2" />
    </svg>
  );
}

function IconePeriodo({ inicio }: { inicio: Date }) {
  return (
    <span className="monitoria-icone">
      {inicio.getHours() < 12 ? <IconeManha /> : <IconeTarde />}
    </span>
  );
}

type Props = {
  disciplina: string;
  professor?: string;
  horarios: Horario[];
};

export function Monitoria({ disciplina, professor, horarios }: Props) {
  const [agora, setAgora] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setAgora(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const sessoes = useMemo(() => analisar(horarios), [horarios]);
  const todas = useMemo(() => ocorrencias(sessoes, agora), [sessoes, agora]);

  const atual = todas.find((o) => agora >= o.dataInicio && agora < o.dataFim);
  const proxima = atual ?? todas.find((o) => o.dataInicio.getTime() > agora.getTime());

  if (!proxima) {
    return (
      <p className="cmd-aviso">
        Nenhum horário de monitoria cadastrado. Preencha <code>monitoria.horarios</code> em{' '}
        <code>src/data/portfolio.ts</code>.
      </p>
    );
  }

  const emSessao = Boolean(atual);
  const rotulo = emSessao
    ? 'AGORA'
    : diaRelativo(proxima.dataInicio, agora) === 'Hoje'
      ? 'HOJE'
      : 'PRÓXIMA';

  const quando = `${diaRelativo(proxima.dataInicio, agora)} · ${hhmm(proxima.dataInicio)} – ${hhmm(proxima.dataFim)}`;
  const etiqueta = duracao(proxima.dataFim.getTime() - proxima.dataInicio.getTime());

  const contagem = emSessao
    ? `faltam ${duracao(proxima.dataFim.getTime() - agora.getTime())}`
    : `em ${distancia(proxima.dataInicio.getTime() - agora.getTime())}`;

  const progresso = emSessao
    ? Math.min(
        100,
        Math.max(
          0,
          ((agora.getTime() - proxima.dataInicio.getTime()) /
            (proxima.dataFim.getTime() - proxima.dataInicio.getTime())) *
            100,
        ),
      )
    : 0;

  const seguintes = todas.filter(
    (o) =>
      o.dataInicio.getTime() > proxima.dataInicio.getTime() &&
      o.dataInicio.getTime() < proxima.dataInicio.getTime() + 7 * DIA,
  );

  return (
    <div className="monitoria">
      <div className={`monitoria-card${emSessao ? ' monitoria-card--agora' : ''}`}>
        <div className="monitoria-topo">
          <span className="monitoria-rotulo">
            <span className="monitoria-ponto" />
            {rotulo}
          </span>
          <span className="monitoria-etiqueta">{etiqueta}</span>
        </div>

        <p className="monitoria-quando">
          <IconePeriodo inicio={proxima.dataInicio} />
          {quando}
        </p>

        <p className="monitoria-contagem">{contagem}</p>

        {emSessao && (
          <div
            className="monitoria-progresso"
            role="progressbar"
            aria-label="Progresso da monitoria"
            aria-valuenow={Math.round(progresso)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${progresso}%` }} />
          </div>
        )}

        <p className="monitoria-disciplina">{disciplina}</p>

        {(professor || proxima.local) && (
          <p className="monitoria-info">
            {[professor, proxima.local].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      {seguintes.length > 0 && (
        <ul className="monitoria-lista">
          {seguintes.map((o) => (
            <li key={o.dataInicio.toISOString()}>
              <span className="monitoria-lista-dia">{DIA_CURTO[o.dataInicio.getDay()]}</span>
              <IconePeriodo inicio={o.dataInicio} />
              <span className="monitoria-lista-hora">
                {hhmm(o.dataInicio)} – {hhmm(o.dataFim)}
              </span>
              {o.local && <span className="monitoria-lista-local">{o.local}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
