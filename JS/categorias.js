const SUPABASE_URL = "https://ouuwgxztehzshrtjdehb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2tOQkWcuI6Xd06OEEG9D1w_Esm6_e9j";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Main page ────────────────────────────────────────────────────
const mensagemPrincipal = document.getElementById("mensagemPrincipal");
const tabelaCategorias = document.getElementById("tabelaCategorias");
const pesquisaCategoriaInput = document.getElementById("pesquisaCategoria");
const btnPesquisarCategoria = document.getElementById("btnPesquisarCategoria");
const avisoCategoria = document.getElementById("avisoCategoria");
const btnNovaCategoria = document.getElementById("btnNovaCategoria");

// ─── Modal ────────────────────────────────────────────────────────
const modalCategoria = document.getElementById("modalCategoria");
const modalCategoriaTitulo = document.getElementById("modalCategoriaTitulo");
const btnFecharModalCategoria = document.getElementById(
  "btnFecharModalCategoria",
);
const btnCancelarModal = document.getElementById("btnCancelarModal");
const formCategoria = document.getElementById("formCategoria");
const mensagem = document.getElementById("mensagem");

const CategoriaIdInput = document.getElementById("CategoriaId");
const descCategoriaInput = document.getElementById("descCategoria");
const btnSalvar = document.getElementById("btnSalvar");

let categoriasCarregadas = [];

// ─── Utilities ───────────────────────────────────────────────────

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = "mensagem " + tipo;
}

function mostrarMensagemPrincipal(texto, tipo) {
  mensagemPrincipal.textContent = texto;
  mensagemPrincipal.className = "mensagem " + tipo;
}

async function descCadastrada(desc, ignorarId) {
  let query = supabaseClient
    .from("categoria_produto")
    .select("categoriaprodutoid")
    .eq("ds_categoria_produto", desc);
  if (ignorarId) query = query.neq("categoriaprodutoid", ignorarId);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data !== null;
}

// ─── Main table ───────────────────────────────────────────────────

function renderizarCategorias(categorias) {
  if (categorias.length === 0) {
    tabelaCategorias.innerHTML = `<tr><td colspan="3">Nenhuma categoria encontrada.</td></tr>`;
    return;
  }

  tabelaCategorias.innerHTML = "";

  categorias.forEach(function (categoria) {
    const linha = document.createElement("tr");
    linha.className = "linha-clicavel";

    linha.innerHTML = `
      <td>${categoria.categoriaprodutoid}</td>
      <td>${categoria.ds_categoria_produto}</td>
      <td class="coluna-acoes"></td>
    `;

    const botaoEditar = document.createElement("button");
    botaoEditar.textContent = "Editar";
    botaoEditar.className = "btn-editar";
    botaoEditar.type = "button";
    botaoEditar.addEventListener("click", function () {
      prepararEdicao(categoria);
    });

    const botaoExcluir = document.createElement("button");
    botaoExcluir.textContent = "Excluir";
    botaoExcluir.className = "btn-excluir";
    botaoExcluir.type = "button";
    botaoExcluir.addEventListener("click", function () {
      excluirCategoria(categoria);
    });

    linha.querySelector(".coluna-acoes").appendChild(botaoEditar);
    linha.querySelector(".coluna-acoes").appendChild(botaoExcluir);

    tabelaCategorias.appendChild(linha);
  });
}

function executarPesquisaCategorias() {
  const valor = pesquisaCategoriaInput.value.trim();
  const termo = valor.toLowerCase();
  const ePuramenteNumerico = /^\d+$/.test(valor);

  avisoCategoria.classList.remove("visivel");

  if (!valor) {
    renderizarCategorias(categoriasCarregadas);
    return;
  }

  if (!ePuramenteNumerico && valor.length < 4) {
    avisoCategoria.classList.add("visivel");
    return;
  }

  const filtradas = categoriasCarregadas.filter(function (categoria) {
    return (
      String(categoria.categoriaprodutoid).includes(termo) ||
      categoria.ds_categoria_produto.toLowerCase().includes(termo)
    );
  });

  renderizarCategorias(filtradas);
}

async function carregarCategorias() {
  const { data, error } = await supabaseClient
    .from("categoria_produto")
    .select("categoriaprodutoid, ds_categoria_produto")
    .order("categoriaprodutoid", { ascending: true });

  if (error) {
    tabelaCategorias.innerHTML = `<tr><td colspan="3">Erro ao carregar as categorias.</td></tr>`;
    mostrarMensagemPrincipal(
      "Erro ao buscar as categorias: " + error.message,
      "erro",
    );
    return;
  }

  if (data.length === 0) {
    categoriasCarregadas = [];
    tabelaCategorias.innerHTML = `<tr><td colspan="3">Nenhuma categoria cadastrada.</td></tr>`;
    return;
  }

  categoriasCarregadas = data;
  executarPesquisaCategorias();
}

