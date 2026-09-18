import './style.css'

// Interfaces dos Modelos de Dados
interface Mascote {
  id: string
  nome: string
  emoji: string
  descricao: string
}

interface Pergunta {
  id: string
  texto: string
  tipo: 'multipla_escolha' | 'texto' | 'foto' | 'audio' | 'termometro'
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
  midiaUrl?: string
  tipoMidia?: 'foto' | 'audio' | 'texto' | 'termometro'
  dataHora: string
}

interface CrachaEstudante {
  nome: string
  codigoTurma: string
  mascote: Mascote
}

interface EstadoApp {
  cracha: CrachaEstudante | null
  recantoAtual: Recanto | null
  missaoAtual: Missao | null
  respostas: RespostaSubmetida[]
}

// Opções de Mascotes do Explore ITS
const mascotesDisponiveis: Mascote[] = [
  { id: 'lobo-guara', nome: 'Guará', emoji: '🦊', descricao: 'O guardião curioso das veredas do Cerrado.' },
  { id: 'tamandua-bandeira', nome: 'Bandeira', emoji: '🐜', descricao: 'O protetor incansável dos solos e cupinzeiros.' },
  { id: 'arara-azul', nome: 'Azulzinha', emoji: '🦜', descricao: 'A mensageira dos céus e semeadora das matas.' },
  { id: 'tatu-bola', nome: 'Bolinha', emoji: '🦔', descricao: 'O explorador resistente da vegetação nativa.' }
]

// Estado Global
const estado: EstadoApp = {
  cracha: carregarCrachaSalvo(),
  recantoAtual: null,
  missaoAtual: null,
  respostas: carregarRespostasSalvas()
}

let mascoteSelecionadoTemp: Mascote = mascotesDisponiveis[0]
let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []
let gravandoAudio = false
let fotoCapturadaBase64: string | null = null
let audioGravadoBase64: string | null = null
let dadosTermometro: { temp: number; umidade: number; sombra: string } | null = null
let modalSucessoAberto = false
let mensagemSucessoModal = ''
let exibindoRelatorio = false

