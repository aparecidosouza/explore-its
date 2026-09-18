import { recantos } from './data/recantos'
import { EstadoAplicacao, Recanto, MissaoCientifica } from './@types'
import { capturarFotoCampo } from './utils/camera'
import { iniciarGravacaoAudio, pararGravacaoAudio } from './utils/audio'
import { EditorCanvas } from './utils/canvas'

// Estado Global da Aplicação
const estado: EstadoAplicacao = {
  recantoAtual: null,
  missaoAtual: null,
  descobertas: Number(localStorage.getItem('explore_its_descobertas')) || 0,
  missoesConcluidas: new Set(JSON.parse(localStorage.getItem('explore_its_concluidas') || '[]')),
  dadosColetados: JSON.parse(localStorage.getItem('explore_its_dados') || '{}')
}

let gravandoAudio = false
let editorCanvas: EditorCanvas | null = null

const app = document.querySelector<HTMLDivElement>('#app')!

function salvarProgresso() {
  try {
    localStorage.setItem('explore_its_descobertas', estado.descobertas.toString())
    localStorage.setItem('explore_its_concluidas', JSON.stringify(Array.from(estado.missoesConcluidas)))
    localStorage.setItem('explore_its_dados', JSON.stringify(estado.dadosColetados))
  } catch (e) {
    console.warn('Limite do localStorage atingido:', e)
  }
}

function resetarEstadoCompleto() {
  localStorage.clear()
  estado.recantoAtual = null
  estado.missaoAtual = null
  estado.descobertas = 0
  estado.missoesConcluidas.clear()
  estado.dadosColetados = {}
  renderApp()
}

function renderizarHeader(): string {
  return `
    <header style="background: #1b4332; color: white; padding: 1rem; text-align: center; border-bottom: 4px solid #2d6a4f; position: relative;">
      <h1 style="margin: 0; font-size: 1.4rem;">🌱 Explore ITS</h1>
      <p style="margin: 0.3rem 0 0; font-size: 0.85rem; opacity: 0.9;">Trilha da Semente Peregrina • EF II</p>
      
      <div style="display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 0.5rem;">
        <div style="background: #2d6a4f; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.85rem; font-weight: bold;">
          🔍 Descobertas: <span>${estado.descobertas}</span>
        </div>
        <button id="btn-reset-app" style="background: #d90429; color: white; border: none; padding: 0.3rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: bold; cursor: pointer;">
          🔄 Inicio
        </button>
      </div>
    </header>
  `
}

function renderizarListaRecantos(): string {
  return `
    <main style="padding: 1rem; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2d6a4f; font-size: 1.2rem; margin-bottom: 1rem;">Estações de Investigação</h2>
      <div style="display: flex; flex-direction: column; gap: 0.8rem;">
        ${recantos.map(recanto => {
          const concluida = recanto.missoes.every(m => estado.missoesConcluidas.has(m.id))
          return `
            <button 
              class="btn-recanto" 
              data-id="${recanto.id}"
              style="display: flex; align-items: center; gap: 0.8rem; background: ${concluida ? '#d8f3dc' : '#f8f9fa'}; border: 2px solid ${concluida ? '#52b788' : '#e9ecef'}; padding: 1rem; border-radius: 12px; text-align: left; cursor: pointer; width: 100%; transition: transform 0.1s;"
            >
              <span style="font-size: 2rem;">${recanto.icone}</span>
              <div style="flex: 1;">
                <h3 style="margin: 0; color: #1b4332; font-size: 1rem;">${recanto.titulo}</h3>
                <span style="font-size: 0.75rem; background: #b7e4c7; color: #1b4332; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${recanto.eixoAmbiental}</span>
                <p style="margin: 0.3rem 0 0; font-size: 0.8rem; color: #6c757d;">${recanto.descricao}</p>
              </div>
              <span style="font-size: 1.2rem;">${concluida ? '✅' : '➡️'}</span>
            </button>
          `
        }).join('')}
      </div>
    </main>
  `
}

