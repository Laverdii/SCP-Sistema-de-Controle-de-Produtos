/* const SUPABASE_URL = "https://ouuwgxztehzshrtjdehb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2tOQkWcuI6Xd06OEEG9D1w_Esm6_e9j";

if (typeof usuarioLogadoEhAdmin === "function" && !usuarioLogadoEhAdmin()) {
  throw new Error("Acesso negado: somente o usuário ADMIN pode administrar usuários.");
}

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Main page ────────────────────────────────────────────────────
const mensagemPrincipal = document.getElementById("mensagemPrincipal");
const tabelaUsuarios = document.getElementById("tabelaUsuarios");
const pesquisaUsuarioInput = document.getElementById("pesquisaUsuario");
const btnPesquisarUsuario = document.getElementById("btnPesquisarUsuario");
const avisoUsuario = document.getElementById("avisoUsuario");
const btnNovoUsuario = document.getElementById("btnNovoUsuario");

// ─── Modal ────────────────────────────────────────────────────────
const modalUsuario = document.getElementById("modalUsuario");
const modalUsuarioTitulo = document.getElementById("modalUsuarioTitulo");
const btnFecharModalUsuario = document.getElementById("btnFecharModalUsuario");
const btnCancelarModal = document.getElementById("btnCancelarModal");
const formUsuario = document.getElementById("formUsuario");
const mensagem = document.getElementById("mensagem");

const usuarioIdInput = document.getElementById("usuarioId");
const nomeUsuarioInput = document.getElementById("nomeUsuario");
const senhaUsuarioInput = document.getElementById("senhaUsuario");
const btnSalvar = document.getElementById("btnSalvar");

let usuariosCarregados = [];

// ─── Utilities ───────────────────────────────────────────────────

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = "mensagem " + tipo;
}

function mostrarMensagemPrincipal(texto, tipo) {
  mensagemPrincipal.textContent = texto;
  mensagemPrincipal.className = "mensagem " + tipo;
}

async function buscarProximoUsuarioId() {
  const { data, error } = await supabaseClient
    .from("usuarios")
    .select("id")
    .order("id", { ascending: true });
  if (error) throw error;
  let proximoId = 1;
  for (const usuario of data) {
    if (usuario.id === proximoId) proximoId++;
    if (usuario.id > proximoId) break;
  }
  return proximoId;
}

// ─── Main table ───────────────────────────────────────────────────

function renderizarUsuarios(usuarios) {
  if (usuarios.length === 0) {
    tabelaUsuarios.innerHTML = `<tr><td colspan="3">Nenhum usuário encontrado.</td></tr>`;
    return;
  }

  tabelaUsuarios.innerHTML = "";

  usuarios.forEach(function (usuario) {
    const linha = document.createElement("tr");
    linha.className = "linha-clicavel";

    linha.innerHTML = `
      <td>${usuario.id}</td>
      <td>${usuario.usuario}</td>
      <td class="coluna-acoes"></td>
    `;

    const botaoEditar = document.createElement("button");
    botaoEditar.textContent = "Editar";
    botaoEditar.className = "btn-editar";
    botaoEditar.type = "button";
    botaoEditar.addEventListener("click", function () {
      prepararEdicao(usuario);
    });

    const botaoExcluir = document.createElement("button");
    botaoExcluir.textContent = "Excluir";
    botaoExcluir.className = "btn-excluir";
    botaoExcluir.type = "button";
    botaoExcluir.addEventListener("click", function () {
      excluirUsuario(usuario);
    });

    linha.querySelector(".coluna-acoes").appendChild(botaoEditar);
    linha.querySelector(".coluna-acoes").appendChild(botaoExcluir);

    tabelaUsuarios.appendChild(linha);
  });
}

function executarPesquisaUsuarios() {
  const valor = pesquisaUsuarioInput.value.trim();
  const termo = valor.toLowerCase();
  const ePuramenteNumerico = /^\d+$/.test(valor);

  avisoUsuario.classList.remove("visivel");

  if (!valor) {
    renderizarUsuarios(usuariosCarregados);
    return;
  }

  if (!ePuramenteNumerico && valor.length < 4) {
    avisoUsuario.classList.add("visivel");
    return;
  }

  const filtrados = usuariosCarregados.filter(function (usuario) {
    return (
      usuario.usuario.toLowerCase().includes(termo) ||
      String(usuario.id).includes(termo)
    );
  });

  renderizarUsuarios(filtrados);
}

async function carregarUsuarios() {
  const { data, error } = await supabaseClient
    .from("usuarios")
    .select("id, usuario, senha")
    .order("id", { ascending: true });

  if (error) {
    tabelaUsuarios.innerHTML = `<tr><td colspan="3">Erro ao carregar usuários.</td></tr>`;
    mostrarMensagemPrincipal("Erro ao buscar usuários: " + error.message, "erro");
    return;
  }

  if (data.length === 0) {
    usuariosCarregados = [];
    tabelaUsuarios.innerHTML = `<tr><td colspan="3">Nenhum usuário cadastrado.</td></tr>`;
    return;
  }

  usuariosCarregados = data;
  executarPesquisaUsuarios();
}

// ─── Modal ────────────────────────────────────────────────────────

function abrirModalUsuario() {
  usuarioIdInput.value = "";
  formUsuario.reset();
  senhaUsuarioInput.required = true;
  senhaUsuarioInput.placeholder = "Digite a senha";
  mensagem.textContent = "";
  mensagem.className = "mensagem";
  modalUsuarioTitulo.textContent = "Novo Usuário";
  btnSalvar.textContent = "Salvar";
  modalUsuario.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function fecharModalUsuario() {
  modalUsuario.style.display = "none";
  document.body.style.overflow = "";
  carregarUsuarios();
}

// ─── CRUD ─────────────────────────────────────────────────────────

function prepararEdicao(usuario) {
  usuarioIdInput.value = usuario.id;
  nomeUsuarioInput.value = usuario.usuario;
  senhaUsuarioInput.value = "";
  senhaUsuarioInput.required = false;
  senhaUsuarioInput.placeholder = "Deixe em branco para manter a senha atual";
  mensagem.textContent = "";
  mensagem.className = "mensagem";
  modalUsuarioTitulo.textContent = "Editar Usuário";
  btnSalvar.textContent = "Atualizar";
  modalUsuario.style.display = "flex";
  document.body.style.overflow = "hidden";
}

async function salvarUsuario() {
  const nomeUsuario = nomeUsuarioInput.value.trim();
  const senhaUsuario = senhaUsuarioInput.value;

  if (!nomeUsuario) {
    mostrarMensagem("O nome do usuário é obrigatório.", "erro");
    return;
  }

  if (!senhaUsuario) {
    mostrarMensagem("A senha é obrigatória.", "erro");
    return;
  }

  let proximoId;
  try {
    proximoId = await buscarProximoUsuarioId();
  } catch (error) {
    mostrarMensagem("Erro ao calcular o próximo código: " + error.message, "erro");
    return;
  }

  const { error } = await supabaseClient.from("usuarios").insert({
    id: proximoId,
    usuario: nomeUsuario,
    senha: senhaUsuario,
  });

  if (error) {
    mostrarMensagem("Erro ao salvar usuário: " + error.message, "erro");
    return;
  }

  mostrarMensagem("Usuário salvo com sucesso!", "sucesso");
  setTimeout(fecharModalUsuario, 800);
}

async function atualizarUsuario() {
  const usuarioId = usuarioIdInput.value;
  const nomeUsuario = nomeUsuarioInput.value.trim();
  const senhaUsuario = senhaUsuarioInput.value;

  if (!nomeUsuario) {
    mostrarMensagem("O nome do usuário é obrigatório.", "erro");
    return;
  }

  const dadosAtualizar = { usuario: nomeUsuario };
  if (senhaUsuario) dadosAtualizar.senha = senhaUsuario;

  const { error } = await supabaseClient
    .from("usuarios")
    .update(dadosAtualizar)
    .eq("id", usuarioId);

  if (error) {
    mostrarMensagem("Erro ao atualizar usuário: " + error.message, "erro");
    return;
  }

  mostrarMensagem("Usuário atualizado com sucesso!", "sucesso");
  setTimeout(fecharModalUsuario, 800);
}

async function excluirUsuario(usuario) {
  const confirmou = confirm("Tem certeza que deseja excluir o usuário " + usuario.usuario + "?");
  if (!confirmou) return;

  const { error } = await supabaseClient
    .from("usuarios")
    .delete()
    .eq("id", usuario.id);

  if (error) {
    mostrarMensagemPrincipal("Erro ao excluir usuário: " + error.message, "erro");
    return;
  }

  mostrarMensagemPrincipal("Usuário excluído com sucesso!", "sucesso");
  carregarUsuarios();
}

// ─── Event listeners ──────────────────────────────────────────────

formUsuario.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  if (usuarioIdInput.value !== "") {
    await atualizarUsuario();
  } else {
    await salvarUsuario();
  }
});

btnNovoUsuario.addEventListener("click", abrirModalUsuario);
btnCancelarModal.addEventListener("click", fecharModalUsuario);
btnFecharModalUsuario.addEventListener("click", fecharModalUsuario);

modalUsuario.addEventListener("click", function (e) {
  if (e.target === modalUsuario) fecharModalUsuario();
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && modalUsuario.style.display !== "none") {
    fecharModalUsuario();
  }
});

btnPesquisarUsuario.addEventListener("click", executarPesquisaUsuarios);

pesquisaUsuarioInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") executarPesquisaUsuarios();
});

pesquisaUsuarioInput.addEventListener("input", function () {
  if (pesquisaUsuarioInput.value.trim() === "") {
    avisoUsuario.classList.remove("visivel");
    renderizarUsuarios(usuariosCarregados);
  }
});

// ─── Init ─────────────────────────────────────────────────────────

carregarUsuarios();
*/
