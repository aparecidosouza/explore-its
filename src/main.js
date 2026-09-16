import './style.css'

// ============================================================
// EXPLORE ITS
// Trilha da Semente Peregrina
// ============================================================
//
// Arquitetura:
//
// APP
//  ├── Estações
//  │    ├── Aprender
//  │    └── Investigar
//  │
//  └── Caderno do Investigador
//
// Para adicionar uma nova estação no futuro,
// basta acrescentar um novo objeto ao array "estacoes".
// A lógica principal do aplicativo não precisa ser alterada.
// ============================================================


// ============================================================
// ELEMENTO PRINCIPAL
// ============================================================

const app = document.querySelector('#app')

if (!app) {
  throw new Error('Elemento #app não encontrado.')
}


// ============================================================
// ESTADO DA APLICAÇÃO
// ============================================================

const estado = {
  estacaoAtual: null,
  missaoAtual: null,
  descobertas: 0,
  missoesConcluidas: new Set()
}


// ============================================================
// DADOS DAS ESTAÇÕES
// ============================================================

const estacoes = [

  // ==========================================================
  // 🌱 SEMENTES
  // ==========================================================

  {
    id: 'sementes',
    icone: '🌱',
    titulo: 'Sementes',

    descricao:
      'Descubra como as sementes nascem, viajam, germinam e encontram novos lugares.',

    missoes: [

      {
        id: 'sementes-aprender-01',
        tipo: 'learn',
        titulo: 'A semente acordou!',

        descricao:
          'Uma pequena semente caiu no chão. Para começar sua jornada, ela precisa encontrar condições favoráveis.',

        pergunta:
          'O que é essencial para uma semente iniciar a germinação?',

        opcoes: [
          '💧 Água e condições adequadas',
          '☀️ Luz sempre',
          '🍎 Um fruto',
          '🐦 Um animal'
        ],

        correta: 0,

        sucesso:
          'A água é fundamental para a germinação, junto com condições adequadas de temperatura e oxigênio. Nem todas as sementes precisam de luz para germinar.',

        dica:
          'Pense no que faz a semente sair de seu estado de dormência.'
      },


      {
        id: 'sementes-aprender-02',
        tipo: 'learn',
        titulo: 'Para onde a semente vai?',

        descricao:
          'O vento começou a soprar e a pequena semente iniciou sua viagem.',

        pergunta:
          'O que pode ajudar uma semente a chegar a novos lugares?',

        opcoes: [
          '💨 O vento',
          '🐦 Os animais',
          '💧 A água',
          '🌱 Todas essas opções'
        ],

        correta: 3,

        sucesso:
          'As sementes podem viajar de diferentes maneiras. O vento, a água e os animais podem ajudar na dispersão.',

        dica:
          'Pense em diferentes maneiras pelas quais uma semente pode viajar.'
      },


      {
        id: 'sementes-aprender-03',
        tipo: 'learn',
        titulo: 'Um novo lugar',

        descricao:
          'Depois de viajar, a semente encontrou um lugar onde poderia iniciar uma nova etapa.',

        pergunta:
          'O que acontece primeiro quando uma semente encontra condições favoráveis?',

        opcoes: [
          '🌱 Ela começa a germinar',
          '🐦 Ela vira um animal',
          '🍂 Ela se transforma em uma folha',
          '🌳 Ela vira imediatamente uma árvore'
        ],

        correta: 0,

        sucesso:
          'Quando encontra condições favoráveis, a semente pode iniciar a germinação.',

        dica:
          'Pense no primeiro passo do desenvolvimento de uma planta.'
      },


      {
        id: 'sementes-aprender-04',
        tipo: 'learn',
        titulo: 'A primeira raiz',

        descricao:
          'A semente começou a germinar. Uma pequena estrutura surgiu e começou a crescer em direção ao solo.',

        pergunta:
          'Qual é uma das principais funções da raiz?',

        opcoes: [
          '🌸 Produzir flores',
          '💧 Absorver água e sais minerais e ajudar a fixar a planta',
          '🍎 Produzir frutos imediatamente',
          '☀️ Captar a luz do Sol'
        ],

        correta: 1,

        sucesso:
          'As raízes ajudam a fixar a planta e participam da absorção de água e sais minerais.',

        dica:
          'Pense na parte da planta que fica em contato com o solo.'
      },


      {
        id: 'sementes-aprender-05',
        tipo: 'learn',
        titulo: 'A nova planta',

        descricao:
          'A semente já não é mais apenas uma semente. Uma pequena planta está se desenvolvendo.',

        pergunta:
          'Qual processo permite que as plantas produzam matéria orgânica utilizando energia da luz?',

        opcoes: [
          '🌱 Germinação',
          '☀️ Fotossíntese',
          '💧 Absorção',
          '🌬️ Respiração'
        ],

        correta: 1,

        sucesso:
          'Na fotossíntese, as plantas utilizam energia da luz para produzir matéria orgânica.',

        dica:
          'Pense no processo que utiliza a energia luminosa.'
      },


      // --------------------------------------------------------
      // INVESTIGAÇÃO
      // --------------------------------------------------------

      {
        id: 'sementes-investigar-01',
        tipo: 'investigate',
        titulo: 'De onde veio esta semente?',

        descricao:
          'Você encontrou uma semente. Agora começa uma investigação. Observe o ambiente e procure pistas.',

        pergunta:
          'Que pistas podem ajudar você a descobrir de onde ela veio?',

        opcoes: [
          '🍎 Procurar um fruto',
          '🌳 Procurar uma planta próxima',
          '🍃 Observar folhas ou flores',
          '🔎 Todas essas pistas podem ajudar'
        ],

        correta: 3,

        sucesso:
          'Muito bem! Um investigador procura diferentes evidências antes de formular uma hipótese.',

        dica:
          'Não procure apenas uma resposta. Procure pistas no ambiente.',

        permiteFoto: true,
        permiteHipotese: true
      },


      {
        id: 'sementes-investigar-02',
        tipo: 'investigate',
        titulo: 'Observe a semente',

        descricao:
          'Observe cuidadosamente uma semente encontrada no ambiente.',

        pergunta:
          'O que você pode observar em uma semente?',

        opcoes: [
          '🎨 Cor',
          '📏 Tamanho e forma',
          '🔎 Superfície',
          '🌱 Todas essas características'
        ],

        correta: 3,

        sucesso:
          'Observar características é uma das primeiras etapas de uma investigação.',

        dica:
          'Antes de identificar alguma coisa, observe cuidadosamente suas características.',

        permiteFoto: true
      }

    ]
  },


  // ==========================================================
  // 🐦 AVES
  // ==========================================================

  {
    id: 'aves',
    icone: '🐦',
    titulo: 'Aves',

    descricao:
      'Observe as aves e descubra evidências de que elas vivem e interagem com o ambiente.',

    missoes: [

      {
        id: 'aves-aprender-01',
        tipo: 'learn',
        titulo: 'Conhecendo as aves',

        descricao:
          'As aves possuem características que ajudam na identificação e na compreensão de seu modo de vida.',

        pergunta:
          'Qual destas estruturas é característica das aves?',

        opcoes: [
          '🪶 Penas',
          '🐟 Escamas de peixe',
          '🐌 Concha',
          '🦎 Carapaça'
        ],

        correta: 0,

        sucesso:
          'As penas são uma característica marcante das aves e desempenham diversas funções.',

        dica:
          'Observe atentamente o corpo de uma ave.'
      },


      {
        id: 'aves-aprender-02',
        tipo: 'learn',
        titulo: 'O que as aves comem?',

        descricao:
          'As aves podem utilizar diferentes recursos encontrados no ambiente.',

        pergunta:
          'Qual destes pode fazer parte da alimentação de algumas aves?',

        opcoes: [
          '🍎 Frutos',
          '🌱 Sementes',
          '🐜 Insetos',
          '🐦 Todas essas opções'
        ],

        correta: 3,

        sucesso:
          'Diferentes espécies de aves possuem diferentes hábitos alimentares.',

        dica:
          'As aves não possuem todas a mesma alimentação.'
      },


      // --------------------------------------------------------
      // INVESTIGAÇÃO
      // --------------------------------------------------------

      {
        id: 'aves-investigar-01',
        tipo: 'investigate',
        titulo: 'Detetive da natureza',

        descricao:
          'Você é um investigador da natureza. Procure evidências de que animais vivem ou passaram por este lugar.',

        pergunta:
          'Qual destas pode ser uma evidência da presença de um animal?',

        opcoes: [
          '🪶 Pena',
          '🪺 Ninho',
          '🍃 Folha comida',
          '🔎 Todas essas opções'
        ],

        correta: 3,

        sucesso:
          'Excelente! Uma investigação começa pela observação de evidências.',

        dica:
          'Uma evidência não precisa ser o animal. Pode ser um vestígio deixado por ele.',

        permiteFoto: true,
        permiteHipotese: true
      },


      {
        id: 'aves-investigar-02',
        tipo: 'hypothesis',
        titulo: 'Quem passou por aqui?',

        descricao:
          'Você encontrou uma pista no ambiente. Agora precisa pensar sobre o que ela pode significar.',

        pergunta:
          'Depois de encontrar uma evidência, qual atitude ajuda na investigação?',

        opcoes: [
          '💭 Formular uma hipótese',
          '🔎 Procurar outras evidências',
          '👀 Observar o ambiente',
          '🌎 Todas essas atitudes'
        ],

        correta: 3,

        sucesso:
          'Muito bem! Observar, formular hipóteses e procurar novas evidências fazem parte da investigação.',

        dica:
          'Um bom investigador não tira conclusões apenas com uma pista.',

        permiteHipotese: true
      }

    ]
  },


  // ==========================================================
  // 💧 ÁGUA
  // ==========================================================

  {
    id: 'agua',
    icone: '💧',
    titulo: 'Água',

    descricao:
      'Investigue como a água se movimenta, é utilizada e se relaciona com o solo e os seres vivos.',

    missoes: [

      {
        id: 'agua-aprender-01',
        tipo: 'learn',
        titulo: 'A água no ambiente',

        descricao:
          'A água está presente em diferentes lugares e participa de muitos processos do ambiente.',

        pergunta:
          'Onde podemos encontrar água no ambiente?',

        opcoes: [
          '🌧️ Na chuva',
          '🌱 No solo e nas plantas',
          '🌊 Em rios e lagos',
          '💧 Em todos esses lugares'
        ],

        correta: 3,

        sucesso:
          'A água circula pelo ambiente e está presente em diferentes lugares.',

        dica:
          'A água não está apenas nos rios.'
      },


      {
        id: 'agua-aprender-02',
        tipo: 'learn',
        titulo: 'A viagem da água',

        descricao:
          'A água participa de diferentes processos quando chega ao ambiente.',

        pergunta:
          'O que pode acontecer com a água da chuva quando chega ao solo?',

        opcoes: [
          '💧 Parte pode infiltrar',
          '🌊 Parte pode escoar pela superfície',
          '🌱 Parte pode ficar disponível para plantas',
          '💧 Todas essas situações podem ocorrer'
        ],

        correta: 3,

        sucesso:
          'Dependendo das características do local, a água pode infiltrar, escoar ou ficar disponível para os seres vivos.',

        dica:
          'Observe o que acontece com a água quando ela encontra diferentes superfícies.'
      },


      // --------------------------------------------------------
      // INVESTIGAÇÃO
      // --------------------------------------------------------

      {
        id: 'agua-investigar-01',
        tipo: 'investigate',
        titulo: 'A viagem de uma gota',

        descricao:
          'Imagine que você é uma gota de água. Investigue sua viagem pelo ambiente.',

        pergunta:
          'Qual pergunta pode ajudar você a investigar a viagem da água?',

        opcoes: [
          '💧 De onde ela veio?',
          '🌎 Para onde ela vai?',
          '🌱 Como ela é utilizada?',
          '🔎 Todas essas perguntas'
        ],

        correta: 3,

        sucesso:
          'Excelente! Investigar a água significa observar sua origem, seus caminhos, seus usos e seu destino.',

        dica:
          'A viagem da água envolve várias etapas.'
      },


      {
        id: 'agua-investigar-02',
        tipo: 'investigate',
        titulo: 'Para onde vai a chuva?',

        descricao:
          'Depois da chuva, observe cuidadosamente o ambiente ao seu redor.',

        pergunta:
          'Em qual lugar a água da chuva pode ter maior facilidade para entrar no solo?',

        opcoes: [
          '🌱 Em um canteiro com terra',
          '🧱 Em uma superfície de cimento',
          '🛣️ No asfalto',
          '🚗 No estacionamento'
        ],

        correta: 0,

        sucesso:
          'Áreas com solo exposto ou superfícies permeáveis podem permitir maior infiltração da água.',

        dica:
          'Compare uma superfície com terra com uma superfície coberta por materiais impermeáveis.',

        permiteFoto: true
      },


      {
        id: 'agua-investigar-03',
        tipo: 'investigate',
        titulo: 'Onde a água é utilizada?',

        descricao:
          'Observe o ambiente e encontre um lugar onde a água é utilizada.',

        pergunta:
          'Qual situação representa um uso da água?',

        opcoes: [
          '🌱 Irrigar plantas',
          '🚰 Beber',
          '🧼 Limpar',
          '💧 Todas essas situações'
        ],

        correta: 3,

        sucesso:
          'A água é utilizada de muitas maneiras no cotidiano e pelos seres vivos.',

        dica:
          'Observe atentamente os diferentes usos da água no lugar onde você está.',

        permiteFoto: true
      }

    ]
  }

]


// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

function render(conteudo) {
  app.innerHTML = conteudo
}


function obterEstacao(id) {
  return estacoes.find(estacao => estacao.id === id)
}


function obterMissao(id) {

  for (const estacao of estacoes) {

    const missao = estacao.missoes.find(
      item => item.id === id
    )

    if (missao) {
      return missao
    }
  }

  return null
}


function totalMissoes() {

  return estacoes.reduce(
    (total, estacao) => total + estacao.missoes.length,
    0
  )
}


function totalConcluidasDaEstacao(estacao) {

  return estacao.missoes.filter(
    missao => estado.missoesConcluidas.has(missao.id)
  ).length
}


// ============================================================
// TELA INICIAL
// ============================================================

function mostrarInicio() {

  estado.estacaoAtual = null
  estado.missaoAtual = null

  render(`

    <header class="cabecalho">

      <h1>🌱 Explore ITS</h1>

      <p>
        Trilha da Semente Peregrina
      </p>

    </header>

    <main>

      <section class="inicio">

        <h2>
          Bem-vindo, explorador!
        </h2>

        <p>
          Observe a natureza, investigue o ambiente
          e descubra como tudo está conectado.
        </p>

        <div class="ciclo">

          <span>👀 Observar</span>
          <span>🔎 Investigar</span>
          <span>💭 Pensar</span>
          <span>📝 Registrar</span>
          <span>🌎 Descobrir</span>

        </div>

        <button
          class="botao-principal"
          data-action="estacoes"
        >
          🌎 Começar a aventura
        </button>

        <button
          class="botao-secundario"
          data-action="caderno"
        >
          📔 Caderno do Investigador
        </button>

      </section>

    </main>
  `)
}


