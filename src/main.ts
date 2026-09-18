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
  turma: string
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

// Controle do Modal de Feedback de Sucesso
let modalSucessoAberto = false
let mensagemSucessoModal = ''
let exibindoRelatorio = false
let navegandoViaHistorico = false

// Dados do Ecossistema Escolar / Trilha Científica
const recantos: Recanto[] = [
  {
    id: 'recanto-1',
    nome: 'Recanto das Plantas Medicinais',
    descricao: 'Explore a horta medicinal, identifique espécies e aprenda sobre princípios ativos.',
    icone: '🌿',
    missoes: [
      {
        id: 'm1-1',
        titulo: 'Identificação de Hortelã',
        descricao: 'Localize a horta de hortelã e observe a textura e o aroma das folhas.',
        concluida: false,
        pergunta: {
          id: 'p1-1',
          texto: 'Qual é o principal uso tradicional do chá de hortelã-pimenta?',
          tipo: 'multipla_escolha',
          opcoes: [
            'Auxílio na digestão e alívio de cólicas',
            'Tratamento de fraturas ósseas',
            'Substituto do sal de cozinha',
            'Aumento da pressão arterial'
          ],
          respostaCorreta: 0
        }
      },
      {
        id: 'm1-2',
        titulo: 'Registro Biológico',
        descricao: 'Escolha uma planta medicinal do recanto e descreva suas características observadas.',
        concluida: false,
        pergunta: {
          id: 'p1-2',
          texto: 'Escreva o nome de uma planta observada e descreva a forma de suas folhas:',
          tipo: 'texto'
        }
      }
    ]
  },
  {
    id: 'recanto-2',
    nome: 'Estação de Compostagem',
    descricao: 'Investigue como a matéria orgânica é reciclada e transformada em adubo pelos decompositores.',
    icone: '🍂',
    missoes: [
      {
        id: 'm2-1',
        titulo: 'Agentes Decompositores',
        descricao: 'Observe o composto em degradação e identifique a presença de organismos vivos.',
        concluida: false,
        pergunta: {
          id: 'p2-1',
          texto: 'Quais organismos são os principais responsáveis pela transformação dos resíduos na composteira?',
          tipo: 'multipla_escolha',
          opcoes: [
            'Fungos, bactérias e minhocas',
            'Apenas luz solar e água',
            'Pássaros e roedores',
            'Plásticos e metais'
          ],
          respostaCorreta: 0
        }
      }
    ]
  },
  {
    id: 'recanto-3',
    nome: 'Hotel de Insetos & Polinizadores',
    descricao: 'Descubra a importância dos insetos solitários na polinização das plantas da escola.',
    icone: '🐝',
    missoes: [
      {
        id: 'm3-1',
        titulo: 'Observação de Polinizadores',
        descricao: 'Observe os furos de madeira do hotel de insetos e procure por abelhas solitárias.',
        concluida: false,
        pergunta: {
          id: 'p3-1',
          texto: 'Qual o papel vital das abelhas na manutenção da biodiversidade vegetal?',
          tipo: 'multipla_escolha',
          opcoes: [
            'Polinização das flores permitindo a geração de frutos e sementes',
            'Consumo total das folhas das árvores',
            'Aumento da compactação do solo',
            'Limpeza de resíduos plásticos'
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
  localStorage.setItem('ecotrilha_cracha', JSON.stringify(cracha))
}

function carregarCrachaSalvo(): CrachaEstudante | null {
  const salvo = localStorage.getItem('ecotrilha_cracha')
  return salvo ? JSON.parse(salvo) : null
}

function salvarRespostas(respostas: RespostaSubmetida[]) {
  localStorage.setItem('ecotrilha_respostas', JSON.stringify(respostas))
}

function carregarRespostasSalvas(): RespostaSubmetida[] {
  const salvas = localStorage.getItem('ecotrilha_respostas')
  return salvas ? JSON.parse(salvas) : []
}

// Sincroniza o Histórico do Navegador para interceptar o botão voltar do celular
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

  // Se estamos na Tela Inicial (Raiz do App), usamos replaceState para não acumular histórico desnecessário
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
    // Retorno para a raiz (Tela Inicial de Estações)
    estado.recantoAtual = null
    estado.missaoAtual = null
    exibindoRelatorio = false
    estado.modoProfessor = false
  }

  // Renderiza a interface sem adicionar novo item à pilha
  let conteudo = renderizarHeader()

  if (estado.modoProfessor) {
    conteudo += renderizarPainelProfessor()
  } else if (exibindoRelatorio) {
    conteudo += renderizarRelatorioCientifico()
  } else if (!estado.cracha) {
    conteudo += renderizarFormularioCracha()
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
})

// Componente: Header do App
function renderizarHeader(): string {
  return `
    <header class="app-header">
      <div class="header-content">
        <h1 id="btn-logo" class="logo">🌿 EcoTrilha Escolar</h1>
        ${estado.cracha ? `
          <div class="user-badge">
            <span class="user-name">👤 ${estado.cracha.nome} (${estado.cracha.turma})</span>
            <button id="btn-relatorio" class="btn-secondary">📜 Caderno</button>
            <button id="btn-alternar-modo" class="btn-prof">
              ${estado.modoProfessor ? '🎓 Aluno' : '👨‍🏫 Prof'}
            </button>
          </div>
        ` : ''}
      </div>
    </header>
  `
}

// Componente: Identificação do Aluno (Crachá)
function renderizarFormularioCracha(): string {
  return `
    <section class="card-container">
      <h2>Identificação do Cientista Mirim</h2>
      <p>Informe seus dados para registrar as descobertas no seu Caderno de Campo:</p>
      <form id="form-cracha" class="cracha-form">
        <div class="form-group">
          <label for="nome-aluno">Seu Nome Completo:</label>
          <input type="text" id="nome-aluno" placeholder="Ex: Maria Silva" required />
        </div>
        <div class="form-group">
          <label for="turma-aluno">Sua Turma / Ano:</label>
          <input type="text" id="turma-aluno" placeholder="Ex: 6º Ano A" required />
        </div>
        <button type="submit" class="btn-primary">Iniciar Expedição</button>
      </form>
    </section>
  `
}

// Componente: Lista Principal de Recantos
function renderizarListaRecantos(): string {
  return `
    <section class="recantos-container">
      <div class="welcome-box">
        <h2>Estações de Investigação</h2>
        <p>Escolha um Recanto Aprendiz para realizar suas missões de campo:</p>
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
              <span class="progress-text">${concluidas} de${total} missões registradas</span>
              <button class="btn-primary btn-explorar" data-id="${recanto.id}">Explorar Recanto</button>
            </div>
          `
        }).join('')}
      </div>
    </section>
  `
}

// Componente: Detalhes do Recanto Selecionado
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
                ${resolvida ? 'Refazer Missão' : 'Iniciar Investigação'}
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
      <button id="btn-voltar-missoes" class="btn-back">⬅ Voltar ao Recanto</button>
      
      <div class="missao-header">
        <span class="tag">Investigação de Campo</span>
        <h2>${missao.titulo}</h2>
        <p>${missao.descricao}</p>
      </div>

      <div class="pergunta-box">
        <h3>Desafio Científico</h3>
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
              <textarea id="resposta-texto" rows="4" placeholder="Escreva aqui suas observações de campo..." required></textarea>
            </div>
          `}
          <button type="submit" class="btn-primary">Submeter Descoberta</button>
        </form>
      </div>
    </section>
  `
}

// Componente: Caderno de Campo / Relatório
function renderizarRelatorioCientifico(): string {
  return `
    <section class="relatorio-container">
      <button id="btn-voltar-relatorio" class="btn-back">⬅ Voltar</button>
      <h2>📜 Caderno de Campo Virtual</h2>
      <p><strong>Cientista:</strong> ${estado.cracha?.nome} | <strong>Turma:</strong> ${estado.cracha?.turma}</p>

      ${estado.respostas.length === 0 ? `
        <div class="empty-state">
          <p>Você ainda não registrou nenhuma descoberta. Explore as estações e responda aos desafios!</p>
        </div>
      ` : `
        <div class="respostas-historico">
          ${estado.respostas.map(r => {
            const recanto = recantos.find(rec => rec.id === r.recantoId)
            return `
              <div class="resposta-card">
                <span class="data-hora">${r.dataHora}</span>
                <h4>${recanto?.nome || 'Recanto'}</h4>
                <p><strong>Pergunta:</strong> ${r.perguntaTexto}</p>
                <p class="resposta-dada"><strong>Sua Resposta:</strong> ${r.respostaDada}</p>
                <span class="status-tag ${r.estaCorreta ? 'correta' : 'registro'}">
                  ${r.estaCorreta ? '✓ Resposta Correta' : '📝 Observação Registrada'}
                </span>
              </div>
            `
          }).join('')}
        </div>
      `}
    </section>
  `
}

// Componente: Painel do Professor
function renderizarPainelProfessor(): string {
  return `
    <section class="painel-professor">
      <button id="btn-voltar-prof" class="btn-back">⬅ Voltar ao Modo Aluno</button>
      <h2>👨‍🏫 Painel do Professor / Curador</h2>
      <p>Visão geral de participações e respostas enviadas neste dispositivo:</p>

      <div class="stats-cards">
        <div class="stat-card">
          <h3>Total de Registros</h3>
          <span class="number">${estado.respostas.length}</span>
        </div>
        <div class="stat-card">
          <h3>Aluno Ativo</h3>
          <span class="text">${estado.cracha ? estado.cracha.nome : 'Nenhum'}</span>
        </div>
      </div>

      <h3>Registros Locais Armazenados</h3>
      <div class="tabela-container">
        <table class="tabela-respostas">
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Estação</th>
              <th>Pergunta</th>
              <th>Resposta</th>
            </tr>
          </thead>
          <tbody>
            ${estado.respostas.map(r => `
              <tr>
                <td>${r.dataHora}</td>
                <td>${r.recantoId}</td>
                <td>${r.perguntaTexto}</td>
                <td>${r.respostaDada}</td>
              </tr>
            `).join('')}
            ${estado.respostas.length === 0 ? `<tr><td colspan="4">Nenhum registro encontrado.</td></tr>` : ''}
          </tbody>
        </table>
      </div>
      <button id="btn-limpar-dados" class="btn-danger">Limpar Registros Locais</button>
    </section>
  `
}

// Componente: Modal de Sucesso Feedback
function renderizarModalSucesso(): string {
  if (!modalSucessoAberto) return ''
  return `
    <div class="modal-overlay">
      <div class="modal-card">
        <div class="modal-icon">🎉</div>
        <h3>Descoberta Registrada!</h3>
        <p>${mensagemSucessoModal}</p>
        <button id="btn-fechar-modal" class="btn-primary">Continuar Trilha</button>
      </div>
    </div>
  `
}

// Renderizador Principal da Interface
function renderApp() {
  atualizarHistoricoNavegacao()

  let conteudo = renderizarHeader()

  if (estado.modoProfessor) {
    conteudo += renderizarPainelProfessor()
  } else if (exibindoRelatorio) {
    conteudo += renderizarRelatorioCientifico()
  } else if (!estado.cracha) {
    conteudo += renderizarFormularioCracha()
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

// Associação de Eventos da Interface
function vincularEventos() {
  // Logo -> Tela Inicial
  document.querySelector('#btn-logo')?.addEventListener('click', () => {
    estado.recantoAtual = null
    estado.missaoAtual = null
    exibindoRelatorio = false
    estado.modoProfessor = false
    renderApp()
  })

  // Form de Crachá
  const formCracha = document.querySelector('#form-cracha') as HTMLFormElement
  if (formCracha) {
    formCracha.addEventListener('submit', (e) => {
      e.preventDefault()
      const nomeInput = (document.querySelector('#nome-aluno') as HTMLInputElement).value
      const turmaInput = (document.querySelector('#turma-aluno') as HTMLInputElement).value
      if (nomeInput && turmaInput) {
        estado.cracha = { nome: nomeInput, turma: turmaInput }
        salvarCracha(estado.cracha)
        renderApp()
      }
    })
  }

  // Explorar Recanto
  document.querySelectorAll('.btn-explorar').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement
      const id = target.getAttribute('data-id')
      estado.recantoAtual = recantos.find(r => r.id === id) || null
      renderApp()
    })
  })

  // Voltar do Recanto para a Lista
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

  // Voltar da Missão para o Recanto
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

      // Atualiza ou insere resposta
      const indexExistente = estado.respostas.findIndex(r => r.recantoId === novaResposta.recantoId && r.missaoId === novaResposta.missaoId)
      if (indexExistente >= 0) {
        estado.respostas[indexExistente] = novaResposta
      } else {
        estado.respostas.push(novaResposta)
      }

      salvarRespostas(estado.respostas)

      mensagemSucessoModal = correta 
        ? 'Excelente observação! Sua resposta foi salva no seu Caderno de Campo.' 
        : 'Sua resposta foi registrada no Caderno de Campo para revisão posterior.'
      
      modalSucessoAberto = true
      renderApp()
    })
  }

  // Modal Fechar
  document.querySelector('#btn-fechar-modal')?.addEventListener('click', () => {
    modalSucessoAberto = false
    estado.missaoAtual = null
    renderApp()
  })

  // Botão Caderno de Campo
  document.querySelector('#btn-relatorio')?.addEventListener('click', () => {
    exibindoRelatorio = true
    estado.modoProfessor = false
    renderApp()
  })

  document.querySelector('#btn-voltar-relatorio')?.addEventListener('click', () => {
    exibindoRelatorio = false
    renderApp()
  })

  // Alternar Modo Professor
  document.querySelector('#btn-alternar-modo')?.addEventListener('click', () => {
    estado.modoProfessor = !estado.modoProfessor
    exibindoRelatorio = false
    renderApp()
  })

  document.querySelector('#btn-voltar-prof')?.addEventListener('click', () => {
    estado.modoProfessor = false
    renderApp()
  })

  // Limpar Dados do Professor
  document.querySelector('#btn-limpar-dados')?.addEventListener('click', () => {
    if (confirm('Deseja realmente apagar todas as respostas salvas neste aparelho?')) {
      estado.respostas = []
      salvarRespostas([])
      renderApp()
    }
  })
}

// Inicialização da Aplicação
renderApp()