function renderizarDetalheRecanto(recanto: Recanto): string {
  return `
    <main style="padding: 1rem; max-width: 600px; margin: 0 auto;">
      <button id="btn-voltar" style="background: #2d6a4f; color: white; border: none; padding: 0.6rem 1rem; border-radius: 8px; font-weight: bold; cursor: pointer; margin-bottom: 1rem; width: 100%;">⬅️ Voltar às Estações</button>
      
      <div style="background: #1b4332; color: white; padding: 1.2rem; border-radius: 12px; margin-bottom: 1rem;">
        <span style="font-size: 2.5rem;">${recanto.icone}</span>
        <h2 style="margin: 0.5rem 0 0.2rem; font-size: 1.3rem;">${recanto.titulo}</h2>
        <span style="font-size: 0.8rem; background: #52b788; color: #1b4332; padding: 2px 8px; border-radius: 4px; font-weight: bold;">Eixo: ${recanto.eixoAmbiental}</span>
      </div>

      <h3 style="color: #2d6a4f; font-size: 1.1rem; margin-bottom: 0.8rem;">Missões Científicas</h3>
      <div style="display: flex; flex-direction: column; gap: 0.8rem;">
        ${recanto.missoes.map(missao => {
          const concluida = estado.missoesConcluidas.has(missao.id)
          return `
            <div style="background: white; border: 1px solid #dee2e6; border-left: 5px solid ${concluida ? '#52b788' : '#2d6a4f'}; padding: 1rem; border-radius: 8px;">
              <h4 style="margin: 0 0 0.4rem; color: #1b4332;">${missao.titulo}</h4>
              <p style="margin: 0 0 0.8rem; font-size: 0.85rem; color: #495057;">${missao.orientacaoCientifica}</p>${concluida 
                ? `<span style="color: #2b9348; font-weight: bold; font-size: 0.85rem;">✅ Missão Concluída</span>`
                : `<button class="btn-iniciar-missao" data-id="${missao.id}" style="background: #2d6a4f; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-weight: bold; cursor: pointer; width: 100%;">Iniciar Investigação</button>`
              }
            </div>
          `
        }).join('')}
      </div>
    </main>
  `
}