// ============================================================
// ESTAÇÕES
// ============================================================

function mostrarEstacoes() {

  estado.estacaoAtual = null
  estado.missaoAtual = null

  render(`

    <header class="cabecalho">

      <h1>🌱 Explore ITS</h1>

      <p>
        Escolha uma estação para explorar
      </p>

    </header>

    <main>

      <section class="inicio">

        <h2>
          🌎 Estações da trilha
        </h2>

        <p>
          Cada estação apresenta diferentes maneiras
          de observar e investigar o ambiente.
        </p>

        <div class="estacoes">

          ${estacoes.map(estacao => {

            const total = estacao.missoes.length

            const concluidas =
              totalConcluidasDaEstacao(estacao)

            return `

              <button
                class="estacao"
                data-action="estacao"
                data-id="${estacao.id}"
              >

                <span class="estacao-icone">
                  ${estacao.icone}
                </span>

                <strong>
                  ${estacao.titulo}
                </strong>

                <small>
                  ${estacao.descricao}
                </small>

                <span class="progresso">
                  ${concluidas} de ${total} descobertas
                </span>

              </button>

            `
          }).join('')}

        </div>


        <div class="resumo">

          🔎 Descobertas registradas:
          <strong>
            ${estado.descobertas}
          </strong>

        </div>


        <button
          class="botao-secundario"
          data-action="caderno"
        >
          📔 Abrir Caderno do Investigador
        </button>


        <button
          class="botao-voltar"
          data-action="inicio"
        >
          ← Voltar ao início
        </button>

      </section>

    </main>
  `)
}


