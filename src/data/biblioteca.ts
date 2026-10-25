export type StatusLivro = 'lendo' | 'lido' | 'quero ler';
export type Publicacao = 'completo' | 'lancando' | 'hiato';
export type FiltroBiblioteca = 'todos' | StatusLivro;

export type Livro = {
  id: string;
  titulo: string;
  autor: string;
  ano?: number;
  genero?: string;
  status: StatusLivro;
  publicacao: Publicacao;
  nota?: number;
  capa?: string;
  corLombada: string;
  corCapa?: string;
  corTexto?: string;
  espessura?: number;
  altura?: number;
  sinopse: string;
  comentario?: string;
  expectativa?: string;
  citacao?: string;
  progresso?: number;
  tags?: string[];
};

export type TipoPagina = 'sobre' | 'ficha' | 'leitura' | 'citacao';

export type PaginaLivro = {
  id: TipoPagina;
  titulo: string;
};

/** Monta as páginas do carrossel para o livro atual. */
export function paginasDoLivro(livro: Livro): PaginaLivro[] {
  const paginas: PaginaLivro[] = [
    { id: 'sobre', titulo: 'Sobre o livro' },
    { id: 'ficha', titulo: 'Ficha' },
    {
      id: 'leitura',
      titulo:
        livro.status === 'quero ler'
          ? 'Por que quero ler'
          : 'Minha leitura',
    },
  ];

  if (livro.citacao) {
    paginas.push({ id: 'citacao', titulo: 'Citação' });
  }

  return paginas;
}

export function rotuloStatus(status: StatusLivro): string {
  switch (status) {
    case 'lendo':
      return 'lendo';
    case 'lido':
      return 'lido';
    case 'quero ler':
      return 'quero ler';
  }
}

export function rotuloPublicacao(publicacao: Publicacao): string {
  switch (publicacao) {
    case 'completo':
      return 'completo';
    case 'lancando':
      return 'lançando';
    case 'hiato':
      return 'hiato';
  }
}

/**
 * Lista atual da biblioteca.
 * Resenhas, citações e a expectativa de Duna podem ser preenchidas depois.
 */
