import './style.css'

import type {
  Mascote,
  OpcaoQuiz,
  Missao,
  Estacao,
  RespostaAtividade,
  MedicaoTemp,
  Cracha
} from './@types'

import { estacoes } from './data/recantos'

const mascotes: Mascote[] = [
  { id: 'guara', nome: 'Guará', emoji: '🦊' },
  { id: 'bandeira', nome: 'Bandeira', emoji: '🐜' },
  { id: 'arara', nome: 'Azulzinha', emoji: '🦜' },
  { id: 'tatu', nome: 'Bolinha', emoji: '🦔' }
]



// Estado Local
let crachaSalvo: Cracha | null = JSON.parse(localStorage.getItem('exp_cracha') || 'null')
let respostasGerais: RespostaAtividade[] = JSON.parse(localStorage.getItem('exp_respostas') || '[]')
let medicoesTemperatura: MedicaoTemp[] = JSON.parse(localStorage.getItem('exp_medicoes') || '[]')

let mascoteTempId = mascotes[0].id
let estacaoAtual: Estacao | null = null
let missaoAtual: Missao | null = null
let fotoTemp: string | null = null
let audioTemp: string | null = null
let opcaoSelecionadaQuiz: string | null = null
let verTabelaTemp = false
let verCaderno = false
let verConquistas = false
let modalMensagem: string | null = null

// Navegação entre as telas principais do aplicativo
type TelaApp =
  | 'inicio'
  | 'mapa-its'
  | 'localidade'
  | 'cadastro'
  | 'trilha'

let telaAtual: TelaApp = 'inicio'
let localidadeAtual: string | null = null

// Estado específico da investigação do Nego d'Água
let evidenciasSelecionadas: string[] = []
let capivaraAvistada = false

const app = document.querySelector<HTMLDivElement>('#app')!

