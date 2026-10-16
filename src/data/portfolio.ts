// ============================================================
//  CONTEUDO DO PORTFOLIO
//  Edite tudo por aqui. Os campos marcados com TODO sao
//  placeholders que voce deve trocar pelos seus dados reais.
// ============================================================

export const perfil = {
  nome: "Pedro Flausino Mendonça",
  primeiroNome: "Pedro",
  titulo: "Estudante de Ciência da Computação",
  subtitulo: "2º semestre · Ciência da Computação",
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

export const terminalComandos = {
  help: `
Comandos disponiveis:
  about | sobre       - Quem sou eu
  skills | habilidades - Minhas habilidades
  projects | projetos  - Meus projetos
  contact | contato    - Como falar comigo
  clear | limpar       - Limpar a tela
  help | ajuda         - Mostrar esta ajuda
`,
  about: `
${perfil.nome}
${perfil.titulo} · ${perfil.subtitulo}
📍 ${perfil.cidade}
📧 ${perfil.links.email}
🐙 ${perfil.links.github}
`,
  skills: `
Habilidades:
${habilidades.map((g) => `  ${g.grupo}: ${g.itens.join(", ")}`).join("\n")}
`,
  projects: `
Projetos:
${projetos.map((p, i) => `  ${i + 1}. ${p.nome} - ${p.descricao}`).join("\n")}
`,
  contact: `
Contato:
  E-mail:   ${perfil.links.email}
  GitHub:   ${perfil.links.github}
  LinkedIn: ${perfil.links.linkedin}
`,
};
