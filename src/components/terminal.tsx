import { useState, useRef, useEffect } from 'react';
import { terminalComandos } from '../data/portfolio';

type HistoryItem = {
  command: string;
  output: string;
};

const comandos: Record<string, string> = {
  ajuda: terminalComandos.help,
  help: terminalComandos.help,
  sobre: terminalComandos.about,
  about: terminalComandos.about,
  habilidades: terminalComandos.skills,
  skills: terminalComandos.skills,
  projetos: terminalComandos.projects,
  projects: terminalComandos.projects,
  contato: terminalComandos.contact,
  contact: terminalComandos.contact,
};

export function Terminal() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;

    const cmd = input.trim().toLowerCase();

    if (cmd === 'clear' || cmd === 'limpar') {
      setHistory([]);
      setInput('');
      return;
    }

    const output =
      cmd === ''
        ? ''
        : comandos[cmd] ??
          `comando não encontrado: ${cmd}. Digite "help" para ver os comandos.`;

    setHistory((prev) => [...prev, { command: input, output }]);
    setInput('');
  };

  return (
    <div className="terminal-window">
      <div className="terminal-header">
        <span className="terminal-dot" style={{ background: '#ff5f56' }} />
        <span className="terminal-dot" style={{ background: '#ffbd2e' }} />
        <span className="terminal-dot" style={{ background: '#27c93f' }} />
        <span className="terminal-title">pedro@portfolio: ~</span>
      </div>

      <div className="terminal-body">
        <div className="text-gray" style={{ marginBottom: '16px' }}>
          Bem-vindo ao terminal do Pedro. Digite <span className="text-green">help</span> para começar.
        </div>

        {history.map((item, index) => (
          <div key={index} style={{ marginBottom: '14px' }}>
            <div>
              <span className="text-green">visitante@portfolio</span>
              <span className="text-gray">:~$ </span>
              <span className="text-yellow">{item.command}</span>
            </div>
            {item.output && (
              <pre className="terminal-output">{item.output}</pre>
            )}
          </div>
        ))}

        <div className="terminal-linha">
          <span className="text-green">visitante@portfolio</span>
          <span className="text-gray">:~$</span>
          <input
            type="text"
            className="terminal-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleCommand}
            spellCheck={false}
            autoComplete="off"
          />
          <span className="cursor" />
        </div>

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