export const livros: Livro[] = [
  {
    id: 'lord-of-mysteries',
    titulo: 'Lord of Mysteries',
    autor: 'Cuttlefish That Loves Diving',
    ano: 2018,
    genero: 'fantasia · mistério',
    status: 'lido',
    publicacao: 'completo',
    nota: 5,
    corLombada: '#35415f',
    corCapa: '#171d2e',
    corTexto: '#ece6d4',
    espessura: 50,
    altura: 224,
    sinopse:
      'Klein Moretti se envolve com uma sociedade de ocultistas e com entidades além da compreensão humana, enquanto tenta sobreviver em um mundo de mistérios, tarô e rituais.',
    tags: ['fantasia', 'mistério', 'steampunk'],
  },
  {
    id: 'shadow-slave',
    titulo: 'Shadow Slave',
    autor: 'Guiltythree',
    ano: 2022,
    genero: 'fantasia sombria · progressão',
    status: 'lendo',
    publicacao: 'lancando',
    nota: 5,
    corLombada: '#3b1f2a',
    corCapa: '#1b0e14',
    corTexto: '#f0d9de',
    espessura: 46,
    altura: 218,
    sinopse:
      'Sunny é arrastado para o Reino dos Sonhos, um mundo de pesadelos, e precisa sobreviver a criaturas e provações enquanto descobre o preço dos seus poderes.',
    tags: ['fantasia sombria', 'progressão', 'web novel'],
  },
  {
    id: 'circle-of-inevitability',
    titulo: 'Circle of Inevitability',
    autor: 'Cuttlefish That Loves Diving',
    ano: 2023,
    genero: 'fantasia · mistério',
    status: 'lido',
    publicacao: 'completo',
    nota: 4.5,
    corLombada: '#24504d',
    corCapa: '#0f2927',
    corTexto: '#d8f1ea',
    espessura: 48,
    altura: 222,
    sinopse:
      'A continuação de Lord of Mysteries acompanha uma nova geração diante de ciclos, profecias e poderes que insistem em retornar.',
    tags: ['fantasia', 'mistério', 'sequência'],
  },
  {
    id: 'red-rising',
    titulo: 'Red Rising',
    autor: 'Pierce Brown',
    ano: 2014,
    genero: 'ficção científica · distopia',
    status: 'lido',
    publicacao: 'completo',
    nota: 4.5,
    corLombada: '#6e2026',
    corCapa: '#371016',
    corTexto: '#f4dcdc',
    espessura: 44,
    altura: 214,
    sinopse:
      'Em uma sociedade dividida por cores, Darrow, um trabalhador de Marte, entra em uma disputa brutal para derrubar a ordem que o mantém no fundo.',
    tags: ['ficção científica', 'distopia', 'trilogia'],
  },
  {
    id: 'golden-son',
    titulo: 'Golden Son',
    autor: 'Pierce Brown',
    ano: 2015,
    genero: 'ficção científica · distopia',
    status: 'lido',
    publicacao: 'completo',
    nota: 5,
    corLombada: '#7a5a16',
    corCapa: '#423006',
    corTexto: '#fff0b8',
    espessura: 46,
    altura: 218,
    sinopse:
      'Darrow precisa transformar a influência conquistada em uma revolução, enquanto a política, a guerra e as alianças do Sistema Solar se tornam cada vez mais perigosas.',
    tags: ['ficção científica', 'distopia', 'trilogia'],
  },
  {
    id: 'morning-star',
    titulo: 'Morning Star',
    autor: 'Pierce Brown',
    ano: 2016,
    genero: 'ficção científica · distopia',
    status: 'lido',
    publicacao: 'completo',
    nota: 5,
    corLombada: '#7a3d1f',
    corCapa: '#45210f',
    corTexto: '#ffe3cf',
    espessura: 48,
    altura: 222,
    sinopse:
      'O encerramento da primeira trilogia de Red Rising leva Darrow ao limite entre a revolução que construiu e as pessoas que precisa proteger.',
    tags: ['ficção científica', 'distopia', 'trilogia'],
  },
  {
    id: 'reverend-insanity',
    titulo: 'Reverend Insanity',
    autor: 'Gu Zhen Ren',
    ano: 2012,
    genero: 'xianxia · fantasia sombria',
    status: 'lendo',
    publicacao: 'hiato',
    nota: 5,
    corLombada: '#2f4a2f',
    corCapa: '#152614',
    corTexto: '#dcead6',
    espessura: 54,
    altura: 228,
    sinopse:
      'Fang Yuan busca a imortalidade em um mundo cruel de cultivo, sem abrir mão dos próprios objetivos diante de qualquer obstáculo.',
    tags: ['xianxia', 'fantasia sombria', 'web novel'],
  },
  {
    id: 'the-radiant-blade-of-wilderness',
    titulo: 'The Radiant Blade of Wilderness',
    autor: 'Cuttlefish That Loves Diving',
    genero: 'fantasia',
    status: 'lendo',
    publicacao: 'lancando',
    nota: 5,
    corLombada: '#3e4f6b',
    corCapa: '#1d2737',
    corTexto: '#e2eaf5',
    espessura: 44,
    altura: 216,
    sinopse:
      'Acompanhe o início desta história de fantasia do mesmo autor de Lord of Mysteries. Sinopse e resenha a preencher.',
    tags: ['fantasia', 'web novel', 'lendo'],
  },
  {
    id: 'duna',
    titulo: 'Duna',
    autor: 'Frank Herbert',
    ano: 1965,
    genero: 'ficção científica',
    status: 'quero ler',
    publicacao: 'completo',
    corLombada: '#745420',
    corCapa: '#3d2a0b',
    corTexto: '#f7df9d',
    espessura: 52,
    altura: 226,
    sinopse:
      'Paul Atreides e sua família assumem o controle de Arrakis, o planeta desértico que concentra a substância mais valiosa do universo.',
    tags: ['ficção científica', 'épico', 'política'],
  },
];
