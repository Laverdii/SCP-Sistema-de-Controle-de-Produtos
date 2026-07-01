const SUPABASE_URL = "https://ouuwgxztehzshrtjdehb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2tOQkWcuI6Xd06OEEG9D1w_Esm6_e9j";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Main page ────────────────────────────────────────────────────
const mensagemPrincipal = document.getElementById("mensagemPrincipal");
const tabelaClientes = document.getElementById("tabelaClientes");
const pesquisaClienteInput = document.getElementById("pesquisaCliente");
const btnPesquisarCliente = document.getElementById("btnPesquisarCliente");
const avisoCliente = document.getElementById("avisoCliente");
const btnNovoCliente = document.getElementById("btnNovoCliente");

// ─── Modal ────────────────────────────────────────────────────────
const modalCliente = document.getElementById("modalCliente");
const modalClienteTitulo = document.getElementById("modalClienteTitulo");
const btnFecharModalCliente = document.getElementById("btnFecharModalCliente");
const btnCancelarModal = document.getElementById("btnCancelarModal");
const formCliente = document.getElementById("formCliente");
const mensagem = document.getElementById("mensagem");

const clienteIdInput = document.getElementById("clienteId");
const tipoClienteInput = document.getElementById("tipoCliente");
const cpfCnpjClienteInput = document.getElementById("cpfCnpjCliente");
const nomeClienteInput = document.getElementById("nomeCliente");
const btnSalvar = document.getElementById("btnSalvar");

let clientesCarregados = [];

// ─── Utilities ───────────────────────────────────────────────────

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = "mensagem " + tipo;
}

function mostrarMensagemPrincipal(texto, tipo) {
  mensagemPrincipal.textContent = texto;
  mensagemPrincipal.className = "mensagem " + tipo;
}

function formatarTipoCliente(tipoCliente) {
  if (tipoCliente === "F") return "Pessoa Física";
  if (tipoCliente === "J") return "Pessoa Jurídica";
  return "Não informado";
}

function formatarCPF(valor) {
  const n = valor.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 3) return n;
  if (n.length <= 6) return n.slice(0, 3) + "." + n.slice(3);
  if (n.length <= 9)
    return n.slice(0, 3) + "." + n.slice(3, 6) + "." + n.slice(6);
  return (
    n.slice(0, 3) + "." + n.slice(3, 6) + "." + n.slice(6, 9) + "-" + n.slice(9)
  );
}

function formatarCNPJ(valor) {
  const n = valor.replace(/\D/g, "").slice(0, 14);
  if (n.length <= 2) return n;
  if (n.length <= 5) return n.slice(0, 2) + "." + n.slice(2);
  if (n.length <= 8)
    return n.slice(0, 2) + "." + n.slice(2, 5) + "." + n.slice(5);
  if (n.length <= 12)
    return (
      n.slice(0, 2) +
      "." +
      n.slice(2, 5) +
      "." +
      n.slice(5, 8) +
      "/" +
      n.slice(8)
    );
  return (
    n.slice(0, 2) +
    "." +
    n.slice(2, 5) +
    "." +
    n.slice(5, 8) +
    "/" +
    n.slice(8, 12) +
    "-" +
    n.slice(12)
  );
}

function aplicarMascaraCpfCnpj() {
  const tipo = tipoClienteInput.value;
  if (tipo === "F")
    cpfCnpjClienteInput.value = formatarCPF(cpfCnpjClienteInput.value);
  else if (tipo === "J")
    cpfCnpjClienteInput.value = formatarCNPJ(cpfCnpjClienteInput.value);
}

function atualizarPlaceholderCpfCnpj() {
  if (tipoClienteInput.value === "F")
    cpfCnpjClienteInput.placeholder = "000.000.000-00";
  else if (tipoClienteInput.value === "J")
    cpfCnpjClienteInput.placeholder = "00.000.000/0000-00";
  else cpfCnpjClienteInput.placeholder = "Digite o CPF ou CNPJ";
}

