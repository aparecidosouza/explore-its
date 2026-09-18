import './style.css'

// Interfaces dos Modelos de Dados
interface Pergunta {
  id: string
  texto: string
  tipo: 'multipla_escolha' | 'texto'
  opcoes?: string[]
  respostaCorreta?: number
}

interface Missao {
  id: string
  titulo: string
  descricao: string
  pergunta: Pergunta
  concluida: boolean
}

interface Recanto {
  id: string
  nome: string
  descricao: string
  icone: string
  missoes: Missao[]
}

interface RespostaSubmetida {
  recantoId: string
  missaoId: string
  perguntaTexto: string
  respostaDada: string
  estaCorreta: boolean
  dataHora: string
}

interface CrachaEstudante {
  nome: string
  codigoTurma: string
}

interface EstadoApp {
  cracha: CrachaEstudante | null
  recantoAtual: Recanto | null
  missaoAtual: Missao | null
  respostas: RespostaSubmetida[]
  modoProfessor: boolean
}

// Estado Global da Aplicação
const estado: EstadoApp = {
  cracha: carregarCrachaSalvo(),
  recantoAtual: null,
  missaoAtual: null,
  respostas: carregarRespostasSalvas(),
  modoProfessor: false
}

// Controle do Modal de Feedback e Navegação
let modalSucessoAberto = false
let mensagemSucessoModal = ''
let exibindoRelatorio = false
let navegandoViaHistorico = false

// Estações da Trilha Explore ITS / PUC Goiás
const recantos: Recanto[] = [
  {
    id: 'estacao-barauna',
    nome: 'Estação Baraúna',
    descricao: 'Explore a imponente árvore símbolo do Cerrado e observe sua biodiversidade local.',
    icone: '🌳',
    missoes: [
      {
        id: 'm-bar-1',
        titulo: 'Identificação da Espécie',
        descricao: 'Observe o tronco e a copa da Baraúna para identificar suas adaptações ao ecossistema.',
        concluida: false,
        pergunta: {
          id: 'p-bar-1',
          texto: 'Quais características da casca e das folhas da Baraúna auxiliam na sua sobrevivência no Cerrado?',
          tipo: 'multipla_escolha',
          opcoes: [
            'Casca espessa e folhas adaptadas à conservação de água',
            'Folhas finas e raiz superficial',
            'Casca lisa e ausência de raiz principal',
            'Sementes aquáticas'
          ],
          respostaCorreta: 0
        }
      },
      {
        id: 'm-bar-2',
        titulo: 'Registro de Campo',
        descricao: 'Anote suas observações sobre a fauna associada a esta árvore.',
        concluida: false,
        pergunta: {
          id: 'p-bar-2',
          texto: 'Descreva os insetos ou aves observados no entorno da Baraúna:',
          tipo: 'texto'
        }
      }
    ]
  },
  {
    id: 'estacao-saci-perere',
    nome: 'Estação Saci-Pererê',
    descricao: 'Investigue os elementos da cultura e folclore integrados ao meio ambiente.',
    icone: '🌪️',
    missoes: [
      {
        id: 'm-saci-1',
        titulo: 'Semeando Histórias',
        descricao: 'Relacione o ecossistema local com os elementos narrativos do espaço.',
        concluida: false,
        pergunta: {
          id: 'p-saci-1',
          texto: 'Qual é a importância da preservação das lendas e do conhecimento tradicional para a conservação ambiental?',
          tipo: 'texto'
        }
      }
    ]
  },
  {
    id: 'estacao-jatoba',
    nome: 'Estação Jatobá',
    descricao: 'Descubra a relevância do Jatobá para a fauna e para o uso sustentável de frutos.',
    icone: '🌰',
    missoes: [
      {
        id: 'm-jat-1',
        titulo: 'Frutos e Sementes',
        descricao: 'Analise a rigidez e a estrutura das sementes de Jatobá encontradas na trilha.',
        concluida: false,
        pergunta: {
          id: 'p-jat-1',
          texto: 'Como a casca dura do fruto do Jatobá protege a semente até o momento do germinar?',
          tipo: 'multipla_escolha',
          opcoes: [
            'Protege contra predadores e variações climáticas severas',
            'Impede completamente a reprodução da árvore',
            'Serve apenas para atrair água da chuva',
            'Dissolve a semente com o calor'
          ],
          respostaCorreta: 0
        }
      }
    ]
  },
  {
    id: 'estacao-pioneiras',
    nome: 'Estação Pioneiras',
    descricao: 'Compreenda o papel das espécies vegetais pioneiras na recuperação do solo.',
    icone: '🌱',
    missoes: [
      {
        id: 'm-pio-1',
        titulo: 'Regeneração Vegetal',
        descricao: 'Observe como as espécies pioneiras ocupam a área para dar lugar à vegetação nativa.',
        concluida: false,
        pergunta: {
          id: 'p-pio-1',
          texto: 'Qual o papel fundamental das plantas pioneiras na restauração de áreas degradadas?',
          tipo: 'multipla_escolha',
          opcoes: [
            'Preparar o solo e criar sombra para espécies mais sensíveis',
            'Impedir o crescimento de qualquer outra árvore',
            'Consumir todos os nutrientes do solo sem reposição',
            'Modificar o clima de toda a região instantaneamente'
          ],
          respostaCorreta: 0
        }
      }
    ]
  },
  {
    id: 'estacao-caipora',
    nome: 'Estação Caipora',
    descricao: 'Explore a proteção da fauna silvestre e o equilíbrio da cadeia alimentar no Cerrado.',
    icone: '🐾',
    missoes: [
      {
        id: 'm-cai-1',
        titulo: 'Guardiões da Floresta',
        descricao: 'Identifique pegadas, rastros ou sinais de animais nativos na estação.',
        concluida: false,
        pergunta: {
          id: 'p-cai-1',
          texto: 'Relate os vestígios da presença da fauna encontrados nesta estação:',
          tipo: 'texto'
        }
      }
    ]
  },
  {
    id: 'estacao-nego-dagua',
    nome: 'Estação Nego D\'Água',
    descricao: 'Analise a importância dos recursos hídricos e das matas de galeria para a região.',
    icone: '💧',
    missoes: [
      {
        id: 'm-neg-1',
        titulo: 'Recursos Hídricos e Mata Ciliar',
        descricao: 'Examine a vegetação de proteção ao redor do curso d\'água.',
        concluida: false,
        pergunta: {
          id: 'p-neg-1',
          texto: 'Como a mata ciliar atua na proteção dos rios e córregos contra o assoreamento?',
          tipo: 'multipla_escolha',
          opcoes: [
            'Suas raízes fixam o solo e filtram os resíduos que iriam para a água',
            'Aumenta a evaporação acelerada da água',
            'Impede a passagem da fauna aquática',
            'Bloqueia a entrada de luz e oxigênio na água'
          ],
          respostaCorreta: 0
        }
      }
    ]
  }
]