function obterHoraAtual(): string {
  const agora = new Date()
  return agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function calcularTotalMissoes(): number {
  return estacoes.reduce((acc, est) => acc + est.missoes.length, 0)
}

function obterCategoriaCientifica(): { titulo: string, descricao: string, icone: string } {
  const total = calcularTotalMissoes()
  const concluidas = respostasGerais.length

  if (concluidas >= total) {
    return {
      titulo: 'Cientista Investigador do Cerrado 🌟',
      descricao: 'Incrível! O grupo concluiu 100% das investigações com precisão científica.',
      icone: '🏆'
    }
  } else if (concluidas >= Math.ceil(total * 0.6)) {
    return {
      titulo: 'Explorador Científico da Trilha 🍃',
      descricao: 'Ótimo trabalho! O grupo completou grande parte das medições e registros no campo.',
      icone: '🥉'
    }
  } else if (concluidas > 0) {
    return {
      titulo: 'Detetive da Natureza em Ação 🔍',
      descricao: 'A jornada começou! Continue realizando as medições e fotos para alcançar o topo.',
      icone: '🌱'
    }
  } else {
    return {
      titulo: 'Aprendiz de Expedição 🎒',
      descricao: 'Inicie as missões nas estações para desbloquear sua categoria científica!',
      icone: '📍'
    }
  }
}

// MAPA GERAL DO ITS
async function carregarMapaITS() {
  console.log('CARREGAR MAPA ITS EXECUTADO')

  const container = document.querySelector<HTMLDivElement>('#mapa-its-container')

  if (!container) return

  try {
    const resposta = await fetch('/explore-its/mapa-explore-its-mestre.svg')

    if (!resposta.ok) {
      throw new Error('Não foi possível carregar o mapa geral do ITS.')
    }

    const svgTexto = await resposta.text()

    container.innerHTML = svgTexto

    const svg = container.querySelector('svg')

    if (svg) {
  svg.classList.add('mapa-svg')
  svg.setAttribute('role', 'img')
  svg.setAttribute(
    'aria-label',
    'Mapa interativo do Instituto do Trópico Subúmido'
  )

  // TESTE DE INTERATIVIDADE:
  // Trilha da Semente Peregrina
  const marcadorTrilha = svg.querySelector<SVGElement>(
    '#marcador_trilha_semente_peregrina'
  )

  if (marcadorTrilha) {
    marcadorTrilha.style.cursor = 'pointer'

    marcadorTrilha.addEventListener('click', () => {
      localidadeAtual = 'trilha-semente-peregrina'
      telaAtual = 'localidade'
      render()
    })
  } else {
    console.warn(
      'Marcador da Trilha da Semente Peregrina não encontrado no SVG.'
    )
  }
}

  } catch (erro) {
    console.error('Erro ao carregar o mapa geral do ITS:', erro)

    container.innerHTML =
      '<p class="mapa-erro">Não foi possível carregar o mapa do ITS.</p>'
  }
}

// MAPA DA TRILHA DA SEMENTE PEREGRINA
async function carregarMapaInterativo() {
  
  console.log('FUNÇÃO DO MAPA EXECUTADA')
  
  const container = document.querySelector<HTMLDivElement>('#mapa-container')

  if (!container) return

  try {
    const resposta = await fetch('/explore-its/mapa-explore-its.svg')

    if (!resposta.ok) {
      throw new Error('Não foi possível carregar o mapa.')
    }

    const svgTexto = await resposta.text()

    container.innerHTML = svgTexto

    console.log(
    'IDS DO MAPA GERAL:',
    [...container.querySelectorAll('[id]')].map(el => el.id)
)

const svg = container.querySelector('svg')

    if (svg) {
  svg.classList.add('mapa-svg')
  svg.setAttribute('role', 'img')
  svg.setAttribute(
    'aria-label',
    'Mapa da Trilha da Semente Peregrina'
  )

  // RECANTOS INTERATIVOS DO MAPA
const recantosMapa = [
  { mapa: 'fazenda-barauna', estacao: 'fazenda-barauna' },
  { mapa: 'recanto-saci-perere', estacao: 'recanto-saci-perere' },
  { mapa: 'recanto-jatoba', estacao: 'recanto-jatoba' },
  { mapa: 'recanto-pioneiras', estacao: 'recanto-pioneiras' },
  { mapa: 'recanto-caipora', estacao: 'caipora' },
  { mapa: 'recanto-nego-dagua', estacao: 'recanto-nego-dagua' }
]

recantosMapa.forEach(({ mapa, estacao }) => {
  const marcador = svg.querySelector<SVGElement>(`#${mapa}`)

  if (!marcador) {
    console.warn(`Marcador ${mapa} não encontrado no SVG.`)
    return
  }

  marcador.style.cursor = 'pointer'

  marcador.addEventListener('click', () => {
    const recanto = estacoes.find(e => e.id === estacao)

    if (!recanto) {
      console.warn(`Estação ${estacao} não encontrada no aplicativo.`)
      return
    }

    estacaoAtual = recanto
    missaoAtual = null
    render()
  })
})
}
  } catch (erro) {
    console.error('Erro ao carregar o mapa:', erro)

    container.innerHTML =
      '<p class="mapa-erro">Não foi possível carregar o mapa.</p>'
  }
}

function render() {
  const categoria = obterCategoriaCientifica()

  let html = `
    <header class="app-header">
      <div class="header-content">
        <span class="logo" id="nav-home">🍃 Explore ITS</span>
        ${crachaSalvo && telaAtual === 'trilha' ? `
          <div class="user-badge">
            <small><strong>${crachaSalvo.mascote.emoji}${crachaSalvo.nome}</strong></small>
            <button id="btn-conquistas" class="btn-secondary">🎖️ Conquistas</button>
            <button id="btn-tabela-temp" class="btn-secondary">📊 Temperaturas</button>
            <button id="btn-caderno" class="btn-secondary">📜 Caderno</button>
            <button id="btn-sair" class="btn-danger">Sair</button>
        </div>
      ` : ''}
      </div>
    </header>
  `
if (telaAtual === 'inicio') {
  html += `
    <main class="tela-inicio-its">

      <section class="inicio-its-hero">

        <div class="inicio-its-selo">
          🌿 EXPLORE ITS
        </div>

        <h1>Instituto do Trópico Subúmido</h1>

        <p class="inicio-its-chamada">
          Um espaço onde natureza, ciência, história e cultura
          se encontram.
        </p>

        <p class="inicio-its-texto">
          Explore os diferentes espaços do ITS e descubra
          o que cada lugar tem para contar.
        </p>

        <button id="btn-explorar-its" class="btn-primary">
          Explorar o ITS →
        </button>

      </section>

    </main>
  `
} else if (telaAtual === 'mapa-its') {
  html += `
    <main class="tela-mapa-its">

      <section class="mapa-its-introducao">
        <div class="inicio-its-selo">
          🌿 EXPLORE ITS
        </div>

        <h2>Explore os espaços do ITS</h2>

        <p>
          Toque em uma localidade do mapa para conhecer
          esse espaço e descobrir o que existe por lá.
        </p>
      </section>

      <section class="mapa-its-area">

        <div
          class="mapa-container"
          id="mapa-its-container"
          aria-label="Mapa interativo do Instituto do Trópico Subúmido"
        >
          <div class="mapa-carregando">
            Carregando mapa do ITS...
          </div>
        </div>

      </section>

    </main>
  `
} else if (telaAtual === 'localidade') {

  html += `
    <main class="tela-localidade">

      <button id="btn-voltar-mapa-its" class="localidade-voltar">
        ← Voltar ao mapa
      </button>

      <section class="localidade-hero localidade-hero-placeholder">

        <div class="localidade-hero-conteudo">
          <span class="localidade-categoria">
            🌿 EXPERIÊNCIA NO CERRADO
          </span>

          <h1>Trilha da Semente Peregrina</h1>
        </div>

      </section>

      <section class="localidade-conteudo">

        <div class="localidade-chamada">
          <span>EXPLORE • OBSERVE • INVESTIGUE</span>
          <h2>Uma trilha. Muitas pistas.</h2>

          <p>
            Ao longo do percurso, a natureza revela pistas sobre
            o Cerrado, seus organismos, a água e as transformações
            da paisagem.
          </p>
        </div>

        <div class="localidade-dados">

          <div class="localidade-dado">
            <span>🥾</span>
            <strong>~1,4 km</strong>
            <small>de percurso</small>
          </div>

          <div class="localidade-dado">
            <span>🔎</span>
            <strong>6</strong>
            <small>recantos</small>
          </div>

          <div class="localidade-dado">
            <span>🌡️</span>
            <strong>3</strong>
            <small>medições</small>
          </div>

        </div>

        <section class="localidade-missao">

          <span class="localidade-secao-label">
            SUA MISSÃO
          </span>

          <h2>Investigue a trilha como um cientista</h2>

          <div class="localidade-acoes">
            <span>👀 Observar</span>
            <span>📷 Registrar</span>
            <span>🌡️ Medir</span>
            <span>🔎 Investigar</span>
          </div>

        </section>

        <button id="btn-iniciar-expedicao" class="btn-primary localidade-iniciar">
          Iniciar a expedição →
        </button>

        <p class="localidade-frase-final">
          🌱 A natureza dá as pistas. Você faz a investigação.
        </p>

      </section>

    </main>
  `

} else if (telaAtual === 'cadastro') {

  html += `
    <div class="tela-identificacao">

      <section class="boas-vindas-expedicao">

        <div class="identificacao-selo">
          🌿 EXPLORE ITS
        </div>

        <h2>Trilha da Semente Peregrina</h2>

        <p class="identificacao-chamada">
          A natureza está cheia de pistas.<br>
          <strong>Vamos descobrir o que ela tem para contar?</strong>
        </p>

        <div class="identificacao-ilustracao">
          🌱 🔎 🐜 🦜
        </div>

      </section>

      <section class="card-container identificacao-card">

        <div class="identificacao-titulo">
          <span>🧭</span>
          <div>
            <small>PRIMEIRO PASSO</small>
            <h3>Prepare sua expedição</h3>
          </div>
        </div>

        <p class="identificacao-instrucao">
          Conte quem está participando da investigação e escolha
          seu companheiro de expedição.
        </p>

        <form id="form-cadastro">

          <div class="form-group">
            <label>Nome do Estudante / Grupo</label>
            <input
              type="text"
              id="inp-nome"
              required
              placeholder="Ex: Grupo Alpha ou Maria Silva"
            />
          </div>

          <div class="form-group">
            <label>Turma / Escola</label>
            <input
              type="text"
              id="inp-turma"
              required
              placeholder="Ex: 6º Ano B"
            />
          </div>

          <div class="form-group">
            <label>Escolha seu companheiro de expedição</label>

            <div class="mascotes-grid">
              ${mascotes.map(m => `
                <div
                  class="mascote-card ${m.id === mascoteTempId ? 'selecionado' : ''}"
                  data-id="${m.id}"
                >
                  <span class="mascote-emoji">${m.emoji}</span>
                  <strong>${m.nome}</strong>
                  <small>companheiro</small>
                </div>
              `).join('')}
            </div>
          </div>

          <button
            type="submit"
            class="btn-primary btn-iniciar-expedicao"
          >
            Começar a investigação →
          </button>

        </form>

      </section>

      <section class="identificacao-mensagem">
        <span>👀</span>
        <p>
          <strong>Observe.</strong>
          <strong>Investigue.</strong>
          <strong>Descubra.</strong>
        </p>
      </section>

    </div>
  `
} else if (telaAtual === 'trilha' && verConquistas) {
    const total = calcularTotalMissoes()
    const concluidas = respostasGerais.length
    const progressoPct = Math.round((concluidas / total) * 100)
    const temInvestigacaoCorrego = respostasGerais.some(r => r.missaoId === 'm-neg-investigacao')

    html += `
      <div class="card-container">
        <button id="btn-voltar-estacoes" class="btn-back">⬅ Voltar às Estações</button>
        <h2>🎖️ Nível do Grupo & Conquistas</h2>

        <div class="conquista-nivel">
          <div class="conquista-nivel-icone">${categoria.icone}</div>
          <h3>${categoria.titulo}</h3>
          <p>${categoria.descricao}</p>
        </div>
        <h4>Progresso da Trilha (${concluidas}/${total} atividades)</h4>
        <div style="background:#e2e8f0; border-radius:10px; height:16px; width:100%; margin:8px 0 15px 0; overflow:hidden;">
          <div style="background:var(--primary); height:100%; width:${progressoPct}%; transition:width 0.3s;"></div>
        </div>

        <h4>Medalhas Desbloqueadas:</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px;">
          <div class="missao-card" style="opacity: ${medicoesTemperatura.length > 0 ? '1' : '0.4'}; text-align:center;">
            <div style="font-size:2rem;">🌡️</div>
            <strong>Termômetro de Ouro</strong>
            <p style="font-size:0.75rem; color:var(--text-muted);">${medicoesTemperatura.length > 0 ? 'Medições registradas!' : 'Ainda não aferido'}</p>
          </div>
          <div class="missao-card" style="opacity: ${respostasGerais.some(r => r.midiaUrl) ? '1' : '0.4'}; text-align:center;">
            <div style="font-size:2rem;">📷</div>
            <strong>Fotógrafo Científico</strong>
            <p style="font-size:0.75rem; color:var(--text-muted);">${respostasGerais.some(r => r.midiaUrl) ? 'Foto capturada!' : 'Tire uma foto'}</p>
          </div>
          <div class="missao-card" style="opacity: ${temInvestigacaoCorrego ? '1' : '0.4'}; text-align:center;">
            <div style="font-size:2rem;">🏅</div>
            <strong>Investigador de Relações Ecológicas</strong>
            <p style="font-size:0.75rem; color:var(--text-muted);">${temInvestigacaoCorrego ? 'Evidências analisadas no córrego!' : 'Conclua a investigação no Nego d\'Água'}</p>
          </div>
          <div class="missao-card" style="opacity: ${concluidas >= total ? '1' : '0.4'}; text-align:center;">
            <div style="font-size:2rem;">🏆</div>
            <strong>Trilha 100%</strong>
            <p style="font-size:0.75rem; color:var(--text-muted);">${concluidas >= total ? 'Todas concluídas!' : 'Pendente'}</p>
          </div>
        </div>
      </div>
    `
  } else if (telaAtual === 'trilha' && verTabelaTemp) {
    html += `
      <div class="card-container">
        <button id="btn-voltar-estacoes" class="btn-back">⬅ Voltar às Estações</button>
        <h2>📊 Tabela de Temperaturas da Trilha</h2>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:15px;">
          Medições de temperatura (°C) e horários coletados nos recantos:
        </p>

        <table style="width:100%; border-collapse: collapse; text-align:left; font-size:0.9rem;">
          <thead>
            <tr style="border-bottom: 2px solid var(--border); background:#f1f5f9;">
              <th style="padding:8px;">Ponto de Coleta</th>
              <th style="padding:8px;">Temp (°C)</th>
              <th style="padding:8px;">Horário</th>
            </tr>
          </thead>
          <tbody>
            ${[
              { id: 'fazenda-barauna', nome: '1. Fazenda Baraúna' },
              { id: 'recanto-jatoba', nome: '3. Recanto do Jatobá' },
              { id: 'recanto-nego-dagua', nome: '6. Recanto do Nego d\'Água' }
            ].map(ponto => {
              const med = medicoesTemperatura.find(m => m.estacaoId === ponto.id)
              return `
                <tr style="border-bottom: 1px solid var(--border);">
                  <td style="padding:10px 8px;"><strong>${ponto.nome}</strong></td>
                  <td style="padding:10px 8px; color:var(--primary-dark); font-weight:bold;">
                    ${med ? `${med.valorTemp} °C` : '<span style="color:#d97706;">Pendente</span>'}
                  </td>
                  <td style="padding:10px 8px; color:var(--text-muted);">
                    ${med ? med.horarioMedicao : '-'}
                  </td>
                </tr>
              `
            }).join('')}
          </tbody>
        </table>
      </div>
    `
  } else if (telaAtual === 'trilha' && verCaderno) {
    html += `
      <div class="card-container">
        <button id="btn-voltar-estacoes" class="btn-back">⬅ Voltar às Estações</button>
        <h2>📜 Caderno de Campo</h2>
        <p><small>Estudante/Grupo: ${crachaSalvo.nome} | Turma: ${crachaSalvo.turma}</small></p>
        <hr style="margin:10px 0; border:0; border-top:1px solid var(--border);" />

        ${respostasGerais.length === 0 ? '<p>Nenhum registro gravado ainda.</p>' : ''}
        ${respostasGerais.map(r => `
          <div class="resposta-card">
            <h4>${r.titulo}</h4>
            <p style="font-size:0.9rem; margin-top:4px; white-space: pre-line;">${r.conteudo}</p>${r.midiaUrl ? `<div class="preview-box"><img src="${r.midiaUrl}" class="img-preview"/></div>` : ''}
            <small style="color:var(--text-muted); font-size:0.75rem;">${r.dataHora}</small>
          </div>
        `).join('')}
      </div>
    `
  } else if (telaAtual === 'trilha' && missaoAtual && estacaoAtual) {
    const medExistente = medicoesTemperatura.find(m => m.estacaoId === estacaoAtual!.id)
    const horaPadrao = medExistente ? medExistente.horarioMedicao : obterHoraAtual()

    html += `
      <div class="card-container">
        <button id="btn-voltar-estacao" class="btn-back">⬅ Voltar para ${estacaoAtual.nome}</button>
        <h3>${missaoAtual.titulo}</h3>
        <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:12px;">${missaoAtual.descricao}</p>

        ${missaoAtual.instrucoesHtml ? missaoAtual.instrucoesHtml : ''}

        <form id="form-missao">
          ${missaoAtual.tipo === 'investigacao-corrego' ? `
            <!-- Alerta e botão de Capivara à Vista -->
            <div style="background:#fef3c7; border:2px solid #f59e0b; padding:12px; border-radius:10px; margin-bottom:15px;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong>🐾 Viu uma capivara no local?</strong>
                <button type="button" id="btn-toggle-capivara" class="btn-secondary" style="font-size:0.8rem; padding:4px 8px;">
                  ${capivaraAvistada ? '✅ Avistada!' : 'Marcar Avistamento'}
                </button>
              </div>
              ${capivaraAvistada ? `
                <div style="margin-top:10px; font-size:0.85rem; color:#92400e; background:white; padding:8px; border-radius:6px;">
                  <strong>⚠️ Atenção Científica:</strong> Observe de longe! Não tente se aproximar, alimentar nem chamar o animal. Fotografe apenas se for seguro.
                </div>
              ` : ''}
            </div>

            <!-- Etapa 1: Seleção de Evidências -->
            <div class="form-group">
              <label>1. Selecione pelo menos 2 evidências observadas da ponte:</label>
              <div style="display:flex; flex-direction:column; gap:8px; margin-top:6px;">
                <label style="display:flex; align-items:center; gap:8px; font-size:0.88rem; cursor:pointer;">
                  <input type="checkbox" class="chk-evidencia" value="🌿 Vegetação (pindaíbas, plantas, frutos, sementes)" ${evidenciasSelecionadas.includes('🌿 Vegetação (pindaíbas, plantas, frutos, sementes)') ? 'checked' : ''}/>
                  🌿 Vegetação (pindaíbas, plantas, frutos, sementes)
                </label>
                <label style="display:flex; align-items:center; gap:8px; font-size:0.88rem; cursor:pointer;">
                  <input type="checkbox" class="chk-evidencia" value="🐾 Animais ou Sinais (pegadas, fezes, marcas de alimentação, trilhas)" ${evidenciasSelecionadas.includes('🐾 Animais ou Sinais (pegadas, fezes, marcas de alimentação, trilhas)') ? 'checked' : ''}/>
                  🐾 Animais ou Sinais (pegadas, fezes, marcas de alimentação, trilhas)
                </label>
                <label style="display:flex; align-items:center; gap:8px; font-size:0.88rem; cursor:pointer;">
                  <input type="checkbox" class="chk-evidencia" value="💧 Água e Margem (correnteza, transparência, galhos, matéria orgânica)" ${evidenciasSelecionadas.includes('💧 Água e Margem (correnteza, transparência, galhos, matéria orgânica)') ? 'checked' : ''}/>
                  💧 Água e Margem (correnteza, transparência, galhos, matéria orgânica)
                </label>
              </div>
            </div>

            <!-- Etapa 2: Fotografia da Evidência -->
            <div class="form-group">
              <label>2. Fotografe 1 das evidências encontradas:</label>
              <input type="file" id="input-foto" accept="image/*" capture="environment" style="display:none" />
              <button type="button" id="btn-foto" class="btn-secondary" style="margin-top:4px;">📷 Capturar Foto da Evidência</button>
              <div class="preview-box">
                ${fotoTemp ? `<img src="${fotoTemp}" class="img-preview"/>` : '<small>Nenhuma foto tirada</small>'}
              </div>
            </div>

            <!-- Etapa 3: Elaboração da Hipótese -->
            <div class="form-group">
              <label>3. O que você observou e o que isso <u>sugere</u> sobre o ambiente?</label>
              <textarea id="inp-hipotese" rows="3" required placeholder="Ex: Encontramos marcas de alimentação na margem. Isso SUGERE que a vegetação local serve de alimento para os animais."></textarea>
            </div>

            <!-- Princípio Científico -->
            <div style="background:#eff6ff; border-left:4px solid #3b82f6; padding:10px; border-radius:4px; font-size:0.82rem; color:#1e40af; margin-bottom:12px;">
              <strong>🧠 Princípio Científico:</strong> Observação não é conclusão. Uma evidência apoia uma hipótese, mas precisamos de mais investigações para ter certeza!
            </div>

            <!-- Etapa 4: Próxima Investigação -->
            <div class="form-group">
              <label>4. Se vocês voltassem aqui amanhã, o que procurariam para testar essa hipótese?</label>
              <select id="sel-proxima-investigacao" required style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border); font-size:0.88rem; margin-top:4px;">
                <option value="">-- Selecione uma opção de teste --</option>
                <option value="Novas marcas de alimentação nas plantas">Novas marcas de alimentação nas plantas</option>
                <option value="Pegadas recentes na lama da margem">Pegadas recentes na lama da margem</option>
                <option value="Presença direta de capivaras ou outros animais">Presença direta de capivaras ou outros animais</option>
                <option value="Alterações no volume de folhas e galhos acumulados">Alterações no volume de folhas e galhos acumulados</option>
                <option value="Outra evidência de campo">Outra evidência de campo</option>
              </select>
            </div>
          ` : ''}

          ${missaoAtual.tipo === 'quiz' && missaoAtual.opcoesQuiz ? `
            <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:15px;">
              ${missaoAtual.opcoesQuiz.map(opt => `
                <label style="display:flex; align-items:flex-start; gap:10px; background:#f8fafc; border:2px solid ${opcaoSelecionadaQuiz === opt.id ? 'var(--primary)' : 'var(--border)'}; padding:12px; border-radius:8px; cursor:pointer;">
                  <input type="radio" name="opcao-quiz" value="${opt.id}" ${opcaoSelecionadaQuiz === opt.id ? 'checked' : ''} style="margin-top:3px;" />
                  <span style="font-size:0.9rem; color:var(--text);">${opt.texto}</span>
                </label>
              `).join('')}
            </div>
          ` : ''}

          ${missaoAtual.tipo === 'temperatura' ? `
            <div class="form-group">
              <label>Temperatura lida no Termômetro Digital (°C):</label>
              <input type="number" step="0.1" id="inp-temp" required placeholder="Ex: 26.5" value="${medExistente ? medExistente.valorTemp : ''}" style="font-size:1.2rem; padding:10px;" />
            </div>
            <div class="form-group">
              <label>${missaoAtual.requerHorario ? 'Horário de Início da Trilha:' : 'Horário da Medição:'}</label>
              <input type="time" id="inp-hora" required value="${horaPadrao}" style="font-size:1.1rem; padding:8px;" />
            </div>
          ` : ''}

          ${missaoAtual.tipo === 'foto' ? `
            <input type="file" id="input-foto" accept="image/*" capture="environment" style="display:none" />
            <button type="button" id="btn-foto" class="btn-secondary">📷 Capturar Foto do Organismo</button>
            <div class="preview-box">
              ${fotoTemp ? `<img src="${fotoTemp}" class="img-preview"/>` : '<small>Nenhuma foto tirada</small>'}
            </div>
          ` : ''}

          ${missaoAtual.tipo === 'texto' ? `
            <div class="form-group">
              <textarea id="inp-texto" rows="3" required placeholder="Digite suas observações..."></textarea>
            </div>
          ` : ''}

          ${missaoAtual.tipo === 'audio' ? `
            <button type="button" id="btn-audio" class="btn-secondary">🎙️ Gravador de Áudio</button>
            <div class="preview-box">
              ${audioTemp ? '<p>✅ Áudio registrado!</p>' : '<small>Gravação pendente</small>'}
            </div>
          ` : ''}

          <button type="submit" class="btn-primary" style="margin-top:14px;">Salvar Atividade</button>
        </form>
      </div>
    `
  } else if (telaAtual === 'trilha' && estacaoAtual) {
    const totalMissoesEstacao = estacaoAtual.missoes.length
    const concluidasEstacao = estacaoAtual.missoes.filter(m => respostasGerais.some(r => r.missaoId === m.id)).length
    const estacaoConclvida = concluidasEstacao === totalMissoesEstacao

    const idxAtual = estacoes.findIndex(e => e.id === estacaoAtual!.id)
    const proximaEstacao = idxAtual < estacoes.length - 1 ? estacoes[idxAtual + 1] : null

    html += `
      <div class="card-container">
        <button id="btn-voltar-home" class="btn-back">⬅ Voltar às Estações</button>
        <h2>${estacaoAtual.icone} ${estacaoAtual.nome}</h2>
        <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:15px;">${estacaoAtual.descricao}</p>

        ${estacaoConclvida ? `
          <div style="background:#f0fdf4; border:2px solid var(--primary); padding:14px; border-radius:10px; margin-bottom:15px; text-align:center;">
            <h4 style="color:var(--primary-dark);">🎉 Recanto Concluído com Sucesso!</h4>
            <p style="font-size:0.85rem; color:var(--text-muted); margin:4px 0 10px 0;">Todas as atividades deste ponto foram entregues.</p>
            ${proximaEstacao ? `
              <button class="btn-primary btn-proximo-recanto" data-id="${proximaEstacao.id}">
                Ir para o Próximo Recanto (${proximaEstacao.nome}) ➔
              </button>
            ` : `
              <button id="btn-ver-conquistas-final" class="btn-primary">
                🏆 Ver Resultado Final da Expedição
              </button>
            `}
          </div>
        ` : ''}

        <h3>Atividades deste Recanto:</h3>
        <div style="margin-top:10px; display:flex; flex-direction:column; gap:10px;">
          ${estacaoAtual.missoes.map(m => {
            const feita = respostasGerais.some(r => r.missaoId === m.id)
            return `
              <div class="missao-card">
                <h4>${m.titulo}${feita ? '✅' : ''}</h4>
                <p style="font-size:0.85rem; color:var(--text-muted); margin:4px 0 10px 0;">${m.descricao}</p>
                <button class="btn-primary btn-abrir-missao" data-id="${m.id}">
                  ${feita ? 'Editar Registro' : 'Fazer Atividade'}
                </button>
              </div>
            `
          }).join('')}
        </div>
      </div>
    `
  } else if (telaAtual === 'trilha') {
  html += `
    <div class="home-exploracao">

      <section class="hero-exploracao">
        <div class="hero-selo">🌿 EXPLORE ITS</div>

        <h2>Trilha da Semente Peregrina</h2>

        <p class="hero-frase">
          A natureza deixou pistas.<br>
          <strong>Você consegue encontrá-las?</strong>
        </p>

        <div class="ciclo-investigador">
          <div>
            <span>👀</span>
            <small>Observar</small>
          </div>
          <div class="ciclo-seta">→</div>
          <div>
            <span>🔎</span>
            <small>Investigar</small>
          </div>
          <div class="ciclo-seta">→</div>
          <div>
            <span>📝</span>
            <small>Registrar</small>
          </div>
          <div class="ciclo-seta">→</div>
          <div>
            <span>💡</span>
            <small>Descobrir</small>
          </div>
        </div>
      </section>

      <section class="mapa-exploracao">
        <div class="mapa-cabecalho">
          <span>MAPA DA EXPEDIÇÃO</span>
          <h3>Trilha da Semente Peregrina</h3>
         <p>Conheça o percurso e os pontos de investigação.</p>
      </div>

     <div
  class="mapa-container"
  id="mapa-container"
  aria-label="Mapa interativo da Trilha da Semente Peregrina"
>
  <div class="mapa-carregando">Carregando mapa...</div>

  })

  document.querySelector('#form-cadastro')?.addEventListener('submit', (e) => {
  e.preventDefault()

  const nome = (document.querySelector('#inp-nome') as HTMLInputElement).value
  const turma = (document.querySelector('#inp-turma') as HTMLInputElement).value
  const m = mascotes.find(x => x.id === mascoteTempId) || mascotes[0]

  crachaSalvo = { nome, turma, mascote: m }
  localStorage.setItem('exp_cracha', JSON.stringify(crachaSalvo))

  telaAtual = 'trilha'
  render()
})

  document.querySelector('#btn-sair')?.addEventListener('click', () => {
    if (confirm('Deseja apagar os dados locais e reiniciar?')) {
      localStorage.clear()
      crachaSalvo = null
      respostasGerais = []
      medicoesTemperatura = []
      estacaoAtual = null
      missaoAtual = null
      verTabelaTemp = false
      verCaderno = false
      verConquistas = false
      render()
    }
  })

  document.querySelector('#btn-conquistas')?.addEventListener('click', () => { verConquistas = true; verTabelaTemp = false; verCaderno = false; render() })
  document.querySelector('#btn-ver-conquistas-final')?.addEventListener('click', () => { verConquistas = true; verTabelaTemp = false; verCaderno = false; estacaoAtual = null; render() })
  document.querySelector('#btn-tabela-temp')?.addEventListener('click', () => { verTabelaTemp = true; verCaderno = false; verConquistas = false; render() })
  document.querySelector('#btn-caderno')?.addEventListener('click', () => { verCaderno = true; verTabelaTemp = false; verConquistas = false; render() })
  document.querySelector('#btn-voltar-estacoes')?.addEventListener('click', () => { verTabelaTemp = false; verCaderno = false; verConquistas = false; render() })

  document.querySelectorAll('.btn-abrir-estacao').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id')
      estacaoAtual = estacoes.find(e => e.id === id) || null
      render()
    })
  })

  document.querySelectorAll('.btn-proximo-recanto').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id')
      estacaoAtual = estacoes.find(e => e.id === id) || null
      missaoAtual = null
      render()
    })
  })

  document.querySelector('#btn-voltar-home')?.addEventListener('click', () => { estacaoAtual = null; render() })

  document.querySelectorAll('.btn-abrir-missao').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id')
      fotoTemp = null
      audioTemp = null
      opcaoSelecionadaQuiz = null
      evidenciasSelecionadas = []
      capivaraAvistada = false
      missaoAtual = estacaoAtual?.missoes.find(m => m.id === id) || null
      render()
    })
  })

  document.querySelector('#btn-voltar-estacao')?.addEventListener('click', () => { missaoAtual = null; render() })

  document.querySelectorAll('input[name="opcao-quiz"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      opcaoSelecionadaQuiz = (e.target as HTMLInputElement).value
    })
  })

  document.querySelector('#btn-toggle-capivara')?.addEventListener('click', () => {
    capivaraAvistada = !capivaraAvistada
    render()
  })

  document.querySelectorAll('.chk-evidencia').forEach(chk => {
    chk.addEventListener('change', () => {
      evidenciasSelecionadas = Array.from(document.querySelectorAll('.chk-evidencia:checked')).map(el => (el as HTMLInputElement).value)
    })
  })

  const btnFoto = document.querySelector('#btn-foto')
  const inputFoto = document.querySelector('#input-foto') as HTMLInputElement
  if (btnFoto && inputFoto) {
    btnFoto.addEventListener('click', () => inputFoto.click())
    inputFoto.addEventListener('change', () => {
      const file = inputFoto.files?.[0]
      if (file) {
        const r = new FileReader()
        r.onload = (e) => { fotoTemp = e.target?.result as string; render() }
        r.readAsDataURL(file)
      }
    })
  }

  document.querySelector('#btn-audio')?.addEventListener('click', () => {
    audioTemp = "Audio_Registrado"
    alert('Áudio gravado com sucesso!')
    render()
  })

  document.querySelector('#form-missao')?.addEventListener('submit', (e) => {
    e.preventDefault()
    if (!missaoAtual || !estacaoAtual) return

    let conteudo = ''
    let midiaUrl = undefined
</div>

      <section class="orientacao-exploracao">
        <div class="orientacao-icone">🧭</div>
        <div>
          <strong>Como explorar?</strong>
          <p>
            Escolha um recanto, observe o ambiente e siga as pistas.
            A resposta está na natureza.
          </p>
        </div>
      </section>

      <div class="titulo-recantos">
        <div>
          <span>EXPEDIÇÃO</span>
          <h3>Escolha um recanto para começar</h3>
        </div>
      </div>

      <div class="recantos-grid">
        ${estacoes.map((e, index) => {
          const totalM = e.missoes.length
          const concM = e.missoes.filter(m =>
            respostasGerais.some(r => r.missaoId === m.id)
          ).length

          const concluida = concM === totalM && totalM > 0

          return `
            <article class="recanto-card novo-recanto-card ${concluida ? 'recanto-concluido' : ''}">

              <div class="recanto-topo">
                <div class="recanto-numero">
                  ${index + 1}
                </div>

                <div class="recanto-icone">
                  ${e.icone}
                </div>

                ${concluida ? `
                  <div class="recanto-check">✓</div>
                ` : ''}
              </div>

              <div class="recanto-conteudo">
                <small class="recanto-label">RECANTO ${index + 1}</small>

                <h3>${e.nome}</h3>

                <p>${e.descricao}</p>

                <div class="recanto-status">
                  ${concluida
                    ? '✓ Investigação registrada'
                    : '🔎 Pronto para investigar'}
                </div>

                <button
                  class="btn-primary btn-abrir-estacao"
                  data-id="${e.id}"
                >
                  ${concluida ? 'Revisar investigação' : 'Explorar recanto →'}
                </button>
              </div>

            </article>
          `
        }).join('')}
      </div>

      <section class="frase-final-exploracao">
        <span>🌱</span>
        <p>
          <strong>Observe com atenção.</strong><br>
          Cada detalhe pode ser uma descoberta.
        </p>
      </section>

    </div>
  `
}

  if (modalMensagem) {
    html = `
      <div class="modal-overlay">
        <div class="modal-card">
          <h3>✅ Atividade Salva!</h3>
          <p style="margin:10px 0;">${modalMensagem}</p>
          <button id="btn-fechar-modal" class="btn-primary">OK</button>
        </div>
      </div>
    `
  }

 app.innerHTML = html

if (telaAtual === 'mapa-its') {
  carregarMapaITS()
} else {
  carregarMapaInterativo()
}

bindEvents()
}

