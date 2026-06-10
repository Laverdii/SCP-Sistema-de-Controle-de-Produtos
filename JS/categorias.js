const SUPABASE_URL = "https://ouuwgxztehzshrtjdehb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2tOQkWcuI6Xd06OEEG9D1w_Esm6_e9j";

/*
  Cria o Categoria de conexão com o Supabase.

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

const formCategoria = document.getElementById("formCategoria");
const tabelaCategorias = document.getElementById("tabelaCategorias");
const mensagem = document.getElementById("mensagem");
const pesquisaCategoriaInput = document.getElementById("pesquisaCategoria");
const btnPesquisarCategoria = document.getElementById("btnPesquisarCategoria");
const avisoCategoria = document.getElementById("avisoCategoria");

const CategoriaIdInput = document.getElementById("CategoriaId");
const descCategoriaInput = document.getElementById("descCategoria");

const btnSalvar = document.getElementById("btnSalvar");
const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");

let categoriasCarregadas = [];

/*
  ============================================
  FUNÇÃO PARA MOSTRAR MENSAGEM NA TELA
  ============================================

  Essa função recebe:
  - texto: mensagem que será exibida.
  - tipo: classe CSS aplicada na mensagem.

  Exemplo:
  mostrarMensagem("Categoria salvo com sucesso!", "sucesso");
  mostrarMensagem("Erro ao salvar Categoria.", "erro");
*/

function mostrarMensagem(texto, tipo) {
  mensagem.textContent = texto;
  mensagem.className = "mensagem " + tipo;
}

async function buscarProximoCategoriaIdDisponivel() {
  const { data, error } = await supabaseClient
    .from("categoria_produto")
    .select("categoriaprodutoid")
    .order("categoriaprodutoid", { ascending: true });

  if (error) {
    throw error;
  }

  let proximoId = 1;

  for (const categoria of data) {
    if (categoria.categoriaprodutoid === proximoId) {
      proximoId++;
    }

    if (categoria.categoriaprodutoid > proximoId) {
      break;
    }
  }

  return proximoId;
}

/*
  ============================================
  CARREGAR CategoriaS
  ============================================

  Essa função busca os Categorias no Supabase e monta as linhas da tabela.

  Observação importante:
  A tabela foi criada assim:

  CREATE TABLE Categoria (...)

  Como não foram usadas aspas no nome da tabela,
  no PostgreSQL o nome normalmente fica em minúsculo: Categoria.

  Por isso usamos:
  .from("Categoria")
*/