// Elemento Raiz no DOM
const app = document.querySelector<HTMLDivElement>('#app')!

// Funções de Armazenamento Local (LocalStorage)
function salvarCracha(cracha: CrachaEstudante) {
  localStorage.setItem('explore_its_cracha', JSON.stringify(cracha))
}

function carregarCrachaSalvo(): CrachaEstudante | null {
  const salvo = localStorage.getItem('explore_its_cracha')
  return salvo ? JSON.parse(salvo) : null
}

function salvarRespostas(respostas: RespostaSubmetida[]) {
  localStorage.setItem('explore_its_respostas', JSON.stringify(respostas))
}

function carregarRespostasSalvas(): RespostaSubmetida[] {
  const salvas = localStorage.getItem('explore_its_respostas')
  return salvas ? JSON.parse(salvas) : []
}

// Sincroniza o Histórico do Navegador para o botão voltar nativo
function atualizarHistoricoNavegacao() {
  if (navegandoViaHistorico) {
    navegandoViaHistorico = false
    return
  }

  const estadoHistorico = {
    recantoId: estado.recantoAtual?.id || null,
    missaoId: estado.missaoAtual?.id || null,
    exibindoRelatorio,
    modoProfessor: estado.modoProfessor
  }

  const estaNaTelaInicial = !estado.recantoAtual && !estado.missaoAtual && !exibindoRelatorio && !estado.modoProfessor

  if (estaNaTelaInicial) {
    history.replaceState(estadoHistorico, '', window.location.pathname)
  } else {
    history.pushState(estadoHistorico, '')
  }
}