// ============================================================
// MENU DA ESTAÇÃO
// ============================================================

function mostrarEstacao(estacao) {

  estado.estacaoAtual = estacao
  estado.missaoAtual = null

  const aprender =
    estacao.missoes.filter(
      missao => missao.tipo === 'learn'
    )

  const investigar =
    estacao.missoes.filter(
      missao => missao.tipo !== 'learn'
    )

  const concluidas =
    totalConcluidasDaEstacao(estacao)

  render(`

    <header class="cabecalho">

      <h1>
        ${estacao.icone} ${estacao.titulo}
      </h1>

      <p>
        ${estacao.descricao}
      </p>

    </header>

    <main>

      <section class="inicio">

        <div class="progresso-estacao">

          🔎 ${concluidas} de ${estacao.missoes.length}
          missões concluídas

        </div>


        <h3>
          📚 Aprender
        </h3>

        <p>
          Descubra conceitos e conhecimentos sobre este tema.
        </p>

        <div class="lista-missoes">

          ${criarBotoesMissoes(aprender)}

        </div>


        <h3>
          🔎 Investigar
        </h3>

        <p>
          Saia da tela, observe o ambiente e procure evidências.
        </p>

        <div class="lista-missoes">

          ${criarBotoesMissoes(investigar)}

        </div>


        <button
          class="botao-voltar"
          data-action="estacoes"
        >
          ← Voltar às estações
        </button>

      </section>

    </main>
  `)
}


