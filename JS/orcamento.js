const SUPABASE_URL = "https://ouuwgxztehzshrtjdehb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2tOQkWcuI6Xd06OEEG9D1w_Esm6_e9j";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Main page ────────────────────────────────────────────────────
const mensagemPrincipal = document.getElementById("mensagemPrincipal");
const tabelaListaOrcamentos = document.getElementById("tabelaListaOrcamentos");
const pesquisaOrcamentosInput = document.getElementById("pesquisaOrcamentos");
const btnPesquisarOrcamentos = document.getElementById("btnPesquisarOrcamentos");
const avisoOrcamentos = document.getElementById("avisoOrcamentos");
const btnNovoOrcamento = document.getElementById("btnNovoOrcamento");

// ─── Modal: Atribuir / Editar ─────────────────────────────────────
const modalAtribuirOrcamento = document.getElementById("modalAtribuirOrcamento");
const modalAtribuirTitulo = document.getElementById("modalAtribuirTitulo");
const btnFecharModalAtribuir = document.getElementById("btnFecharModalAtribuir");
const btnCancelarModal = document.getElementById("btnCancelarModal");
const formOrcamento = document.getElementById("formOrcamento");
const mensagem = document.getElementById("mensagem");

const orcamentoIdInput = document.getElementById("OrcamentoId");
const clienteOrcamentoInput = document.getElementById("OrcamentoCliente");
const dataOrcamentoInput = document.getElementById("dt_orcamento");
const validadeOrcamentoInput = document.getElementById("dt_validade_orcamento");
const btnSalvar = document.getElementById("btnSalvar");

// ─── Seção de itens (modo edição) ────────────────────────────────
const secaoItens = document.getElementById("secaoItens");
const formItemOrcamento = document.getElementById("formItemOrcamento");
const produtoItemOrcamentoInput = document.getElementById("produtoItemOrcamento");
const quantidadeItemOrcamentoInput = document.getElementById("quantidadeItemOrcamento");
const produtoOriginalItemInput = document.getElementById("produtoOriginalItem");
const btnCancelarItem = document.getElementById("btnCancelarItem");
const btnSalvarItem = document.getElementById("btnSalvarItem");
const tabelaItensEdicao = document.getElementById("tabelaItensEdicao");
const pesquisaItemOrcamentoInput = document.getElementById("pesquisaItemOrcamento");
const btnPesquisarItemOrcamento = document.getElementById("btnPesquisarItemOrcamento");
const avisoItemOrcamento = document.getElementById("avisoItemOrcamento");

// ─── Modal: Ver Itens ─────────────────────────────────────────────
const modalVerItens = document.getElementById("modalVerItens");
const btnFecharModalVerItens = document.getElementById("btnFecharModalVerItens");
const modalVerItensNumero = document.getElementById("modalVerItensNumero");
const tabelaVerItens = document.getElementById("tabelaVerItens");

const DIAS_VALIDADE_ORCAMENTO = 7;

let produtos = [];
let itensOrcamentoCarregados = [];
let listaOrcamentosCarregados = [];
let modoEdicaoOrcamento = null; // null = criar | number = orcamentoid em edição

// ─── Utilities ───────────────────────────────────────────────────

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = "mensagem " + tipo;
}

function mostrarMensagemPrincipal(texto, tipo) {
  mensagemPrincipal.textContent = texto;
  mensagemPrincipal.className = "mensagem " + tipo;
}

