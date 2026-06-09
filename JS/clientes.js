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

  /*
    Neste exemplo, vamos permitir editar apenas o nome.

    Por isso:
    - bloqueamos o tipo;
    - bloqueamos o CPF/CNPJ.
  */
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
  /*
    Pegamos o ID do cliente que está sendo editado.
  */
  const clienteId = clienteIdInput.value;

  /*
    Pegamos o novo nome digitado.
  */
  const nomeCliente = nomeClienteInput.value;

  /*
    Atualizamos somente a coluna nome_cliente.

    O filtro .eq("clienteid", clienteId) é essencial.
    Ele informa qual registro será atualizado.
  */
  const { error } = await supabaseClient
    .from("cliente")
    .update({
      nome_cliente: nomeCliente,
    })
    .eq("clienteid", clienteId);

  /*
    Se houver erro, mostramos a mensagem e paramos.
  */
  if (error) {
    mostrarMensagem("Erro ao atualizar cliente: " + error.message, "erro");
    return;
  }

  /*
    Se deu certo, mostramos mensagem de sucesso.
  */
  mostrarMensagem("Nome atualizado com sucesso!", "sucesso");

  /*
    Saímos do modo edição.
  */
  cancelarEdicao();

  /*
    Recarregamos a tabela para mostrar o nome atualizado.
  */
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
  CARREGAMENTO INICIAL DA PÁGINA
  ============================================

  Assim que o arquivo JavaScript é carregado,
  buscamos os clientes no Supabase.
*/

carregarClientes();
