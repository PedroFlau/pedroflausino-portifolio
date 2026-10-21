// ============================================================
//  CONTEUDO DO PORTFOLIO
//  Edite tudo por aqui. Os campos marcados com TODO sao
//  placeholders que voce deve trocar pelos seus dados reais.
// ============================================================

export const perfil = {
  nome: "Pedro Flausino Mendonça",
  primeiroNome: "Pedro",
  titulo: "Estudante de Ciência da Computação",
  subtitulo: "2º semestre",
  idade: 19,
  cidade: "Belo Horizonte, MG",
  bio: [
    "Oi! Sou o Pedro Flausino Mendonça, tenho 19 anos e sou estudante de Ciência da Computação (2º semestre). Estou começando minha jornada na programação e construindo minha base em lógica, algoritmos e desenvolvimento de software.",
    "Gosto de aprender na prática: montar projetos, quebrar a cabeça com um bug e ver as coisas funcionando. Estou em busca da minha primeira oportunidade na área para evoluir junto com um time.",
  ],
  links: {
    github: "https://github.com/PedroFlau",
    linkedin:
      "https://www.linkedin.com/in/pedro-flausino-mendon%C3%A7a-6475783a5",
    email: "pedroflau1@gmail.com",
  },
};

export const habilidades: { grupo: string; itens: string[] }[] = [
  { grupo: "Linguagens", itens: ["Java", "C", "C++", "JavaScript"] },
  { grupo: "Front-end", itens: ["HTML", "CSS"] },
  { grupo: "Ferramentas", itens: ["Linux (CachyOS)", "Git", "GitHub"] },
];

export const projetos: {
  nome: string;
  descricao: string;
  tecnologias: string[];
  link?: string;
  demo?: string;
}[] = [
  {
    nome: "Portfólio Terminal",
    descricao:
      "Este site! Um portfólio pessoal com estética de terminal, construído do zero com React, TypeScript e Vite.",
    tecnologias: ["React", "TypeScript", "Vite", "CSS"],
    link: "https://github.com/PedroFlau",
  },
  {
    nome: "Visualize It",
    descricao:
      "Website para visualizar conceitos da disciplina de Algoritmos e Estruturas de Dados II (AEDS II). Projeto em equipe do qual participo.",
    tecnologias: ["TypeScript", "JavaScript", "HTML", "CSS"],
    link: "https://github.com/fernandoleitepagani/visualize_it",
    demo: "https://visualizeit-pi.vercel.app/",
  },
  {
    nome: "Em breve",
    descricao: "Espaço reservado para o próximo projeto. Volte em breve! 👀",
    tecnologias: [],
  },
];

export const formacao = [
  {
    titulo: "Bacharelado em Ciência da Computação",
    local: "Em andamento · 2º semestre (2026.2)",
    periodo: "Início em 2026.1",
  },
];

// ------------------------------------------------------------
//  DADOS EXTRAS (usados pelos comandos do terminal)
//  Preencha os campos marcados com TODO.
// ------------------------------------------------------------

// Monitoria
export const monitoria: {
  disciplina: string;
  professor?: string;
  horarios: { dia: string; hora: string; local?: string }[];
} = {
  disciplina: "Algoritmos e Estruturas de Dados I",
  professor: "",
  horarios: [
    { dia: "Terça", hora: "15:20 - 18:20" },
    { dia: "Quarta", hora: "15:20 - 17:20" },
    { dia: "Quinta", hora: "09:00 - 12:00" },
    { dia: "Sexta", hora: "15:20 - 17:20" },
  ],
};

// Currículo: já aponta para /cv.pdf (troque o arquivo em public/cv.pdf)
export const curriculo = { arquivo: "/cv.pdf" };

// Lattes (TODO: cole o link do seu currículo Lattes)
export const lattes: { url: string; resumo: string } = {
  url: "",
  resumo: "",
};

// Jogos + progresso de conquistas (TODO)
export type JogoConquistas = {
  nome: string;
  conquistas: { feitas: number; total: number };
};
export const jogos: { steam: JogoConquistas[]; xbox: JogoConquistas[] } = {
  steam: [],
  xbox: [],
};

