const SUPABASE_URL = "https://ouuwgxztehzshrtjdehb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2tOQkWcuI6Xd06OEEG9D1w_Esm6_e9j";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const inputUsuario = document.getElementById("nomeUsuario");
const inputSenha = document.getElementById("senhaUsuario");
const btnCadastrar = document.getElementById("btnCadastrar");
const mensagem = document.getElementById("mensagem");
const usuarioRegex = /^[a-zA-Z0-9. ]+$/;

function atualizarBotao() {
  const usuarioPreenchido = inputUsuario.value.trim() !== "";
  const senhaPreenchida = inputSenha.value.trim() !== "";
  btnCadastrar.disabled = !(usuarioPreenchido && senhaPreenchida);
}

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = "mensagem " + tipo;
}

btnCadastrar.addEventListener("click", async function () {
  const nomeUsuario = inputUsuario.value.trim();
  const senhaUsuario = inputSenha.value.trim();
  const emailFake = `${nomeUsuario}@example.com`;

  if (!usuarioRegex.test(nomeUsuario)) {
    mostrarMensagem("Nome de usuário inválido. Use apenas letras, números e espaços.", "erro");
    return;
  }

  btnCadastrar.disabled = true;
  btnCadastrar.textContent = "Cadastrando...";
  mostrarMensagem("", "");

  try {
    const { data, error: erroAuth } = await supabaseClient.auth.signUp({
      email: emailFake,
      password: senhaUsuario,
    });

    if (erroAuth) throw erroAuth;
    if (!data.user) throw new Error("Usuario nao foi criado no Auth.");

    const { error: erroInsert } = await supabaseClient.from("usuarios").insert({
      usuario: nomeUsuario,
      auth_user_id: data.user.id,
    });

    if (erroInsert) {
      if (erroInsert.code === "23505") {
        mostrarMensagem("Este nome de usuario ja esta cadastrado.", "erro");
      } else {
        throw erroInsert;
      }

      btnCadastrar.textContent = "Cadastrar";
      atualizarBotao();
      return;
    }

    mostrarMensagem(
      "Cadastro realizado! Redirecionando para o login...",
      "sucesso",
    );

    setTimeout(function () {
      window.location.href = "telalogin.html";
    }, 1200);
  } catch (error) {
    mostrarMensagem("Erro ao cadastrar: " + error.message, "erro");
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
