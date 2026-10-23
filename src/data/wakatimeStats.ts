// ============================================================
//  GERADO AUTOMATICAMENTE por scripts/wakatime.mjs — NÃO EDITE À MÃO.
//  Atualize com:  npm run wakatime
//  Fonte: https://wakatime.com/api/v1/users/PedroFlau/stats/all_time
// ============================================================

export type FonteWakaTime = 'api' | 'build';

export type RangeWakaTime =
  | 'last_7_days'
  | 'last_30_days'
  | 'last_6_months'
  | 'last_year'
  | 'all_time';

export type ItemWakaTime = {
  nome: string;
  segundos: number;
  porcento: number;
};

export type StatsWakaTime = {
  /** Perfil do WakaTime (lido de src/data/portfolio.ts). */
  usuario: string;
  perfil: string;
  /** Data (YYYY-MM-DD) dos dados. */
  geradoEm: string;
  /** Período dos dados (padrão: all_time). */
  range?: RangeWakaTime;
  /** "oauth" quando lido com o token; "publico" quando veio do perfil público. */
  modo?: 'oauth' | 'publico';
  /** Início do histórico no WakaTime (YYYY-MM-DD). */
  desde: string | null;
  totalSegundos: number;
  mediaDiariaSegundos: number;
  diasAtivos: number | null;
  diasTotais: number | null;
  /** Tempo de hoje (só com o token). */
  hojeSegundos?: number | null;
  /** Dia com mais tempo no período. */
  melhorDia?: { data: string; segundos: number } | null;
  linguagens: ItemWakaTime[];
  editores: ItemWakaTime[];
  categorias: ItemWakaTime[];
  sistemas: ItemWakaTime[];
  /** Projetos (só com o token). */
  projetos?: ItemWakaTime[];
  /** "api" quando veio da rota ao vivo; "build" quando é a foto do build. */
  fonte?: FonteWakaTime;
};

export const wakatimeStats: StatsWakaTime = {
  "usuario": "PedroFlau",
  "perfil": "https://wakatime.com/@PedroFlau",
  "geradoEm": "2026-10-17",
  "desde": "2026-05-14",
  "totalSegundos": 248928,
  "mediaDiariaSegundos": 5186,
  "diasAtivos": 48,
  "diasTotais": 156,
  "linguagens": [
    {
      "nome": "JavaScript",
      "segundos": 45539,
      "porcento": 18.29
    },
    {
      "nome": "C",
      "segundos": 43693,
      "porcento": 17.55
    },
    {
      "nome": "HTML",
      "segundos": 42241,
      "porcento": 16.97
    },
    {
      "nome": "CSS",
      "segundos": 29155,
      "porcento": 11.71
    },
    {
      "nome": "Markdown",
      "segundos": 20602,
      "porcento": 8.28
    },
    {
      "nome": "JSON",
      "segundos": 19040,
      "porcento": 7.65
    },
    {
      "nome": "C++",
      "segundos": 17902,
      "porcento": 7.19
    },
    {
      "nome": "Java",
      "segundos": 13710,
      "porcento": 5.51
    },
    {
      "nome": "TypeScript",
      "segundos": 11695,
      "porcento": 4.7
    },
    {
      "nome": "Text",
      "segundos": 2543,
      "porcento": 1.02
    },
    {
      "nome": "Other",
      "segundos": 2333,
      "porcento": 0.94
    },
    {
      "nome": "Python",
      "segundos": 331,
      "porcento": 0.13
    },
    {
      "nome": "XML",
      "segundos": 134,
      "porcento": 0.05
    }
  ],
  "editores": [
    {
      "nome": "VS Code",
      "segundos": 221533,
      "porcento": 88.99
    },
    {
      "nome": "Neovim",
      "segundos": 16733,
      "porcento": 6.72
    },
    {
      "nome": "Opencode Cli",
      "segundos": 10662,
      "porcento": 4.28
    }
  ],
  "categorias": [
    {
      "nome": "Coding",
      "segundos": 212357,
      "porcento": 85.31
    },
    {
      "nome": "Writing Docs",
      "segundos": 20602,
      "porcento": 8.28
    },
    {
      "nome": "AI Coding",
      "segundos": 15340,
      "porcento": 6.16
    },
    {
      "nome": "Debugging",
      "segundos": 331,
      "porcento": 0.13
    },
    {
      "nome": "Building",
      "segundos": 292,
      "porcento": 0.12
    }
  ],
  "sistemas": [
    {
      "nome": "Linux",
      "segundos": 194178,
      "porcento": 78.01
    },
    {
      "nome": "Windows",
      "segundos": 54750,
      "porcento": 21.99
    }
  ],
  "fonte": "build"
};