function cpfEhValido(cpf) {
  const n = cpf.replace(/\D/g, "");
  if (/^(\d)\1{10}$/.test(n)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(n[i]) * (10 - i);
  let resto = soma % 11;
  const d1 = resto < 2 ? 0 : 11 - resto;
  if (d1 !== parseInt(n[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(n[i]) * (11 - i);
  resto = soma % 11;
  const d2 = resto < 2 ? 0 : 11 - resto;
  return d2 === parseInt(n[10]);
}

function cnpjEhValido(cnpj) {
  const n = cnpj.replace(/\D/g, "");
  if (/^(\d)\1{13}$/.test(n)) return false;
  const p1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let soma = 0;
  for (let i = 0; i < 12; i++) soma += parseInt(n[i]) * p1[i];
  let resto = soma % 11;
  const d1 = resto < 2 ? 0 : 11 - resto;
  if (d1 !== parseInt(n[12])) return false;
  const p2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  soma = 0;
  for (let i = 0; i < 13; i++) soma += parseInt(n[i]) * p2[i];
  resto = soma % 11;
  const d2 = resto < 2 ? 0 : 11 - resto;
  return d2 === parseInt(n[13]);
}

function validarDigitosCpfCnpj(tipoCliente, cpfCnpj) {
  const digitos = cpfCnpj.replace(/\D/g, "");
  if (tipoCliente === "F") {
    if (digitos.length !== 11)
      return "CPF inválido. O CPF deve ter 11 dígitos.";
    if (!cpfEhValido(cpfCnpj))
      return "CPF inválido. Os dígitos verificadores não conferem.";
  }
  if (tipoCliente === "J") {
    if (digitos.length !== 14)
      return "CNPJ inválido. O CNPJ deve ter 14 dígitos.";
    if (!cnpjEhValido(cpfCnpj))
      return "CNPJ inválido. Os dígitos verificadores não conferem.";
  }
  return null;
}

async function verificarCpfCnpjDuplicado(cpfCnpj, clienteIdAtual) {
  let query = supabaseClient
    .from("cliente")
    .select("clienteid")
    .eq("cpf_cnpj_cliente", cpfCnpj);
  if (clienteIdAtual) query = query.neq("clienteid", clienteIdAtual);
  const { data, error } = await query;
  if (error) throw error;
  return data.length > 0;
}

// ─── Main table ───────────────────────────────────────────────────

function renderizarClientes(clientes) {
  if (clientes.length === 0) {
    tabelaClientes.innerHTML = `<tr><td colspan="5">Nenhum cliente encontrado.</td></tr>`;
    return;
  }

  tabelaClientes.innerHTML = "";

  clientes.forEach(function (cliente) {
    const linha = document.createElement("tr");
    linha.className = "linha-clicavel";

    linha.innerHTML = `
      <td>${cliente.clienteid}</td>
      <td>${formatarTipoCliente(cliente.tipo_cliente)}</td>
      <td>${cliente.cpf_cnpj_cliente}</td>
      <td>${cliente.nome_cliente}</td>
      <td class="coluna-acoes"></td>
    `;

    const botaoEditar = document.createElement("button");
    botaoEditar.textContent = "Editar";
    botaoEditar.className = "btn-editar";
    botaoEditar.type = "button";
    botaoEditar.addEventListener("click", function () {
      prepararEdicao(cliente);
    });

    const botaoExcluir = document.createElement("button");
    botaoExcluir.textContent = "Excluir";
    botaoExcluir.className = "btn-excluir";
    botaoExcluir.type = "button";
    botaoExcluir.addEventListener("click", function () {
      excluirCliente(cliente);
    });

    linha.querySelector(".coluna-acoes").appendChild(botaoEditar);
    linha.querySelector(".coluna-acoes").appendChild(botaoExcluir);

    tabelaClientes.appendChild(linha);
  });
}

function executarPesquisaClientes() {
  const valor = pesquisaClienteInput.value.trim();
  const termo = valor.toLowerCase();
  const ePuramenteNumerico = /^\d+$/.test(valor);

  avisoCliente.classList.remove("visivel");

  if (!valor) {
    renderizarClientes(clientesCarregados);
    return;
  }

  if (!ePuramenteNumerico && valor.length < 4) {
    avisoCliente.classList.add("visivel");
    return;
  }

  const filtrados = clientesCarregados.filter(function (cliente) {
    return (
      cliente.nome_cliente.toLowerCase().includes(termo) ||
      String(cliente.clienteid).includes(termo)
    );
  });

  renderizarClientes(filtrados);
}

async function carregarClientes() {
  const { data, error } = await supabaseClient
    .from("cliente")
    .select("clienteid, tipo_cliente, cpf_cnpj_cliente, nome_cliente")
    .order("clienteid", { ascending: true });

  if (error) {
    tabelaClientes.innerHTML = `<tr><td colspan="5">Erro ao carregar clientes.</td></tr>`;
    mostrarMensagemPrincipal(
      "Erro ao buscar clientes: " + error.message,
      "erro",
    );
    return;
  }

  if (data.length === 0) {
    clientesCarregados = [];
    tabelaClientes.innerHTML = `<tr><td colspan="5">Nenhum cliente cadastrado.</td></tr>`;
    return;
  }

  clientesCarregados = data;
  executarPesquisaClientes();
}

// ─── Modal ────────────────────────────────────────────────────────

function abrirModalCliente() {
  clienteIdInput.value = "";
  formCliente.reset();
  mensagem.textContent = "";
  mensagem.className = "mensagem";
  modalClienteTitulo.textContent = "Novo Cliente";
  btnSalvar.textContent = "Salvar";
  atualizarPlaceholderCpfCnpj();
  modalCliente.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function fecharModalCliente() {
  modalCliente.style.display = "none";
  document.body.style.overflow = "";
  carregarClientes();
}

// ─── CRUD ─────────────────────────────────────────────────────────

function prepararEdicao(cliente) {
  clienteIdInput.value = cliente.clienteid;
  tipoClienteInput.value = cliente.tipo_cliente;
  cpfCnpjClienteInput.value = cliente.cpf_cnpj_cliente;
  nomeClienteInput.value = cliente.nome_cliente;
  atualizarPlaceholderCpfCnpj();
  aplicarMascaraCpfCnpj();
  mensagem.textContent = "";
  mensagem.className = "mensagem";
  modalClienteTitulo.textContent = "Editar Cliente";
  btnSalvar.textContent = "Atualizar";
  modalCliente.style.display = "flex";
  document.body.style.overflow = "hidden";
}

async function salvarCliente() {
  const tipoCliente = tipoClienteInput.value;
  const cpfCnpjCliente = cpfCnpjClienteInput.value;
  const nomeCliente = nomeClienteInput.value;

  const erroCpfCnpj = validarDigitosCpfCnpj(tipoCliente, cpfCnpjCliente);
  if (erroCpfCnpj) {
    mostrarMensagem(erroCpfCnpj, "erro");
    return;
  }

  let cpfCnpjDuplicado;
  try {
    cpfCnpjDuplicado = await verificarCpfCnpjDuplicado(cpfCnpjCliente, null);
  } catch (error) {
    mostrarMensagem("Erro ao verificar CPF/CNPJ: " + error.message, "erro");
    return;
  }

  if (cpfCnpjDuplicado) {
    mostrarMensagem("CPF/CNPJ já cadastrado para outro cliente.", "erro");
    return;
  }

  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  const { error } = await supabaseClient.from("cliente").insert({
    tipo_cliente: tipoCliente,
    cpf_cnpj_cliente: cpfCnpjCliente,
    nome_cliente: nomeCliente,
    auth_user_id: user.id,
  });

  if (error) {
    mostrarMensagem("Erro ao salvar cliente: " + error.message, "erro");
    return;
  }

  mostrarMensagem("Cliente salvo com sucesso!", "sucesso");
  setTimeout(fecharModalCliente, 800);
}

async function atualizarNomeCliente() {
  const clienteId = clienteIdInput.value;
  const tipoCliente = tipoClienteInput.value;
  const cpfCnpjCliente = cpfCnpjClienteInput.value;
  const nomeCliente = nomeClienteInput.value;

  const erroCpfCnpj = validarDigitosCpfCnpj(tipoCliente, cpfCnpjCliente);
  if (erroCpfCnpj) {
    mostrarMensagem(erroCpfCnpj, "erro");
    return;
  }

  let cpfCnpjDuplicado;
  try {
    cpfCnpjDuplicado = await verificarCpfCnpjDuplicado(
      cpfCnpjCliente,
      clienteId,
    );
  } catch (error) {
    mostrarMensagem("Erro ao verificar CPF/CNPJ: " + error.message, "erro");
    return;
  }

  if (cpfCnpjDuplicado) {
    mostrarMensagem("CPF/CNPJ já cadastrado para outro cliente.", "erro");
    return;
  }

  const { error } = await supabaseClient
    .from("cliente")
    .update({
      tipo_cliente: tipoCliente,
      cpf_cnpj_cliente: cpfCnpjCliente,
      nome_cliente: nomeCliente,
    })
    .eq("clienteid", clienteId);

  if (error) {
    mostrarMensagem("Erro ao atualizar cliente: " + error.message, "erro");
    return;
  }

  mostrarMensagem("Cliente atualizado com sucesso!", "sucesso");
  setTimeout(fecharModalCliente, 800);
}

async function excluirCliente(cliente) {
  const confirmou = confirm(
    "Tem certeza que deseja excluir o cliente " + cliente.nome_cliente + "?",
  );
  if (!confirmou) return;

  const { error } = await supabaseClient
    .from("cliente")
    .delete()
    .eq("clienteid", cliente.clienteid);

  if (error) {
    mostrarMensagemPrincipal(
      "Erro ao excluir cliente: " + error.message,
      "erro",
    );
    return;
  }

  mostrarMensagemPrincipal("Cliente excluído com sucesso!", "sucesso");
  carregarClientes();
}

// ─── Event listeners ──────────────────────────────────────────────

formCliente.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  if (clienteIdInput.value !== "") {
    await atualizarNomeCliente();
  } else {
    await salvarCliente();
  }
});

btnNovoCliente.addEventListener("click", abrirModalCliente);
btnCancelarModal.addEventListener("click", fecharModalCliente);
btnFecharModalCliente.addEventListener("click", fecharModalCliente);

modalCliente.addEventListener("click", function (e) {
  if (e.target === modalCliente) fecharModalCliente();
});

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && modalCliente.style.display !== "none") {
    fecharModalCliente();
  }
});

tipoClienteInput.addEventListener("change", function () {
  cpfCnpjClienteInput.value = "";
  atualizarPlaceholderCpfCnpj();
});

cpfCnpjClienteInput.addEventListener("input", aplicarMascaraCpfCnpj);

btnPesquisarCliente.addEventListener("click", executarPesquisaClientes);

pesquisaClienteInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") executarPesquisaClientes();
});

pesquisaClienteInput.addEventListener("input", function () {
  if (pesquisaClienteInput.value.trim() === "") {
    avisoCliente.classList.remove("visivel");
    renderizarClientes(clientesCarregados);
  }
});

// ─── Init ─────────────────────────────────────────────────────────

carregarClientes();
