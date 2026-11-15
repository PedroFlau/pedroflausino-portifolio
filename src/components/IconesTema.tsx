import type { ComponentType } from 'react';
import type { Tema } from '../hooks/useTema';

// Ícones do botão de tema da barra superior. O botão mostra o ícone do
// PRÓXIMO tema (o que será ativado ao clicar).

function IconeSol() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function IconeLua() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function IconeSistema() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="13" rx="1" />
      <path d="M8 21h8M12 17v4M7 8h4M7 11h7" />
    </svg>
  );
}

function IconeImperio() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M12 5v4.4M12 14.6V19M5 12h4.4M14.6 12H19M7.05 7.05l3.1 3.1M13.85 13.85l3.1 3.1M7.05 16.95l3.1-3.1M13.85 10.15l3.1-3.1" />
    </svg>
  );
}

/** Ícone de cada tema. */
export const ICONE_TEMA: Record<Tema, ComponentType> = {
  dark: IconeLua,
  light: IconeSol,
  system: IconeSistema,
  galactic_empire: IconeImperio,
};
