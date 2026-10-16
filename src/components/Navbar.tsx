import { useEffect, useState } from 'react';

type Tema = 'dark' | 'light';

function temaInicial(): Tema {
  const salvo = localStorage.getItem('tema');
  if (salvo === 'light' || salvo === 'dark') return salvo;
  return 'dark';
}

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

export function Navbar() {
  const [tema, setTema] = useState<Tema>(temaInicial);

  useEffect(() => {
    document.documentElement.dataset.theme = tema;
    localStorage.setItem('tema', tema);
  }, [tema]);

  const claro = tema === 'light';

  return (
    <header className="navbar">
      <a className="navbar-logo" href="#top">
        FLAUSINO<span className="text-accent">.DEV</span>
      </a>

      <button
        className="tema-toggle"
        onClick={() => setTema(claro ? 'dark' : 'light')}
        aria-label={claro ? 'Ativar modo escuro' : 'Ativar modo claro'}
        title={claro ? 'Ativar modo escuro' : 'Ativar modo claro'}
      >
        {claro ? <IconeLua /> : <IconeSol />}
      </button>
    </header>
  );
}
