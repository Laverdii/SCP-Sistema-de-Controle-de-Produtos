const SUPABASE_URL = "https://ouuwgxztehzshrtjdehb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2tOQkWcuI6Xd06OEEG9D1w_Esm6_e9j";

/*
  Cria o cliente de conexão com o Supabase.

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

const formCliente = document.getElementById("formCliente");
const tabelaClientes = document.getElementById("tabelaClientes");
const mensagem = document.getElementById("mensagem");

const clienteIdInput = document.getElementById("clienteId");
const tipoClienteInput = document.getElementById("tipoCliente");
const cpfCnpjClienteInput = document.getElementById("cpfCnpjCliente");
const nomeClienteInput = document.getElementById("nomeCliente");

const btnSalvar = document.getElementById("btnSalvar");
const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");

/*
  ============================================
  FUNÇÃO PARA MOSTRAR MENSAGEM NA TELA
  ============================================

  Essa função recebe:
  - texto: mensagem que será exibida.
  - tipo: classe CSS aplicada na mensagem.

  Exemplo:
  mostrarMensagem("Cliente salvo com sucesso!", "sucesso");
  mostrarMensagem("Erro ao salvar cliente.", "erro");
*/

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = "mensagem " + tipo;
}

/*
  ============================================
  FUNÇÃO PARA FORMATAR O TIPO DO CLIENTE
  ============================================

  No banco, o tipo é salvo como:
  F = Pessoa Física
  J = Pessoa Jurídica

  Essa função transforma o valor salvo no banco em um texto amigável.
*/

function formatarTipoCliente(tipoCliente) {
  if (tipoCliente === "F") {
    return "Pessoa Física";
  }

  if (tipoCliente === "J") {
    return "Pessoa Jurídica";
  }

  return "Não informado";
}

/*
  ============================================
  FORMATAÇÃO DE CPF E CNPJ
  ============================================
*/

function formatarCPF(valor) {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);
  if (numeros.length <= 3) return numeros;
  if (numeros.length <= 6) return numeros.slice(0, 3) + "." + numeros.slice(3);
  if (numeros.length <= 9)
    return (
      numeros.slice(0, 3) + "." + numeros.slice(3, 6) + "." + numeros.slice(6)
    );
  return (
    numeros.slice(0, 3) +
    "." +
    numeros.slice(3, 6) +
    "." +
    numeros.slice(6, 9) +
    "-" +
    numeros.slice(9)
  );
}

function formatarCNPJ(valor) {
  const numeros = valor.replace(/\D/g, "").slice(0, 14);
  if (numeros.length <= 2) return numeros;
  if (numeros.length <= 5) return numeros.slice(0, 2) + "." + numeros.slice(2);
  if (numeros.length <= 8)
    return (
      numeros.slice(0, 2) + "." + numeros.slice(2, 5) + "." + numeros.slice(5)
    );
  if (numeros.length <= 12)
    return (
      numeros.slice(0, 2) +
      "." +
      numeros.slice(2, 5) +
      "." +
      numeros.slice(5, 8) +
      "/" +
      numeros.slice(8)
    );
  return (
    numeros.slice(0, 2) +
    "." +
    numeros.slice(2, 5) +
    "." +
    numeros.slice(5, 8) +
    "/" +
    numeros.slice(8, 12) +
    "-" +
    numeros.slice(12)
  );
}

function aplicarMascaraCpfCnpj() {
  const tipo = tipoClienteInput.value;
  if (tipo === "F") {
    cpfCnpjClienteInput.value = formatarCPF(cpfCnpjClienteInput.value);
  } else if (tipo === "J") {
    cpfCnpjClienteInput.value = formatarCNPJ(cpfCnpjClienteInput.value);
  }
}

function atualizarPlaceholderCpfCnpj() {
  if (tipoClienteInput.value === "F") {
    cpfCnpjClienteInput.placeholder = "000.000.000-00";
  } else if (tipoClienteInput.value === "J") {
    cpfCnpjClienteInput.placeholder = "00.000.000/0000-00";
  } else {
    cpfCnpjClienteInput.placeholder = "Digite o CPF ou CNPJ";
  }
}

/*
  ============================================
  VERIFICAÇÃO DE CPF/CNPJ DUPLICADO
  ============================================

  Busca no banco se já existe outro cliente com o mesmo CPF/CNPJ.
  O parâmetro clienteIdAtual é passado durante edição para excluir
  o próprio cliente da verificação.
*/

