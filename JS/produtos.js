const SUPABASE_URL = "https://ouuwgxztehzshrtjdehb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2tOQkWcuI6Xd06OEEG9D1w_Esm6_e9j";

/*
  Cria o Produto de conexão com o Supabase.

  A variável "supabase" vem da biblioteca que carregamos no HTML:
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
*/
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/*
  ============================================
  PEGANDO ELEMENTOS DO HTML
  ============================================

  Usamos document.getElementById para acessar elementos da tela.
  Assim conseguimos ler valores, alterar textos e criar ações.
*/

const formProduto = document.getElementById("formProduto");
const tabelaProdutos = document.getElementById("tabelaProdutos");
const mensagem = document.getElementById("mensagem");

const produtoIdInput = document.getElementById("produtoId");
const categoriaProdutoInput = document.getElementById("categoriaProduto");
const descProdutoInput = document.getElementById("descProduto");
const obsProdutoInput = document.getElementById("obsProduto");
const valorProdutoInput = document.getElementById("valorProduto");
const dataCadastroInput = document.getElementById("dataCadastro");
const statusProdutoInput = document.getElementById("statusProduto");

const btnSalvar = document.getElementById("btnSalvar");
const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");

const filtroCodProdutoInput = document.getElementById("filtroCodProduto");
const filtroCodCategoriaInput = document.getElementById("filtroCodCategoria");
const filtroDescProdutoInput = document.getElementById("filtroDescProduto");
const filtroObsProdutoInput = document.getElementById("filtroObsProduto");
const btnLimparFiltros = document.getElementById("btnLimparFiltros");
const contadorResultados = document.getElementById("contadorResultados");
const pillsStatus = document.querySelectorAll(".pill[data-status]");

let produtosCarregados = [];
const statusSelecionados = new Set();

/*
  ============================================
  FUNÇÃO PARA MOSTRAR MENSAGEM NA TELA
  ============================================

  Essa função recebe:
  - texto: mensagem que será exibida.
  - tipo: classe CSS aplicada na mensagem.

  Exemplo:
  mostrarMensagem("Produto salvo com sucesso!", "sucesso");
  mostrarMensagem("Erro ao salvar Produto.", "erro");
*/

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = "mensagem " + tipo;
}

async function buscarProximoProdutoIdDisponivel() {
  const { data, error } = await supabaseClient
    .from("produto")
    .select("produtoid")
    .order("produtoid", { ascending: true });

  if (error) {
    throw error;
  }

  let proximoId = 1;

  for (const produto of data) {
    if (produto.produtoid === proximoId) {
      proximoId++;
    }

    if (produto.produtoid > proximoId) {
      break;
    }
  }

  return proximoId;
}

