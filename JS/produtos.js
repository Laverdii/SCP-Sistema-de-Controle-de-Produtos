const SUPABASE_URL = "https://ouuwgxztehzshrtjdehb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2tOQkWcuI6Xd06OEEG9D1w_Esm6_e9j";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Main page ────────────────────────────────────────────────────
const mensagemPrincipal = document.getElementById("mensagemPrincipal");
const tabelaProdutos = document.getElementById("tabelaProdutos");
const btnNovoProduto = document.getElementById("btnNovoProduto");

// ─── Modal ────────────────────────────────────────────────────────
const modalProduto = document.getElementById("modalProduto");
const modalProdutoTitulo = document.getElementById("modalProdutoTitulo");
const btnFecharModalProduto = document.getElementById("btnFecharModalProduto");
const btnCancelarModal = document.getElementById("btnCancelarModal");
const formProduto = document.getElementById("formProduto");
const mensagem = document.getElementById("mensagem");

const produtoIdInput = document.getElementById("produtoId");
const categoriaProdutoInput = document.getElementById("categoriaProduto");
const descProdutoInput = document.getElementById("descProduto");
const obsProdutoInput = document.getElementById("obsProduto");
const valorProdutoInput = document.getElementById("valorProduto");
const dataCadastroInput = document.getElementById("dataCadastro");
const statusProdutoInput = document.getElementById("statusProduto");
const btnSalvar = document.getElementById("btnSalvar");

// ─── Filters ──────────────────────────────────────────────────────
const filtroCodProdutoInput = document.getElementById("filtroCodProduto");
const filtroCodCategoriaInput = document.getElementById("filtroCodCategoria");
const filtroDescProdutoInput = document.getElementById("filtroDescProduto");
const filtroObsProdutoInput = document.getElementById("filtroObsProduto");
const btnLimparFiltros = document.getElementById("btnLimparFiltros");
const btnPesquisarFiltros = document.getElementById("btnPesquisarFiltros");
const contadorResultados = document.getElementById("contadorResultados");
const pillsStatus = document.querySelectorAll(".pill[data-status]");
const avisoDescProduto = document.getElementById("avisoDescProduto");
const avisoObsProduto = document.getElementById("avisoObsProduto");

let produtosCarregados = [];
const statusSelecionados = new Set();

// ─── Utilities ───────────────────────────────────────────────────

