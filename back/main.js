import './style.css'

const app = document.querySelector('#app')


// ==========================================
// DADOS DAS MISSÕES
// ==========================================

const missoes = [

  {
    numero: 1,
    titulo: 'A semente acordou!',
    historia: `
      Uma pequena semente caiu no chão.
      Para começar sua jornada, ela precisa descobrir
      o que é necessário para crescer.
    `,
    pergunta: 'O que uma semente precisa para começar a crescer?',
    opcoes: [
      '💧 Água',
      '☀️ Luz',
      '🌱 Solo',
      '🌱 Todas essas opções'
    ],
    correta: 3,
    acerto: `
      A semente precisa de água, luz e um ambiente
      adequado no solo para iniciar seu desenvolvimento.
    `,
    erro: `
      Pense em tudo o que uma semente precisa
      para começar sua jornada.
    `
  },

  {
    numero: 2,
    titulo: 'Para onde a semente vai?',
    historia: `
      O vento começou a soprar e a pequena semente
      iniciou sua viagem.
    `,
    pergunta: 'O que pode ajudar uma semente a chegar a novos lugares?',
    opcoes: [
      '💨 O vento',
      '🐦 Os animais',
      '💧 A água',
      '🌱 Todas essas opções'
    ],
    correta: 3,
    acerto: `
      As sementes podem viajar de diferentes maneiras.
      O vento, a água e os animais podem ajudar
      a espalhá-las para novos lugares.
    `,
    erro: `
      Pense em diferentes maneiras pelas quais
      uma semente pode viajar.
    `
  },

  {
    numero: 3,
    titulo: 'Um novo lugar',
    historia: `
      Depois de viajar, a semente finalmente encontrou
      um lugar onde poderia começar uma nova etapa.
    `,
    pergunta: `
      O que acontece primeiro quando uma semente
      encontra condições favoráveis?
    `,
    opcoes: [
      '🌱 Ela começa a germinar',
      '🐦 Ela vira um animal',
      '🍂 Ela se transforma em uma folha',
      '🌳 Ela vira imediatamente uma árvore'
    ],
    correta: 0,
    acerto: `
      Quando encontra condições favoráveis,
      a semente pode iniciar a germinação.
    `,
    erro: `
      A semente está começando uma nova etapa.
      Pense no primeiro passo do desenvolvimento de uma planta.
    `
  },

  {
    numero: 4,
    titulo: 'A primeira raiz',
    historia: `
      A semente começou a germinar.
      Uma pequena estrutura surgiu primeiro
      e começou a crescer em direção ao solo.
    `,
    pergunta: 'Qual é a principal função da raiz?',
    opcoes: [
      '🌸 Produzir flores',
      '💧 Absorver água e sais minerais e ajudar a fixar a planta',
      '🍎 Produzir frutos imediatamente',
      '☀️ Captar a luz do Sol'
    ],
    correta: 1,
    acerto: `
      As raízes ajudam a fixar a planta no solo
      e absorvem água e sais minerais.
    `,
    erro: `
      Pense na parte da planta que fica
      em contato com o solo.
    `
  },

  {
    numero: 5,
    titulo: 'A nova planta',
    historia: `
      A semente já não é mais apenas uma semente.
      Ela está se transformando em uma pequena planta.
    `,
    pergunta: `
      Qual processo permite que a planta produza
      seu próprio alimento usando luz?
    `,
    opcoes: [
      '🌱 Germinação',
      '☀️ Fotossíntese',
      '💧 Absorção',
      '🌬️ Respiração'
    ],
    correta: 1,
    acerto: `
      A fotossíntese permite que as plantas produzam
      matéria orgânica usando energia da luz.
    `,
    erro: `
      Pense no processo em que a planta utiliza
      a energia da luz para produzir seu alimento.
    `
  }

]

// ==========================================
// FUNÇÃO AUXILIAR
// ==========================================

function mostrarConteudo(html) {

  const main = document.querySelector('main')

  main.innerHTML = html

}

// ==========================================
// VERIFICAR RESPOSTA
// ==========================================

function verificarResposta(resposta, correta) {

  return resposta === correta

}

// ==========================================
// RESPONDER À MISSÃO
// ==========================================

