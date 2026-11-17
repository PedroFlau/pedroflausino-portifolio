import type { Tema } from './useTema';

/** Fonte de exibição de cada tema que usa uma (mesma lista do script do index.html). */
const FONTE_TEMA: Partial<Record<Tema, string>> = {
  system: 'Rajdhani:wght@500;600;700',
  galactic_empire: 'Saira+Condensed:wght@400;500;600;700',
};

/** Carrega a fonte do tema na primeira vez que ele é ativado (quem nunca troca de tema não baixa). */
export function carregarFonteTema(tema: Tema): void {
  const familia = FONTE_TEMA[tema];
  if (!familia || document.querySelector(`link[data-fonte-tema="${tema}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${familia}&display=swap`;
  link.dataset.fonteTema = tema;
  document.head.appendChild(link);
}