// Estações com Termômetro, Câmera e Gravador de Áudio
const recantos: Recanto[] = [
  {
    id: 'estacao-barauna',
    nome: 'Estação Baraúna',
    descricao: 'Explore a imponente árvore símbolo do Cerrado, registre fotos e meça a temperatura do microclima.',
    icone: '🌳',
    missoes: [
      {
        id: 'm-bar-1',
        titulo: 'Termômetro Microclimático',
        descricao: 'Afera a temperatura ambiental e umidade relativa sob a copa da Baraúna.',
        concluida: false,
        pergunta: {
          id: 'p-bar-1',
          texto: 'Aferição do Termômetro sob a Sombra:',
          tipo: 'termometro'
        }
      },
      {
        id: 'm-bar-2',
        titulo: 'Registro Fotográfico do Tronco',
        descricao: 'Tire uma foto bem de perto da casca espessa da Baraúna para registrar suas fissuras.',
        concluida: false,
        pergunta: {
          id: 'p-bar-2',
          texto: 'Fotografe a casca do tronco da árvore:',
          tipo: 'foto'
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
        descricao: 'Grave um áudio capturando o som do vento nas folhas ou dos pássaros ao redor.',
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
    descricao: 'Analise a umidade e o microclima próximo ao curso d\'água.',
    icone: '💧',
    missoes: [
      {
        id: 'm-neg-1',
        titulo: 'Termômetro do Córrego',
        descricao: 'Meça a variação térmica próximo à água.',
        concluida: false,
        pergunta: {
          id: 'p-neg-1',
          texto: 'Afera o microclima úmido da margem:',
          tipo: 'termometro'
        }
      },
      {
        id: 'm-neg-2',
        titulo: 'Som do Córrego',
        descricao: 'Grave um áudio perto do curso d\'água para registrar o barulho da correnteza.',
        concluida: false,
        pergunta: {
          id: 'p-neg-2',
          texto: 'Grave o áudio do fluxo d\'água:',
          tipo: 'audio'
        }
      }
    ]
  }
]

const app = document.querySelector<HTMLDivElement>('#app')!

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

function renderizarHeader(): string {
  return `
    <header class="app-header">
      <div class="header-content">
        <h1 id="btn-logo" class="logo">🍃 Explore ITS</h1>
        ${estado.cracha ? `
          <div class="user-badge">
            <span class="user-name">${estado.cracha.mascote.emoji} ${estado.cracha.nome} (${estado.cracha.codigoTurma})</span>
            <button id="btn-relatorio" class="btn-secondary">📜 Caderno</button>
            <button id="btn-trocar-usuario" class="btn-prof">Sair</button>
          </div>
        ` : ''}
      </div>
    </header>
  `
}

function renderizarFormularioCracha(): string {
  return `
    <section class="card-container">
      <h2>🎒 Bem-vindo ao Explore ITS!</h2>
      <p>Configure seu crachá de expedicionário para iniciar a jornada pelo Cerrado:</p>
      
      <form id="form-cracha" class="cracha-form">
        <div class="form-group">
          <label for="codigo-turma">Código da Turma / Escola:</label>
          <input type="text" id="codigo-turma" placeholder="Ex: ITS-6A" required />
        </div>
        
        <div class="form-group">
          <label for="nome-aluno">Nome do Estudante:</label>
          <input type="text" id="nome-aluno" placeholder="Ex: Maria Silva" required />
        </div>

        <div class="form-group">
          <label>Escolha o seu Mascote de Expedição:</label>
          <div class="mascotes-grid">
            ${mascotesDisponiveis.map(m => `
              <div class="mascote-card ${mascoteSelecionadoTemp.id === m.id ? 'selecionado' : ''}" data-mascoteid="${m.id}">
                <span class="mascote-emoji">${m.emoji}</span>
                <strong>${m.nome}</strong>
                <small>${m.descricao}</small>
              </div>
            `).join('')}
          </div>
        </div>

        <button type="submit" class="btn-primary" style="margin-top: 15px;">Entrar na Trilha</button>
      </form>
    </section>
  `
}

function renderizarListaRecantos(): string {
  return `
    <section class="recantos-container">
      <div class="welcome-box">
        <h2>🌱 Estações da Trilha</h2>
        <p>Acompanhado por <strong>${estado.cracha?.mascote.emoji} ${estado.cracha?.mascote.nome}</strong>, escolha uma estação para explorar:</p>
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
              <span class="progress-text">${concluidas} de${total} desafios concluídos</span>
              <button class="btn-primary btn-explorar" data-id="${recanto.id}">Explorar Estação</button>
            </div>
          `
        }).join('')}
      </div>
    </section>
  `
}

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

function renderizarMissao(missao: Missao): string {
  const tipo = missao.pergunta.tipo

  return `
    <section class="missao-detalhe">
      <button id="btn-voltar-missoes" class="btn-back">⬅ Voltar à Estação</button>
      
      <div class="missao-header">
        <span class="tag">Investigação de Campo com ${estado.cracha?.mascote.emoji}</span>
        <h2>${missao.titulo}</h2>
        <p>${missao.descricao}</p>
      </div>

      <div class="pergunta-box">
        <h3>${missao.pergunta.texto}</h3>

        <form id="form-resposta">
          ${tipo === 'termometro' ? `
            <div class="termometro-container">
              <button type="button" id="btn-medir-termometro" class="btn-secondary">🌡️ Ler Termômetro Digital</button>
              
              <div class="termometro-display ${dadosTermometro ? 'ativo' : ''}">
                <div class="termometro-icone">🌡️</div>
                <div class="termometro-dados">
                  ${dadosTermometro ? `
                    <div class="temp-valor">${dadosTermometro.temp}°C</div>
                    <div class="temp-subtext">💧 Umidade: <strong>${dadosTermometro.umidade}%</strong></div>
                    <div class="temp-subtext">🍃 Sombra: <strong>${dadosTermometro.sombra}</strong></div>
                  ` : `
                    <p class="temp-placeholder">Aperte o botão acima para aferir o microclima da estação em tempo real.</p>
                  `}
                </div>
              </div>
            </div>
          ` : ''}

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

function renderizarRelatorioCientifico(): string {
  return `
    <section class="relatorio-container">
      <button id="btn-voltar-relatorio" class="btn-back">⬅ Voltar</button>
      <h2>📜 Caderno de Campo Virtual</h2>
      <p><strong>Investigador:</strong> ${estado.cracha?.nome} ${estado.cracha?.mascote.emoji} | <strong>Turma:</strong> ${estado.cracha?.codigoTurma}</p>

      ${estado.respostas.length === 0 ? `
        <div class="empty-state">
          <p>Seu caderno está vazio. Explore as estações para registrar fotos, áudios e leituras de termômetro!</p>
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

function renderizarModalSucesso(): string {
  if (!modalSucessoAberto) return ''
  return `
    <div class="modal-overlay">
      <div class="modal-card">
        <div class="modal-icon">${estado.cracha?.mascote.emoji || '🌿'}</div>
        <h3>Descoberta Registrada!</h3>
        <p>${mensagemSucessoModal}</p>
        <button id="btn-fechar-modal" class="btn-primary">Continuar Expedição</button>
      </div>
    </div>
  `
}

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

function vincularEventos() {
  document.querySelector('#btn-logo')?.addEventListener('click', () => {
    estado.recantoAtual = null
    estado.missaoAtual = null
    exibindoRelatorio = false
    renderApp()
  })

  // SELEÇÃO DE MASCOTE
  document.querySelectorAll('.mascote-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).getAttribute('data-mascoteid')
      const encontrado = mascotesDisponiveis.find(m => m.id === id)
      if (encontrado) {
        mascoteSelecionadoTemp = encontrado
        renderApp()
      }
    })
  })

  // CRIAÇÃO DO CRACHÁ
  const formCracha = document.querySelector('#form-cracha') as HTMLFormElement
  if (formCracha) {
    formCracha.addEventListener('submit', (e) => {
      e.preventDefault()
      const codigoInput = (document.querySelector('#codigo-turma') as HTMLInputElement).value
      const nomeInput = (document.querySelector('#nome-aluno') as HTMLInputElement).value
      if (codigoInput && nomeInput) {
        estado.cracha = {
          nome: nomeInput,
          codigoTurma: codigoInput.toUpperCase(),
          mascote: mascoteSelecionadoTemp
        }
        salvarCracha(estado.cracha)
        renderApp()
      }
    })
  }

  // SAIR / RESETAR CRACHÁ
  document.querySelector('#btn-trocar-usuario')?.addEventListener('click', () => {
    if (confirm('Deseja sair e criar um novo crachá?')) {
      localStorage.clear()
      estado.cracha = null
      estado.recantoAtual = null
      estado.missaoAtual = null
      estado.respostas = []
      exibindoRelatorio = false
      renderApp()
    }
  })

  // NAVEGAÇÃO ENTRE ESTAÇÕES
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
        dadosTermometro = null
        estado.missaoAtual = estado.recantoAtual.missoes.find(m => m.id === missaoId) || null
        renderApp()
      }
    })
  })

  document.querySelector('#btn-voltar-missoes')?.addEventListener('click', () => {
    estado.missaoAtual = null
    renderApp()
  })

  // TERMÔMETRO MICROCLIMÁTICO
  const btnMedirTermometro = document.querySelector('#btn-medir-termometro')
  if (btnMedirTermometro) {
    btnMedirTermometro.addEventListener('click', () => {
      const tempSugerida = parseFloat((25 + Math.random() * 5).toFixed(1))
      const umidadeSugerida = Math.floor(50 + Math.random() * 20)
      const opcoesSombra = ['Sombra Densa (Copa)', 'Sombra Parcial', 'Exposição Solar Direta']
      const sombraSugerida = opcoesSombra[Math.floor(Math.random() * opcoesSombra.length)]

      dadosTermometro = {
        temp: tempSugerida,
        umidade: umidadeSugerida,
        sombra: sombraSugerida
      }
      renderApp()
    })
  }

  // CÂMERA
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

  // AUDIO
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
          alert('Permissão de microfone não concedida.')
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

  // SUBMIT RESPOSTA
  const formResposta = document.querySelector('#form-resposta') as HTMLFormElement
  if (formResposta && estado.missaoAtual && estado.recantoAtual) {
    formResposta.addEventListener('submit', (e) => {
      e.preventDefault()
      const tipo = estado.missaoAtual!.pergunta.tipo
      let respostaTexto = 'Registro Efetuado'
      let midiaUrl: string | undefined = undefined
      let tipoMidia: 'foto' | 'audio' | 'texto' | 'termometro' = 'texto'

      if (tipo === 'termometro') {
        if (!dadosTermometro) return alert('Por favor, faça a leitura do termômetro primeiro!')
        respostaTexto = `Temperatura: ${dadosTermometro.temp}°C | Umidade: ${dadosTermometro.umidade}% | ${dadosTermometro.sombra}`
        tipoMidia = 'termometro'
      } else if (tipo === 'foto') {
        if (!fotoCapturadaBase64) return alert('Por favor, tire uma foto antes de salvar.')
        midiaUrl = fotoCapturadaBase64
        respostaTexto = 'Fotografia capturada'
        tipoMidia = 'foto'
      } else if (tipo === 'audio') {
        if (!audioGravadoBase64) return alert('Por favor, grave um áudio antes de salvar.')
        midiaUrl = audioGravadoBase64
        respostaTexto = 'Áudio gravado'
        tipoMidia = 'audio'
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
      mensagemSucessoModal = `Excelente trabalho! ${estado.cracha?.mascote.nome} guardou essa descoberta no Caderno de Campo!`
      modalSucessoAberto = true
      renderApp()
    })
  }

  document.querySelector('#btn-fechar-modal')?.addEventListener('click', () => {
    modalSucessoAberto = false
    estado.missaoAtual = null
    estado.recantoAtual = null
    renderApp()
  })

  document.querySelector('#btn-relatorio')?.addEventListener('click', () => {
    exibindoRelatorio = true
    renderApp()
  })

  document.querySelector('#btn-voltar-relatorio')?.addEventListener('click', () => {
    exibindoRelatorio = false
    renderApp()
  })
}

renderApp()