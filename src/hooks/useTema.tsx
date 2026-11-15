import { createContext, useContext } from 'react';

export type Tema = 'dark' | 'light' | 'system' | 'galactic_empire';

/**
 * Ordem em que o botão de tema alterna entre as opções.
 * Fonte de verdade dos temas válidos (o script inline do index.html repete
 * essa lista porque roda antes do bundle; mantenha os dois iguais).
 */
export const ORDEM_TEMAS: Tema[] = ['dark', 'light', 'system', 'galactic_empire'];

/** Nome exibido para cada tema (botão do topo e mensagens do terminal). */
export const NOME_TEMA: Record<Tema, string> = {
  dark: 'escuro',
  light: 'claro',
  system: 'system',
  galactic_empire: 'galactic_empire',
};

export type TemaContexto = {
  tema: Tema;
  definirTema: (tema: Tema) => void;
  alternarTema: () => void;
};

export const TemaCtx = createContext<TemaContexto | null>(null);

export function useTema(): TemaContexto {
  const ctx = useContext(TemaCtx);
  if (!ctx) {
    throw new Error('useTema precisa ser usado dentro de <TemaCtx.Provider>');
  }
  return ctx;
}

/** Próximo tema na ordem de alternância. */
export function proximoTema(tema: Tema): Tema {
  return ORDEM_TEMAS[(ORDEM_TEMAS.indexOf(tema) + 1) % ORDEM_TEMAS.length];
}

/** Lê o tema salvo no navegador (padrão: escuro). */
export function temaSalvo(): Tema {
  try {
    const salvo = localStorage.getItem('tema');
    return ORDEM_TEMAS.includes(salvo as Tema) ? (salvo as Tema) : 'dark';
  } catch {
    return 'dark';
  }
}

/** Salva o tema no navegador (ignora se o armazenamento estiver bloqueado). */
export function salvarTema(tema: Tema): void {
  try {
    localStorage.setItem('tema', tema);
  } catch {
    // modo privado / storage bloqueado: o tema só não persiste
  }
}
