const SUPABASE_URL = "https://ouuwgxztehzshrtjdehb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2tOQkWcuI6Xd06OEEG9D1w_Esm6_e9j";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const inputUsuario = document.getElementById("nomeUsuario");
const inputSenha = document.getElementById("senhaUsuario");
const btnCadastrar = document.getElementById("btnCadastrar");
const mensagem = document.getElementById("mensagem");

function atualizarBotao() {
  const usuarioPreenchido = inputUsuario.value.trim() !== "";
  const senhaPreenchida = inputSenha.value.trim() !== "";
  btnCadastrar.disabled = !(usuarioPreenchido && senhaPreenchida);
}

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = "mensagem " + tipo;
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

async function usuarioJaExiste(nomeUsuario) {
  const { data, error } = await supabaseClient
    .from("usuarios")
    .select("id")
    .ilike("usuario", nomeUsuario)
    .maybeSingle();

  if (error) throw error;

  return Boolean(data);
}

btnCadastrar.addEventListener("click", async function () {
  const nomeUsuario = inputUsuario.value.trim();
  const senhaUsuario = inputSenha.value.trim();

  btnCadastrar.disabled = true;
  btnCadastrar.textContent = "Cadastrando...";
  mostrarMensagem("", "");

  try {
    if (await usuarioJaExiste(nomeUsuario)) {
      mostrarMensagem("Este nome de usuário já está cadastrado.", "erro");
      btnCadastrar.textContent = "Cadastrar";
      atualizarBotao();
      return;
    }

    const proximoId = await buscarProximoUsuarioId();

    const { error } = await supabaseClient.from("usuarios").insert({
      id: proximoId,
      usuario: nomeUsuario,
      senha: senhaUsuario,
    });

    if (error) throw error;

    mostrarMensagem("Cadastro realizado! Redirecionando para o login...", "sucesso");

    setTimeout(function () {
      window.location.href = "telalogin.html";
    }, 1200);
  } catch (error) {
    mostrarMensagem("Erro ao cadastrar. Tente novamente.", "erro");
    btnCadastrar.textContent = "Cadastrar";
    atualizarBotao();
  }
});

inputUsuario.addEventListener("input", atualizarBotao);
inputSenha.addEventListener("input", atualizarBotao);

document.addEventListener("keydown", function (event) {
  if (event.key === "Enter" && !btnCadastrar.disabled) {
    btnCadastrar.click();
  }
});

atualizarBotao();
