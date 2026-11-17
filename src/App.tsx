import { useEffect, useState } from 'react';
import { Terminal } from './components/Terminal';
import { carregarFonteTema } from './hooks/fontesTema';
import { TemaCtx, proximoTema, salvarTema, temaSalvo, type Tema } from './hooks/useTema';

function App() {
  const [tema, setTema] = useState<Tema>(temaSalvo);

  useEffect(() => {
    document.documentElement.dataset.theme = tema;
    carregarFonteTema(tema);
    // Barra do navegador no celular acompanha o fundo do terminal do tema
    const fundo = getComputedStyle(document.documentElement).getPropertyValue('--term-bg').trim();
    if (fundo) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', fundo);
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