function bindEvents() {

  document.querySelector('#btn-explorar-its')?.addEventListener('click', () => {
    telaAtual = 'mapa-its'
    render()
  })

  document.querySelector('#btn-voltar-mapa-its')?.addEventListener('click', () => {
    localidadeAtual = null
    telaAtual = 'mapa-its'
    render()
  })

  document.querySelector('#btn-iniciar-expedicao')?.addEventListener('click', () => {
    telaAtual = 'cadastro'
    render()
  })

  document.querySelector('#nav-home')?.addEventListener('click', () => {
    estacaoAtual = null
    missaoAtual = null
    verTabelaTemp = false
    verCaderno = false
    verConquistas = false
    render()
  })

  document.querySelectorAll('.mascote-card').forEach(el => {
    el.addEventListener('click', () => {
      mascoteTempId = el.getAttribute('data-id') || mascotes[0].id
      render()
    })
    if (missaoAtual.tipo === 'investigacao-corrego') {
      const chks = Array.from(document.querySelectorAll('.chk-evidencia:checked')).map(el => (el as HTMLInputElement).value)
      if (chks.length < 2) {
        return alert('Por favor, selecione pelo menos 2 evidências observadas!')
      }
      if (!fotoTemp) {
        return alert('Por favor, fotografe 1 das evidências!')
      }

      const hipotese = (document.querySelector('#inp-hipotese') as HTMLTextAreaElement).value
      const proxima = (document.querySelector('#sel-proxima-investigacao') as HTMLSelectElement).value

      if (!hipotese.trim()) return alert('Por favor, descreva o que observou e sua hipótese!')
      if (!proxima) return alert('Por favor, escolha o que investigaria amanhã!')

      conteudo = `Evidências selecionadas:\n- ${chks.join('\n- ')}\n\nHipótese Ecológica:\n"${hipotese}"\n\nPróximo Teste Científico:\n${proxima}${capivaraAvistada ? '\n\n🐾 Capivara avistada com segurança no local!' : ''}`
      midiaUrl = fotoTemp
    } else if (missaoAtual.tipo === 'quiz') {
      if (!opcaoSelecionadaQuiz) return alert('Por favor, escolha uma das opções!')
      const opt = missaoAtual.opcoesQuiz?.find(o => o.id === opcaoSelecionadaQuiz)
      if (!opt) return

      if (!opt.correta) {
        return alert(`❌ Resposta incorreta!\n\n${opt.explicacao}\n\nTente novamente!`)
      }

      conteudo = `Resposta Correta: ${opt.texto}`
    } else if (missaoAtual.tipo === 'temperatura') {
      const tempVal = parseFloat((document.querySelector('#inp-temp') as HTMLInputElement).value)
      const horaVal = (document.querySelector('#inp-hora') as HTMLInputElement).value

      if (isNaN(tempVal)) return alert('Por favor, digite um valor de temperatura válido!')

      medicoesTemperatura = medicoesTemperatura.filter(m => m.estacaoId !== estacaoAtual!.id)
      medicoesTemperatura.push({
        estacaoId: estacaoAtual.id,
        estacaoNome: estacaoAtual.nome,
        valorTemp: tempVal,
        horarioMedicao: horaVal
      })
      localStorage.setItem('exp_medicoes', JSON.stringify(medicoesTemperatura))

      conteudo = `Temperatura: ${tempVal} °C às ${horaVal}`
    } else if (missaoAtual.tipo === 'foto') {
      if (!fotoTemp) return alert('Por favor, tire uma foto!')
      conteudo = 'Foto registrada no local'
      midiaUrl = fotoTemp
    } else if (missaoAtual.tipo === 'texto') {
      conteudo = (document.querySelector('#inp-texto') as HTMLTextAreaElement).value
    } else if (missaoAtual.tipo === 'audio') {
      if (!audioTemp) return alert('Por favor, grave o áudio!')
      conteudo = 'Áudio gravado no local'
    }

    const novaResp: RespostaAtividade = {
      estacaoId: estacaoAtual.id,
      missaoId: missaoAtual.id,
      titulo: `${estacaoAtual.nome} - ${missaoAtual.titulo}`,
      conteudo,
      midiaUrl,
      dataHora: new Date().toLocaleString('pt-BR')
    }

    respostasGerais = respostasGerais.filter(r => r.missaoId !== missaoAtual!.id)
    respostasGerais.push(novaResp)
    localStorage.setItem('exp_respostas', JSON.stringify(respostasGerais))

    const totalMissoes = estacaoAtual.missoes.length
    const concluidas = estacaoAtual.missoes.filter(m => respostasGerais.some(r => r.missaoId === m.id)).length

    if (concluidas === totalMissoes) {
      modalMensagem = `🎉 Parabéns! Você concluiu todas as atividades do ${estacaoAtual.nome}. Medalha 'Investigador das Relações Ecológicas' Desbloqueada!`
    } else {
      modalMensagem = `Atividade salva com sucesso!`
    }

    render()
  })

  document.querySelector('#btn-fechar-modal')?.addEventListener('click', () => {
    modalMensagem = null

    if (estacaoAtual) {
      const totalMissoes = estacaoAtual.missoes.length
      const concluidas = estacaoAtual.missoes.filter(m => respostasGerais.some(r => r.missaoId === m.id)).length
      if (concluidas === totalMissoes) {
        estacaoAtual = null
      }
    }

    missaoAtual = null
    render()
  })
}

render()