import { perfil } from '../data/portfolio';

export function Terminal() {
  return (
    <div className="terminal-window">
      {/* Barra superior com os botões */}
      <div className="terminal-header">
        <span className="terminal-dot" style={{ background: '#ff5f56' }} />
        <span className="terminal-dot" style={{ background: '#ffbd2e' }} />
        <span className="terminal-dot" style={{ background: '#27c93f' }} />
        <span className="terminal-title">pedro@portfolio: ~</span>
      </div>

      <div className="terminal-body">
        <div className="text-gray">
          Bem-vindo ao terminal do Pedro.
        </div>

        {/* Foto do Pedro (substitui a caixa de digitar comandos) */}
        <img
          className="terminal-foto"
          src="/images/minhafoto.jpeg"
          alt={`Foto de ${perfil.nome}`}
        />
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
   NOTA: a caixa de comandos interativa foi removida por enquanto.
   Para reativá-la depois, restaure este trecho no final do
   <div className="terminal-body">:

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

   junto com os estados (useState), o handler handleCommand e os
   imports de react/data/portfolio. A versão completa está no
   histórico do Git.
------------------------------------------------------------------ */