function responderMissao(resposta, missao, feedback) {

  if (verificarResposta(resposta, missao.correta)) {

    feedback.innerHTML = `

      <p>
        🎉 <strong>Muito bem!</strong>
      </p>

      <p>
        ${missao.acerto}
      </p>

    `

  } else {

    feedback.innerHTML = `

      <p>
        🌱 <strong>Boa tentativa!</strong>
      </p>

      <p>
        ${missao.erro}
      </p>

    `

  }

}

// ==========================================
// TELA INICIAL
// ==========================================

function mostrarInicio() {

  app.innerHTML = `

    <header class="cabecalho">
      <h1>🌱 Explore ITS</h1>
      <p>Uma aventura pelo ambiente</p>
    </header>

    <main>

      <section class="inicio">

        <h2>Bem-vindo, explorador!</h2>

        <p>
          Descubra a natureza, observe o ambiente
          e participe de missões.
        </p>

        <button id="comecar">
          Começar a aventura
        </button>

      </section>

    </main>

  `

  document.querySelector('#comecar').addEventListener('click', mostrarApresentacao)

}


// ==========================================
// APRESENTAÇÃO DA SEMENTE
// ==========================================

function mostrarApresentacao() {

 mostrarConteudo(`

    <section class="inicio">

      <h2>🌱 A Semente Peregrina</h2>

      <p>
        Uma pequena semente iniciou uma grande jornada.
      </p>

      <p>
        Agora você vai acompanhar essa aventura,
        observar a natureza e descobrir o ambiente.
      </p>

      <button id="iniciarTrilha">
        Iniciar a trilha
      </button>

    </section>

  `)

  document.querySelector('#iniciarTrilha').addEventListener('click', () => {

    mostrarMissao(0)

  })

}

// ==========================================
// MOSTRAR UMA MISSÃO
// ==========================================

function mostrarMissao(indice) {

  const missao = missoes[indice]

  mostrarConteudo(`

    <section class="inicio">

      <h2>🌱 Missão ${missao.numero}</h2>

      <h3>${missao.titulo}</h3>

      <p>
        ${missao.historia}
      </p>

      <p>
        <strong>
          ${missao.pergunta}
        </strong>
      </p>

      <div id="opcoes">

        ${missao.opcoes.map((opcao, index) => `

          <button class="opcao" data-index="${index}">
            ${opcao}
          </button>

        `).join('')}

      </div>

      <div id="feedback"></div>

    </section>

  `)

  const opcoes = document.querySelectorAll('.opcao')
  const feedback = document.querySelector('#feedback')

  opcoes.forEach(opcao => {

    opcao.addEventListener('click', () => {

      const resposta = Number(opcao.dataset.index)

      const acertou = verificarResposta(
        resposta,
        missao.correta
      )

      if (acertou) {

        feedback.innerHTML = `

          <p>
            🎉 <strong>Muito bem!</strong>
          </p>

          <p>
            ${missao.acerto}
          </p>

          <button id="continuar">
            ➡️ Continuar a aventura
          </button>

        `

        document.querySelector('#continuar').addEventListener('click', () => {

          const proxima = indice + 1

          if (proxima < missoes.length) {

            mostrarMissao(proxima)

          } else {

            mostrarFinal()

          }

        })

      } else {

        feedback.innerHTML = `

          <p>
            🌱 <strong>Boa tentativa!</strong>
          </p>

          <p>
            ${missao.erro}
          </p>

        `

      }

    })

  })

}

// ==========================================
// FINAL
// ==========================================

function mostrarFinal() {

  mostrarConteudo(`

    <section class="inicio">

      <h2>🏆 Jornada concluída!</h2>

      <p>
        Você acompanhou a Semente Peregrina
        desde o início de sua jornada.
      </p>

      <p>
        Ela encontrou um lugar, germinou,
        desenvolveu suas primeiras estruturas
        e começou a crescer.
      </p>

      <p>
        🌱 <strong>
          Mas a aventura está apenas começando!
        </strong>
      </p>

      <p>
        Em novas etapas, você poderá descobrir
        como as plantas interagem com o ambiente,
        com os animais e com outros seres vivos.
      </p>

      <button id="reiniciar">
        🔄 Refazer a aventura
      </button>

    </section>

  `)

  document.querySelector('#reiniciar').addEventListener('click', () => {

    mostrarInicio()

  })

}


// ==========================================
// INICIAR A APLICAÇÃO
// ==========================================

mostrarInicio()