function renderizarCategorias(categorias) {
  if (categorias.length === 0) {
    tabelaCategorias.innerHTML = `
      <tr>
        <td colspan="3">Nenhuma categoria encontrada.</td>
      </tr>
    `;
    return;
  }

  tabelaCategorias.innerHTML = "";

  categorias.forEach(function (Categoria) {
    const linha = document.createElement("tr");

    linha.innerHTML = `
      <td>${Categoria.categoriaprodutoid}</td>
      <td>${Categoria.ds_categoria_produto}</td>
      <td class="coluna-acoes"></td>
    `;

    const botaoEditar = document.createElement("button");
    botaoEditar.textContent = "Editar";
    botaoEditar.className = "btn-editar";
    botaoEditar.type = "button";
    botaoEditar.addEventListener("click", function () {
      prepararEdicao(Categoria);
    });

    const botaoExcluir = document.createElement("button");
    botaoExcluir.textContent = "Excluir";
    botaoExcluir.className = "btn-excluir";
    botaoExcluir.type = "button";
    botaoExcluir.addEventListener("click", function () {
      excluirCategoria(Categoria);
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

function filtrarCategorias() {
  executarPesquisaCategorias();
}

async function carregarCategorias() {
  const { data, error } = await supabaseClient
    .from("categoria_produto")
    .select("categoriaprodutoid, ds_categoria_produto")
    .order("categoriaprodutoid", { ascending: true });

  if (error) {
    tabelaCategorias.innerHTML = `
      <tr>
        <td colspan="3">Erro ao carregar as categorias.</td>
      </tr>
    `;
    mostrarMensagem("Erro ao buscar as categorias: " + error.message, "erro");
    return;
  }

  if (data.length === 0) {
    categoriasCarregadas = [];
    tabelaCategorias.innerHTML = `
      <tr>
        <td colspan="3">Nenhuma categoria cadastrada.</td>
      </tr>
    `;
    return;
  }

  categoriasCarregadas = data;
  filtrarCategorias();
}

/*
  ============================================
  PREPARAR EDIÇÃO
  ============================================

  Essa função é chamada quando o usuário clica no botão Editar.

  Ela pega os dados do Categoria selecionado e joga para dentro do formulário.
*/

function prepararEdicao(Categoria) {
  /*
    Preenche o campo código.
    Esse campo é importante porque usaremos o ID para saber qual Categoria atualizar.
  */
  CategoriaIdInput.value = Categoria.categoriaprodutoid;

  /*
    Preenche os demais campos com os dados do Categoria.
  */
  descCategoriaInput.value = Categoria.ds_categoria_produto;

  /*
    Neste exemplo, vamos permitir editar apenas o nome.

    Por isso:
    - bloqueamos o tipo;
    - bloqueamos o CPF/CNPJ.
  */
  CategoriaIdInput.readOnly = true;

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
    "Editando o Categoria: " + Categoria.ds_categoria_produto,
    "sucesso",
  );
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
  formCategoria.reset();

  /*
    Garante que o ID fique vazio.
    Se o ID estiver vazio, o sistema entende que é um novo cadastro.
  */
  CategoriaIdInput.value = "";

  /*
    Libera os campos que estavam bloqueados durante a edição.
  */
  CategoriaIdInput.readOnly = false;

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
  VERIFICAR DUPLICIDADE DE CPF/CNPJ
  ============================================

  Consulta o banco para checar se já existe um Categoria com o mesmo CPF/CNPJ.

  Parâmetros:
  - cpfCnpj: valor digitado no formulário.
  - ignorarId: ID do Categoria atual na edição (evita conflito consigo mesmo).

  Retorna true se já existir outro Categoria com esse CPF/CNPJ.
*/

async function descCadastrada(desc, ignorarId = null) {
  let query = supabaseClient
    .from("categoria_produto")
    .select("categoriaprodutoid")
    .eq("ds_categoria_produto", desc);

  if (ignorarId) {
    query = query.neq("categoriaprodutoid", ignorarId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw error;
  }

  return data !== null;
}

/*
  ============================================
  SALVAR Categoria
  ============================================

  Essa função cadastra um novo Categoria no Supabase.

  Ela será chamada quando o campo CategoriaId estiver vazio.
*/

async function salvarCategoria() {
  /*
    Pegamos os valores digitados no formulário.
  */
  const descCategoria = descCategoriaInput.value.trim();

  if (!descCategoria) {
    mostrarMensagem("A descrição da categoria é obrigatória.", "erro");
    descCategoriaInput.focus();
    return;
  }

  /*
    Antes de inserir, verificamos se o CPF/CNPJ já está cadastrado.
  */
  let duplicado;
  try {
    duplicado = await descCadastrada(descCategoria);
  } catch (error) {
    mostrarMensagem("Erro ao verificar a descrição: " + error.message, "erro");
    return;
  }

  if (duplicado) {
    mostrarMensagem("Descrição já cadastrada como categoria.", "erro");
    return;
  }

  let proximoCategoriaId;
  try {
    proximoCategoriaId = await buscarProximoCategoriaIdDisponivel();
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
  const novoCategoria = {
    categoriaprodutoid: proximoCategoriaId,
    ds_categoria_produto: descCategoria,
  };

  /*
    Insere o novo Categoria na tabela Categoria.
  */
  const { error } = await supabaseClient
    .from("categoria_produto")
    .insert(novoCategoria);

  /*
    Se houver erro, mostramos a mensagem e paramos a função.
  */
  if (error) {
    mostrarMensagem("Erro ao salvar categoria: " + error.message, "erro");
    return;
  }

  /*
    Se deu certo, mostramos mensagem de sucesso.
  */
  mostrarMensagem("Categoria salva com sucesso!", "sucesso");

  /*
    Limpamos o formulário.
  */
  formCategoria.reset();

  /*
    Recarregamos a listagem para mostrar o novo Categoria na tabela.
  */
  carregarCategorias();
}

/*
  ============================================
  ATUALIZAR NOME DO Categoria
  ============================================

  Essa função atualiza apenas o nome do Categoria.

  Ela será chamada quando o campo CategoriaId estiver preenchido.
*/

async function atualizarNomeCategoria() {
  /*
    Pegamos o ID do Categoria que está sendo editado.
  */
  const CategoriaId = CategoriaIdInput.value;

  /*
    Pegamos o novo nome digitado.
  */
  const descCategoria = descCategoriaInput.value.trim();

  if (!descCategoria) {
    mostrarMensagem("A descrição da categoria é obrigatória.", "erro");
    descCategoriaInput.focus();
    return;
  }

  /*
    Atualizamos somente a coluna nome_Categoria.

    O filtro .eq("Categoriaid", CategoriaId) é essencial.
    Ele informa qual registro será atualizado.
  */
  const { error } = await supabaseClient
    .from("categoria_produto")
    .update({
      ds_categoria_produto: descCategoria,
    })
    .eq("categoriaprodutoid", CategoriaId);

  /*
    Se houver erro, mostramos a mensagem e paramos.
  */
  if (error) {
    mostrarMensagem("Erro ao atualizar categoria: " + error.message, "erro");
    return;
  }

  /*
    Saímos do modo edição.
  */
  cancelarEdicao();

  /*
    Se deu certo, mostramos mensagem de sucesso.
  */
  mostrarMensagem("Categoria atualizada com sucesso!", "sucesso");

  /*
    Recarregamos a tabela para mostrar o nome atualizado.
  */
  carregarCategorias();
}

/*
  ============================================
  EXCLUIR Categoria
  ============================================

  Essa função exclui um Categoria do Supabase.

  Ela recebe o objeto Categoria inteiro para poder usar:
  - Categoria.Categoriaid
  - Categoria.nome_Categoria
*/

async function excluirCategoria(Categoria) {
  /*
    Antes de excluir, pedimos confirmação.

    O confirm retorna:
    - true se o usuário clicar em OK;
    - false se o usuário clicar em Cancelar.
  */
  const confirmou = confirm(
    "Tem certeza que deseja excluir a categoria " +
      Categoria.ds_categoria_produto +
      "?",
  );

  /*
    Se o usuário cancelar, paramos a função.
  */
  if (!confirmou) {
    return;
  }

  /*
    Executa o DELETE na tabela Categoria.

    O filtro .eq("Categoriaid", Categoria.Categoriaid) garante que apenas
    o Categoria selecionado será excluído.
  */
  const { error } = await supabaseClient
    .from("categoria_produto")
    .delete()
    .eq("categoriaprodutoid", Categoria.categoriaprodutoid);

  /*
    Se houver erro, mostramos uma mensagem.
  */
  if (error) {
    mostrarMensagem("Erro ao excluir categoria: " + error.message, "erro");
    return;
  }

  /*
    Se o Categoria excluído era o mesmo que estava sendo editado,
    cancelamos a edição para limpar o formulário.
  */
  if (CategoriaIdInput.value == Categoria.categoriaprodutoid) {
    cancelarEdicao();
  }

  /*
    Mostra mensagem de sucesso.
  */
  mostrarMensagem("Categoria excluído com sucesso!", "sucesso");

  /*
    Recarrega a tabela para remover visualmente o Categoria excluído.
  */
  carregarCategorias();
}

/*
  ============================================
  EVENTO DE ENVIO DO FORMULÁRIO
  ============================================

  Este evento acontece quando o usuário clica em Salvar ou Atualizar.
*/

formCategoria.addEventListener("submit", async function (evento) {
  /*
    Impede a página de recarregar ao enviar o formulário.
  */
  evento.preventDefault();

  /*
    Verificamos se o campo CategoriaId está preenchido.

    Se estiver vazio:
    - é um cadastro novo.

    Se estiver preenchido:
    - é uma edição.
  */
  const estaEditando = CategoriaIdInput.value !== "";

  if (estaEditando) {
    await atualizarNomeCategoria();
  } else {
    await salvarCategoria();
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

carregarCategorias();