// ============================================================
// BOTÕES DAS MISSÕES
// ============================================================

function criarBotoesMissoes(missoes) {

  if (missoes.length === 0) {

    return `
      <p>
        Nenhuma missão disponível ainda.
      </p>
    `
  }


  return missoes.map((missao, index) => {

    const concluida =
      estado.missoesConcluidas.has(missao.id)

    const iconeTipo =
      missao.tipo === 'learn'
        ? '📚'
        : '🔎'

    return `

      <button
        class="missao ${concluida ? 'concluida' : ''}"
        data-action="missao"
        data-id="${missao.id}"
      >

        <span class="numero-missao">

          ${concluida ? '✓' : index + 1}

        </span>

        <span>
          ${iconeTipo}
        </span>

        <span>
          ${missao.titulo}
        </span>

      </button>

    `
  }).join('')
}


// ============================================================
// MOSTRAR MISSÃO
// ============================================================

function mostrarMissao(missao) {

  estado.missaoAtual = missao

  const estacao =
    estado.estacaoAtual

  if (!estacao) {
    return
  }


  const concluida =
    estado.missoesConcluidas.has(missao.id)


  const tipo =
    missao.tipo === 'learn'
      ? '📚 Aprender'
      : '🔎 Investigar'


  render(`

    <header class="cabecalho">

      <p>
        ${estacao.icone} ${estacao.titulo}
      </p>

      <h1>
        ${tipo}
      </h1>

    </header>


    <main>

      <section class="inicio">

        <div class="missao-topo">

          <span>
            ${tipo}
          </span>

          ${concluida
            ? '<span>✓ Descoberta registrada</span>'
            : ''
          }

        </div>


        <h2>
          ${missao.titulo}
        </h2>


        <p>
          ${missao.descricao}
        </p>


        ${missao.permiteFoto
          ? `
            <div class="recurso">

              📷
              <strong>Observe e registre</strong>

              <p>
                Esta missão foi preparada para receber
                registros fotográficos.
              </p>

            </div>
          `
          : ''
        }


        ${missao.pergunta
          ? `
            <p class="pergunta">

              <strong>
                ${missao.pergunta}
              </strong>

            </p>
          `
          : ''
        }


        <div id="opcoes">

          ${criarOpcoes(missao)}

        </div>


        <div id="feedback"></div>


        ${missao.permiteHipotese
          ? `
            <div class="hipotese">

              💭
              <strong>Pense como um investigador</strong>

              <p>
                Depois de observar as evidências,
                você poderá formular uma hipótese.
              </p>

            </div>
          `
          : ''
        }


        <button
          class="botao-voltar"
          data-action="voltar-estacao"
        >
          ← Voltar à estação
        </button>

      </section>

    </main>
  `)
}


