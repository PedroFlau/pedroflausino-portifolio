import { createContext, useContext } from 'react';

export type Tema = 'dark' | 'light' | 'system';

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

/** Lê o tema salvo no navegador (padrão: escuro). */
export function temaSalvo(): Tema {
  const salvo = localStorage.getItem('tema');
  return salvo === 'light' || salvo === 'system' ? salvo : 'dark';
}
