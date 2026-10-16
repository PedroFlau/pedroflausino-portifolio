import { useState } from 'react';

const links = [
  { href: '#sobre', label: 'sobre' },
  { href: '#habilidades', label: 'habilidades' },
  { href: '#projetos', label: 'projetos' },
  { href: '#contato', label: 'contato' },
];

export function Navbar() {
  const [aberto, setAberto] = useState(false);

  return (
    <header className="navbar">
      <a className="navbar-logo" href="#top" onClick={() => setAberto(false)}>
        <span className="text-green">~/</span>pedro-flausino
      </a>

      <button
        className="navbar-toggle"
        aria-label="Abrir menu"
        onClick={() => setAberto((v) => !v)}
      >
        {aberto ? '✕' : '☰'}
      </button>

      <nav className={`navbar-links ${aberto ? 'aberto' : ''}`}>
        {links.map((l) => (
          <a key={l.href} href={l.href} onClick={() => setAberto(false)}>
            {l.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