function formatarMoeda(valor) {
  if (valor === null || valor === undefined || valor === "") return "-";
  const numero = parseFloat(valor);
  if (isNaN(numero)) return "-";
  return (
    "R$ " +
    numero.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function numeroParaMascara(valor) {
  if (valor === null || valor === undefined || valor === "") return "";
  const numero = parseFloat(valor);
  if (isNaN(numero)) return "";
  return (
    "R$ " +
    numero.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function extrairValorNumerico(valorMascarado) {
  const limpo = valorMascarado.replace(/[R$\s.]/g, "").replace(",", ".");
  return parseFloat(limpo) || 0;
}

function aplicarMascaraMoeda(e) {
  const digits = e.target.value.replace(/\D/g, "").slice(-13);
  if (!digits) {
    e.target.value = "";
    return;
  }
  const centavos = parseInt(digits, 10);
  const reais = Math.floor(centavos / 100);
  const cents = centavos % 100;
  e.target.value =
    "R$ " +
    reais.toLocaleString("pt-BR") +
    "," +
    String(cents).padStart(2, "0");
}

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = "mensagem " + tipo;
}

function mostrarMensagemPrincipal(texto, tipo) {
  mensagemPrincipal.textContent = texto;
  mensagemPrincipal.className = "mensagem " + tipo;
}

function formatarDataParaInput(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function formatarDataParaExibicao(dataStr) {
  if (!dataStr) return "-";
  const partes = dataStr.slice(0, 10).split("-");
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function preencherDatasAutomaticas() {
  dataCadastroInput.value = formatarDataParaInput(new Date());
}

async function buscarProximoProdutoIdDisponivel() {
  const { data, error } = await supabaseClient
    .from("produto")
    .select("produtoid")
    .order("produtoid", { ascending: true });
  if (error) throw error;
  let proximoId = 1;
  for (const produto of data) {
    if (produto.produtoid === proximoId) proximoId++;
    if (produto.produtoid > proximoId) break;
  }
  return proximoId;
}

async function carregarCategoriasDoSelect() {
  const { data, error } = await supabaseClient
    .from("categoria_produto")
    .select("categoriaprodutoid, ds_categoria_produto")
    .order("categoriaprodutoid", { ascending: true });

  if (error) {
    mostrarMensagemPrincipal(
      "Erro ao carregar categorias: " + error.message,
      "erro",
    );
    return;
  }

  categoriaProdutoInput.innerHTML = `<option value="">Selecione</option>`;
  data.forEach(function (categoria) {
    const option = document.createElement("option");
    option.value = categoria.categoriaprodutoid;
    option.textContent = categoria.ds_categoria_produto;
    categoriaProdutoInput.appendChild(option);
  });
}

// ─── Main table ───────────────────────────────────────────────────

function renderizarProdutos(produtos) {
  if (produtos.length === 0) {
    tabelaProdutos.innerHTML = `<tr><td colspan="8">Nenhum produto encontrado.</td></tr>`;
    return;
  }

  tabelaProdutos.innerHTML = "";

  produtos.forEach(function (produto) {
    const linha = document.createElement("tr");
    const inativo = produto.status_produto === "INATIVO";
    linha.className = "linha-clicavel" + (inativo ? " produto-inativo" : "");

    linha.innerHTML = `
      <td>${produto.produtoid}</td>
      <td>${produto.categoriaprodutoid}</td>
      <td>${produto.ds_produto}</td>
      <td>${produto.obs_produto}</td>
      <td>${formatarMoeda(produto.vl_venda_produto)}</td>
      <td>${formatarDataParaExibicao(produto.dt_cadastro_produto)}</td>
      <td>${produto.status_produto}</td>
      <td class="coluna-acoes"></td>
    `;

    const botaoEditar = document.createElement("button");
    botaoEditar.textContent = "Editar";
    botaoEditar.className = "btn-editar";
    botaoEditar.type = "button";
    botaoEditar.addEventListener("click", function () {
      prepararEdicao(produto);
    });

    const botaoExcluir = document.createElement("button");
    botaoExcluir.textContent = "Excluir";
    botaoExcluir.className = "btn-excluir";
    botaoExcluir.type = "button";
    botaoExcluir.addEventListener("click", function () {
      excluirProduto(produto);
    });

    linha.querySelector(".coluna-acoes").appendChild(botaoEditar);
    linha.querySelector(".coluna-acoes").appendChild(botaoExcluir);
    tabelaProdutos.appendChild(linha);
  });
}

function validarCamposTexto() {
  const descValor = filtroDescProdutoInput.value.trim();
  const obsValor = filtroObsProdutoInput.value.trim();
  let valido = true;

  if (descValor.length > 0 && descValor.length < 4) {
    avisoDescProduto.classList.add("visivel");
    valido = false;
  } else {
    avisoDescProduto.classList.remove("visivel");
  }

  if (obsValor.length > 0 && obsValor.length < 4) {
    avisoObsProduto.classList.add("visivel");
    valido = false;
  } else {
    avisoObsProduto.classList.remove("visivel");
  }

  return valido;
}

function filtrarProdutos() {
  if (!validarCamposTexto()) return;

  const codProduto = filtroCodProdutoInput.value.trim();
  const codCategoria = filtroCodCategoriaInput.value.trim();
  const desc = filtroDescProdutoInput.value.toLowerCase().trim();
  const obs = filtroObsProdutoInput.value.toLowerCase().trim();

  const filtrados = produtosCarregados.filter(function (produto) {
    if (codProduto && !String(produto.produtoid).includes(codProduto))
      return false;
    if (
      codCategoria &&
      !String(produto.categoriaprodutoid).includes(codCategoria)
    )
      return false;
    if (desc && !produto.ds_produto.toLowerCase().includes(desc)) return false;
    if (obs && !produto.obs_produto.toLowerCase().includes(obs)) return false;
    if (
      statusSelecionados.size > 0 &&
      !statusSelecionados.has(produto.status_produto)
    )
      return false;
    return true;
  });

  renderizarProdutos(filtrados);

  const total = produtosCarregados.length;
  contadorResultados.textContent =
    filtrados.length === total
      ? `${total} produto${total !== 1 ? "s" : ""}`
      : `${filtrados.length} de ${total} produto${total !== 1 ? "s" : ""}`;
}

async function carregarProdutos() {
  const { data, error } = await supabaseClient
    .from("produto")
    .select(
      "produtoid, categoriaprodutoid, ds_produto, obs_produto, vl_venda_produto, dt_cadastro_produto, status_produto",
    )
    .order("produtoid", { ascending: true });

  if (error) {
    tabelaProdutos.innerHTML = `<tr><td colspan="8">Erro ao carregar Produtos.</td></tr>`;
    mostrarMensagemPrincipal(
      "Erro ao buscar produtos: " + error.message,
      "erro",
    );
    return;
  }

  if (data.length === 0) {
    produtosCarregados = [];
    tabelaProdutos.innerHTML = `<tr><td colspan="8">Nenhum Produto cadastrado.</td></tr>`;
    contadorResultados.textContent = "0 produtos";
    return;
  }

  produtosCarregados = data;
  filtrarProdutos();
}

// ─── Modal ────────────────────────────────────────────────────────

function abrirModalProduto() {
  produtoIdInput.value = "";
  formProduto.reset();
  preencherDatasAutomaticas();
  mensagem.textContent = "";
  mensagem.className = "mensagem";
  modalProdutoTitulo.textContent = "Novo Produto";
  btnSalvar.textContent = "Salvar";
  modalProduto.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function fecharModalProduto() {
  modalProduto.style.display = "none";
  document.body.style.overflow = "";
  carregarProdutos();
}

// ─── CRUD ─────────────────────────────────────────────────────────

function prepararEdicao(produto) {
  produtoIdInput.value = produto.produtoid;
  categoriaProdutoInput.value = produto.categoriaprodutoid;
  descProdutoInput.value = produto.ds_produto;
  obsProdutoInput.value = produto.obs_produto;
  valorProdutoInput.value = numeroParaMascara(produto.vl_venda_produto);
  dataCadastroInput.value = produto.dt_cadastro_produto
    ? produto.dt_cadastro_produto.substring(0, 10)
    : "";
  statusProdutoInput.value = produto.status_produto;
  mensagem.textContent = "";
  mensagem.className = "mensagem";
  modalProdutoTitulo.textContent = "Editar Produto";
  btnSalvar.textContent = "Atualizar";
  modalProduto.style.display = "flex";
  document.body.style.overflow = "hidden";
}

async function salvarProduto() {
  const categoriaProduto = categoriaProdutoInput.value;
  const descProduto = descProdutoInput.value;
  const obsProduto = obsProdutoInput.value;
  const valorProduto = extrairValorNumerico(valorProdutoInput.value);
  const dataCadastro = dataCadastroInput.value;
  const statusProduto = statusProdutoInput.value;

  let proximoProdutoId;
  try {
    proximoProdutoId = await buscarProximoProdutoIdDisponivel();
  } catch (error) {
    mostrarMensagem(
      "Erro ao calcular o próximo código: " + error.message,
      "erro",
    );
    return;
  }

  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  const { error } = await supabaseClient.from("produto").insert({
    categoriaprodutoid: categoriaProduto,
    ds_produto: descProduto,
    obs_produto: obsProduto,
    vl_venda_produto: valorProduto,
    dt_cadastro_produto: dataCadastro,
    status_produto: statusProduto,
    auth_user_id: user.id,
  });

  if (error) {
    mostrarMensagem("Erro ao salvar Produto: " + error.message, "erro");
    return;
  }

  mostrarMensagem("Produto salvo com sucesso!", "sucesso");
  setTimeout(fecharModalProduto, 800);
}

async function atualizarProduto() {
  const produtoId = produtoIdInput.value;
  const categoriaProduto = categoriaProdutoInput.value;
  const descProduto = descProdutoInput.value;
  const obsProduto = obsProdutoInput.value;
  const valorProduto = extrairValorNumerico(valorProdutoInput.value);
  const dataCadastro = dataCadastroInput.value;
  const statusProduto = statusProdutoInput.value;

  const { error } = await supabaseClient
    .from("produto")
    .update({
      categoriaprodutoid: categoriaProduto,
      ds_produto: descProduto,
      obs_produto: obsProduto,
      vl_venda_produto: valorProduto,
      dt_cadastro_produto: dataCadastro,
      status_produto: statusProduto,
    })
    .eq("produtoid", produtoId);

  if (error) {
    mostrarMensagem("Erro ao atualizar Produto: " + error.message, "erro");
    return;
  }

  mostrarMensagem("Produto atualizado com sucesso!", "sucesso");
  setTimeout(fecharModalProduto, 800);
}

async function excluirProduto(produto) {
  const confirmou = confirm(
    "Tem certeza que deseja excluir o produto " + produto.ds_produto + "?",
  );
  if (!confirmou) return;

  const { error } = await supabaseClient
    .from("produto")
    .delete()
    .eq("produtoid", produto.produtoid);

  if (error) {
    mostrarMensagemPrincipal(
      "Erro ao excluir produto: " + error.message,
      "erro",
    );
    return;
  }

  mostrarMensagemPrincipal("Produto excluído com sucesso!", "sucesso");
  carregarProdutos();
}

// ─── Event listeners ──────────────────────────────────────────────

formProduto.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  if (produtoIdInput.value !== "") {
    await atualizarProduto();
  } else {
    await salvarProduto();
  }
});

btnNovoProduto.addEventListener("click", abrirModalProduto);
btnCancelarModal.addEventListener("click", fecharModalProduto);
btnFecharModalProduto.addEventListener("click", fecharModalProduto);
valorProdutoInput.addEventListener("input", aplicarMascaraMoeda);

modalProduto.addEventListener("click", function (e) {
  if (e.target === modalProduto) fecharModalProduto();
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && modalProduto.style.display !== "none") {
    fecharModalProduto();
  }
});

pillsStatus.forEach(function (pill) {
  pill.addEventListener("click", function () {
    const status = pill.dataset.status;
    if (statusSelecionados.has(status)) {
      statusSelecionados.delete(status);
      pill.classList.remove("ativa");
    } else {
      statusSelecionados.add(status);
      pill.classList.add("ativa");
    }
    filtrarProdutos();
  });
});

btnPesquisarFiltros.addEventListener("click", filtrarProdutos);

[
  filtroCodProdutoInput,
  filtroCodCategoriaInput,
  filtroDescProdutoInput,
  filtroObsProdutoInput,
].forEach(function (input) {
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") filtrarProdutos();
  });
  input.addEventListener("input", function () {
    const descValor = filtroDescProdutoInput.value.trim();
    const obsValor = filtroObsProdutoInput.value.trim();
    if (descValor === "" || descValor.length >= 4)
      avisoDescProduto.classList.remove("visivel");
    if (obsValor === "" || obsValor.length >= 4)
      avisoObsProduto.classList.remove("visivel");
  });
});

btnLimparFiltros.addEventListener("click", function () {
  filtroCodProdutoInput.value = "";
  filtroCodCategoriaInput.value = "";
  filtroDescProdutoInput.value = "";
  filtroObsProdutoInput.value = "";
  statusSelecionados.clear();
  avisoDescProduto.classList.remove("visivel");
  avisoObsProduto.classList.remove("visivel");
  pillsStatus.forEach(function (pill) {
    pill.classList.remove("ativa");
  });
  filtrarProdutos();
});

// ─── Init ─────────────────────────────────────────────────────────

carregarCategoriasDoSelect();
carregarProdutos();
