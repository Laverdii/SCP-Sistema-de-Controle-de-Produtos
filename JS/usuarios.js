const SUPABASE_URL = "https://ouuwgxztehzshrtjdehb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2tOQkWcuI6Xd06OEEG9D1w_Esm6_e9j";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const formUsuario = document.getElementById("formUsuario");
const tabelaUsuarios = document.getElementById("tabelaUsuarios");
const mensagem = document.getElementById("mensagem");
const pesquisaUsuarioInput = document.getElementById("pesquisaUsuario");
const btnPesquisarUsuario = document.getElementById("btnPesquisarUsuario");
const avisoUsuario = document.getElementById("avisoUsuario");

const usuarioIdInput = document.getElementById("usuarioId");
const nomeUsuarioInput = document.getElementById("nomeUsuario");
const senhaUsuarioInput = document.getElementById("senhaUsuario");

const btnSalvar = document.getElementById("btnSalvar");
const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");

let usuariosCarregados = [];

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = "mensagem " + tipo;
}

function renderizarUsuarios(usuarios) {
  if (usuarios.length === 0) {
    tabelaUsuarios.innerHTML = `
      <tr>
        <td colspan="3">Nenhum usuário encontrado.</td>
      </tr>
    `;
    return;
  }

  tabelaUsuarios.innerHTML = "";

  usuarios.forEach(function (usuario) {
    const linha = document.createElement("tr");

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
    tabelaUsuarios.innerHTML = `
      <tr>
        <td colspan="3">Erro ao carregar usuários.</td>
      </tr>
    `;
    mostrarMensagem("Erro ao buscar usuários: " + error.message, "erro");
    return;
  }

  if (data.length === 0) {
    usuariosCarregados = [];
    tabelaUsuarios.innerHTML = `
      <tr>
        <td colspan="3">Nenhum usuário cadastrado.</td>
      </tr>
    `;
    return;
  }

  usuariosCarregados = data;
  executarPesquisaUsuarios();
}

function prepararEdicao(usuario) {
  usuarioIdInput.value = usuario.id;
  nomeUsuarioInput.value = usuario.usuario;
  senhaUsuarioInput.value = "";
  senhaUsuarioInput.required = false;
  senhaUsuarioInput.placeholder = "Deixe em branco para manter a senha atual";

  btnSalvar.textContent = "Atualizar";
  btnCancelarEdicao.style.display = "inline-block";

  mostrarMensagem("Editando o usuário: " + usuario.usuario, "sucesso");
}

function cancelarEdicao() {
  formUsuario.reset();
  usuarioIdInput.value = "";
  senhaUsuarioInput.required = true;
  senhaUsuarioInput.placeholder = "Digite a senha";
  btnSalvar.textContent = "Salvar";
  btnCancelarEdicao.style.display = "none";
  mensagem.textContent = "";
  mensagem.className = "mensagem";
}

async function buscarProximoUsuarioId() {
  const { data, error } = await supabaseClient
    .from("usuarios")
    .select("id")
    .order("id", { ascending: true });

  if (error) {
    throw error;
  }

  let proximoId = 1;
  for (const usuario of data) {
    if (usuario.id === proximoId) {
      proximoId++;
    }
    if (usuario.id > proximoId) {
      break;
    }
  }

  return proximoId;
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

  const novoUsuario = {
    id: proximoId,
    usuario: nomeUsuario,
    senha: senhaUsuario,
  };

  const { error } = await supabaseClient.from("usuarios").insert(novoUsuario);

  if (error) {
    mostrarMensagem("Erro ao salvar usuário: " + error.message, "erro");
    return;
  }

  mostrarMensagem("Usuário salvo com sucesso!", "sucesso");
  formUsuario.reset();
  carregarUsuarios();
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

  if (senhaUsuario) {
    dadosAtualizar.senha = senhaUsuario;
  }

  const { error } = await supabaseClient
    .from("usuarios")
    .update(dadosAtualizar)
    .eq("id", usuarioId);

  if (error) {
    mostrarMensagem("Erro ao atualizar usuário: " + error.message, "erro");
    return;
  }

  cancelarEdicao();
  mostrarMensagem("Usuário atualizado com sucesso!", "sucesso");
  carregarUsuarios();
}

async function excluirUsuario(usuario) {
  const confirmou = confirm(
    "Tem certeza que deseja excluir o usuário " + usuario.usuario + "?"
  );

  if (!confirmou) {
    return;
  }

  const { error } = await supabaseClient
    .from("usuarios")
    .delete()
    .eq("id", usuario.id);

  if (error) {
    mostrarMensagem("Erro ao excluir usuário: " + error.message, "erro");
    return;
  }

  if (usuarioIdInput.value == usuario.id) {
    cancelarEdicao();
  }

  mostrarMensagem("Usuário excluído com sucesso!", "sucesso");
  carregarUsuarios();
}

formUsuario.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  const estaEditando = usuarioIdInput.value !== "";

  if (estaEditando) {
    await atualizarUsuario();
  } else {
    await salvarUsuario();
  }
});

btnCancelarEdicao.addEventListener("click", function () {
  cancelarEdicao();
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

carregarUsuarios();
