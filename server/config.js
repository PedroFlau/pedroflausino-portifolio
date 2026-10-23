// ============================================================
//  Configurações do WakaTime lidas pelo servidor
//  (server/wakatime.js e server/codando.js).
// ============================================================

export const WAKATIME_CONFIG = {
  // Fuso da sua conta no WakaTime (wakatime.com/settings/preferences):
  // é por ele que a API separa os dias.
  FUSO: 'America/Sao_Paulo',

  // Último heartbeat há até tantos minutos = "codando agora".
  // A extensão manda um a cada ~2 min enquanto você digita.
  MINUTOS_ATIVO: 10,

  // Pausa maior que isso encerra a sessão (mesmo timeout padrão do WakaTime).
  MINUTOS_PAUSA: 15,

  // Projetos que aparecem pelo nome (com a branch). "*" = todos.
  // Para esconder projetos, troque por uma lista, ex.:
  //   PROJETOS_PUBLICOS: ['pedroflausino-portifolio', 'aeds'],
  // Também dá para somar nomes pela variável WAKATIME_PUBLIC_PROJECTS ("a, b").
  PROJETOS_PUBLICOS: ['*'],

  // Projeto fora da lista: true = aparece como "projeto privado";
  // false = o "codando agora" nem aparece.
  MOSTRAR_PRIVADO: true,
};

/** Lista do config + WAKATIME_PUBLIC_PROJECTS, tudo em minúsculas. */
function permitidos(env) {
  const extra = String(env?.WAKATIME_PUBLIC_PROJECTS ?? '')
    .split(',')
    .map((nome) => nome.trim())
    .filter(Boolean);
  return new Set(
    [...WAKATIME_CONFIG.PROJETOS_PUBLICOS, ...extra].map((nome) => nome.toLowerCase()),
  );
}

/** O nome deste projeto pode aparecer na página? */
export function projetoPublico(nome, env) {
  if (!nome) return false;
  const lista = permitidos(env);
  return lista.has('*') || lista.has(String(nome).toLowerCase());
}
