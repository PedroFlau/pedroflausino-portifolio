import { useEffect, useState } from 'react';
import { Terminal } from './components/Terminal';
import { TemaCtx, proximoTema, salvarTema, temaSalvo, type Tema } from './hooks/useTema';

function App() {
  const [tema, setTema] = useState<Tema>(temaSalvo);

  useEffect(() => {
    document.documentElement.dataset.theme = tema;
    salvarTema(tema);
  }, [tema]);

  return (
    <TemaCtx.Provider
      value={{
        tema,
        definirTema: setTema,
        alternarTema: () => setTema(proximoTema),
      }}
    >
      <Terminal />
    </TemaCtx.Provider>
  );
}

export default App;
