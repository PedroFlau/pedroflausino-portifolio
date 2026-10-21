import { useEffect, useState } from 'react';
import { Terminal } from './components/Terminal';
import { TemaCtx, ORDEM_TEMAS, temaSalvo, type Tema } from './hooks/useTema';
import './App.css';

function App() {
  const [tema, setTema] = useState<Tema>(temaSalvo);

  useEffect(() => {
    document.documentElement.dataset.theme = tema;
    localStorage.setItem('tema', tema);
  }, [tema]);

  const ordem = ORDEM_TEMAS;

  return (
    <TemaCtx.Provider
      value={{
        tema,
        definirTema: setTema,
        alternarTema: () =>
          setTema((t) => ordem[(ordem.indexOf(t) + 1) % ordem.length]),
      }}
    >
      <Terminal />
    </TemaCtx.Provider>
  );
}

export default App;
