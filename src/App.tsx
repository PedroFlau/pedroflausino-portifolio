import { useEffect, useState } from 'react';
import { Terminal } from './components/Terminal';
import { TemaCtx, temaSalvo, type Tema } from './hooks/useTema';
import './App.css';

function App() {
  const [tema, setTema] = useState<Tema>(temaSalvo);

  useEffect(() => {
    document.documentElement.dataset.theme = tema;
    localStorage.setItem('tema', tema);
  }, [tema]);

  return (
    <TemaCtx.Provider
      value={{
        tema,
        definirTema: setTema,
        alternarTema: () => setTema((t) => (t === 'dark' ? 'light' : 'dark')),
      }}
    >
      <Terminal />
    </TemaCtx.Provider>
  );
}

export default App;
