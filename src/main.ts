import { recantos } from './data/recantos'
import { EstadoAplicacao, Recanto, MissaoCientifica } from './@types'

// Estado Global da Aplicação
const estado: EstadoAplicacao = {
  recantoAtual: null,
  missaoAtual: null,
  descobertas: Number(localStorage.getItem('explore_its_descobertas')) || 0,
  missoesConcluidas: new Set(JSON.parse(localStorage.getItem('explore_its_concluidas') || '[]')),
  dadosColetados: JSON.parse(localStorage.getItem('explore_its_dados') || '{}')
}

// Elementos da DOM
const app = document.querySelector<HTMLDivElement>('#app')!

function salvarProgresso() {
  localStorage.setItem('explore_its_descobertas', estado.descobertas.toString())
  localStorage.setItem('explore_its_concluidas', JSON.stringify(Array.from(estado.missoesConcluidas)))
  localStorage.setItem('explore_its_dados', JSON.stringify(estado.dadosColetados))
}

function renderizarHeader(): string {
  return `
    <header style="background: #1b4332; color: white; padding: 1rem; text-align: center; border-bottom: 4px solid #2d6a4f;">
      <h1 style="margin: 0; font-size: 1.4rem;">🌱 Explore ITS</h1>
      <p style="margin: 0.3rem 0 0; font-size: 0.85rem; opacity: 0.9;">Trilha da Semente Peregrina • EF II</p>
      <div style="margin-top: 0.5rem; background: #2d6a4f; padding: 0.3rem 0.8rem; border-radius: 20px; display: inline-block; font-size: 0.85rem; font-weight: bold;">
        🔍 Descobertas: <span>${estado.descobertas}</span>
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
      <button id="btn-voltar" style="background: none; border: none; color: #2d6a4f; font-weight: bold; cursor: pointer; padding: 0.5rem 0; margin-bottom: 0.5rem;">⬅️ Voltar às Estações</button>
      
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
  return `
    <main style="padding: 1rem; max-width: 600px; margin: 0 auto;">
      <button id="btn-cancelar-missao" style="background: none; border: none; color: #6c757d; font-weight: bold; cursor: pointer; padding: 0.5rem 0;">❌ Cancelar</button>
      
      <div style="background: #f8f9fa; border: 2px solid #2d6a4f; padding: 1rem; border-radius: 12px; margin-top: 0.5rem;">
        <h3 style="margin: 0 0 0.5rem; color: #1b4332;">${missao.titulo}</h3>
        <p style="font-size: 0.9rem; color: #343a40; margin-bottom: 1rem;">${missao.orientacaoCientifica}</p>

        ${missao.recursoRequerido === 'quiz' && missao.opcoes ? `
          <form id="form-quiz" style="display: flex; flex-direction: column; gap: 0.6rem;">
            ${missao.opcoes.map((opcao, idx) => `
              <label style="background: white; border: 1px solid #ced4da; padding: 0.8rem; border-radius: 8px; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                <input type="radio" name="opcao" value="${idx}" required>
                <span>${opcao}</span>
              </label>
            `).join('')}
            <button type="submit" style="background: #52b788; color: #1b4332; border: none; padding: 0.8rem; border-radius: 8px; font-weight: bold; font-size: 1rem; margin-top: 0.5rem; cursor: pointer;">Enviar Resposta</button>
          </form>
        ` : `
          <div style="background: #e9ecef; padding: 1rem; border-radius: 8px; text-align: center; margin-bottom: 1rem;">
            <p style="margin: 0; font-size: 0.85rem; color: #495057;">[Módulo do Recurso: <strong>${missao.recursoRequerido.toUpperCase()}</strong>]</p>
            <p style="margin: 0.5rem 0 0; font-size: 0.75rem; color: #6c757d;">Utilize as ferramentas de campo para registrar a evidência.</p>
          </div>
          <button id="btn-concluir-generico" style="background: #52b788; color: #1b4332; border: none; padding: 0.8rem; border-radius: 8px; font-weight: bold; font-size: 1rem; width: 100%; cursor: pointer;">Registrar Evidência no Relatório</button>
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
  // Selecionar Recanto
  document.querySelectorAll('.btn-recanto').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.id
      estado.recantoAtual = recantos.find(r => r.id === id) || null
      renderApp()
    })
  })

  // Voltar para a lista
  document.querySelector('#btn-voltar')?.addEventListener('click', () => {
    estado.recantoAtual = null
    renderApp()
  })

  // Iniciar Missão
  document.querySelectorAll('.btn-iniciar-missao').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.id
      estado.missaoAtual = estado.recantoAtual?.missoes.find(m => m.id === id) || null
      renderApp()
    })
  })

  // Cancelar Missão
  document.querySelector('#btn-cancelar-missao')?.addEventListener('click', () => {
    estado.missaoAtual = null
    renderApp()
  })

  // Submeter Quiz
  document.querySelector('#form-quiz')?.addEventListener('submit', (e) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const selecionado = form.querySelector<HTMLInputElement>('input[name="opcao"]:checked')?.value

    if (selecionado !== undefined && estado.missaoAtual) {
      if (Number(selecionado) === estado.missaoAtual.correta) {
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