function renderizarMissao(missao: MissaoCientifica): string {
  const fotoExistente = estado.dadosColetados[missao.id]?.foto
  const audioExistente = estado.dadosColetados[missao.id]?.audio

  const requerFoto = missao.recursoRequerido === 'camera' || missao.permiteFoto
  const requerAudio = missao.recursoRequerido === 'audio' || missao.permiteAudio
  const requerDesenho = missao.recursoRequerido === 'desenho' || missao.permiteDesenho

  return `
    <main style="padding: 1rem; max-width: 600px; margin: 0 auto;">
      <button id="btn-cancelar-missao" style="background: #6c757d; color: white; border: none; padding: 0.5rem 1rem; border-radius: 8px; font-weight: bold; cursor: pointer; margin-bottom: 0.8rem; width: 100%;">❌ Cancelar Missão</button>
      
      <div style="background: #f8f9fa; border: 2px solid #2d6a4f; padding: 1rem; border-radius: 12px;">
        <h3 style="margin: 0 0 0.5rem; color: #1b4332;">${missao.titulo}</h3>
        <p style="font-size: 0.9rem; color: #343a40; margin-bottom: 1rem;">${missao.orientacaoCientifica}</p>

        <!-- Módulo de Foto / Canvas de Desenho -->
        ${requerFoto || requerDesenho ? `
          <div style="text-align: center; margin: 1rem 0; background: #e9ecef; padding: 1rem; border-radius: 8px;">
            <div id="preview-foto-container" style="display: ${fotoExistente ? 'block' : 'none'}; margin-bottom: 1rem;">
              ${requerDesenho ? `
                <p style="font-size: 0.8rem; color: #2d6a4f; font-weight: bold; margin-bottom: 0.4rem;">Desenhe a linha do vetor de fluxo sobre a imagem:</p>
                <div style="width: 100%; overflow: hidden; border-radius: 8px; border: 2px solid #2d6a4f; background: #000;">
                  <canvas id="canvas-desenho" style="width: 100%; display: block; touch-action: none;"></canvas>
                </div>
                <button id="btn-limpar-canvas" type="button" style="background: #6c757d; color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.75rem; font-weight: bold; margin-top: 0.4rem; cursor: pointer;">✏️ Refazer Desenho</button>
              ` : `
                <img id="img-preview" src="${fotoExistente || ''}" alt="Evidência" style="width: 100%; max-height: 250px; object-fit: cover; border-radius: 8px; border: 2px solid #2d6a4f;" />
              `}
            </div>
            <button id="btn-capturar-foto" type="button" style="background: #2d6a4f; color: white; border: none; padding: 0.8rem 1.2rem; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%;">
              📸 ${fotoExistente ? 'Tirar Nova Foto' : 'Tirar Foto para Registro'}
            </button>
          </div>
        ` : ''}

        <!-- Módulo de Gravação de Áudio -->
        ${requerAudio ? `
          <div style="text-align: center; margin: 1rem 0; background: #e9ecef; padding: 1rem; border-radius: 8px;">
            <div id="preview-audio-container" style="display: ${audioExistente ? 'block' : 'none'}; margin-bottom: 1rem;">
              <audio id="audio-preview" controls src="${audioExistente || ''}" style="width: 100%;"></audio>
            </div>
            <button id="btn-gravar-audio" type="button" style="background: #d90429; color: white; border: none; padding: 0.8rem 1.2rem; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%;">
              🎙️ <span id="lbl-btn-audio">${gravandoAudio ? 'Parar Gravação' : (audioExistente ? 'Gravado (Clique p/ Novo)' : 'Gravar Relato / Som')}</span>
            </button>
          </div>
        ` : ''}

        <!-- Formulário Quiz -->
        ${missao.opcoes && missao.opcoes.length > 0 ? `
          <form id="form-quiz" style="display: flex; flex-direction: column; gap: 0.6rem; margin-top: 1rem;">
            ${missao.pergunta ? `<p style="font-weight: bold; color: #1b4332; margin-bottom: 0.5rem;">${missao.pergunta}</p>` : ''}
            ${missao.opcoes.map((opcao, idx) => `
              <label style="background: white; border: 1px solid #ced4da; padding: 0.8rem; border-radius: 8px; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                <input type="radio" name="opcao" value="${idx}" required>
                <span>${opcao}</span>
              </label>
            `).join('')}
            <button type="submit" style="background: #52b788; color: #1b4332; border: none; padding: 0.8rem; border-radius: 8px; font-weight: bold; font-size: 1rem; margin-top: 0.5rem; cursor: pointer;">Enviar Resposta</button>
          </form>
        ` : `
          <button id="btn-concluir-generico" style="background: #52b788; color: #1b4332; border: none; padding: 0.8rem; border-radius: 8px; font-weight: bold; font-size: 1rem; width: 100%; cursor: pointer; margin-top: 0.5rem;">Registrar Evidência no Relatório</button>
        `}
      </div>
    </main>
  `
}

function renderApp() {
  let conteudo = renderizarHeader()

  if (estado.missaoAtual) {
    conteudo += renderizarMissao(estado.missaoAtual)
  } else if (estado.recantoAtual) {
    conteudo += renderizarDetalheRecanto(estado.recantoAtual)
  } else {
    conteudo += renderizarListaRecantos()
  }

  app.innerHTML = conteudo
  vincularEventos()
}