function formatarDataParaInput(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function preencherDatasAutomaticas() {
  const hoje = new Date();

  dataCadastroInput.value = formatarDataParaInput(hoje);
}

/*
  ============================================
  CARREGAR ProdutoS
  ============================================

  Essa função busca os Produtos no Supabase e monta as linhas da tabela.

  Observação importante:
  A tabela foi criada assim:

  CREATE TABLE Produto (...)

  Como não foram usadas aspas no nome da tabela,
  no PostgreSQL o nome normalmente fica em minúsculo: Produto.

  Por isso usamos:
  .from("Produto")
*/

async function carregarCategoriasDoSelect() {
  const { data, error } = await supabaseClient
    .from("categoria_produto")
    .select("categoriaprodutoid, ds_categoria_produto")
    .order("categoriaprodutoid", { ascending: true });

  if (error) {
    mostrarMensagem("Erro ao carregar categorias: " + error.message, "erro");
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

function renderizarProdutos(produtos) {
  if (produtos.length === 0) {
    tabelaProdutos.innerHTML = `
      <tr>
        <td colspan="8">Nenhum produto encontrado.</td>
      </tr>
    `;
    return;
  }

  tabelaProdutos.innerHTML = "";

  produtos.forEach(function (Produto) {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td>${Produto.produtoid}</td>
      <td>${Produto.categoriaprodutoid}</td>
      <td>${Produto.ds_produto}</td>
      <td>${Produto.obs_produto}</td>
      <td>${Produto.vl_venda_produto}</td>
      <td>${Produto.dt_cadastro_produto ? Produto.dt_cadastro_produto.substring(0, 10) : ""}</td>
      <td>${Produto.status_produto}</td>
      <td class="coluna-acoes"></td>
    `;

    const botaoEditar = document.createElement("button");
    botaoEditar.textContent = "Editar";
    botaoEditar.className = "btn-editar";
    botaoEditar.type = "button";
    botaoEditar.addEventListener("click", function () {
      prepararEdicao(Produto);
    });

    const botaoExcluir = document.createElement("button");
    botaoExcluir.textContent = "Excluir";
    botaoExcluir.className = "btn-excluir";
    botaoExcluir.type = "button";
    botaoExcluir.addEventListener("click", function () {
      excluirProduto(Produto);
    });

    linha.querySelector(".coluna-acoes").appendChild(botaoEditar);
    linha.querySelector(".coluna-acoes").appendChild(botaoExcluir);
    tabelaProdutos.appendChild(linha);
  });
}

function filtrarProdutos() {
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
    tabelaProdutos.innerHTML = `
      <tr>
        <td colspan="8">Erro ao carregar Produtos.</td>
      </tr>
    `;
    mostrarMensagem("Erro ao buscar produtos: " + error.message, "erro");
    return;
  }

  if (data.length === 0) {
    produtosCarregados = [];
    tabelaProdutos.innerHTML = `
      <tr>
        <td colspan="8">Nenhum Produto cadastrado.</td>
      </tr>
    `;
    contadorResultados.textContent = "0 produtos";
    return;
  }

  produtosCarregados = data;
  filtrarProdutos();
}

/*
  ============================================
  PREPARAR EDIÇÃO
  ============================================

  Essa função é chamada quando o usuário clica no botão Editar.

  Ela pega os dados do Produto selecionado e joga para dentro do formulário.
*/

function prepararEdicao(Produto) {
  /*
    Preenche o campo código.
    Esse campo é importante porque usaremos o ID para saber qual Produto atualizar.
  */
  produtoIdInput.value = Produto.produtoid;

  /*
    Preenche os demais campos com os dados do Produto.
  */
  categoriaProdutoInput.value = Produto.categoriaprodutoid;
  descProdutoInput.value = Produto.ds_produto;
  obsProdutoInput.value = Produto.obs_produto;
  valorProdutoInput.value = Produto.vl_venda_produto;
  dataCadastroInput.value = Produto.dt_cadastro_produto
    ? Produto.dt_cadastro_produto.substring(0, 10)
    : "";
  statusProdutoInput.value = Produto.status_produto;

  /*
    Mudamos o texto do botão principal para "Atualizar".
  */
  btnSalvar.textContent = "Atualizar";

  /*
    Mostramos o botão Cancelar edição.
  */
  btnCancelarEdicao.style.display = "inline-block";

  /*
    Mostramos uma mensagem informando que o usuário está editando.
  */
  mostrarMensagem(
    "Editando o Produto: " + Produto.obs_produto + " - " + Produto.ds_produto,
  );
}

/*
  ============================================
  CANCELAR EDIÇÃO
  ============================================

  Essa função limpa o formulário e volta para o modo de cadastro.
*/

function cancelarEdicao() {
  formProduto.reset();
  preencherDatasAutomaticas();

  produtoIdInput.value = "";

  /*
    Volta o botão principal para "Salvar".
  */
  btnSalvar.textContent = "Salvar";

  /*
    Esconde novamente o botão Cancelar edição.
  */
  btnCancelarEdicao.style.display = "none";

  /*
    Limpa a área de mensagem.
  */
  mensagem.textContent = "";
  mensagem.className = "mensagem";
}

/*
  ============================================
  SALVAR Produto
  ============================================

  Essa função cadastra um novo Produto no Supabase.

  Ela será chamada quando o campo ProdutoId estiver vazio.
*/

async function salvarProduto() {
  /*
    Pegamos os valores digitados no formulário.
  */

  const categoriaProduto = categoriaProdutoInput.value;
  const descProduto = descProdutoInput.value;
  const obsProduto = obsProdutoInput.value;
  const valorProduto = valorProdutoInput.value;
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

  /*
    Montamos o objeto que será enviado para o Supabase.

    As propriedades precisam ter o mesmo nome das colunas da tabela.
  */

  const novoProduto = {
    produtoid: proximoProdutoId,
    categoriaprodutoid: categoriaProduto,
    ds_produto: descProduto,
    obs_produto: obsProduto,
    vl_venda_produto: valorProduto,
    dt_cadastro_produto: dataCadastro,
    status_produto: statusProduto,
  };

  /*
    Insere o novo Produto na tabela Produto.
  */
  const { error } = await supabaseClient.from("produto").insert(novoProduto);

  /*
    Se houver erro, mostramos a mensagem e paramos a função.
  */
  if (error) {
    mostrarMensagem("Erro ao salvar Produto: " + error.message, "erro");
    return;
  }

  /*
    Se deu certo, mostramos mensagem de sucesso.
  */
  mostrarMensagem("Produto salvo com sucesso!", "sucesso");

  formProduto.reset();
  preencherDatasAutomaticas();

  carregarProdutos();
}

/*
  ============================================
  ATUALIZAR NOME DO Produto
  ============================================

  Essa função atualiza apenas o nome do Produto.

  Ela será chamada quando o campo ProdutoId estiver preenchido.
*/

async function atualizarProduto() {
  const produtoId = produtoIdInput.value;
  const categoriaProduto = categoriaProdutoInput.value;
  const descProduto = descProdutoInput.value;
  const obsProduto = obsProdutoInput.value;
  const valorProduto = valorProdutoInput.value;
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

  cancelarEdicao();
  mostrarMensagem("Sucesso ao atualizar item: " + descProduto, "sucesso");
  carregarProdutos();
}

/*
  ============================================
  EXCLUIR Produto
  ============================================

  Essa função exclui um Produto do Supabase.

  Ela recebe o objeto Produto inteiro para poder usar:
  - Produto.Produtoid
  - Produto.nome_Produto
*/

async function excluirProduto(Produto) {
  /*
    Antes de excluir, pedimos confirmação.

    O confirm retorna:
    - true se o usuário clicar em OK;
    - false se o usuário clicar em Cancelar.
  */
  const confirmou = confirm(
    "Tem certeza que deseja excluir o produto " +
      Produto.ds_produto +
      " - " +
      Produto.obs_produto +
      "?",
  );

  /*
    Se o usuário cancelar, paramos a função.
  */
  if (!confirmou) {
    return;
  }

  /*
    Executa o DELETE na tabela Produto.

    O filtro .eq("produtoid", Produto.produtoid) garante que apenas
    o Produto selecionado será excluído.
  */
  const { error } = await supabaseClient
    .from("produto")
    .delete()
    .eq("produtoid", Produto.produtoid);

  /*
    Se houver erro, mostramos uma mensagem.
  */
  if (error) {
    mostrarMensagem("Erro ao excluir produto: " + error.message, "erro");
    return;
  }

  /*
    Se o Produto excluído era o mesmo que estava sendo editado,
    cancelamos a edição para limpar o formulário.
  */
  if (produtoIdInput.value == Produto.produtoid) {
    cancelarEdicao();
  }

  /*
    Mostra mensagem de sucesso.
  */
  mostrarMensagem("Produto excluído com sucesso!", "sucesso");

  /*
    Recarrega a tabela para remover visualmente o Produto excluído.
  */
  carregarProdutos();
}

/*
  ============================================
  EVENTO DE ENVIO DO FORMULÁRIO
  ============================================

  Este evento acontece quando o usuário clica em Salvar ou Atualizar.
*/

formProduto.addEventListener("submit", async function (evento) {
  /*
    Impede a página de recarregar ao enviar o formulário.
  */
  evento.preventDefault();

  /*
    Verificamos se o campo ProdutoId está preenchido.

    Se estiver vazio:
    - é um cadastro novo.

    Se estiver preenchido:
    - é uma edição.
  */
  const estaEditando = produtoIdInput.value !== "";

  if (estaEditando) {
    await atualizarProduto();
  } else {
    await salvarProduto();
  }
});

/*
  ============================================
  EVENTO DO BOTÃO CANCELAR EDIÇÃO
  ============================================

  Quando o usuário clicar em "Cancelar edição",
  chamamos a função cancelarEdicao.
*/

btnCancelarEdicao.addEventListener("click", function () {
  cancelarEdicao();
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

[
  filtroCodProdutoInput,
  filtroCodCategoriaInput,
  filtroDescProdutoInput,
  filtroObsProdutoInput,
].forEach(function (input) {
  input.addEventListener("input", filtrarProdutos);
});

btnLimparFiltros.addEventListener("click", function () {
  filtroCodProdutoInput.value = "";
  filtroCodCategoriaInput.value = "";
  filtroDescProdutoInput.value = "";
  filtroObsProdutoInput.value = "";
  statusSelecionados.clear();
  pillsStatus.forEach(function (pill) {
    pill.classList.remove("ativa");
  });
  filtrarProdutos();
});

preencherDatasAutomaticas();
carregarCategoriasDoSelect();
carregarProdutos();