// Intercepta o botão "Voltar" nativo do celular
window.addEventListener('popstate', (e) => {
  navegandoViaHistorico = true

  if (e.state) {
    estado.modoProfessor = e.state.modoProfessor || false
    exibindoRelatorio = e.state.exibindoRelatorio || false
    estado.recantoAtual = recantos.find(r => r.id === e.state.recantoId) || null
    
    if (estado.recantoAtual && e.state.missaoId) {
      estado.missaoAtual = estado.recantoAtual.missoes.find(m => m.id === e.state.missaoId) || null
    } else {
      estado.missaoAtual = null
    }
  } else {
    estado.recantoAtual = null
    estado.missaoAtual = null
    exibindoRelatorio = false
    estado.modoProfessor = false
  }

  renderAppSemHistorico()
})

// Componente: Header do App
function renderizarHeader(): string {
  return `
    <header class="app-header">
      <div class="header-content">
        <h1 id="btn-logo" class="logo">🍃 Explore ITS</h1>
        ${estado.cracha ? `
          <div class="user-badge">
            <span class="user-name">👤 ${estado.cracha.nome} (${estado.cracha.codigoTurma})</span>
            <button id="btn-relatorio" class="btn-secondary">📜 Caderno</button>
            <button id="btn-trocar-usuario" class="btn-prof">Sair</button>
          </div>
        ` : ''}
      </div>
    </header>
  `
}

// Componente: Identificação do Aluno / Testador
function renderizarFormularioCracha(): string {
  return `
    <section class="card-container">
      <h2>Trilha da Semente Peregrina</h2>
      <p>Informe o Código da Turma e seu Nome para iniciar a expedição de teste:</p>
      <form id="form-cracha" class="cracha-form">
        <div class="form-group">
          <label for="codigo-turma">Código da Turma / Grupo:</label>
          <input type="text" id="codigo-turma" placeholder="Ex: ITS-2026" required />
        </div>
        <div class="form-group">
          <label for="nome-aluno">Seu Nome Completo:</label>
          <input type="text" id="nome-aluno" placeholder="Ex: Maria Silva" required />
        </div>
        <button type="submit" class="btn-primary">Iniciar Expedição</button>
      </form>
    </section>
  `
}

// Componente: Lista Principal de Estações
function renderizarListaRecantos(): string {
  return `
    <section class="recantos-container">
      <div class="welcome-box">
        <h2>Estações da Trilha</h2>
        <p>Selecione uma das estações para explorar os desafios ecológicos:</p>
      </div>
      <div class="grid-recantos">
        ${recantos.map(recanto => {
          const concluidas = recanto.missoes.filter(m => 
            estado.respostas.some(r => r.recantoId === recanto.id && r.missaoId === m.id)
          ).length
          const total = recanto.missoes.length

          return `
            <div class="recanto-card" data-id="${recanto.id}">
              <div class="recanto-icon">${recanto.icone}</div>
              <h3>${recanto.nome}</h3>
              <p>${recanto.descricao}</p>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${(concluidas / total) * 100}%"></div>
              </div>
              <span class="progress-text">${concluidas} de${total} desafios concluídos</span>
              <button class="btn-primary btn-explorar" data-id="${recanto.id}">Explorar Estação</button>
            </div>
          `
        }).join('')}
      </div>
    </section>
  `
}

// Componente: Detalhes da Estação Selecionada
function renderizarDetalheRecanto(recanto: Recanto): string {
  return `
    <section class="recanto-detalhe">
      <button id="btn-voltar-recantos" class="btn-back">⬅ Voltar para as Estações</button>
      <div class="recanto-header">
        <span class="recanto-icon-lg">${recanto.icone}</span>
        <h2>${recanto.nome}</h2>
        <p>${recanto.descricao}</p>
      </div>

      <h3>Missões Disponíveis</h3>
      <div class="lista-missoes">
        ${recanto.missoes.map(missao => {
          const resolvida = estado.respostas.some(r => r.recantoId === recanto.id && r.missaoId === missao.id)
          return `
            <div class="missao-card ${resolvida ? 'resolvida' : ''}">
              <div class="missao-info">
                <h4>${missao.titulo}${resolvida ? '✅' : ''}</h4>
                <p>${missao.descricao}</p>
              </div>
              <button class="btn-primary btn-iniciar-missao" data-missaoid="${missao.id}">
                ${resolvida ? 'Refazer Desafio' : 'Iniciar Investigação'}
              </button>
            </div>
          `
        }).join('')}
      </div>
    </section>
  `
}