function limparMensagemPrincipal() {
  mensagemPrincipal.textContent = "";
  mensagemPrincipal.className = "mensagem";
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

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function preencherDatasAutomaticas() {
  const hoje = new Date();
  const validade = new Date(hoje);
  validade.setDate(hoje.getDate() + DIAS_VALIDADE_ORCAMENTO);
  dataOrcamentoInput.value = formatarDataParaInput(hoje);
  validadeOrcamentoInput.value = formatarDataParaInput(validade);
}

function buscarProduto(produtoId) {
  return produtos.find(function (p) {
    return String(p.produtoid) === String(produtoId);
  });
}

// ─── Main table ───────────────────────────────────────────────────

async function carregarTodosOrcamentos() {
  tabelaListaOrcamentos.innerHTML = `<tr><td colspan="6">Carregando orçamentos...</td></tr>`;

  const { data, error } = await supabaseClient
    .from("orcamento")
    .select(
      "orcamentoid, clienteid, dt_orcamento, dt_validade_orcamento, vl_total_orcamento, cliente(nome_cliente)",
    )
    .order("orcamentoid", { ascending: true });

  if (error) {
    tabelaListaOrcamentos.innerHTML = `<tr><td colspan="6">Erro ao carregar orçamentos.</td></tr>`;
    mostrarMensagemPrincipal(
      "Erro ao carregar orçamentos: " + error.message,
      "erro",
    );
    return;
  }

  listaOrcamentosCarregados = data || [];
  filtrarListaOrcamentos();
}

function renderizarListaOrcamentos(lista) {
  if (lista.length === 0) {
    tabelaListaOrcamentos.innerHTML = `<tr><td colspan="6">Nenhum orçamento encontrado.</td></tr>`;
    return;
  }

  tabelaListaOrcamentos.innerHTML = "";

  lista.forEach(function (orcamento) {
    const nomeCliente = orcamento.cliente
      ? orcamento.cliente.nome_cliente
      : "-";
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td>${orcamento.orcamentoid}</td>
      <td>${nomeCliente}</td>
      <td>${formatarDataParaExibicao(orcamento.dt_orcamento)}</td>
      <td>${formatarDataParaExibicao(orcamento.dt_validade_orcamento)}</td>
      <td>${formatarMoeda(orcamento.vl_total_orcamento)}</td>
      <td></td>
    `;

    const tdAcoes = linha.querySelector("td:last-child");

    const btnVerItens = document.createElement("button");
    btnVerItens.textContent = "Ver itens";
    btnVerItens.className = "btn-editar";
    btnVerItens.type = "button";
    btnVerItens.addEventListener("click", function () {
      abrirModalVerItens(orcamento.orcamentoid);
    });

    const btnEditar = document.createElement("button");
    btnEditar.textContent = "Editar";
    btnEditar.className = "btn-editar";
    btnEditar.type = "button";
    btnEditar.addEventListener("click", function () {
      abrirModalParaEditar(orcamento);
    });

    const btnExcluir = document.createElement("button");
    btnExcluir.textContent = "Excluir";
    btnExcluir.className = "btn-excluir";
    btnExcluir.type = "button";
    btnExcluir.addEventListener("click", function () {
      excluirOrcamento(orcamento.orcamentoid);
    });

    tdAcoes.appendChild(btnVerItens);
    tdAcoes.appendChild(btnEditar);
    tdAcoes.appendChild(btnExcluir);

    tabelaListaOrcamentos.appendChild(linha);
  });
}

function executarPesquisaOrcamentos() {
  const valor = pesquisaOrcamentosInput.value.trim();
  const termo = valor.toLowerCase();
  const ePuramenteNumerico = /^\d+$/.test(valor);

  avisoOrcamentos.classList.remove("visivel");

  if (!valor) {
    renderizarListaOrcamentos(listaOrcamentosCarregados);
    return;
  }

  if (!ePuramenteNumerico && valor.length < 4) {
    avisoOrcamentos.classList.add("visivel");
    return;
  }

  const filtrados = listaOrcamentosCarregados.filter(function (orcamento) {
    const nomeCliente = orcamento.cliente
      ? orcamento.cliente.nome_cliente.toLowerCase()
      : "";
    return (
      String(orcamento.orcamentoid).includes(termo) ||
      nomeCliente.includes(termo)
    );
  });

  renderizarListaOrcamentos(filtrados);
}

function filtrarListaOrcamentos() {
  executarPesquisaOrcamentos();
}

// ─── Modal: Atribuir (criar) ──────────────────────────────────────

function abrirModalAtribuir() {
  modoEdicaoOrcamento = null;
  orcamentoIdInput.value = "";
  clienteOrcamentoInput.value = "";
  preencherDatasAutomaticas();
  mensagem.textContent = "";
  mensagem.className = "mensagem";
  modalAtribuirTitulo.textContent = "Atribuir Orçamento";
  btnSalvar.textContent = "Atribuir orçamento";
  btnSalvar.disabled = true;
  secaoItens.style.display = "none";
  modalAtribuirOrcamento.style.display = "flex";
  document.body.style.overflow = "hidden";
}

// ─── Modal: Editar ────────────────────────────────────────────────

function abrirModalParaEditar(orcamento) {
  modoEdicaoOrcamento = orcamento.orcamentoid;
  orcamentoIdInput.value = orcamento.orcamentoid;
  clienteOrcamentoInput.value = orcamento.clienteid;
  dataOrcamentoInput.value = orcamento.dt_orcamento
    ? orcamento.dt_orcamento.slice(0, 10)
    : "";
  validadeOrcamentoInput.value = orcamento.dt_validade_orcamento
    ? orcamento.dt_validade_orcamento.slice(0, 10)
    : "";
  mensagem.textContent = "";
  mensagem.className = "mensagem";
  modalAtribuirTitulo.textContent = "Editar Orçamento";
  btnSalvar.textContent = "Salvar alterações";
  btnSalvar.disabled = false;
  limparFormularioItem();
  pesquisaItemOrcamentoInput.value = "";
  secaoItens.style.display = "block";
  modalAtribuirOrcamento.style.display = "flex";
  document.body.style.overflow = "hidden";
  carregarItensOrcamento();
}

function fecharModalAtribuir() {
  modalAtribuirOrcamento.style.display = "none";
  document.body.style.overflow = "";
  modoEdicaoOrcamento = null;
  itensOrcamentoCarregados = [];
  carregarTodosOrcamentos();
}

// ─── Itens do orçamento (modo edição) ────────────────────────────

async function carregarItensOrcamento() {
  tabelaItensEdicao.innerHTML = `<tr><td colspan="6">Carregando itens...</td></tr>`;

  const { data, error } = await supabaseClient
    .from("orcamento_item")
    .select(
      "orcamentoid, produtoid, produtodesc, qt_produto, vl_unitario, vl_total",
    )
    .eq("orcamentoid", modoEdicaoOrcamento)
    .order("produtoid", { ascending: true });

  if (error) {
    itensOrcamentoCarregados = [];
    tabelaItensEdicao.innerHTML = `<tr><td colspan="6">Erro ao carregar itens.</td></tr>`;
    mostrarMensagem("Erro ao buscar itens: " + error.message, "erro");
    return;
  }

  if (data.length === 0) {
    itensOrcamentoCarregados = [];
    await atualizarTotalOrcamento(0);
    tabelaItensEdicao.innerHTML = `<tr><td colspan="6">Nenhum item cadastrado para este orçamento.</td></tr>`;
    return;
  }

  const total = data.reduce(function (acc, item) {
    return acc + Number(item.vl_total || 0);
  }, 0);

  await atualizarTotalOrcamento(total);

  itensOrcamentoCarregados = data;
  filtrarItensOrcamento();
}

function renderizarItensOrcamento(itens) {
  if (itens.length === 0) {
    tabelaItensEdicao.innerHTML = `<tr><td colspan="6">Nenhum item encontrado.</td></tr>`;
    return;
  }

  tabelaItensEdicao.innerHTML = "";

  itens.forEach(function (item) {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td>${item.produtoid}</td>
      <td>${item.produtodesc}</td>
      <td>${item.qt_produto}</td>
      <td>${formatarMoeda(item.vl_unitario)}</td>
      <td>${formatarMoeda(item.vl_total)}</td>
      <td></td>
    `;

    const tdAcoes = linha.querySelector("td:last-child");

    const botaoEditar = document.createElement("button");
    botaoEditar.textContent = "Editar";
    botaoEditar.className = "btn-editar";
    botaoEditar.type = "button";
    botaoEditar.addEventListener("click", function () {
      prepararEdicaoItem(item);
    });

    const botaoExcluir = document.createElement("button");
    botaoExcluir.textContent = "Excluir";
    botaoExcluir.className = "btn-excluir";
    botaoExcluir.type = "button";
    botaoExcluir.addEventListener("click", function () {
      excluirItemOrcamento(item);
    });

    tdAcoes.appendChild(botaoEditar);
    tdAcoes.appendChild(botaoExcluir);

    tabelaItensEdicao.appendChild(linha);
  });
}

function executarPesquisaItensOrcamento() {
  const valor = pesquisaItemOrcamentoInput.value.trim();
  const termo = valor.toLowerCase();
  const ePuramenteNumerico = /^\d+$/.test(valor);

  avisoItemOrcamento.classList.remove("visivel");

  if (!valor) {
    renderizarItensOrcamento(itensOrcamentoCarregados);
    return;
  }

  if (!ePuramenteNumerico && valor.length < 4) {
    avisoItemOrcamento.classList.add("visivel");
    return;
  }

  const filtrados = itensOrcamentoCarregados.filter(function (item) {
    return (
      String(item.produtoid).includes(termo) ||
      item.produtodesc.toLowerCase().includes(termo)
    );
  });

  renderizarItensOrcamento(filtrados);
}

function filtrarItensOrcamento() {
  executarPesquisaItensOrcamento();
}

function prepararEdicaoItem(item) {
  produtoOriginalItemInput.value = item.produtoid;
  produtoItemOrcamentoInput.value = item.produtoid;
  quantidadeItemOrcamentoInput.value = item.qt_produto;
  btnSalvarItem.textContent = "Salvar item";
  produtoItemOrcamentoInput.focus();
}

function limparFormularioItem() {
  produtoOriginalItemInput.value = "";
  produtoItemOrcamentoInput.value = "";
  quantidadeItemOrcamentoInput.value = "";
  btnSalvarItem.textContent = "Adicionar item";
}

async function atualizarTotalOrcamento(total) {
  if (!modoEdicaoOrcamento) return;

  const { error } = await supabaseClient
    .from("orcamento")
    .update({ vl_total_orcamento: total })
    .eq("orcamentoid", modoEdicaoOrcamento);

  if (error) {
    mostrarMensagem("Erro ao atualizar total: " + error.message, "erro");
  }
}

async function buscarItemOrcamento(produtoId) {
  const { data, error } = await supabaseClient
    .from("orcamento_item")
    .select("orcamentoid, produtoid, produtodesc, qt_produto, vl_unitario, vl_total")
    .eq("orcamentoid", modoEdicaoOrcamento)
    .eq("produtoid", produtoId)
    .maybeSingle();

  if (error) {
    mostrarMensagem("Erro ao buscar item: " + error.message, "erro");
    return null;
  }

  return data;
}

async function gerarProximoOrcamentoItemId() {
  const { data, error } = await supabaseClient
    .from("orcamento_item")
    .select("orcamentoitemid")
    .order("orcamentoitemid", { ascending: true });

  if (error) {
    mostrarMensagem("Erro ao gerar ID do item: " + error.message, "erro");
    return null;
  }

  let proximoId = 1;
  for (const item of data) {
    if (item.orcamentoitemid === proximoId) {
      proximoId++;
    }
    if (item.orcamentoitemid > proximoId) {
      break;
    }
  }

  return proximoId;
}

async function salvarItemOrcamento(evento) {
  evento.preventDefault();

  const produtoId = produtoItemOrcamentoInput.value;
  const quantidade = Number(quantidadeItemOrcamentoInput.value);
  const produto = buscarProduto(produtoId);

  if (!produto || quantidade <= 0) {
    mostrarMensagem(
      "Selecione um produto e informe uma quantidade válida.",
      "erro",
    );
    return;
  }

  const valorUnitario = Number(produto.vl_venda_produto || 0);
  const item = {
    orcamentoid: modoEdicaoOrcamento,
    produtoid: produto.produtoid,
    produtodesc: produto.ds_produto,
    qt_produto: quantidade,
    vl_unitario: valorUnitario,
    vl_total: quantidade * valorUnitario,
  };

  const produtoOriginalId = produtoOriginalItemInput.value;

  if (produtoOriginalId && String(produtoOriginalId) !== String(produtoId)) {
    await supabaseClient
      .from("orcamento_item")
      .delete()
      .eq("orcamentoid", modoEdicaoOrcamento)
      .eq("produtoid", produtoOriginalId);
  }

  const itemExistente = await buscarItemOrcamento(produtoId);
  let resultado;

  if (itemExistente) {
    resultado = await supabaseClient
      .from("orcamento_item")
      .update({
        produtodesc: item.produtodesc,
        qt_produto: item.qt_produto,
        vl_unitario: item.vl_unitario,
        vl_total: item.vl_total,
      })
      .eq("orcamentoid", item.orcamentoid)
      .eq("produtoid", item.produtoid);
  } else {
    const proximoId = await gerarProximoOrcamentoItemId();
    if (!proximoId) return;

    resultado = await supabaseClient.from("orcamento_item").insert({
      orcamentoitemid: proximoId,
      ...item,
    });
  }

  if (resultado.error) {
    mostrarMensagem(
      "Erro ao salvar item: " + resultado.error.message,
      "erro",
    );
    return;
  }

  limparFormularioItem();
  mostrarMensagem("Item salvo com sucesso!", "sucesso");
  carregarItensOrcamento();
}

async function excluirItemOrcamento(item) {
  const confirmou = confirm("Deseja remover este item do orçamento?");
  if (!confirmou) return;

  const { error } = await supabaseClient
    .from("orcamento_item")
    .delete()
    .eq("orcamentoid", item.orcamentoid)
    .eq("produtoid", item.produtoid);

  if (error) {
    mostrarMensagem("Erro ao excluir item: " + error.message, "erro");
    return;
  }

  limparFormularioItem();
  mostrarMensagem("Item removido com sucesso!", "sucesso");
  carregarItensOrcamento();
}

// ─── Modal: Ver Itens (somente leitura) ───────────────────────────

function abrirModalVerItens(orcamentoId) {
  modalVerItensNumero.textContent = `#${orcamentoId}`;
  tabelaVerItens.innerHTML = `<tr><td colspan="6">Carregando itens...</td></tr>`;
  modalVerItens.style.display = "flex";
  document.body.style.overflow = "hidden";
  carregarItensParaModal(orcamentoId);
}

function fecharModalVerItens() {
  modalVerItens.style.display = "none";
  document.body.style.overflow = "";
}

async function carregarItensParaModal(orcamentoId) {
  let { data, error } = await supabaseClient
    .from("orcamento_item")
    .select(
      "produtoid, produtodesc, obs_produto, qt_produto, vl_unitario, vl_total",
    )
    .eq("orcamentoid", orcamentoId)
    .order("produtoid", { ascending: true });

  if (error) {
    const resultado = await supabaseClient
      .from("orcamento_item")
      .select("produtoid, produtodesc, qt_produto, vl_unitario, vl_total")
      .eq("orcamentoid", orcamentoId)
      .order("produtoid", { ascending: true });

    if (resultado.error) {
      tabelaVerItens.innerHTML = `<tr><td colspan="6">Erro ao carregar itens.</td></tr>`;
      return;
    }

    data = resultado.data;
  }

  if (!data || data.length === 0) {
    tabelaVerItens.innerHTML = `<tr><td colspan="6">Nenhum item cadastrado para este orçamento.</td></tr>`;
    return;
  }

  tabelaVerItens.innerHTML = "";

  data.forEach(function (item) {
    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${item.produtoid}</td>
      <td>${item.produtodesc || "-"}</td>
      <td>${item.obs_produto || "-"}</td>
      <td>${item.qt_produto}</td>
      <td>${formatarMoeda(item.vl_unitario)}</td>
      <td>${formatarMoeda(item.vl_total)}</td>
    `;
    tabelaVerItens.appendChild(linha);
  });
}

// ─── Data ─────────────────────────────────────────────────────────

async function carregarClientesDoSelect() {
  const { data, error } = await supabaseClient
    .from("cliente")
    .select("clienteid, nome_cliente")
    .order("nome_cliente", { ascending: true });

  if (error) {
    mostrarMensagemPrincipal(
      "Erro ao carregar clientes: " + error.message,
      "erro",
    );
    return;
  }

  clienteOrcamentoInput.innerHTML = `<option value="">Selecione</option>`;
  data.forEach(function (cliente) {
    const option = document.createElement("option");
    option.value = cliente.clienteid;
    option.textContent = cliente.nome_cliente;
    clienteOrcamentoInput.appendChild(option);
  });
}

async function carregarProdutosDoSelect() {
  const { data, error } = await supabaseClient
    .from("produto")
    .select("produtoid, ds_produto, vl_venda_produto")
    .order("ds_produto", { ascending: true });

  if (error) {
    mostrarMensagemPrincipal(
      "Erro ao carregar produtos: " + error.message,
      "erro",
    );
    return;
  }

  produtos = data;
  produtoItemOrcamentoInput.innerHTML = `<option value="">Selecione</option>`;
  produtos.forEach(function (produto) {
    const option = document.createElement("option");
    option.value = produto.produtoid;
    option.textContent = produto.ds_produto;
    produtoItemOrcamentoInput.appendChild(option);
  });
}

async function buscarProximoOrcamentoIdDisponivel() {
  const { data, error } = await supabaseClient
    .from("orcamento")
    .select("orcamentoid")
    .order("orcamentoid", { ascending: true });

  if (error) {
    throw error;
  }

  let proximoId = 1;
  for (const orcamento of data) {
    if (orcamento.orcamentoid === proximoId) {
      proximoId++;
    }
    if (orcamento.orcamentoid > proximoId) {
      break;
    }
  }

  return proximoId;
}

// ─── Salvar orçamento (criar ou atualizar) ────────────────────────

async function salvarOrcamento(evento) {
  evento.preventDefault();

  const clienteId = clienteOrcamentoInput.value;
  if (!clienteId) {
    mostrarMensagem("Selecione um cliente.", "erro");
    return;
  }

  btnSalvar.disabled = true;

  if (modoEdicaoOrcamento !== null) {
    const { error } = await supabaseClient
      .from("orcamento")
      .update({
        clienteid: clienteId,
        dt_validade_orcamento: validadeOrcamentoInput.value,
      })
      .eq("orcamentoid", modoEdicaoOrcamento);

    btnSalvar.disabled = false;

    if (error) {
      mostrarMensagem("Erro ao atualizar orçamento: " + error.message, "erro");
      return;
    }

    mostrarMensagem("Orçamento atualizado com sucesso!", "sucesso");
  } else {
    let proximoId;
    try {
      proximoId = await buscarProximoOrcamentoIdDisponivel();
    } catch (error) {
      btnSalvar.disabled = false;
      mostrarMensagem(
        "Erro ao calcular o próximo código: " + error.message,
        "erro",
      );
      return;
    }

    const { error } = await supabaseClient.from("orcamento").insert({
      orcamentoid: proximoId,
      clienteid: clienteId,
      dt_orcamento: dataOrcamentoInput.value,
      dt_validade_orcamento: validadeOrcamentoInput.value,
      vl_total_orcamento: 0,
    });

    btnSalvar.disabled = false;

    if (error) {
      mostrarMensagem("Erro ao criar orçamento: " + error.message, "erro");
      return;
    }

    mostrarMensagem("Orçamento criado com sucesso!", "sucesso");
    setTimeout(fecharModalAtribuir, 800);
  }
}

// ─── Excluir orçamento ────────────────────────────────────────────

async function excluirOrcamento(orcamentoId) {
  const confirmou = confirm(
    "Tem certeza que deseja excluir este orçamento e todos os seus itens?",
  );
  if (!confirmou) return;

  limparMensagemPrincipal();

  const exclusaoItens = await supabaseClient
    .from("orcamento_item")
    .delete()
    .eq("orcamentoid", orcamentoId);

  if (exclusaoItens.error) {
    mostrarMensagemPrincipal(
      "Erro ao excluir itens: " + exclusaoItens.error.message,
      "erro",
    );
    return;
  }

  const exclusaoOrcamento = await supabaseClient
    .from("orcamento")
    .delete()
    .eq("orcamentoid", orcamentoId);

  if (exclusaoOrcamento.error) {
    mostrarMensagemPrincipal(
      "Erro ao excluir orçamento: " + exclusaoOrcamento.error.message,
      "erro",
    );
    return;
  }

  mostrarMensagemPrincipal("Orçamento excluído com sucesso!", "sucesso");
  carregarTodosOrcamentos();
}

// ─── Event listeners ──────────────────────────────────────────────

btnNovoOrcamento.addEventListener("click", abrirModalAtribuir);
btnCancelarModal.addEventListener("click", fecharModalAtribuir);
btnFecharModalAtribuir.addEventListener("click", fecharModalAtribuir);
btnFecharModalVerItens.addEventListener("click", fecharModalVerItens);
formItemOrcamento.addEventListener("submit", salvarItemOrcamento);
btnCancelarItem.addEventListener("click", limparFormularioItem);
btnPesquisarOrcamentos.addEventListener("click", executarPesquisaOrcamentos);

pesquisaOrcamentosInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") executarPesquisaOrcamentos();
});

pesquisaOrcamentosInput.addEventListener("input", function () {
  if (pesquisaOrcamentosInput.value.trim() === "") {
    avisoOrcamentos.classList.remove("visivel");
    renderizarListaOrcamentos(listaOrcamentosCarregados);
  }
});

btnPesquisarItemOrcamento.addEventListener("click", executarPesquisaItensOrcamento);

pesquisaItemOrcamentoInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") executarPesquisaItensOrcamento();
});

pesquisaItemOrcamentoInput.addEventListener("input", function () {
  if (pesquisaItemOrcamentoInput.value.trim() === "") {
    avisoItemOrcamento.classList.remove("visivel");
    renderizarItensOrcamento(itensOrcamentoCarregados);
  }
});
formOrcamento.addEventListener("submit", salvarOrcamento);

clienteOrcamentoInput.addEventListener("change", function () {
  if (modoEdicaoOrcamento === null) {
    btnSalvar.disabled = !clienteOrcamentoInput.value;
  }
});

modalAtribuirOrcamento.addEventListener("click", function (e) {
  if (e.target === modalAtribuirOrcamento) {
    fecharModalAtribuir();
  }
});

modalVerItens.addEventListener("click", function (e) {
  if (e.target === modalVerItens) {
    fecharModalVerItens();
  }
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    if (modalVerItens.style.display !== "none") {
      fecharModalVerItens();
    } else if (modalAtribuirOrcamento.style.display !== "none") {
      fecharModalAtribuir();
    }
  }
});

// ─── Init ─────────────────────────────────────────────────────────

carregarClientesDoSelect();
carregarProdutosDoSelect();
carregarTodosOrcamentos();
