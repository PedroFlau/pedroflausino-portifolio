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
];

// Projetos (TODO: adicione os seus conforme forem saindo)
export const projetos: {
  nome: string;
  descricao: string;
  tecnologias: string[];
  link?: string;
}[] = [
  {
    nome: "Portfólio Terminal",
    descricao:
      "Este site! Um portfólio pessoal com estética de terminal, construído do zero com React, TypeScript e Vite.",
    tecnologias: ["React", "TypeScript", "Vite", "CSS"],
    link: "https://github.com/PedroFlau",
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

// Monitoria (TODO: preencha a matéria e os horários)
export const monitoria: {
  disciplina: string;
  professor?: string;
  horarios: { dia: string; hora: string; local?: string }[];
} = {
  disciplina: "", // TODO: ex. "Algoritmos e Estruturas de Dados"
  professor: "", // TODO (opcional)
  horarios: [
    // TODO: ex. { dia: "Terça", hora: "14:00 - 16:00", local: "Sala 204" },
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

// Viagens (TODO: lugares que você já visitou)
export const viagens: { lugar: string; ano?: string }[] = [];

// Recomendações (TODO)
export const recomendacoes: {
  autor: string;
  cargo?: string;
  texto: string;
}[] = [];

// Prêmios e reconhecimentos (TODO)
export const premios: { titulo: string; ano?: string; descricao?: string }[] = [];

// WakaTime (TODO: link do perfil + um resumo curto)
export const wakatime: { url: string; resumo: string } = {
  url: "",
  resumo: "",
};

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
  { nome: "tema", aliases: ["theme"], desc: "Opções de tema (claro/escuro)" },
  { nome: "limpar", aliases: ["clean", "clear"], desc: "Limpa o terminal" },
  { nome: "ajuda", aliases: ["help"], desc: "Mostra esta lista de comandos" },
];
