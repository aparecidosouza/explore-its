import './style.css'

// Interfaces dos Modelos de Dados
interface Pergunta {
  id: string
  texto: string
  tipo: 'multipla_escolha' | 'texto' | 'foto' | 'audio' | 'sensor_clima'
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
  midiaUrl?: string // URL da foto ou áudio em base64/blob
  tipoMidia?: 'foto' | 'audio' | 'texto'
  estaCorreta?: boolean
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
}

// Estado Global da Aplicação
const estado: EstadoApp = {
  cracha: carregarCrachaSalvo(),
  recantoAtual: null,
  missaoAtual: null,
  respostas: carregarRespostasSalvas()
}

// Controle de Mídias e Modais
let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []
let gravandoAudio = false
let fotoCapturadaBase64: string | null = null
let audioGravadoBase64: string | null = null

let modalSucessoAberto = false
let mensagemSucessoModal = ''
let exibindoRelatorio = false

// Estações com Sensores, Câmera e Gravador de Áudio
const recantos: Recanto[] = [
  {
    id: 'estacao-barauna',
    nome: 'Estação Baraúna',
    descricao: 'Explore a imponente árvore símbolo do Cerrado, registre fotos e meça as condições da sombra.',
    icone: '🌳',
    missoes: [
      {
        id: 'm-bar-1',
        titulo: 'Registro Fotográfico do Tronco',
        descricao: 'Tire uma foto bem de perto da casca espessa da Baraúna para registrar suas fissuras.',
        concluida: false,
        pergunta: {
          id: 'p-bar-1',
          texto: 'Fotografe a casca do tronco da árvore:',
          tipo: 'foto'
        }
      },
      {
        id: 'm-bar-2',
        titulo: 'Coleta Microclimática',
        descricao: 'Utilize o sensor do aplicativo para aferir a temperatura e umidade sob a copa da Baraúna.',
        concluida: false,
        pergunta: {
          id: 'p-bar-2',
          texto: 'Afera a temperatura e condições ambientais neste ponto:',
          tipo: 'sensor_clima'
        }
      }
    ]
  },
  {
    id: 'estacao-saci-perere',
    nome: 'Estação Saci-Pererê',
    descricao: 'Investigue o ecossistema e grave os sons da natureza ou relatos sobre os mistérios da mata.',
    icone: '🌪️',
    missoes: [
      {
        id: 'm-saci-1',
        titulo: 'Sons da Mata',
        descricao: 'Grave um áudio de 10 segundos capturando o barulho do vento nas folhas ou os pássaros ao redor.',
        concluida: false,
        pergunta: {
          id: 'p-saci-1',
          texto: 'Grave o som ambiente desta estação:',
          tipo: 'audio'
        }
      }
    ]
  },
  {
    id: 'estacao-jatoba',
    nome: 'Estação Jatobá',
    descricao: 'Analise os frutos e sementes do Jatobá e responda às questões ecológicas.',
    icone: '🌰',
    missoes: [
      {
        id: 'm-jat-1',
        titulo: 'Análise de Resistência',
        descricao: 'Examine a rigidez da semente de Jatobá encontrada na trilha.',
        concluida: false,
        pergunta: {
          id: 'p-jat-1',
          texto: 'Como a casca dura do fruto do Jatobá protege a semente?',
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
    id: 'estacao-caipora',
    nome: 'Estação Caipora',
    descricao: 'Registre evidências de fauna silvestre e pegadas no solo através de fotos.',
    icone: '🐾',
    missoes: [
      {
        id: 'm-cai-1',
        titulo: 'Rastros de Animais',
        descricao: 'Procure por pegadas ou sinais de animais no solo e fotografe o achado.',
        concluida: false,
        pergunta: {
          id: 'p-cai-1',
          texto: 'Tire uma foto do vestígio de fauna encontrado:',
          tipo: 'foto'
        }
      }
    ]
  },
  {
    id: 'estacao-nego-dagua',
    nome: 'Estação Nego D\'Água',
    descricao: 'Analise a umidade ao redor do curso d\'água e grave o som do fluxo de água.',
    icone: '💧',
    missoes: [
      {
        id: 'm-neg-1',
        titulo: 'Som do Córrego',
        descricao: 'Grave um áudio perto do curso d\'água para registrar o barulho da correnteza.',
        concluida: false,
        pergunta: {
          id: 'p-neg-1',
          texto: 'Grave o áudio do fluxo d\'água:',
          tipo: 'audio'
        }
      }
    ]
  }
]

const app = document.querySelector<HTMLDivElement>('#app')!

// Funções de Armazenamento Local
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

// Componente: Header
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

// Componente: Formulário Inicial
function renderizarFormularioCracha(): string {
  return `
    <section class="card-container">
      <h2>Trilha Explore ITS</h2>
      <p>Informe a Turma e seu Nome para acessar os recursos de campo (Câmera, Áudio e Sensores):</p>
      <form id="form-cracha" class="cracha-form">
        <div class="form-group">
          <label for="codigo-turma">Código da Turma:</label>
          <input type="text" id="codigo-turma" placeholder="Ex: ITS-6A" required />
        </div>
        <div class="form-group">
          <label for="nome-aluno">Nome do Aluno:</label>
          <input type="text" id="nome-aluno" placeholder="Ex: Lucas Mendes" required />
        </div>
        <button type="submit" class="btn-primary">Iniciar Expedição</button>
      </form>
    </section>
  `
}

// Componente: Lista de Estações
function renderizarListaRecantos(): string {
  return `
    <section class="recantos-container">
      <div class="welcome-box">
        <h2>Estações da Trilha</h2>
        <p>Selecione uma estação para realizar coletas de campo e responder aos desafios:</p>
      </div>
      <div class="grid-recantos">
        ${recantos.map(recanto => {
          const concluidas = recanto.missoes.filter(m => 
            estado.respostas.some(r => r.recantoId === recanto.id && r.missaoId === m.id)
          ).length
          const total = recanto.missoes.length

          return `
            <div class="recanto-card">
              <div class="recanto-icon">${recanto.icone}</div>
              <h3>${recanto.nome}</h3>
              <p>${recanto.descricao}</p>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${(concluidas / total) * 100}%"></div>
              </div>
              <span class="progress-text">${concluidas} de${total} concluídos</span>
              <button class="btn-primary btn-explorar" data-id="${recanto.id}">Explorar Estação</button>
            </div>
          `
        }).join('')}
      </div>
    </section>
  `
}

// Componente: Detalhes da Estação
function renderizarDetalheRecanto(recanto: Recanto): string {
  return `
    <section class="recanto-detalhe">
      <button id="btn-voltar-recantos" class="btn-back">⬅ Voltar para Estações</button>
      <div class="recanto-header">
        <span class="recanto-icon-lg">${recanto.icone}</span>
        <h2>${recanto.nome}</h2>
        <p>${recanto.descricao}</p>
      </div>

      <h3>Desafios Disponíveis</h3>
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
                ${resolvida ? 'Refazer Desafio' : 'Iniciar Coleta'}
              </button>
            </div>
          `
        }).join('')}
      </div>
    </section>
  `
}

// Componente: Interface da Missão (com Câmera, Áudio, Temperatura)
function renderizarMissao(missao: Missao): string {
  const tipo = missao.pergunta.tipo

  return `
    <section class="missao-detalhe">
      <button id="btn-voltar-missoes" class="btn-back">⬅ Voltar à Estação</button>
      
      <div class="missao-header">
        <span class="tag">Investigação de Campo</span>
        <h2>${missao.titulo}</h2>
        <p>${missao.descricao}</p>
      </div>

      <div class="pergunta-box">
        <h3>${missao.pergunta.texto}</h3>

        <form id="form-resposta">
          ${tipo === 'foto' ? `
            <div class="media-container">
              <input type="file" id="input-camera" accept="image/*" capture="environment" style="display:none;" />
              <button type="button" id="btn-tirar-foto" class="btn-secondary">📷 Abrir Câmera</button>
              <div id="preview-foto-container" class="preview-box">
                ${fotoCapturadaBase64 ? `<img src="${fotoCapturadaBase64}" class="img-preview" />` : '<p>Nenhuma foto capturada</p>'}
              </div>
            </div>
          ` : ''}

          ${tipo === 'audio' ? `
            <div class="media-container">
              <button type="button" id="btn-gravador-audio" class="btn-secondary">
                ${gravandoAudio ? '🔴 Parar Gravação' : '🎙️ Iniciar Gravação de Som'}
              </button>
              <div id="preview-audio-container" class="preview-box">
                ${audioGravadoBase64 ? `<audio controls src="${audioGravadoBase64}"></audio>` : '<p>Nenhum áudio gravado</p>'}
              </div>
            </div>
          ` : ''}

          ${tipo === 'sensor_clima' ? `
            <div class="sensor-container">
              <button type="button" id="btn-ler-sensor" class="btn-secondary">🌡️ Ler Dados do Ambiente</button>
              <div id="dados-sensor" class="sensor-box">
                <p>Clique acima para aferir a temperatura e luz do ambiente.</p>
              </div>
            </div>
          ` : ''}

          ${tipo === 'multipla_escolha' ? `
            <div class="opcoes-container">
              ${missao.pergunta.opcoes?.map((opcao, idx) => `
                <label class="opcao-label">
                  <input type="radio" name="resposta" value="${idx}" required />
                  <span>${opcao}</span>
                </label>
              `).join('')}
            </div>
          ` : ''}

          ${tipo === 'texto' ? `
            <div class="form-group">
              <textarea id="resposta-texto" rows="4" placeholder="Escreva aqui suas observações de campo..." required></textarea>
            </div>
          ` : ''}

          <button type="submit" class="btn-primary" style="margin-top: 15px;">Salvar Descoberta</button>
        </form>
      </div>
    </section>
  `
}

// Componente: Caderno de Campo (com exibição de Fotos e Áudios)
function renderizarRelatorioCientifico(): string {
  return `
    <section class="relatorio-container">
      <button id="btn-voltar-relatorio" class="btn-back">⬅ Voltar</button>
      <h2>📜 Caderno de Campo Virtual</h2>
      <p><strong>Investigador:</strong> ${estado.cracha?.nome} | <strong>Turma:</strong> ${estado.cracha?.codigoTurma}</p>

      ${estado.respostas.length === 0 ? `
        <div class="empty-state">
          <p>Seu caderno está vazio. Explore as estações para registrar fotos, áudios e respostas!</p>
        </div>
      ` : `
        <div class="respostas-historico">
          ${estado.respostas.map(r => {
            const recanto = recantos.find(rec => rec.id === r.recantoId)
            return `
              <div class="resposta-card">
                <span class="data-hora">${r.dataHora}</span>
                <h4>${recanto?.nome || 'Estação'}</h4>
                <p><strong>Desafio:</strong> ${r.perguntaTexto}</p>
                <p><strong>Registro:</strong> ${r.respostaDada}</p>
                
                ${r.tipoMidia === 'foto' && r.midiaUrl ? `
                  <div class="media-preview">
                    <img src="${r.midiaUrl}" alt="Registro Fotográfico" class="img-preview" />
                  </div>
                ` : ''}

                ${r.tipoMidia === 'audio' && r.midiaUrl ? `
                  <div class="media-preview">
                    <audio controls src="${r.midiaUrl}"></audio>
                  </div>
                ` : ''}

                <span class="status-tag correta">✅ Registrado</span>
              </div>
            `
          }).join('')}
        </div>
      `}
    </section>
  `
}

// Modal de Confirmação
function renderizarModalSucesso(): string {
  if (!modalSucessoAberto) return ''
  return `
    <div class="modal-overlay">
      <div class="modal-card">
        <div class="modal-icon">🌿</div>
        <h3>Sucesso!</h3>
        <p>${mensagemSucessoModal}</p>
        <button id="btn-fechar-modal" class="btn-primary">Continuar Expedição</button>
      </div>
    </div>
  `
}

// Renderizador da Aplicação
function renderApp() {
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

// Associação de Eventos e Ativação dos Sensores
function vincularEventos() {
  document.querySelector('#btn-logo')?.addEventListener('click', () => {
    estado.recantoAtual = null
    estado.missaoAtual = null
    exibindoRelatorio = false
    renderApp()
  })

  // Login
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

  document.querySelector('#btn-trocar-usuario')?.addEventListener('click', () => {
    if (confirm('Deseja trocar de usuário?')) {
      localStorage.removeItem('explore_its_cracha')
      estado.cracha = null
      estado.recantoAtual = null
      estado.missaoAtual = null
      exibindoRelatorio = false
      renderApp()
    }
  })

  // Navegação
  document.querySelectorAll('.btn-explorar').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-id')
      estado.recantoAtual = recantos.find(r => r.id === id) || null
      renderApp()
    })
  })

  document.querySelector('#btn-voltar-recantos')?.addEventListener('click', () => {
    estado.recantoAtual = null
    renderApp()
  })

  document.querySelectorAll('.btn-iniciar-missao').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const missaoId = (e.currentTarget as HTMLElement).getAttribute('data-missaoid')
      if (estado.recantoAtual) {
        fotoCapturadaBase64 = null
        audioGravadoBase64 = null
        estado.missaoAtual = estado.recantoAtual.missoes.find(m => m.id === missaoId) || null
        renderApp()
      }
    })
  })

  document.querySelector('#btn-voltar-missoes')?.addEventListener('click', () => {
    estado.missaoAtual = null
    renderApp()
  })

  // FUNCIONALIDADE 1: CÂMERA
  const btnTirarFoto = document.querySelector('#btn-tirar-foto')
  const inputCamera = document.querySelector('#input-camera') as HTMLInputElement
  if (btnTirarFoto && inputCamera) {
    btnTirarFoto.addEventListener('click', () => inputCamera.click())
    inputCamera.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          fotoCapturadaBase64 = event.target?.result as string
          renderApp()
        }
        reader.readAsDataURL(file)
      }
    })
  }

  // FUNCIONALIDADE 2: GRAVADOR DE ÁUDIO
  const btnGravadorAudio = document.querySelector('#btn-gravador-audio')
  if (btnGravadorAudio) {
    btnGravadorAudio.addEventListener('click', async () => {
      if (!gravandoAudio) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          mediaRecorder = new MediaRecorder(stream)
          audioChunks = []

          mediaRecorder.ondataavailable = (event) => audioChunks.push(event.data)
          mediaRecorder.onstop = () => {
            const blobAudio = new Blob(audioChunks, { type: 'audio/webm' })
            const reader = new FileReader()
            reader.onload = (e) => {
              audioGravadoBase64 = e.target?.result as string
              renderApp()
            }
            reader.readAsDataURL(blobAudio)
          }

          mediaRecorder.start()
          gravandoAudio = true
          renderApp()
        } catch (err) {
          alert('Permissão de microfone negada ou não suportada.')
        }
      } else {
        if (mediaRecorder) {
          mediaRecorder.stop()
          mediaRecorder.stream.getTracks().forEach(track => track.stop())
        }
        gravandoAudio = false
      }
    })
  }

  // FUNCIONALIDADE 3: SENSOR CLIMÁTICO / LUZ
  const btnLerSensor = document.querySelector('#btn-ler-sensor')
  if (btnLerSensor) {
    btnLerSensor.addEventListener('click', () => {
      const box = document.querySelector('#dados-sensor')
      if (box) {
        const tempSimulada = (26 + Math.random() * 4).toFixed(1)
        const umidadeSimulada = (55 + Math.random() * 15).toFixed(0)
        box.innerHTML = `
          <p>🌡️ <strong>Temperatura Estimada:</strong> ${tempSimulada} °C</p>
          <p>💧 <strong>Umidade Relativa:</strong> ${umidadeSimulada}%</p>
          <p>☀️ <strong>Luminosidade:</strong> Alta (Coleta do Cerrado)</p>
        `
      }
    })
  }

  // ENVIO DE RESPOSTAS E MÍDIAS
  const formResposta = document.querySelector('#form-resposta') as HTMLFormElement
  if (formResposta && estado.missaoAtual && estado.recantoAtual) {
    formResposta.addEventListener('submit', (e) => {
      e.preventDefault()
      const tipo = estado.missaoAtual!.pergunta.tipo
      let respostaTexto = 'Registro Efetuado'
      let midiaUrl: string | undefined = undefined
      let tipoMidia: 'foto' | 'audio' | 'texto' = 'texto'

      if (tipo === 'foto') {
        if (!fotoCapturadaBase64) return alert('Por favor, tire uma foto antes de salvar.')
        midiaUrl = fotoCapturadaBase64
        respostaTexto = 'Fotografia capturada na estação'
        tipoMidia = 'foto'
      } else if (tipo === 'audio') {
        if (!audioGravadoBase64) return alert('Por favor, grave um áudio antes de salvar.')
        midiaUrl = audioGravadoBase64
        respostaTexto = 'Áudio gravado na estação'
        tipoMidia = 'audio'
      } else if (tipo === 'sensor_clima') {
        const box = document.querySelector('#dados-sensor')
        respostaTexto = box?.textContent || 'Aferição de temperatura e clima realizada'
      } else if (tipo === 'multipla_escolha') {
        const selecionada = document.querySelector('input[name="resposta"]:checked') as HTMLInputElement
        if (selecionada) {
          const idx = parseInt(selecionada.value)
          respostaTexto = estado.missaoAtual!.pergunta.opcoes ? estado.missaoAtual!.pergunta.opcoes[idx] : ''
        }
      } else if (tipo === 'texto') {
        const areaTexto = document.querySelector('#resposta-texto') as HTMLTextAreaElement
        respostaTexto = areaTexto.value
      }

      const novaResposta: RespostaSubmetida = {
        recantoId: estado.recantoAtual!.id,
        missaoId: estado.missaoAtual!.id,
        perguntaTexto: estado.missaoAtual!.pergunta.texto,
        respostaDada: respostaTexto,
        midiaUrl,
        tipoMidia,
        dataHora: new Date().toLocaleString('pt-BR')
      }

      const indexExistente = estado.respostas.findIndex(r => r.recantoId === novaResposta.recantoId && r.missaoId === novaResposta.missaoId)
      if (indexExistente >= 0) {
        estado.respostas[indexExistente] = novaResposta
      } else {
        estado.respostas.push(novaResposta)
      }

      salvarRespostas(estado.respostas)

      mensagemSucessoModal = 'Sua descoberta e mídias foram salvas no Caderno de Campo com sucesso!'
      modalSucessoAberto = true
      renderApp()
    })
  }

  // Fechar Modal
  document.querySelector('#btn-fechar-modal')?.addEventListener('click', () => {
    modalSucessoAberto = false
    estado.missaoAtual = null
    estado.recantoAtual = null
    renderApp()
  })

  // Ver Caderno
  document.querySelector('#btn-relatorio')?.addEventListener('click', () => {
    exibindoRelatorio = true
    renderApp()
  })

  document.querySelector('#btn-voltar-relatorio')?.addEventListener('click', () => {
    exibindoRelatorio = false
    renderApp()
  })
}

// Inicializa o App
renderApp()