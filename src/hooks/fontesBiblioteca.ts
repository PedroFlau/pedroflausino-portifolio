/**
 * Fontes das capas geradas: serifa (tarô, selo, horizonte) e condensada
 * (insígnia, sombra). Só baixam quando a biblioteca é aberta.
 */
const URL_FONTES =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Oswald:wght@500;600;700&display=swap';

export function carregarFontesBiblioteca(): void {
  if (document.querySelector('link[data-fontes-biblioteca]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = URL_FONTES;
  link.dataset.fontesBiblioteca = '';
  document.head.appendChild(link);
}