// ─── Modal ────────────────────────────────────────────────────────

function abrirModalCategoria() {
  CategoriaIdInput.value = "";
  formCategoria.reset();
  mensagem.textContent = "";
  mensagem.className = "mensagem";
  modalCategoriaTitulo.textContent = "Nova Categoria";
  btnSalvar.textContent = "Salvar";
  modalCategoria.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function fecharModalCategoria() {
  modalCategoria.style.display = "none";
  document.body.style.overflow = "";
  carregarCategorias();
}

// ─── CRUD ─────────────────────────────────────────────────────────

function prepararEdicao(categoria) {
  CategoriaIdInput.value = categoria.categoriaprodutoid;
  descCategoriaInput.value = categoria.ds_categoria_produto;
  mensagem.textContent = "";
  mensagem.className = "mensagem";
  modalCategoriaTitulo.textContent = "Editar Categoria";
  btnSalvar.textContent = "Atualizar";
  modalCategoria.style.display = "flex";
  document.body.style.overflow = "hidden";
}

async function salvarCategoria() {
  const descCategoria = descCategoriaInput.value.trim();

  if (!descCategoria) {
    mostrarMensagem("A descrição da categoria é obrigatória.", "erro");
    descCategoriaInput.focus();
    return;
  }

  let duplicado;
  try {
    duplicado = await descCadastrada(descCategoria, null);
  } catch (error) {
    mostrarMensagem("Erro ao verificar a descrição: " + error.message, "erro");
    return;
  }

  if (duplicado) {
    mostrarMensagem("Descrição já cadastrada como categoria.", "erro");
    return;
  }

  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  const { error } = await supabaseClient.from("categoria_produto").insert({
    ds_categoria_produto: descCategoria,
    auth_user_id: user.id,
  });

  if (error) {
    mostrarMensagem("Erro ao salvar categoria: " + error.message, "erro");
    return;
  }

  mostrarMensagem("Categoria salva com sucesso!", "sucesso");
  setTimeout(fecharModalCategoria, 800);
}

async function atualizarNomeCategoria() {
  const CategoriaId = CategoriaIdInput.value;
  const descCategoria = descCategoriaInput.value.trim();

  if (!descCategoria) {
    mostrarMensagem("A descrição da categoria é obrigatória.", "erro");
    descCategoriaInput.focus();
    return;
  }

  const { error } = await supabaseClient
    .from("categoria_produto")
    .update({ ds_categoria_produto: descCategoria })
    .eq("categoriaprodutoid", CategoriaId);

  if (error) {
    mostrarMensagem("Erro ao atualizar categoria: " + error.message, "erro");
    return;
  }

  mostrarMensagem("Categoria atualizada com sucesso!", "sucesso");
  setTimeout(fecharModalCategoria, 800);
}

async function excluirCategoria(categoria) {
  const confirmou = confirm(
    "Tem certeza que deseja excluir a categoria " +
      categoria.ds_categoria_produto +
      "?",
  );
  if (!confirmou) return;

  const { error } = await supabaseClient
    .from("categoria_produto")
    .delete()
    .eq("categoriaprodutoid", categoria.categoriaprodutoid);

  if (error) {
    mostrarMensagemPrincipal(
      "Erro ao excluir categoria: " + error.message,
      "erro",
    );
    return;
  }

  mostrarMensagemPrincipal("Categoria excluída com sucesso!", "sucesso");
  carregarCategorias();
}

// ─── Event listeners ──────────────────────────────────────────────

formCategoria.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  if (CategoriaIdInput.value !== "") {
    await atualizarNomeCategoria();
  } else {
    await salvarCategoria();
  }
});

btnNovaCategoria.addEventListener("click", abrirModalCategoria);
btnCancelarModal.addEventListener("click", fecharModalCategoria);
btnFecharModalCategoria.addEventListener("click", fecharModalCategoria);

modalCategoria.addEventListener("click", function (e) {
  if (e.target === modalCategoria) fecharModalCategoria();
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && modalCategoria.style.display !== "none") {
    fecharModalCategoria();
  }
});

btnPesquisarCategoria.addEventListener("click", executarPesquisaCategorias);

pesquisaCategoriaInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") executarPesquisaCategorias();
});

pesquisaCategoriaInput.addEventListener("input", function () {
  if (pesquisaCategoriaInput.value.trim() === "") {
    avisoCategoria.classList.remove("visivel");
    renderizarCategorias(categoriasCarregadas);
  }
});

// ─── Init ─────────────────────────────────────────────────────────

carregarCategorias();
