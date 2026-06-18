const SUPABASE_URL = "https://ouuwgxztehzshrtjdehb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2tOQkWcuI6Xd06OEEG9D1w_Esm6_e9j";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const inputUsuario = document.getElementById("loginUsuario");
const inputSenha = document.getElementById("senhaUsuario");
const btnEntrar = document.getElementById("btnEntrar");
const mensagem = document.getElementById("mensagem");

localStorage.removeItem("scp_usuario_logado");

/*
  Habilita ou desabilita o botão conforme os campos estejam preenchidos.
  O botão só fica ativo quando ambos os campos têm conteúdo.
*/
function atualizarBotao() {
  const usuarioPreenchido = inputUsuario.value.trim() !== "";
  const senhaPreenchida = inputSenha.value.trim() !== "";
  btnEntrar.disabled = !(usuarioPreenchido && senhaPreenchida);
}

inputUsuario.addEventListener("input", atualizarBotao);
inputSenha.addEventListener("input", atualizarBotao);

/*
  Realiza o login consultando a tabela "usuario" no Supabase.
  Se as credenciais existirem, redireciona para a página home.
*/
btnEntrar.addEventListener("click", async function () {
  const usuario = inputUsuario.value.trim();
  const senha = inputSenha.value.trim();

  btnEntrar.disabled = true;
  btnEntrar.textContent = "Verificando...";
  mensagem.textContent = "";
  mensagem.className = "mensagem";

  const { data, error } = await supabaseClient
    .from("usuarios")
    .select("id, usuario")
    .ilike("usuario", usuario)
    .eq("senha", senha)
    .maybeSingle();

  if (error) {
    mensagem.textContent = "Erro ao conectar. Tente novamente.";
    mensagem.className = "mensagem erro";
    btnEntrar.textContent = "Entrar";
    atualizarBotao();
    return;
  }

  if (!data) {
    mensagem.textContent = "Usuário ou senha incorretos.";
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
      id: data.id,
      usuario: data.usuario,
    })
  );

  setTimeout(function () {
    window.location.href = "home.html";
  }, 800);
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    btnEntrar.click();
  }
});

// Estado inicial: botão desabilitado
atualizarBotao();
