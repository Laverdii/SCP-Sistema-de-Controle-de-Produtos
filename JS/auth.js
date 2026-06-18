const SESSAO_USUARIO_CHAVE = "scp_usuario_logado";

function obterUsuarioLogado() {
  const usuarioSalvo = localStorage.getItem(SESSAO_USUARIO_CHAVE);
  if (!usuarioSalvo) return null;

  try {
    return JSON.parse(usuarioSalvo);
  } catch (error) {
    localStorage.removeItem(SESSAO_USUARIO_CHAVE);
    return null;
  }
}

function usuarioLogadoEhAdmin() {
  const usuario = obterUsuarioLogado();
  return (
    usuario !== null &&
    Number(usuario.id) === 1 &&
    String(usuario.usuario).trim().toUpperCase() === "ADMIN"
  );
}

function sairDoSistema() {
  localStorage.removeItem(SESSAO_USUARIO_CHAVE);
}

function protegerPagina() {
  const usuario = obterUsuarioLogado();
  const paginaAtual = window.location.pathname.split("/").pop();

  if (!usuario) {
    window.location.href = "telalogin.html";
    throw new Error("Acesso negado: usuário não autenticado.");
  }

  if (paginaAtual === "cadastrodeusuarios.html" && !usuarioLogadoEhAdmin()) {
    alert("Acesso permitido somente para o usuário ADMIN.");
    window.location.href = "home.html";
    throw new Error("Acesso negado: somente o usuário ADMIN pode administrar usuários.");
  }

  if (!usuarioLogadoEhAdmin()) {
    document
      .querySelectorAll('a[href="cadastrodeusuarios.html"]')
      .forEach(function (linkUsuarios) {
        const itemMenu = linkUsuarios.closest("li");
        if (itemMenu) itemMenu.remove();
      });
  }

  document
    .querySelectorAll('a[href="telalogin.html"]')
    .forEach(function (linkSair) {
      linkSair.addEventListener("click", sairDoSistema);
    });
}

protegerPagina();