// Componente: Tela de Resolução da Missão
function renderizarMissao(missao: Missao): string {
  return `
    <section class="missao-detalhe">
      <button id="btn-voltar-missoes" class="btn-back">⬅ Voltar à Estação</button>
      
      <div class="missao-header">
        <span class="tag">Desafio de Campo</span>
        <h2>${missao.titulo}</h2>
        <p>${missao.descricao}</p>
      </div>

      <div class="pergunta-box">
        <h3>Investigação Científica</h3>
        <p class="pergunta-texto">${missao.pergunta.texto}</p>

        <form id="form-resposta">
          ${missao.pergunta.tipo === 'multipla_escolha' ? `
            <div class="opcoes-container">
              ${missao.pergunta.opcoes?.map((opcao, idx) => `
                <label class="opcao-label">
                  <input type="radio" name="resposta" value="${idx}" required />
                  <span>${opcao}</span>
                </label>
              `).join('')}
            </div>
          ` : `
            <div class="form-group">
              <textarea id="resposta-texto" rows="4" placeholder="Escreva aqui suas observações sobre esta estação..." required></textarea>
            </div>
          `}
          <button type="submit" class="btn-primary">Registrar Descoberta</button>
        </form>
      </div>
    </section>
  `
}

// Componente: Caderno de Campo Virtual
function renderizarRelatorioCientifico(): string {
  return `
    <section class="relatorio-container">
      <button id="btn-voltar-relatorio" class="btn-back">⬅ Voltar</button>
      <h2>📜 Caderno de Campo Virtual</h2>
      <p><strong>Investigador:</strong> ${estado.cracha?.nome} | <strong>Turma/Grupo:</strong> ${estado.cracha?.codigoTurma}</p>

      ${estado.respostas.length === 0 ? `
        <div class="empty-state">
          <p>Sua caderneta está vazia. Visite as estações e registre suas descobertas!</p>
        </div>
      ` : `
        <div class="respostas-historico">
          ${estado.respostas.map(r => {
            const recanto = recantos.find(rec => rec.id === r.recantoId)
            return `
              <div class="resposta-card">
                <span class="data-hora">${r.dataHora}</span>
                <h4>${recanto?.nome || 'Estação'}</h4>
                <p><strong>Pergunta:</strong> ${r.perguntaTexto}</p>
                <p class="resposta-dada"><strong>Sua Resposta:</strong> ${r.respostaDada}</p>
                <span class="status-tag ${r.estaCorreta ? 'correta' : 'registro'}">
                  ${r.estaCorreta ? '✓ Registro Concluído' : '📝 Observação Registrada'}
                </span>
              </div>
            `
          }).join('')}
        </div>
      `}
    </section>
  `
}

// Componente: Modal de Sucesso
function renderizarModalSucesso(): string {
  if (!modalSucessoAberto) return ''
  return `
    <div class="modal-overlay">
      <div class="modal-card">
        <div class="modal-icon">🌱</div>
        <h3>Descoberta Registrada!</h3>
        <p>${mensagemSucessoModal}</p>
        <button id="btn-fechar-modal" class="btn-primary">Continuar Trilha</button>
      </div>
    </div>
  `
}

// Auxiliar de Renderização
function renderAppSemHistorico() {
  let conteudo = renderizarHeader()

  if (!estado.cracha) {
    conteudo += renderizarFormularioCracha()
  } else if (exibindoRelatorio) {
    conteudo += renderizarRelatorioCientifico()
  } else if (estado.missaoAtual) {
    conteudo += renderizarMissao(estado.missaoAtual)
  } else if (estado.recantoAtual) {
    conteudo += renderizarDetalheRecanto(estado.recantoAtual)
  } else {
    conteudo += renderizarListaRecantos()
  }

  conteudo += renderizarModalSucesso()
  app.innerHTML = conteudo
  vincularEventos()
}

// Renderizador Principal da Interface
function renderApp() {
  atualizarHistoricoNavegacao()
  renderAppSemHistorico()
}