// Viagens (com coordenadas para o mapa/globo)
export type Viagem = { lugar: string; lat: number; lng: number };
export const viagens: Viagem[] = [
  { lugar: "Paris, França", lat: 48.8566, lng: 2.3522 },
  { lugar: "Barcelona, Espanha", lat: 41.3874, lng: 2.1686 },
  { lugar: "Lisboa, Portugal", lat: 38.7223, lng: -9.1393 },
  { lugar: "Nova York, Estados Unidos", lat: 40.7128, lng: -74.006 },
  { lugar: "Orlando, Estados Unidos", lat: 28.5383, lng: -81.3792 },
  { lugar: "Washington D.C., Estados Unidos", lat: 38.9072, lng: -77.0369 },
  { lugar: "Baltimore, Estados Unidos", lat: 39.2904, lng: -76.6122 },
  { lugar: "Filadélfia, Estados Unidos", lat: 39.9526, lng: -75.1652 },
  { lugar: "Santiago, Chile", lat: -33.4489, lng: -70.6693 },
  { lugar: "Cartagena, Colômbia", lat: 10.391, lng: -75.4794 },
  { lugar: "Cidade do Panamá, Panamá", lat: 8.9824, lng: -79.5199 },
  // Brasil
  { lugar: "Recife, Brasil", lat: -8.0476, lng: -34.877 },
  { lugar: "Porto de Galinhas, Brasil", lat: -8.5083, lng: -35.0044 },
  { lugar: "Maceió, Brasil", lat: -9.6658, lng: -35.7353 },
  { lugar: "Salvador, Brasil", lat: -12.9777, lng: -38.5016 },
  { lugar: "Vila Velha, Brasil", lat: -20.3297, lng: -40.2925 },
  { lugar: "Rio de Janeiro, Brasil", lat: -22.9068, lng: -43.1729 },
  { lugar: "São Paulo, Brasil", lat: -23.5505, lng: -46.6333 },
  { lugar: "Foz do Iguaçu, Brasil", lat: -25.5163, lng: -54.5854 },
  { lugar: "Gramado, Brasil", lat: -29.3746, lng: -50.8764 },
];

// Países visitados (derivados dos lugares, sem repetir)
export const paisesVisitados = [
  ...new Set(
    viagens
      .map((v) => v.lugar.split(",").pop()?.trim())
      .filter((pais): pais is string => Boolean(pais)),
  ),
];

// Recomendações (TODO)
export const recomendacoes: {
  autor: string;
  cargo?: string;
  texto: string;
}[] = [];

// Prêmios e reconhecimentos (TODO)
export const premios: { titulo: string; ano?: string; descricao?: string }[] = [];

// WakaTime — não há nada pra preencher aqui: as estatísticas vêm da rota
// /api/wakatime (lógica em server/wakatime.js) e a "foto" que entra no build
// é gerada por "npm run wakatime" em src/data/wakatimeStats.ts.

// ------------------------------------------------------------
//  LISTA DE COMANDOS DO TERMINAL
//  nome   = comando principal
//  aliases = variações aceitas (pt/en)
// ------------------------------------------------------------
export const comandos: { nome: string; aliases: string[]; desc: string }[] = [
  { nome: "sobre", aliases: ["about"], desc: "Quem sou eu" },
  {
    nome: "habilidades",
    aliases: ["skills", "skils"],
    desc: "Minhas linguagens e ferramentas",
  },
  { nome: "contato", aliases: ["contact"], desc: "Como falar comigo" },
  { nome: "projetos", aliases: ["projects"], desc: "Meus projetos" },
  {
    nome: "monitoria",
    aliases: ["tutoring"],
    desc: "Matéria e horários da monitoria",
  },
  { nome: "curriculo", aliases: ["resume"], desc: "Meu currículo (PDF)" },
  { nome: "lattes", aliases: ["academic"], desc: "Meu currículo Lattes" },
  {
    nome: "recomendacoes",
    aliases: ["recommendations"],
    desc: "Minhas recomendações",
  },
  { nome: "premios", aliases: ["awards"], desc: "Prêmios e reconhecimentos" },
  { nome: "viagens", aliases: ["travel"], desc: "Lugares que já visitei" },
  { nome: "steam", aliases: [], desc: "Jogos e conquistas na Steam" },
  { nome: "xbox", aliases: [], desc: "Jogos e conquistas no Xbox" },
  { nome: "wakatime", aliases: [], desc: "Meu tempo de código (WakaTime)" },
  { nome: "tema", aliases: ["theme"], desc: "Opções de tema (claro/escuro/system)" },
  { nome: "limpar", aliases: ["clean", "clear"], desc: "Limpa o terminal" },
  { nome: "ajuda", aliases: ["help"], desc: "Mostra esta lista de comandos" },
];