function vincularEventos() {
  document.querySelector('#btn-reset-app')?.addEventListener('click', () => {
    if (confirm('Deseja voltar para a tela inicial e resetar as missões?')) {
      resetarEstadoCompleto()
    }
  })

  document.querySelectorAll('.btn-recanto').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.id
      estado.recantoAtual = recantos.find(r => r.id === id) || null
      renderApp()
    })
  })

  document.querySelector('#btn-voltar')?.addEventListener('click', () => {
    estado.recantoAtual = null
    estado.missaoAtual = null
    renderApp()
  })

  document.querySelectorAll('.btn-iniciar-missao').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.id
      estado.missaoAtual = estado.recantoAtual?.missoes.find(m => m.id === id) || null
      renderApp()
    })
  })

  document.querySelector('#btn-cancelar-missao')?.addEventListener('click', () => {
    estado.missaoAtual = null
    renderApp()
  })

  // Capturar Foto e Inicializar Canvas com Retardo Técnico para Ajuste no DOM
  document.querySelector('#btn-capturar-foto')?.addEventListener('click', async () => {
    try {
      const foto = await capturarFotoCampo()
      const container = document.querySelector<HTMLDivElement>('#preview-foto-container')
      const imgPreview = document.querySelector<HTMLImageElement>('#img-preview')

      if (container && estado.missaoAtual) {
        container.style.display = 'block'

        const canvasEl = document.querySelector<HTMLCanvasElement>('#canvas-desenho')
        if (canvasEl) {
          // Garante a criação do objeto Canvas e o carregamento imediato da foto
          editorCanvas = new EditorCanvas(canvasEl)
          await editorCanvas.carregarImagem(foto.base64)
        } else if (imgPreview) {
          imgPreview.src = foto.base64
        }

        estado.dadosColetados[estado.missaoAtual.id] = {
          ...estado.dadosColetados[estado.missaoAtual.id],
          foto: foto.base64,
          dataHora: foto.timestamp
        }
        salvarProgresso()
      }
    } catch (erro) {
      console.log('Captura cancelada ou falhou:', erro)
    }
  })

  // Limpar Canvas
  document.querySelector('#btn-limpar-canvas')?.addEventListener('click', () => {
    editorCanvas?.limpar()
  })

  // Gravar / Parar Áudio
  document.querySelector('#btn-gravar-audio')?.addEventListener('click', async () => {
    const lblBtn = document.querySelector<HTMLSpanElement>('#lbl-btn-audio')

    if (!gravandoAudio) {
      try {
        await iniciarGravacaoAudio()
        gravandoAudio = true
        if (lblBtn) lblBtn.innerText = '🔴 Gravando... Clique p/ Parar'
      } catch (erro) {
        alert('Não foi possível aceder ao microfone. Verifique as permissões.')
      }
    } else {
      try {
        const resultado = await pararGravacaoAudio()
        gravandoAudio = false
        
        const container = document.querySelector<HTMLDivElement>('#preview-audio-container')
        const player = document.querySelector<HTMLAudioElement>('#audio-preview')

        if (container && player && estado.missaoAtual) {
          player.src = resultado.base64
          container.style.display = 'block'

          estado.dadosColetados[estado.missaoAtual.id] = {
            ...estado.dadosColetados[estado.missaoAtual.id],
            audio: resultado.base64,
            duracao: resultado.duracaoSegundos,
            dataHora: resultado.timestamp
          }
          salvarProgresso()
        }
        if (lblBtn) lblBtn.innerText = '🎙️ Gravado (Clique p/ Novo)'
      } catch (erro) {
        console.error('Erro ao encerrar gravação:', erro)
        gravandoAudio = false
      }
    }
  })

  // Submeter Quiz
  document.querySelector('#form-quiz')?.addEventListener('submit', (e) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const selecionado = form.querySelector<HTMLInputElement>('input[name="opcao"]:checked')?.value

    if (selecionado !== undefined && estado.missaoAtual) {
      if (Number(selecionado) === estado.missaoAtual.correta) {
        if (editorCanvas && estado.missaoAtual) {
          estado.dadosColetados[estado.missaoAtual.id].fotoComDesenho = editorCanvas.exportarResultado()
        }
        alert(estado.missaoAtual.sucesso || 'Evidência registrada com sucesso!')
        estado.missoesConcluidas.add(estado.missaoAtual.id)
        estado.descobertas += 10
        salvarProgresso()
        estado.missaoAtual = null
        renderApp()
      } else {
        alert(estado.missaoAtual.dica || 'Revise suas observações de campo e tente novamente.')
      }
    }
  })

  // Concluir Missão Genérica
  document.querySelector('#btn-concluir-generico')?.addEventListener('click', () => {
    if (estado.missaoAtual) {
      if (editorCanvas) {
        estado.dadosColetados[estado.missaoAtual.id] = {
          ...estado.dadosColetados[estado.missaoAtual.id],
          fotoComDesenho: editorCanvas.exportarResultado()
        }
      }
      alert('Evidência científica registrada no banco de dados local!')
      estado.missoesConcluidas.add(estado.missaoAtual.id)
      estado.descobertas += 10
      salvarProgresso()
      estado.missaoAtual = null
      renderApp()
    }
  })
}

// Inicializar Aplicação
renderApp()