// ============================================================
// OPÇÕES
// ============================================================

function criarOpcoes(missao) {

  if (!missao.opcoes) {
    return ''
  }


  return missao.opcoes.map((opcao, index) => {

    return `

      <button
        class="opcao"
        data-action="responder"
        data-opcao="${index}"
      >

        ${opcao}

      </button>

    `
  }).join('')
}


// ============================================================
// VERIFICAR RESPOSTA
// ============================================================

function verificarResposta(resposta, missao) {

  const feedback =
    document.querySelector('#feedback')

  if (!feedback) {
    return
  }


  if (resposta === missao.correta) {

    registrarDescoberta(missao)


    feedback.innerHTML = `

      <div class="feedback sucesso">

        <p>
          🎉 <strong>Muito bem!</strong>
        </p>

        <p>
          ${missao.sucesso}
        </p>

        <button
          class="botao-principal"
          data-action="voltar-estacao"
        >
          🔎 Continuar investigando
        </button>

      </div>

    `

    desativarOpcoes()

  } else {

    feedback.innerHTML = `

      <div class="feedback erro">

        <p>
          🌱 <strong>Boa tentativa!</strong>
        </p>

        <p>
          ${missao.dica}
        </p>

        <p>
          Observe novamente e tente outra vez.
        </p>

      </div>

    `
  }
}


// ============================================================
// DESATIVAR OPÇÕES DEPOIS DO ACERTO
// ============================================================

function desativarOpcoes() {

  document
    .querySelectorAll('[data-action="responder"]')
    .forEach(botao => {

      botao.disabled = true

    })
}


// ============================================================
// REGISTRAR DESCOBERTA
// ============================================================

function registrarDescoberta(missao) {

  if (
    estado.missoesConcluidas.has(missao.id)
  ) {

    return
  }


  estado.missoesConcluidas.add(
    missao.id
  )

  estado.descobertas++
}


// ============================================================
// CADERNO DO INVESTIGADOR
// ============================================================