// Associação de Eventos da Interface
function vincularEventos() {
  // Logo -> Tela Inicial
  document.querySelector('#btn-logo')?.addEventListener('click', () => {
    estado.recantoAtual = null
    estado.missaoAtual = null
    exibindoRelatorio = false
    renderApp()
  })

  // Form de Identificação
  const formCracha = document.querySelector('#form-cracha') as HTMLFormElement
  if (formCracha) {
    formCracha.addEventListener('submit', (e) => {
      e.preventDefault()
      const codigoInput = (document.querySelector('#codigo-turma') as HTMLInputElement).value
      const nomeInput = (document.querySelector('#nome-aluno') as HTMLInputElement).value
      if (codigoInput && nomeInput) {
        estado.cracha = { nome: nomeInput, codigoTurma: codigoInput.toUpperCase() }
        salvarCracha(estado.cracha)
        renderApp()
      }
    })
  }

  // Trocar/Sair Usuário
  document.querySelector('#btn-trocar-usuario')?.addEventListener('click', () => {
    if (confirm('Deseja sair da sessão atual para trocar de identificação?')) {
      localStorage.removeItem('explore_its_cracha')
      estado.cracha = null
      estado.recantoAtual = null
      estado.missaoAtual = null
      exibindoRelatorio = false
      renderApp()
    }
  })

  // Explorar Estação
  document.querySelectorAll('.btn-explorar').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement
      const id = target.getAttribute('data-id')
      estado.recantoAtual = recantos.find(r => r.id === id) || null
      renderApp()
    })
  })

  // Voltar da Estação para a Lista
  document.querySelector('#btn-voltar-recantos')?.addEventListener('click', () => {
    estado.recantoAtual = null
    renderApp()
  })

  // Iniciar Missão
  document.querySelectorAll('.btn-iniciar-missao').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement
      const missaoId = target.getAttribute('data-missaoid')
      if (estado.recantoAtual) {
        estado.missaoAtual = estado.recantoAtual.missoes.find(m => m.id === missaoId) || null
        renderApp()
      }
    })
  })

  // Voltar da Missão para a Estação
  document.querySelector('#btn-voltar-missoes')?.addEventListener('click', () => {
    estado.missaoAtual = null
    renderApp()
  })

  // Submeter Resposta da Missão
  const formResposta = document.querySelector('#form-resposta') as HTMLFormElement
  if (formResposta && estado.missaoAtual && estado.recantoAtual) {
    formResposta.addEventListener('submit', (e) => {
      e.preventDefault()
      const pergunta = estado.missaoAtual!.pergunta
      let respostaTexto = ''
      let correta = true

      if (pergunta.tipo === 'multipla_escolha') {
        const selecionada = document.querySelector('input[name="resposta"]:checked') as HTMLInputElement
        if (selecionada) {
          const idx = parseInt(selecionada.value)
          respostaTexto = pergunta.opcoes ? pergunta.opcoes[idx] : ''
          correta = idx === pergunta.respostaCorreta
        }
      } else {
        const areaTexto = document.querySelector('#resposta-texto') as HTMLTextAreaElement
        respostaTexto = areaTexto.value
      }

      const novaResposta: RespostaSubmetida = {
        recantoId: estado.recantoAtual!.id,
        missaoId: estado.missaoAtual!.id,
        perguntaTexto: pergunta.texto,
        respostaDada: respostaTexto,
        estaCorreta: correta,
        dataHora: new Date().toLocaleString('pt-BR')
      }

      const indexExistente = estado.respostas.findIndex(r => r.recantoId === novaResposta.recantoId && r.missaoId === novaResposta.missaoId)
      if (indexExistente >= 0) {
        estado.respostas[indexExistente] = novaResposta
      } else {
        estado.respostas.push(novaResposta)
      }

      salvarRespostas(estado.respostas)

      mensagemSucessoModal = 'Sua observação foi salva no Caderno de Campo com sucesso!'
      modalSucessoAberto = true
      renderApp()
    })
  }

  // Modal Fechar
  document.querySelector('#btn-fechar-modal')?.addEventListener('click', () => {
    modalSucessoAberto = false
    estado.missaoAtual = null
    estado.recantoAtual = null
    renderApp()
  })

  // Botão Caderno de Campo
  document.querySelector('#btn-relatorio')?.addEventListener('click', () => {
    exibindoRelatorio = true
    renderApp()
  })

  document.querySelector('#btn-voltar-relatorio')?.addEventListener('click', () => {
    exibindoRelatorio = false
    renderApp()
  })
}

// Inicialização da Aplicação
renderApp()