async function verificarCpfCnpjDuplicado(cpfCnpj, clienteIdAtual) {
  let query = supabaseClient
    .from("cliente")
    .select("clienteid")
    .eq("cpf_cnpj_cliente", cpfCnpj);

  if (clienteIdAtual) {
    query = query.neq("clienteid", clienteIdAtual);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data.length > 0;
}

/*
  ============================================
  ALGORITMO DE VALIDAÇÃO DE CPF
  ============================================

  O CPF tem 11 dígitos. Os dois últimos são dígitos verificadores
  calculados a partir dos 9 primeiros. O algoritmo:

  1ª verificação — multiplica os 9 primeiros dígitos pelos pesos
  10, 9, 8 ... 2, soma os resultados e calcula o resto da divisão
  por 11. Se o resto for < 2, o dígito verificador é 0; caso
  contrário é 11 - resto. O resultado deve bater com o 10º dígito.

  2ª verificação — repete o processo com os 10 primeiros dígitos
  e pesos 11, 10, 9 ... 2. O resultado deve bater com o 11º dígito.

  CPFs com todos os dígitos iguais (ex: 111.111.111-11) passam
  matematicamente mas são inválidos — rejeitamos antes de calcular.
*/

function cpfEhValido(cpf) {
  const n = cpf.replace(/\D/g, "");

  if (/^(\d)\1{10}$/.test(n)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(n[i]) * (10 - i);
  let resto = soma % 11;
  const digito1 = resto < 2 ? 0 : 11 - resto;
  if (digito1 !== parseInt(n[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(n[i]) * (11 - i);
  resto = soma % 11;
  const digito2 = resto < 2 ? 0 : 11 - resto;
  return digito2 === parseInt(n[10]);
}

/*
  ============================================
  ALGORITMO DE VALIDAÇÃO DE CNPJ
  ============================================

  O CNPJ tem 14 dígitos. Os dois últimos são dígitos verificadores.

  1ª verificação — multiplica os 12 primeiros dígitos pelos pesos
  5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2. O cálculo do dígito segue
  a mesma lógica do CPF (resto < 2 → 0, senão 11 - resto).
  O resultado deve bater com o 13º dígito.

  2ª verificação — repete com os 13 primeiros e pesos
  6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2.
  O resultado deve bater com o 14º dígito.
*/

function cnpjEhValido(cnpj) {
  const n = cnpj.replace(/\D/g, "");

  if (/^(\d)\1{13}$/.test(n)) return false;

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let soma = 0;
  for (let i = 0; i < 12; i++) soma += parseInt(n[i]) * pesos1[i];
  let resto = soma % 11;
  const digito1 = resto < 2 ? 0 : 11 - resto;
  if (digito1 !== parseInt(n[12])) return false;

  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  soma = 0;
  for (let i = 0; i < 13; i++) soma += parseInt(n[i]) * pesos2[i];
  resto = soma % 11;
  const digito2 = resto < 2 ? 0 : 11 - resto;
  return digito2 === parseInt(n[13]);
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

async function buscarProximoClienteIdDisponivel() {
  const { data, error } = await supabaseClient
    .from("cliente")
    .select("clienteid")
    .order("clienteid", { ascending: true });

  if (error) {
    throw error;
  }

  let proximoId = 1;

  for (const cliente of data) {
    if (cliente.clienteid === proximoId) {
      proximoId++;
    }

    if (cliente.clienteid > proximoId) {
      break;
    }
  }

  return proximoId;
}

/*
  ============================================
  CARREGAR CLIENTES
  ============================================

  Essa função busca os clientes no Supabase e monta as linhas da tabela.

  Observação importante:
  A tabela foi criada assim:

  CREATE TABLE CLIENTE (...)

  Como não foram usadas aspas no nome da tabela,
  no PostgreSQL o nome normalmente fica em minúsculo: cliente.

  Por isso usamos:
  .from("cliente")
*/

async function carregarClientes() {
  /*
    Faz um SELECT na tabela cliente.

    Estamos buscando as colunas:
    - clienteid
    - tipo_cliente
    - cpf_cnpj_cliente
    - nome_cliente

    E ordenando pelo clienteid em ordem crescente.
  */
  const { data, error } = await supabaseClient
    .from("cliente")
    .select("clienteid, tipo_cliente, cpf_cnpj_cliente, nome_cliente")
    .order("clienteid", { ascending: true });

  /*
    Se der erro na consulta, mostramos uma mensagem na tabela
    e também uma mensagem de erro acima da listagem.
  */
  if (error) {
    tabelaClientes.innerHTML = `
      <tr>
        <td colspan="5">Erro ao carregar clientes.</td>
      </tr>
    `;

    mostrarMensagem("Erro ao buscar clientes: " + error.message, "erro");
    return;
  }

  /*
    Se a consulta funcionar, mas não houver nenhum cliente,
    mostramos uma mensagem dizendo que não há registros.
  */
  if (data.length === 0) {
    tabelaClientes.innerHTML = `
      <tr>
        <td colspan="5">Nenhum cliente cadastrado.</td>
      </tr>
    `;
    return;
  }

  /*
    Limpamos o corpo da tabela antes de preencher.
    Isso evita duplicar linhas quando recarregamos os clientes.
  */
  tabelaClientes.innerHTML = "";

  /*
    Percorremos a lista de clientes retornada pelo Supabase.

    Para cada cliente, criamos uma linha <tr>.
  */
  data.forEach(function (cliente) {
    const linha = document.createElement("tr");

    /*
      Criamos as colunas principais da linha.

      A última coluna recebe a classe "coluna-acoes".
      Nessa coluna colocaremos os botões Editar e Excluir.
    */
    linha.innerHTML = `
      <td>${cliente.clienteid}</td>
      <td>${formatarTipoCliente(cliente.tipo_cliente)}</td>
      <td>${cliente.cpf_cnpj_cliente}</td>
      <td>${cliente.nome_cliente}</td>
      <td class="coluna-acoes"></td>
    `;

    /*
      ============================================
      BOTÃO EDITAR
      ============================================
    */

    const botaoEditar = document.createElement("button");

    botaoEditar.textContent = "Editar";
    botaoEditar.className = "btn-editar";
    botaoEditar.type = "button";

    /*
      Quando clicar no botão Editar,
      chamamos a função prepararEdicao
      passando o cliente da linha atual.
    */
    botaoEditar.addEventListener("click", function () {
      prepararEdicao(cliente);
    });

    /*
      ============================================
      BOTÃO EXCLUIR
      ============================================
    */

    const botaoExcluir = document.createElement("button");

    botaoExcluir.textContent = "Excluir";
    botaoExcluir.className = "btn-excluir";
    botaoExcluir.type = "button";

    /*
      Quando clicar no botão Excluir,
      chamamos a função excluirCliente
      passando o cliente da linha atual.
    */
    botaoExcluir.addEventListener("click", function () {
      excluirCliente(cliente);
    });

    /*
      Adicionamos os botões dentro da coluna Ações.
    */
    linha.querySelector(".coluna-acoes").appendChild(botaoEditar);
    linha.querySelector(".coluna-acoes").appendChild(botaoExcluir);

    /*
      Adicionamos a linha pronta dentro do tbody da tabela.
    */
    tabelaClientes.appendChild(linha);
  });
}

/*
  ============================================
  PREPARAR EDIÇÃO
  ============================================

  Essa função é chamada quando o usuário clica no botão Editar.

  Ela pega os dados do cliente selecionado e joga para dentro do formulário.
*/

function prepararEdicao(cliente) {
  /*
    Preenche o campo código.
    Esse campo é importante porque usaremos o ID para saber qual cliente atualizar.
  */
  clienteIdInput.value = cliente.clienteid;

  /*
    Preenche os demais campos com os dados do cliente.
  */
  tipoClienteInput.value = cliente.tipo_cliente;
  cpfCnpjClienteInput.value = cliente.cpf_cnpj_cliente;
  nomeClienteInput.value = cliente.nome_cliente;

  atualizarPlaceholderCpfCnpj();
  aplicarMascaraCpfCnpj();

  tipoClienteInput.disabled = false;
  cpfCnpjClienteInput.readOnly = false;

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
  mostrarMensagem("Editando o cliente: " + cliente.nome_cliente, "sucesso");
}

/*
  ============================================
  CANCELAR EDIÇÃO
  ============================================

  Essa função limpa o formulário e volta para o modo de cadastro.
*/

function cancelarEdicao() {
  /*
    Limpa os campos do formulário.
  */
  formCliente.reset();

  /*
    Garante que o ID fique vazio.
    Se o ID estiver vazio, o sistema entende que é um novo cadastro.
  */
  clienteIdInput.value = "";

  /*
    Libera os campos que estavam bloqueados durante a edição.
  */
  tipoClienteInput.disabled = false;
  cpfCnpjClienteInput.readOnly = false;

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
  SALVAR CLIENTE
  ============================================

  Essa função cadastra um novo cliente no Supabase.

  Ela será chamada quando o campo clienteId estiver vazio.
*/

async function salvarCliente() {
  /*
    Pegamos os valores digitados no formulário.
  */
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

  let proximoClienteId;

  try {
    proximoClienteId = await buscarProximoClienteIdDisponivel();
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
  const novoCliente = {
    clienteid: proximoClienteId,
    tipo_cliente: tipoCliente,
    cpf_cnpj_cliente: cpfCnpjCliente,
    nome_cliente: nomeCliente,
  };

  /*
    Insere o novo cliente na tabela cliente.
  */
  const { error } = await supabaseClient.from("cliente").insert(novoCliente);

  /*
    Se houver erro, mostramos a mensagem e paramos a função.
  */
  if (error) {
    mostrarMensagem("Erro ao salvar cliente: " + error.message, "erro");
    return;
  }

  /*
    Se deu certo, mostramos mensagem de sucesso.
  */
  mostrarMensagem("Cliente salvo com sucesso!", "sucesso");

  /*
    Limpamos o formulário.
  */
  formCliente.reset();

  /*
    Recarregamos a listagem para mostrar o novo cliente na tabela.
  */
  carregarClientes();
}

/*
  ============================================
  ATUALIZAR NOME DO CLIENTE
  ============================================

  Essa função atualiza apenas o nome do cliente.

  Ela será chamada quando o campo clienteId estiver preenchido.
*/

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

  cancelarEdicao();
  mostrarMensagem("Cliente atualizado com sucesso!", "sucesso");
  carregarClientes();
}

/*
  ============================================
  EXCLUIR CLIENTE
  ============================================

  Essa função exclui um cliente do Supabase.

  Ela recebe o objeto cliente inteiro para poder usar:
  - cliente.clienteid
  - cliente.nome_cliente
*/

async function excluirCliente(cliente) {
  /*
    Antes de excluir, pedimos confirmação.

    O confirm retorna:
    - true se o usuário clicar em OK;
    - false se o usuário clicar em Cancelar.
  */
  const confirmou = confirm(
    "Tem certeza que deseja excluir o cliente " + cliente.nome_cliente + "?",
  );

  /*
    Se o usuário cancelar, paramos a função.
  */
  if (!confirmou) {
    return;
  }

  /*
    Executa o DELETE na tabela cliente.

    O filtro .eq("clienteid", cliente.clienteid) garante que apenas
    o cliente selecionado será excluído.
  */
  const { error } = await supabaseClient
    .from("cliente")
    .delete()
    .eq("clienteid", cliente.clienteid);

  /*
    Se houver erro, mostramos uma mensagem.
  */
  if (error) {
    mostrarMensagem("Erro ao excluir cliente: " + error.message, "erro");
    return;
  }

  /*
    Se o cliente excluído era o mesmo que estava sendo editado,
    cancelamos a edição para limpar o formulário.
  */
  if (clienteIdInput.value == cliente.clienteid) {
    cancelarEdicao();
  }

  /*
    Mostra mensagem de sucesso.
  */
  mostrarMensagem("Cliente excluído com sucesso!", "sucesso");

  /*
    Recarrega a tabela para remover visualmente o cliente excluído.
  */
  carregarClientes();
}

/*
  ============================================
  EVENTO DE ENVIO DO FORMULÁRIO
  ============================================

  Este evento acontece quando o usuário clica em Salvar ou Atualizar.
*/

formCliente.addEventListener("submit", async function (evento) {
  /*
    Impede a página de recarregar ao enviar o formulário.
  */
  evento.preventDefault();

  /*
    Verificamos se o campo clienteId está preenchido.

    Se estiver vazio:
    - é um cadastro novo.

    Se estiver preenchido:
    - é uma edição.
  */
  const estaEditando = clienteIdInput.value !== "";

  if (estaEditando) {
    await atualizarNomeCliente();
  } else {
    await salvarCliente();
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

/*
  ============================================
  MÁSCARA AUTOMÁTICA DE CPF / CNPJ
  ============================================

  Quando o tipo muda, limpa o campo e atualiza o placeholder.
  Quando o usuário digita, aplica a máscara em tempo real.
*/

tipoClienteInput.addEventListener("change", function () {
  cpfCnpjClienteInput.value = "";
  atualizarPlaceholderCpfCnpj();
});

cpfCnpjClienteInput.addEventListener("input", aplicarMascaraCpfCnpj);

/*
  ============================================
  CARREGAMENTO INICIAL DA PÁGINA
  ============================================

  Assim que o arquivo JavaScript é carregado,
  buscamos os clientes no Supabase.
*/

carregarClientes();