function mostrarCaderno() {

  render(`

    <header class="cabecalho">

      <h1>
        📔 Caderno do Investigador
      </h1>

      <p>
        Suas descobertas na trilha
      </p>

    </header>


    <main>

      <section class="inicio">

        <div class="resumo-caderno">

          <h2>
            🔎 ${estado.descobertas}
          </h2>

          <p>
            descobertas registradas
          </p>

        </div>


        <h3>
          Missões concluídas
        </h3>


        ${estado.missoesConcluidas.size === 0

          ? `

            <div class="vazio">

              <p>
                🌱 Seu caderno ainda está vazio.
              </p>

              <p>
                Escolha uma estação e comece a investigar!
              </p>

            </div>

          `

          : criarListaDescobertas()

        }


        <button
          class="botao-principal"
          data-action="estacoes"
        >
          🌎 Continuar explorando
        </button>


        <button
          class="botao-voltar"
          data-action="inicio"
        >
          ← Voltar ao início
        </button>

      </section>

    </main>
  `)
}


// ============================================================
// LISTA DE DESCOBERTAS
// ============================================================

function criarListaDescobertas() {

  return estacoes.map(estacao => {

    const descobertasDaEstacao =
      estacao.missoes.filter(
        missao =>
          estado.missoesConcluidas.has(missao.id)
      )


    if (descobertasDaEstacao.length === 0) {
      return ''
    }


    return `

      <div class="registro-estacao">

        <h4>
          ${estacao.icone} ${estacao.titulo}
        </h4>

        <ul>

          ${descobertasDaEstacao.map(missao => `

            <li>
              ✓ ${missao.titulo}
            </li>

          `).join('')}

        </ul>

      </div>

    `

  }).join('')
}


// ============================================================
// EVENTOS
// ============================================================
//
// Usamos um único sistema de eventos para todo o aplicativo.
//
// Isso deixa o código mais leve e evita criar dezenas de
// addEventListener toda vez que uma tela é reconstruída.
// ============================================================

app.addEventListener('click', event => {

  const elemento =
    event.target instanceof Element
      ? event.target
      : null


  if (!elemento) {
    return
  }


  const botao =
    elemento.closest('[data-action]')


  if (!botao) {
    return
  }


  const acao =
    botao.dataset.action


  // ----------------------------------------------------------
  // INÍCIO
  // ----------------------------------------------------------

  if (acao === 'inicio') {

    mostrarInicio()
    return
  }


  // ----------------------------------------------------------
  // ESTAÇÕES
  // ----------------------------------------------------------

  if (acao === 'estacoes') {

    mostrarEstacoes()
    return
  }


  // ----------------------------------------------------------
  // ABRIR ESTAÇÃO
  // ----------------------------------------------------------

  if (acao === 'estacao') {

    const id =
      botao.dataset.id

    const estacao =
      obterEstacao(id)

    if (estacao) {

      mostrarEstacao(estacao)

    }

    return
  }


  // ----------------------------------------------------------
  // ABRIR MISSÃO
  // ----------------------------------------------------------

  if (acao === 'missao') {

    const id =
      botao.dataset.id

    const missao =
      obterMissao(id)

    if (!missao) {
      return
    }


    const estacao =
      estacoes.find(
        item =>
          item.missoes.some(
            itemMissao =>
              itemMissao.id === missao.id
          )
      )


    if (estacao) {

      estado.estacaoAtual =
        estacao

      mostrarMissao(missao)

    }

    return
  }


  // ----------------------------------------------------------
  // RESPONDER
  // ----------------------------------------------------------

  if (acao === 'responder') {

    const resposta =
      Number(botao.dataset.opcao)

    const missao =
      estado.missaoAtual

    if (!missao) {
      return
    }


    verificarResposta(
      resposta,
      missao
    )

    return
  }


  // ----------------------------------------------------------
  // VOLTAR PARA ESTAÇÃO
  // ----------------------------------------------------------

  if (acao === 'voltar-estacao') {

    if (estado.estacaoAtual) {

      mostrarEstacao(
        estado.estacaoAtual
      )

    } else {

      mostrarEstacoes()

    }

    return
  }


  // ----------------------------------------------------------
  // CADERNO
  // ----------------------------------------------------------

  if (acao === 'caderno') {

    mostrarCaderno()
    return
  }

})


// ============================================================
// INICIAR APLICAÇÃO
// ============================================================

mostrarInicio()