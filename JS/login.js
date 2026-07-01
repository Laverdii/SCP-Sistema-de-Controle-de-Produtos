const SUPABASE_URL = "https://ouuwgxztehzshrtjdehb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2tOQkWcuI6Xd06OEEG9D1w_Esm6_e9j";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const inputUsuario = document.getElementById("loginUsuario");
const inputSenha = document.getElementById("senhaUsuario");
const btnEntrar = document.getElementById("btnEntrar");
const mensagem = document.getElementById("mensagem");

localStorage.removeItem("scp_usuario_logado");
supabaseClient.auth.signOut();

function atualizarBotao() {
  const usuarioPreenchido = inputUsuario.value.trim() !== "";
  const senhaPreenchida = inputSenha.value.trim() !== "";
  btnEntrar.disabled = !(usuarioPreenchido && senhaPreenchida);
}

inputUsuario.addEventListener("input", atualizarBotao);
inputSenha.addEventListener("input", atualizarBotao);

btnEntrar.addEventListener("click", async function () {
  const usuario = inputUsuario.value.trim();
  const senha = inputSenha.value.trim();
  const emailFake = `${usuario}@example.com`;

  btnEntrar.disabled = true;
  btnEntrar.textContent = "Verificando...";
  mensagem.textContent = "";
  mensagem.className = "mensagem";

  const { data: dadosLogin, error: erroLogin } =
    await supabaseClient.auth.signInWithPassword({
      email: emailFake,
      password: senha,
    });

  if (erroLogin || !dadosLogin.user) {
    mensagem.textContent = "Usuario ou senha incorretos.";
    mensagem.className = "mensagem erro";
    btnEntrar.textContent = "Entrar";
    atualizarBotao();
    return;
  }

  const { data: dadosUsuario, error: erroUsuario } = await supabaseClient
    .from("usuarios")
    .select("id, usuario")
    .eq("auth_user_id", dadosLogin.user.id)
    .maybeSingle();

  if (erroUsuario || !dadosUsuario) {
    mensagem.textContent = "Erro ao carregar dados do usuario.";
    mensagem.className = "mensagem erro";
    btnEntrar.textContent = "Entrar";
    atualizarBotao();
    return;
  }

  mensagem.textContent = "Login realizado! Redirecionando...";
  mensagem.className = "mensagem sucesso";
  localStorage.setItem(
    "scp_usuario_logado",
    JSON.stringify({
      id: dadosUsuario.id,
      usuario: dadosUsuario.usuario,
    }),
  );

  setTimeout(function () {
    window.location.href = "home.html";
  }, 800);
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Enter" && !btnEntrar.disabled) {
    btnEntrar.click();
  }
});

atualizarBotao();
