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


// =====================================================
// ESTADO DA EXPEDIÇÃO
// Dados que permanecem salvos durante a investigação
// =====================================================

let crachaSalvo: Cracha | null = JSON.parse(
  localStorage.getItem('exp_cracha') || 'null'
)

let inicioExpedicao: string | null =
  localStorage.getItem('exp_inicio_expedicao')

let idExpedicao: string | null =
  localStorage.getItem('exp_id_expedicao')

let respostasGerais: RespostaAtividade[] = JSON.parse(
  localStorage.getItem('exp_respostas') || '[]'
)

let medicoesTemperatura: MedicaoTemp[] = JSON.parse(
  localStorage.getItem('exp_medicoes') || '[]'
)


// =====================================================
// DESCOBERTAS PELO CAMINHO
// =====================================================

type DescobertaExpedicao = {
  id: string
  tipo:
    | 'pequenos-habitantes'
    | 'quem-passou'
    | 'vidas-conectadas'
    | 'curiosidade'
  foto: string
  pergunta?: string
  dataHora: string
}

let descobertasExpedicao: DescobertaExpedicao[] = JSON.parse(
  localStorage.getItem('exp_descobertas') || '[]'
)


// =====================================================
// RETRATOS DA PAISAGEM
// Pontos de observação A, B e C
// =====================================================

type RegistroPaisagem = {
  ponto: 'A' | 'B' | 'C'
  foto: string | null
  porteVegetacao: number
  aberturaPaisagem: number
  luzSolo: number
  temperatura: number | null
  dataHora: string
}

let registrosPaisagem: RegistroPaisagem[] = JSON.parse(
  localStorage.getItem('exp_paisagens') || '[]'
)

let interpretacaoPaisagem: string =
  localStorage.getItem('exp_interpretacao_paisagem') || ''


// =====================================================
// ESTADO TEMPORÁRIO DA INTERFACE
// Não representa dados científicos permanentes
// =====================================================

let mascoteTempId = mascotes[0].id

let estacaoAtual: Estacao | null = null
let missaoAtual: Missao | null = null

let paisagemAtual: 'A' | 'B' | 'C' | null = null

let finalExpedicaoAberto = false
let sinteseExpedicaoAberta = false

let desafiosExpedicaoAberto = false

let desafioAtual:
  | 'pequenos-habitantes'
  | 'quem-passou'
  | 'vidas-conectadas'
  | 'curiosidade'
  | null = null

let fotoDesafioTemp: string | null = null
let fotoPaisagemTemp: string | null = null
let fotoTemp: string | null = null

let opcaoSelecionadaQuiz: string | null = null

let verTabelaTemp = false

let verCaderno = false

let verConquistas = false

let modalMensagem: string | null = null


// =====================================================
// ÁUDIO — ESTADO TEMPORÁRIO DE GRAVAÇÃO
// =====================================================

let audioTemp: string | null = null

let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []
let streamAudio: MediaStream | null = null
let gravandoAudio = false

// Navegação entre as telas principais do aplicativo
type TelaApp =
  | 'inicio'
  | 'mapa-its'
  | 'localidade'
  | 'cadastro'
  | 'trilha'

let telaAtual: TelaApp = 'inicio'
let localidadeAtual: string | null = null


const app = document.querySelector<HTMLDivElement>('#app')!

// =====================================================
// TEMPO DA EXPEDIÇÃO
// Registro e apresentação de horários
// =====================================================

function obterHoraAtual(): string {
  const agora = new Date()
  return agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function obterDataHoraISO(): string {
  return new Date().toISOString()
}

function formatarHorarioRegistro(dataHora: string): string {
  // Registros novos em formato ISO
  if (dataHora.includes('T')) {
    const data = new Date(dataHora)

    if (!isNaN(data.getTime())) {
      return data.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  // Compatibilidade com os registros antigos
  const horarioAntigo = dataHora.match(/\d{2}:\d{2}/)

  return horarioAntigo?.[0] || dataHora
}

// =====================================================
// GPS DA EXPEDIÇÃO
// Leitura da posição atual do dispositivo
// =====================================================

let gpsWatchId: number | null = null

function calcularDistanciaMetros(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const raioTerra = 6371000

  const paraRadianos = (graus: number) =>
    graus * Math.PI / 180

  const deltaLat = paraRadianos(lat2 - lat1)
  const deltaLon = paraRadianos(lon2 - lon1)

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(paraRadianos(lat1)) *
    Math.cos(paraRadianos(lat2)) *
    Math.sin(deltaLon / 2) *
    Math.sin(deltaLon / 2)

  const c = 2 * Math.atan2(
    Math.sqrt(a),
    Math.sqrt(1 - a)
  )

  return raioTerra * c
}

function obterLocalizacaoAtual(svg: SVGSVGElement) {
  if (!navigator.geolocation) {
    console.warn('GPS: geolocalização não disponível neste dispositivo.')
    return
  }

  if (gpsWatchId !== null) {
    navigator.geolocation.clearWatch(gpsWatchId)
    gpsWatchId = null
  }

  gpsWatchId = navigator.geolocation.watchPosition(
    posicao => {
      const latitude = posicao.coords.latitude
      const longitude = posicao.coords.longitude
      const precisao = posicao.coords.accuracy

      console.log('GPS DO DISPOSITIVO')
      console.log('Latitude:', latitude)
      console.log('Longitude:', longitude)
      console.log('Precisão:', `± ${Math.round(precisao)} m`)

            const idsMarcadoresGPS = [
        'marcador_inicio',
        'marcador_saci_perere',
        'marcador_paisagemA',
        'marcador_paisagemB',
        'marcador_caipora',
        'marcador_paisagemC',
        'marcador_fim'
      ]

      console.log('DISTÂNCIAS ATÉ OS PONTOS DA TRILHA')

      let pontoMaisProximo = ''
      let menorDistancia = Infinity

      idsMarcadoresGPS.forEach(id => {
        const marcador = svg.querySelector<SVGElement>(`#${id}`)

        if (!marcador) return

        const latTexto = marcador.getAttribute('data-lat')
        const lonTexto = marcador.getAttribute('data-lon')

        if (!latTexto || !lonTexto) return

        const latPonto = Number(latTexto)
        const lonPonto = Number(lonTexto)

        const distancia = calcularDistanciaMetros(
        latitude,
        longitude,
        latPonto,
        lonPonto
)

console.log(
  `${id}: ${Math.round(distancia)} m`
)

if (distancia < menorDistancia) {
  menorDistancia = distancia
  pontoMaisProximo = id
}

      })

      console.log('PONTO MAIS PRÓXIMO DO DISPOSITIVO')
      console.log('Marcador:', pontoMaisProximo)
      console.log('Distância:', `${Math.round(menorDistancia)} m`)
const gpsDiagnostico = document.querySelector<HTMLDivElement>('#gps-diagnostico')

if (gpsDiagnostico) {
  gpsDiagnostico.innerHTML = `
    📍 <strong>GPS — teste de campo</strong><br>
    Ponto mais próximo: <strong>${pontoMaisProximo}</strong><br>
    Distância: <strong>${Math.round(menorDistancia)} m</strong><br>
    Precisão: <strong>± ${Math.round(precisao)} m</strong>
  `
}

    },

    erro => {
      console.warn(
        'GPS: não foi possível obter a localização.',
        erro.message
      )
    },

    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  )
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
    'Mapa da Trilha da Semente Peregrina'
  )

// ESTAÇÕES DE INVESTIGAÇÃO DO MAPA
    
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
    const resposta = await fetch('/explore-its/mapa-trilha-app.svg')

    if (!resposta.ok) {
      throw new Error('Não foi possível carregar o mapa.')
    }

    const svgTexto = await resposta.text()

    container.innerHTML = svgTexto

    console.log(
    'IDS DO MAPA DA TRILHA:',
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

  // TESTE DAS COORDENADAS GPS GRAVADAS NO SVG
  const idsMarcadoresGPS = [
    'marcador_inicio',
    'marcador_saci_perere',
    'marcador_paisagemA',
    'marcador_paisagemB',
    'marcador_caipora',
    'marcador_paisagemC',
    'marcador_fim'
  ]

  idsMarcadoresGPS.forEach(id => {
    const marcador = svg.querySelector<SVGElement>(`#${id}`)

    if (!marcador) {
      console.warn(`GPS: marcador ${id} não encontrado.`)
      return
    }

    const latitude = marcador.getAttribute('data-lat')
    const longitude = marcador.getAttribute('data-lon')

    console.log(
      `GPS ${id}:`,
      'latitude =',
      latitude,
      'longitude =',
      longitude
    )
  })

obterLocalizacaoAtual(svg)

// ESTAÇÕES DE INVESTIGAÇÃO DO MAPA
const estacoesMapa = [
  { mapa: 'marcador_inicio', estacao: 'inicio-trilha' },
  { mapa: 'marcador_saci_perere', estacao: 'recanto-saci-perere' },
  { mapa: 'marcador_caipora', estacao: 'caipora' }
]

estacoesMapa.forEach(({ mapa, estacao }) => {
  const marcador = svg.querySelector<SVGElement>(`#${mapa}`)

  if (!marcador) {
    console.warn(`Marcador ${mapa} não encontrado no SVG.`)
    return
  }

  marcador.style.cursor = 'pointer'

  marcador.addEventListener('click', () => {
    const encontrada = estacoes.find(
      item => item.id === estacao
    )

    if (!encontrada) {
      console.warn(`Estação ${estacao} não encontrada.`)
      return
    }

    paisagemAtual = null
    fotoPaisagemTemp = null
    estacaoAtual = encontrada
    missaoAtual = null

    render()
  })
})

  // PONTOS DE OBSERVAÇÃO DA PAISAGEM
  const paisagensMapa = [
    { mapa: 'marcador_paisagemA', paisagem: 'A' },
    { mapa: 'marcador_paisagemB', paisagem: 'B' },
    { mapa: 'marcador_paisagemC', paisagem: 'C' }
  ]

  paisagensMapa.forEach(({ mapa, paisagem }) => {
    const marcador = svg.querySelector<SVGElement>(`#${mapa}`)

    if (!marcador) {
      console.warn(`Marcador da Paisagem ${paisagem} não encontrado no SVG.`)
      return
    }

    marcador.style.cursor = 'pointer'

marcador.addEventListener('click', () => {
  paisagemAtual = paisagem as 'A' | 'B' | 'C'

  const registroExistente = registrosPaisagem.find(
    registro => registro.ponto === paisagemAtual
  )

  fotoPaisagemTemp = registroExistente?.foto || null

  estacaoAtual = null
  missaoAtual = null

  render()
})
 })

// FINAL DA EXPEDIÇÃO
const marcadorFim = svg.querySelector<SVGElement>('#marcador_fim')

if (marcadorFim) {
  marcadorFim.style.cursor = 'pointer'

  marcadorFim.addEventListener('click', () => {
    estacaoAtual = null
    missaoAtual = null
    paisagemAtual = null
    desafioAtual = null
    desafiosExpedicaoAberto = false

    finalExpedicaoAberto = true

    render()
  })
}

} // fecha if (svg)

} catch (erro) {
  console.error('Erro ao carregar o mapa:', erro)

  container.innerHTML =
    '<p class="mapa-erro">Não foi possível carregar o mapa.</p>'
  }
}

function render() {
  
  let html = `
    <header class="app-header">
      <div class="header-content">
        <span class="logo" id="nav-home">🍃 Explore ITS</span>
        ${crachaSalvo && telaAtual === 'trilha' ? `
          <div class="user-badge">
            <small><strong>${crachaSalvo.mascote.emoji}${crachaSalvo.nome}</strong></small>
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

${crachaSalvo ? `
  <button
    id="btn-continuar-expedicao"
    class="btn-primary localidade-iniciar"
  >
    Continuar a expedição →
  </button>
` : `
  <button
    id="btn-iniciar-expedicao"
    class="btn-primary localidade-iniciar"
  >
    Iniciar a expedição →
  </button>
`}

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

} else if (telaAtual === 'trilha' && verTabelaTemp) {

  const temperaturaInicial = medicoesTemperatura.find(
    m => m.estacaoId === 'inicio-trilha'
  )

  const paisagemA = registrosPaisagem.find(r => r.ponto === 'A')
  const paisagemB = registrosPaisagem.find(r => r.ponto === 'B')
  const paisagemC = registrosPaisagem.find(r => r.ponto === 'C')

  const pontosTemperatura = [
    {
      nome: 'Início da Trilha',
      temperatura: temperaturaInicial?.valorTemp ?? null,
      horario: temperaturaInicial?.horarioMedicao ?? null
    },
    {
      nome: 'Paisagem A',
      temperatura: paisagemA?.temperatura ?? null,
      horario: paisagemA ? formatarHorarioRegistro(paisagemA.dataHora) : null
    },
    {
      nome: 'Paisagem B',
      temperatura: paisagemB?.temperatura ?? null,
      horario: paisagemB ? formatarHorarioRegistro(paisagemB.dataHora) : null
    },
    {
      nome: 'Paisagem C',
      temperatura: paisagemC?.temperatura ?? null,
      horario: paisagemC ? formatarHorarioRegistro(paisagemC.dataHora) : null
    }
  ]

  html += `
    <div class="card-container">

      <button id="btn-voltar-estacoes" class="btn-back">
        ⬅ Voltar para a expedição
      </button>

      <h2>🌡️ Temperaturas ao longo da trilha</h2>

      <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:15px;">
        Compare as temperaturas registradas em diferentes ambientes
        durante a expedição.
      </p>

      <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.9rem;">
        <thead>
          <tr style="border-bottom:2px solid var(--border); background:#f1f5f9;">
            <th style="padding:8px;">Ponto</th>
            <th style="padding:8px;">Temp. (°C)</th>
            <th style="padding:8px;">Horário</th>
          </tr>
        </thead>

        <tbody>
          ${pontosTemperatura.map(ponto => `
            <tr style="border-bottom:1px solid var(--border);">

              <td style="padding:10px 8px;">
                <strong>${ponto.nome}</strong>
              </td>

              <td style="padding:10px 8px; color:var(--primary-dark); font-weight:bold;">
                ${
                  ponto.temperatura !== null
                    ? `${ponto.temperatura} °C`
                    : '<span style="color:#d97706;">—</span>'
                }
              </td>

              <td style="padding:10px 8px; color:var(--text-muted);">
                ${ponto.horario ?? '—'}
              </td>

            </tr>
          `).join('')}
        </tbody>
      </table>

    </div>
  `
} else if (telaAtual === 'trilha' && verCaderno) {

  const paisagensCompletas =
    registrosPaisagem.some(r => r.ponto === 'A') &&
    registrosPaisagem.some(r => r.ponto === 'B') &&
    registrosPaisagem.some(r => r.ponto === 'C')

const registroA = registrosPaisagem.find(r => r.ponto === 'A')
const registroB = registrosPaisagem.find(r => r.ponto === 'B')
const registroC = registrosPaisagem.find(r => r.ponto === 'C')

let tempoExpedicao = ''

if (inicioExpedicao) {
  const inicio = new Date(inicioExpedicao).getTime()
  const agora = Date.now()

  const minutosTotais = Math.max(
    0,
    Math.floor((agora - inicio) / 60000)
  )

  const horas = Math.floor(minutosTotais / 60)
  const minutos = minutosTotais % 60

  tempoExpedicao =
    horas > 0
      ? `${horas} h ${minutos} min`
      : `${minutos} min`
}

html += `
    <div class="card-container">
      <button id="btn-voltar-estacoes" class="btn-back">
        ⬅ Voltar às Estações
      </button>

      <h2>📜 Caderno de Campo</h2>

      <p>
        <small>
          Estudante/Grupo: ${crachaSalvo.nome} |
          Turma: ${crachaSalvo.turma}
        </small>
      </p>

<hr style="margin:10px 0; border:0; border-top:1px solid var(--border);" />

${inicioExpedicao ? `
  <div class="caderno-expedicao-info">
    <span>EXPEDIÇÃO</span>

    <strong>
      📅 ${new Date(inicioExpedicao).toLocaleDateString('pt-BR')}
      &nbsp;•&nbsp;
      🕒 Início ${new Date(inicioExpedicao).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })}
      ${tempoExpedicao
        ? `&nbsp;•&nbsp; ⏱ ${tempoExpedicao}`
        : ''}
    </strong>
  </div>
` : ''}

${respostasGerais.length === 0 &&
  registrosPaisagem.length === 0 &&
  descobertasExpedicao.length === 0
    ? '<p>Nenhum registro gravado ainda.</p>'
    : ''
}

      ${registrosPaisagem.length > 0 ? `
        <h3 style="margin-top:18px;">🌿 Retratos da Paisagem</h3>

        ${registrosPaisagem
          .sort((a, b) => a.ponto.localeCompare(b.ponto))
          .map(r => `
            <div class="resposta-card">

              <h4>📍 Ponto ${r.ponto} — Retrato da Paisagem</h4>

              ${r.foto ? `
                <div class="preview-box">
                  <img
                    src="${r.foto}"
                    class="img-preview"
                    alt="Paisagem registrada no Ponto ${r.ponto}"
                  />
                </div>
              ` : ''}

<div class="caderno-escala">
  <strong>Porte da vegetação</strong>

  <div class="caderno-escala-extremos">
    <span>Baixa</span>
    <span>Alta</span>
  </div>

  <div class="caderno-escala-linha">
    <span
      class="caderno-escala-marcador"
      style="left:${r.porteVegetacao}%"
    ></span>
  </div>
</div>

<div class="caderno-escala">
  <strong>Abertura da paisagem</strong>

  <div class="caderno-escala-extremos">
    <span>Aberta</span>
    <span>Fechada</span>
  </div>

  <div class="caderno-escala-linha">
    <span
      class="caderno-escala-marcador"
      style="left:${r.aberturaPaisagem}%"
    ></span>
  </div>
</div>

<div class="caderno-escala">
  <strong>Luz chegando ao solo</strong>

  <div class="caderno-escala-extremos">
    <span>Muita</span>
    <span>Pouca</span>
  </div>

  <div class="caderno-escala-linha">
    <span
      class="caderno-escala-marcador"
      style="left:${r.luzSolo}%"
    ></span>
  </div>
</div>

              ${r.temperatura !== null ? `
                <p style="font-size:0.9rem;">
                  <strong>🌡️ Temperatura:</strong>
                  ${r.temperatura} °C
                </p>
              ` : ''}

              <small style="color:var(--text-muted); font-size:0.75rem;">
              🕒 ${formatarHorarioRegistro(r.dataHora)}
              </small>

            </div>
          `).join('')}
      ` : ''}

${paisagensCompletas && registroA && registroB && registroC ? `
  <div class="comparacao-paisagens">

    <h3>🔎 Compare as paisagens</h3>

    <p>
      Você já registrou os três pontos de observação.
      Agora compare as evidências coletadas ao longo da trilha.
    </p>

    <div class="comparacao-variavel">
      <strong>Porte da vegetação</strong>

      <div class="comparacao-extremos">
        <span>Baixa</span>
        <span>Alta</span>
      </div>

      <div class="comparacao-linha">
        <span
          class="comparacao-ponto comparacao-a"
          style="left:${registroA.porteVegetacao}%"
        >A</span>

        <span
          class="comparacao-ponto comparacao-b"
          style="left:${registroB.porteVegetacao}%"
        >B</span>

        <span
          class="comparacao-ponto comparacao-c"
          style="left:${registroC.porteVegetacao}%"
        >C</span>
      </div>
    </div>

    <div class="comparacao-variavel">
      <strong>Abertura da paisagem</strong>

      <div class="comparacao-extremos">
        <span>Aberta</span>
        <span>Fechada</span>
      </div>

      <div class="comparacao-linha">
        <span
          class="comparacao-ponto comparacao-a"
          style="left:${registroA.aberturaPaisagem}%"
        >A</span>

        <span
          class="comparacao-ponto comparacao-b"
          style="left:${registroB.aberturaPaisagem}%"
        >B</span>

        <span
          class="comparacao-ponto comparacao-c"
          style="left:${registroC.aberturaPaisagem}%"
        >C</span>
      </div>
    </div>

    <div class="comparacao-variavel">
      <strong>Luz chegando ao solo</strong>

      <div class="comparacao-extremos">
        <span>Muita</span>
        <span>Pouca</span>
      </div>

      <div class="comparacao-linha">
        <span
          class="comparacao-ponto comparacao-a"
          style="left:${registroA.luzSolo}%"
        >A</span>

        <span
          class="comparacao-ponto comparacao-b"
          style="left:${registroB.luzSolo}%"
        >B</span>

        <span
          class="comparacao-ponto comparacao-c"
          style="left:${registroC.luzSolo}%"
        >C</span>
      </div>
    </div>

    <div class="comparacao-temperatura">

      <strong>🌡️ Temperatura registrada</strong>

      <div class="comparacao-temperatura-valores">

        <div>
          <span class="temperatura-ponto">A</span>
          <strong>
            ${registroA.temperatura !== null
              ? `${registroA.temperatura} °C`
              : '—'}
          </strong>
        </div>

        <div>
          <span class="temperatura-ponto">B</span>
          <strong>
            ${registroB.temperatura !== null
              ? `${registroB.temperatura} °C`
              : '—'}
          </strong>
        </div>

        <div>
          <span class="temperatura-ponto">C</span>
          <strong>
            ${registroC.temperatura !== null
              ? `${registroC.temperatura} °C`
              : '—'}
          </strong>
        </div>

      </div>

    </div>

    <div class="interpretacao-paisagem">

      <h4>🧭 O que mudou ao longo da trilha?</h4>

      <p>
        Compare os pontos A, B e C. Descreva uma diferença
        ou um padrão que chamou sua atenção e indique quais
        evidências sustentam sua observação.
      </p>

      <label for="texto-interpretacao-paisagem">
        <strong>Minha interpretação</strong>
      </label>

      <textarea
        id="texto-interpretacao-paisagem"
        rows="4"
        placeholder="Ex.: Observei que..."
      >${interpretacaoPaisagem}</textarea>

      <button
        type="button"
        class="btn-primary"
        id="btn-salvar-interpretacao-paisagem"
      >
        Salvar interpretação
      </button>

    </div>

  </div>
` : ''}

${descobertasExpedicao.length > 0 ? `
  <div class="descobertas-caderno">

    <h3 style="margin-top:18px;">🌿 Descobertas pelo Caminho</h3>

    <p style="font-size:0.9rem; color:var(--text-muted);">
      Evidências e descobertas registradas durante a caminhada.
    </p>

    ${[
      {
        tipo: 'pequenos-habitantes',
        titulo: '🔎 Pequenos habitantes'
      },
      {
        tipo: 'quem-passou',
        titulo: '🐾 Quem passou por aqui?'
      },
      {
        tipo: 'vidas-conectadas',
        titulo: '🔗 Vidas conectadas'
      },
      {
        tipo: 'curiosidade',
        titulo: '❓ Isso me deixou curioso'
      }
    ].map(grupo => {

      const registrosDoGrupo = descobertasExpedicao.filter(
        descoberta => descoberta.tipo === grupo.tipo
      )

      if (registrosDoGrupo.length === 0) return ''

      return `
        <div class="grupo-descobertas ${
          grupo.tipo === 'curiosidade'
              ? 'grupo-curiosidades'
              : 'grupo-fotos'
          }">

          <h4 style="margin:18px 0 8px;">
            ${grupo.titulo}
            <span style="
              font-size:0.75rem;
              font-weight:500;
              color:var(--text-muted);
            ">
              (${registrosDoGrupo.length})
            </span>
          </h4>

          ${registrosDoGrupo.map(descoberta => `
            <div class="resposta-card descoberta-caderno-card">

              <div class="preview-box">
                <img
                  src="${descoberta.foto}"
                  class="img-preview"
                  alt="Descoberta registrada durante a expedição"
                />
              </div>

              ${descoberta.tipo === 'curiosidade' && descoberta.pergunta ? `
                <div class="pergunta-descoberta">
                  <strong>❓ Minha pergunta</strong>
                  <p>${descoberta.pergunta}</p>
                </div>
              ` : ''}

              <small style="color:var(--text-muted); font-size:0.75rem;">
                🕒 ${formatarHorarioRegistro(descoberta.dataHora)}
              </small>

            </div>
          `).join('')}

        </div>
      `
    }).join('')}

  </div>
` : ''}

      ${respostasGerais.length > 0 ? `
        <h3 style="margin-top:18px;">🔎 Registros das Investigações</h3>

        ${respostasGerais.map(r => `
          <div class="resposta-card">
            <h4>${r.titulo}</h4>

            <p style="font-size:0.9rem; margin-top:4px; white-space:pre-line;">
              ${r.conteudo}
            </p>

            ${r.midiaUrl ? `
              <div class="preview-box">
                <img src="${r.midiaUrl}" class="img-preview"/>
              </div>
            ` : ''}

            <small style="color:var(--text-muted); font-size:0.75rem;">
              🕒 ${formatarHorarioRegistro(r.dataHora)}
            </small>
          </div>
        `).join('')}
      ` : ''}

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
            <button type="button" id="btn-audio" class="btn-secondary">
              ${gravandoAudio ? '⏹️ Parar gravação' : '🎙️ Iniciar gravação'}
            </button>

          <div class="preview-box">
          ${gravandoAudio
            ? '<p>🔴 Gravando... observe os sons ao seu redor.</p>'
             : audioTemp
              ? `
                <p>✅ Gravação concluída</p>
                <audio controls src="${audioTemp}" style="width:100%; margin-top:8px;"></audio>
                <small>Ouça o registro antes de salvar a atividade.</small>
        `
        : '<small>Gravação pendente</small>'
    }

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

    html += `
      <div class="card-container">
        <button id="btn-voltar-home" class="btn-back">⬅ Voltar às Etapas</button>
        <h2>${estacaoAtual.icone} ${estacaoAtual.nome}</h2>
        <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:15px;">${estacaoAtual.descricao}</p>

${estacaoConclvida ? `
  <div style="
    background:#f0fdf4;
    border:2px solid var(--primary);
    padding:14px;
    border-radius:10px;
    margin-bottom:15px;
    text-align:center;
  ">
    <h4 style="color:var(--primary-dark);">
      🌿 Registro concluído!
    </h4>

    <p style="
      font-size:0.85rem;
      color:var(--text-muted);
      margin:4px 0 10px 0;
    ">
      Seu registro foi guardado no Caderno da Expedição.
    </p>

    <button
      type="button"
      id="btn-voltar-mapa-estacao"
      class="btn-primary"
    >
      🗺️ Voltar ao mapa e continuar a expedição
    </button>
  </div>
` : ''}

        <h3>Atividades desta etapa:</h3>
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
} else if (telaAtual === 'trilha' && finalExpedicaoAberto) {

  html += `
    <div class="card-container">

      <button
        type="button"
        id="btn-voltar-mapa-final"
        class="btn-back"
      >
        ⬅ Voltar ao mapa
      </button>

      <div style="text-align:center; padding:10px 0 20px 0;">

        <div style="font-size:2.8rem; margin-bottom:10px;">
          🌿
        </div>

        <span style="
          display:inline-block;
          font-size:0.75rem;
          font-weight:700;
          letter-spacing:0.08em;
          color:var(--primary);
          margin-bottom:8px;
        ">
          FIM DO PERCURSO
        </span>

        <h2 style="margin-bottom:10px;">
          A trilha terminou. A investigação ainda não.
        </h2>

        <p style="
          color:var(--text-muted);
          line-height:1.6;
          margin-bottom:20px;
        ">
          Ao longo do caminho, vocês observaram diferentes paisagens,
          fizeram medições e reuniram pistas sobre o ambiente.
        </p>

        <div style="
          background:#f0fdf4;
          border:1px solid #bbf7d0;
          border-radius:12px;
          padding:16px;
          margin-bottom:20px;
          text-align:left;
        ">
          <strong style="color:var(--primary-dark);">
            🔎 Agora vamos olhar para o conjunto.
          </strong>

          <p style="
            margin:6px 0 0 0;
            color:var(--text-muted);
            font-size:0.9rem;
            line-height:1.5;
          ">
            Compare os registros feitos nos três pontos de observação
            e descubra o que mudou ao longo da trilha.
          </p>
        </div>

        <button
          type="button"
          id="btn-reunir-pistas"
          class="btn-primary"
          style="width:100%;"
        >
          Reunir as pistas →
        </button>

      </div>

    </div>
  `

} else if (telaAtual === 'trilha' && sinteseExpedicaoAberta) {

  const paisagemA = registrosPaisagem.find(registro => registro.ponto === 'A')
  const paisagemB = registrosPaisagem.find(registro => registro.ponto === 'B')
  const paisagemC = registrosPaisagem.find(registro => registro.ponto === 'C')

  const paisagensSintese = [
    { ponto: 'A', registro: paisagemA },
    { ponto: 'B', registro: paisagemB },
    { ponto: 'C', registro: paisagemC }
  ]

  html += `
    <div class="card-container">

      <button
        type="button"
        id="btn-voltar-final"
        class="btn-back"
      >
        ⬅ Voltar
      </button>

      <div style="margin-bottom:22px;">

        <span style="
          display:inline-block;
          font-size:0.75rem;
          font-weight:700;
          letter-spacing:0.08em;
          color:var(--primary);
          margin-bottom:6px;
        ">
          🔎 SÍNTESE DA EXPEDIÇÃO
        </span>

        <h2 style="margin-bottom:8px;">
          Vamos reunir as pistas
        </h2>

        <p style="
          color:var(--text-muted);
          line-height:1.5;
        ">
          Observe os registros feitos nos três pontos e compare
          como a paisagem mudou ao longo da trilha.
        </p>

      </div>

      <div style="
        background:#f0fdf4;
        border:1px solid #bbf7d0;
        border-radius:12px;
        padding:14px;
        margin-bottom:24px;
      ">
        <strong style="color:var(--primary-dark);">
          💡 A investigação ainda não terminou
        </strong>

        <p style="
          margin:5px 0 0 0;
          font-size:0.88rem;
          color:var(--text-muted);
          line-height:1.5;
        ">
          Agora as pistas coletadas em diferentes lugares podem ser
          observadas lado a lado.
        </p>
      </div>

      <h3 style="margin-bottom:14px;">
        1. COMPARE OS LUGARES
      </h3>

      <div style="
        display:grid;
        grid-template-columns:repeat(3, 1fr);
        gap:8px;
        margin-bottom:24px;
      ">

        ${paisagensSintese.map(item => `
          <div style="
            border:1px solid var(--border);
            border-radius:10px;
            overflow:hidden;
            background:#fff;
          ">

            <div style="
              text-align:center;
              font-weight:700;
              padding:7px;
              color:var(--primary-dark);
            ">
              Ponto ${item.ponto}
            </div>

            ${item.registro?.foto ? `
              <img
                src="${item.registro.foto}"
                alt="Paisagem do Ponto ${item.ponto}"
                style="
                  width:100%;
                  aspect-ratio:1/1;
                  object-fit:cover;
                  display:block;
                "
              >
            ` : `
              <div style="
                aspect-ratio:1/1;
                display:flex;
                align-items:center;
                justify-content:center;
                background:#f8fafc;
                color:var(--text-muted);
                font-size:0.75rem;
                text-align:center;
                padding:6px;
              ">
                Sem registro neste ponto
              </div>
            `}

            <div style="
              text-align:center;
              padding:7px 4px;
              font-size:0.8rem;
            ">
              🌡️ ${
                item.registro?.temperatura !== null &&
                item.registro?.temperatura !== undefined
                  ? `${item.registro.temperatura} °C`
                  : '—'
              }
            </div>

          </div>
        `).join('')}

      </div>

      ${[
        {
          titulo: '🌿 Porte da vegetação',
          esquerda: 'Baixa',
          direita: 'Alta',
          campo: 'porteVegetacao'
        },
        {
          titulo: '🌳 Abertura da paisagem',
          esquerda: 'Aberta',
          direita: 'Fechada',
          campo: 'aberturaPaisagem'
        },
        {
          titulo: '☀️ Luz chegando ao solo',
          esquerda: 'Muita',
          direita: 'Pouca',
          campo: 'luzSolo'
        }
      ].map(variavel => `

        <div style="margin-bottom:22px;">

          <strong style="font-size:0.9rem;">
            ${variavel.titulo}
          </strong>

          <div style="
            display:flex;
            justify-content:space-between;
            font-size:0.72rem;
            color:var(--text-muted);
            margin-top:5px;
          ">
            <span>${variavel.esquerda}</span>
            <span>${variavel.direita}</span>
          </div>

          ${paisagensSintese.map(item => {

            const valor = item.registro
              ? item.registro[
                  variavel.campo as
                    'porteVegetacao' |
                    'aberturaPaisagem' |
                    'luzSolo'
                ]
              : null

            return `
              <div style="
                display:grid;
                grid-template-columns:20px 1fr;
                gap:7px;
                align-items:center;
                margin-top:8px;
              ">

                <strong style="font-size:0.75rem;">
                  ${item.ponto}
                </strong>

                <div style="
                  position:relative;
                  height:6px;
                  background:#e2e8f0;
                  border-radius:999px;
                ">

                  ${valor !== null ? `
                    <span style="
                      position:absolute;
                      left:${valor}%;
                      top:50%;
                      width:14px;
                      height:14px;
                      border-radius:50%;
                      background:var(--primary);
                      transform:translate(-50%, -50%);
                      border:2px solid white;
                      box-shadow:0 0 0 1px var(--primary);
                    "></span>
                  ` : ''}

                </div>

              </div>
            `
          }).join('')}

        </div>

      `).join('')}

    </div>
  `

} else if (
  telaAtual === 'trilha' &&
  desafiosExpedicaoAberto &&
  desafioAtual === 'pequenos-habitantes'
) {

  html += `
    <div class="card-container desafios-expedicao">

      <button
        type="button"
        id="btn-voltar-lista-desafios"
        class="btn-back"
      >
        ⬅ Voltar aos desafios
      </button>

      <div class="desafios-cabecalho">
        <span>🔎 DESCOBERTA DA EXPEDIÇÃO</span>

        <h2>Pequenos habitantes</h2>

        <p>
          Encontrou um pequeno animal pelo caminho?
        </p>
      </div>

      <div class="orientacao-exploracao">
        <div class="orientacao-icone">👀</div>

        <div>
          <strong>Observe com cuidado</strong>

          <p>
            Observe sem tocar, capturar ou retirar o animal do ambiente.
          </p>
        </div>
      </div>

<button
  type="button"
  class="btn-primary"
  id="btn-registrar-pequeno-habitante"
>
  📷 Registrar descoberta
</button>

<input
  type="file"
  id="input-foto-desafio"
  accept="image/*"
  capture="environment"
  style="display:none;"
>

${fotoDesafioTemp ? `
  <div class="paisagem-foto-preview">
    <img
      src="${fotoDesafioTemp}"
      alt="Pequeno habitante registrado"
    >
    <p>✓ Foto registrada</p>
  </div>

  <button
    type="button"
    class="btn-primary"
    id="btn-guardar-descoberta"
  >
    🌿 Guardar descoberta
  </button>
` : ''}

    </div>
  `
} else if (
  telaAtual === 'trilha' &&
  desafiosExpedicaoAberto &&
  desafioAtual === 'quem-passou'
) {

  html += `
    <div class="card-container desafios-expedicao">

      <button
        type="button"
        id="btn-voltar-lista-desafios"
        class="btn-back"
      >
        ⬅ Voltar aos desafios
      </button>

      <div class="desafios-cabecalho">
        <span>🐾 DESCOBERTA DA EXPEDIÇÃO</span>

        <h2>Quem passou por aqui?</h2>

        <p>
          Encontrou uma pista de um animal que não está vendo?
        </p>
      </div>

      <div class="orientacao-exploracao">
        <div class="orientacao-icone">👀</div>

        <div>
          <strong>Observe sem alterar a pista</strong>

          <p>
            Pegadas, penas, ninhos, tocas, restos de alimento
            e outras marcas podem revelar quem esteve por ali.
          </p>
        </div>
      </div>

      <button
        type="button"
        class="btn-primary"
        id="btn-registrar-quem-passou"
      >
        📷 Registrar pista
      </button>

      <input
        type="file"
        id="input-foto-quem-passou"
        accept="image/*"
        capture="environment"
        style="display:none;"
      >

${fotoDesafioTemp ? `
  <div class="paisagem-foto-preview">
    <img
      src="${fotoDesafioTemp}"
      alt="Pista de animal registrada"
    >
    <p>✓ Pista registrada</p>
  </div>

  <button
    type="button"
    class="btn-primary"
    id="btn-guardar-quem-passou"
  >
    🌿 Guardar descoberta
  </button>
` : ''}

    </div>
  `
} else if (
  telaAtual === 'trilha' &&
  desafiosExpedicaoAberto &&
  desafioAtual === 'vidas-conectadas'
) {

  html += `
    <div class="card-container desafios-expedicao">

      <button
        type="button"
        id="btn-voltar-lista-desafios"
        class="btn-back"
      >
        ⬅ Voltar aos desafios
      </button>

      <div class="desafios-cabecalho">
        <span>🔗 DESCOBERTA DA EXPEDIÇÃO</span>

        <h2>Vidas conectadas</h2>

        <p>
          Percebeu dois seres vivos interagindo?
        </p>
      </div>

      <div class="orientacao-exploracao">
        <div class="orientacao-icone">👀</div>

        <div>
          <strong>Observe a relação</strong>

          <p>
            Procure situações em que um ser vivo esteja usando,
            visitando ou interagindo com outro.
          </p>
        </div>
      </div>

      <button
        type="button"
        class="btn-primary"
        id="btn-registrar-vidas-conectadas"
      >
        📷 Registrar interação
      </button>

      <input
        type="file"
        id="input-foto-vidas-conectadas"
        accept="image/*"
        capture="environment"
        style="display:none;"
      >

${fotoDesafioTemp ? `
  <div class="paisagem-foto-preview">
    <img
      src="${fotoDesafioTemp}"
      alt="Interação entre seres vivos registrada"
    >
    <p>✓ Interação registrada</p>
  </div>

  <button
    type="button"
    class="btn-primary"
    id="btn-guardar-vidas-conectadas"
  >
    🌿 Guardar descoberta
  </button>
` : ''}

    </div>
  `
} else if (
  telaAtual === 'trilha' &&
  desafiosExpedicaoAberto &&
  desafioAtual === 'curiosidade'
) {

  html += `
    <div class="card-container desafios-expedicao">

      <button
        type="button"
        id="btn-voltar-lista-desafios"
        class="btn-back"
      >
        ⬅ Voltar aos desafios
      </button>

      <div class="desafios-cabecalho">
        <span>❓ DESCOBERTA DA EXPEDIÇÃO</span>

        <h2>Isso me deixou curioso</h2>

        <p>
          Algo chamou sua atenção durante a caminhada?
        </p>
      </div>

      <div class="orientacao-exploracao">
        <div class="orientacao-icone">👀</div>

        <div>
          <strong>Observe antes de registrar</strong>

          <p>
            Fotografe algo que despertou sua curiosidade.
            Você não precisa saber a resposta.
          </p>
        </div>
      </div>

<button
  type="button"
  class="btn-primary"
  id="btn-registrar-curiosidade"
>
  📷 Registrar descoberta
</button>

<input
  type="file"
  id="input-foto-curiosidade"
  accept="image/*"
  capture="environment"
  style="display:none;"
>

${fotoDesafioTemp ? `
  <div class="paisagem-foto-preview">
    <img
      src="${fotoDesafioTemp}"
      alt="Descoberta que despertou curiosidade"
    >
    <p>✓ Descoberta registrada</p>
  </div>

  <div class="campo-curiosidade">
    <label for="pergunta-curiosidade">
      <strong>Que pergunta isso despertou em você?</strong>
    </label>

    <textarea
      id="pergunta-curiosidade"
      rows="3"
      maxlength="180"
      placeholder="Ex.: Por que isso acontece?"
    ></textarea>
  </div>

  <button
    type="button"
    class="btn-primary"
    id="btn-guardar-curiosidade"
  >
    🌿 Guardar descoberta
  </button>
` : ''}

    </div>
  `

} else if (telaAtual === 'trilha' && desafiosExpedicaoAberto) {

  const totalPequenosHabitantes = descobertasExpedicao.filter(
    descoberta => descoberta.tipo === 'pequenos-habitantes'
  ).length

const totalQuemPassou = descobertasExpedicao.filter(
  descoberta => descoberta.tipo === 'quem-passou'
).length

const totalVidasConectadas = descobertasExpedicao.filter(
  descoberta => descoberta.tipo === 'vidas-conectadas'
).length

const totalCuriosidades = descobertasExpedicao.filter(
  descoberta => descoberta.tipo === 'curiosidade'
).length

  html += `
      <div class="card-container desafios-expedicao">

        <button
          type="button"
          id="btn-voltar-desafios"
          class="btn-back"
        >
          ⬅ Voltar para a expedição
        </button>

        <div class="desafios-cabecalho">
          <span>🔎 DESCOBERTAS PELO CAMINHO</span>

          <h2>Desafios da Expedição</h2>

          <p>
            Algumas descobertas não têm lugar marcado.
            Enquanto caminha, fique atento ao que a natureza revela.
          </p>
        </div>

        <div class="desafios-lista">

          <button
            type="button"
            class="desafio-card"
            id="btn-pequenos-habitantes"
          >
            <span class="desafio-icone">🔎</span>
            <span>
            <strong>Pequenos habitantes</strong>

            <small>
              ${totalPequenosHabitantes > 0
                ? `🌿 ${totalPequenosHabitantes} ${
                    totalPequenosHabitantes === 1
                      ? 'descoberta registrada'
                      : 'descobertas registradas'
                  }`
                : 'Encontrou um pequeno animal? Registre a descoberta.'
              }
            </small>
          </span>
          </button>

          <button
            type="button"
            class="desafio-card"
            id="btn-quem-passou"
          >
            <span class="desafio-icone">🐾</span>
            <span>
              <strong>Quem passou por aqui?</strong>
              <small>
                ${totalQuemPassou > 0
                  ? `🌿 ${totalQuemPassou} ${
                      totalQuemPassou === 1
                        ? 'descoberta registrada'
                        : 'descobertas registradas'
                    }`
                  : 'Procure pistas de animais que você não está vendo.'
                }
              </small>
            </span>
          </button>

<button
  type="button"
  class="desafio-card"
  id="btn-vidas-conectadas"
>
  <span class="desafio-icone">🔗</span>
  <span>
    <strong>Vidas conectadas</strong>
    <small>
      ${totalVidasConectadas > 0
        ? `🌿 ${totalVidasConectadas} ${
            totalVidasConectadas === 1
              ? 'descoberta registrada'
              : 'descobertas registradas'
          }`
        : 'Percebeu uma interação entre seres vivos? Registre.'
      }
    </small>
  </span>
</button>

<button
  type="button"
  class="desafio-card"
  id="btn-curiosidade"
>
  <span class="desafio-icone">❓</span>
  <span>
    <strong>Isso me deixou curioso</strong>
    <small>
      ${totalCuriosidades > 0
        ? `🌿 ${totalCuriosidades} ${
            totalCuriosidades === 1
              ? 'descoberta registrada'
              : 'descobertas registradas'
          }`
        : 'Algo chamou sua atenção? Guarde essa descoberta.'
      }
    </small>
  </span>
</button>

        </div>

      </div>
    `

  } else if (telaAtual === 'trilha') {

    html += `

      <div class="home-exploracao">

        <section class="hero-exploracao">
          <div class="hero-selo">🌿 EXPEDIÇÃO CIENTÍFICA</div>

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
            <p>Siga o percurso e encontre os pontos de investigação.</p>
          </div>

          <div
            class="mapa-container"
            id="mapa-container"
            aria-label="Mapa interativo da Trilha da Semente Peregrina"
          >
            <div class="mapa-carregando">Carregando mapa...</div>
          </div>

          <div id="gps-diagnostico">
            📍 GPS — aguardando localização...
          </div>
        </section>

        <section class="orientacao-exploracao">
          <div class="orientacao-icone">🧭</div>

          <div>
            <strong>Sua expedição</strong>

            <p>
              Durante o percurso, você encontrará estações de investigação
              e pontos para observar como a paisagem muda ao longo da trilha.
            </p>
          </div>
        </section>

        <section class="estrutura-expedicao">

          <div class="estrutura-expedicao-item">
            <span class="estrutura-expedicao-icone">📋</span>
            <div>
              <strong>3 Estações de Investigação</strong>
              <small>Paradas orientadas para investigar o ambiente.</small>
            </div>
          </div>

          <div class="estrutura-expedicao-item">
            <span class="estrutura-expedicao-icone">📷</span>
            <div>
              <strong>3 Pontos de Paisagem</strong>
              <small>Observe e registre as mudanças ao longo do caminho.</small>
            </div>
          </div>

          <button
            type="button"
            class="desafios-percurso"
            id="btn-desafios-percurso"
          >
            <span class="desafios-percurso-icone">🔎</span>

            <span class="desafios-percurso-texto">
              <strong>Desafios em Percurso</strong>
              <small>Fique atento às descobertas durante a caminhada.</small>
            </span>

            <span class="desafios-percurso-seta">→</span>
          </button>

        </section>

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

if (paisagemAtual) {
  const registroPaisagemAtual = registrosPaisagem.find(
  registro => registro.ponto === paisagemAtual
)
  html = `
    <div class="paisagem-tela">

      <div class="paisagem-cabecalho">
        <span>PONTO ${paisagemAtual}</span>
        <h2>Retrato da Paisagem</h2>
        <p>
          Observe o ambiente ao seu redor antes de fazer o registro.
        </p>
      </div>

      <section class="paisagem-etapa">
        <div class="paisagem-etapa-numero">1</div>

        <div>
          <h3>👀 Observe</h3>
          <p>
            Tire os olhos do celular por alguns instantes.
            Olhe ao seu redor e observe a paisagem como um todo.
          </p>
        </div>
      </section>

      <section class="paisagem-etapa">
        <div class="paisagem-etapa-numero">2</div>

        <div>
          <h3>📷 Registre</h3>
          <p>
            Faça uma fotografia que represente a paisagem deste ponto.
          </p>

<button
  type="button"
  class="btn-primary"
  id="btn-foto-paisagem"
>
  📷 Fotografar a paisagem
</button>

<input
  type="file"
  id="input-foto-paisagem"
  accept="image/*"
  capture="environment"
  style="display:none;"
>

${fotoPaisagemTemp ? `
  <div class="paisagem-foto-preview">
    <img
      src="${fotoPaisagemTemp}"
      alt="Fotografia registrada no Ponto ${paisagemAtual}"
    >
    <p>✓ Paisagem registrada</p>
  </div>
` : ''}

        </div>
      </section>

      <section class="paisagem-etapa">
        <div class="paisagem-etapa-numero">3</div>

        <div>
          <h3>🌿 Caracterize</h3>
          <p>
            Depois da fotografia, registre algumas características
            do ambiente observado.
          </p>

<div class="paisagem-escala">

  <label for="escala-porte">
    <strong>Porte da vegetação</strong>
  </label>

  <div class="paisagem-extremos">
    <span>Baixa</span>
    <span>Alta</span>
  </div>

    <input
    type="range"
    id="escala-porte"
    min="0"
    max="100"
    value="${registroPaisagemAtual?.porteVegetacao ?? 50}"
    step="1"
  >

</div>

<div class="paisagem-escala">

  <label for="escala-abertura">
    <strong>Abertura da paisagem</strong>
  </label>

  <div class="paisagem-extremos">
    <span>Aberta</span>
    <span>Fechada</span>
  </div>

  <input
    type="range"
    id="escala-abertura"
    min="0"
    max="100"
    value="${registroPaisagemAtual?.aberturaPaisagem ?? 50}"
    step="1"
  >

</div>

<div class="paisagem-escala">

  <label for="escala-luz">
    <strong>Luz chegando ao solo</strong>
  </label>

  <div class="paisagem-extremos">
    <span>Muita</span>
    <span>Pouca</span>
  </div>


  <input
    type="range"
    id="escala-luz"
    min="0"
    max="100"
    value="${registroPaisagemAtual?.luzSolo ?? 50}"
    step="1"
  >

</div>

<div class="paisagem-medicao">
  <label for="temp-paisagem">
    <strong>🌡️ Temperatura</strong>
  </label>

  <div>
    <input
      type="number"
      id="temp-paisagem"
      inputmode="decimal"
      step="0.1"
      value="${registroPaisagemAtual?.temperatura ?? ''}"
      placeholder="Ex.: 26,5"
    >
    <span>°C</span>
  </div>
</div>

<button
  type="button"
  class="btn-primary"
  id="btn-salvar-paisagem"
>
  Salvar Retrato da Paisagem
</button>

        </div>
      </section>

        </div>
      </section>

      <button
        type="button"
        class="btn-secondary"
        id="btn-voltar-paisagem"
      >
        ← Voltar ao mapa
      </button>

    </div>
  `
}

if (modalMensagem) {
  const etapaConcluida = estacaoAtual
    ? estacaoAtual.missoes.every(m =>
        respostasGerais.some(r => r.missaoId === m.id)
      )
    : false

  html = `
    <div class="modal-overlay">
      <div class="modal-card">
        <h3>
          ${etapaConcluida
            ? '🎉 Etapa concluída!'
            : '✅ Atividade salva!'}
        </h3>

        <p style="margin:10px 0;">
          ${modalMensagem}
        </p>

        <button id="btn-fechar-modal" class="btn-primary">
          OK
        </button>
      </div>
    </div>
  `
}

  app.innerHTML = html

  if (telaAtual === 'mapa-its') {
    carregarMapaITS()
  } else if (telaAtual === 'trilha') {
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

document.querySelector('#btn-continuar-expedicao')?.addEventListener('click', () => {
  telaAtual = 'trilha'
  render()
})

document.querySelector('#btn-reunir-pistas')?.addEventListener('click', () => {
  finalExpedicaoAberto = false
  sinteseExpedicaoAberta = true
  render()
})

document.querySelector('#nav-home')?.addEventListener('click', () => {
    estacaoAtual = null
    missaoAtual = null
    verTabelaTemp = false
    verCaderno = false
    localidadeAtual = null
    telaAtual = 'inicio'
    render()
  })

  document.querySelectorAll('.mascote-card').forEach(el => {
    el.addEventListener('click', () => {
      mascoteTempId = el.getAttribute('data-id') || mascotes[0].id
      render()
    })
  })

document.querySelector('#form-cadastro')?.addEventListener('submit', (e) => {
  e.preventDefault()

  const nome = (document.querySelector('#inp-nome') as HTMLInputElement).value
  const turma = (document.querySelector('#inp-turma') as HTMLInputElement).value
  const m = mascotes.find(x => x.id === mascoteTempId) || mascotes[0]

  crachaSalvo = { nome, turma, mascote: m }
  localStorage.setItem('exp_cracha', JSON.stringify(crachaSalvo))

  // Registra o início real da expedição apenas uma vez
  if (!inicioExpedicao) {
  inicioExpedicao = new Date().toISOString()
  localStorage.setItem('exp_inicio_expedicao', inicioExpedicao)
}

  telaAtual = 'trilha'
  render()
})

document.querySelector('#btn-sair')?.addEventListener('click', () => {
  const confirmarSaida = confirm(
    'Deseja sair da expedição? Seus registros serão mantidos e você poderá continuar depois.'
  )

  if (!confirmarSaida) return

  estacaoAtual = null
  missaoAtual = null
  paisagemAtual = null
  desafioAtual = null
  desafiosExpedicaoAberto = false

  verTabelaTemp = false
  verCaderno = false
  verConquistas = false

  localidadeAtual = null
  telaAtual = 'inicio'

  render()
})


  document.querySelector('#btn-tabela-temp')?.addEventListener('click', () => {
    verTabelaTemp = true
    verCaderno = false
    verConquistas = false
    render()
  })

  document.querySelector('#btn-caderno')?.addEventListener('click', () => {
    verCaderno = true
    verTabelaTemp = false
    verConquistas = false
    render()
  })

document.querySelector('#btn-desafios-percurso')?.addEventListener('click', () => {
  desafiosExpedicaoAberto = true
  render()
})

document.querySelector('#btn-pequenos-habitantes')?.addEventListener('click', () => {
  desafioAtual = 'pequenos-habitantes'
  render()
})

document.querySelector('#btn-quem-passou')?.addEventListener('click', () => {
  desafioAtual = 'quem-passou'
  render()
})

document.querySelector('#btn-vidas-conectadas')?.addEventListener('click', () => {
  desafioAtual = 'vidas-conectadas'
  render()
})

document.querySelector('#btn-curiosidade')?.addEventListener('click', () => {
  desafioAtual = 'curiosidade'
  render()
})

document.querySelector('#btn-voltar-lista-desafios')?.addEventListener('click', () => {
  desafioAtual = null
  render()
})

const btnFotoDesafio =
  document.querySelector('#btn-registrar-pequeno-habitante')

const inputFotoDesafio =
  document.querySelector('#input-foto-desafio') as HTMLInputElement | null

if (btnFotoDesafio && inputFotoDesafio) {

  btnFotoDesafio.addEventListener('click', () => {
    inputFotoDesafio.click()
  })

  inputFotoDesafio.addEventListener('change', () => {

    const file = inputFotoDesafio.files?.[0]

    if (file) {

      const r = new FileReader()

      r.onload = (e) => {
        fotoDesafioTemp = e.target?.result as string
        render()
      }

      r.readAsDataURL(file)
    }
  })
}

const btnFotoQuemPassou =
  document.querySelector('#btn-registrar-quem-passou')

const inputFotoQuemPassou =
  document.querySelector('#input-foto-quem-passou') as HTMLInputElement | null

if (btnFotoQuemPassou && inputFotoQuemPassou) {

  btnFotoQuemPassou.addEventListener('click', () => {
    inputFotoQuemPassou.click()
  })

  inputFotoQuemPassou.addEventListener('change', () => {

    const file = inputFotoQuemPassou.files?.[0]

    if (file) {

      const r = new FileReader()

      r.onload = (e) => {
        fotoDesafioTemp = e.target?.result as string
        render()
      }

      r.readAsDataURL(file)
    }
  })
}

/* FOTO — VIDAS CONECTADAS */

const btnFotoVidasConectadas =
  document.querySelector('#btn-registrar-vidas-conectadas')

const inputFotoVidasConectadas =
  document.querySelector('#input-foto-vidas-conectadas') as HTMLInputElement | null

if (btnFotoVidasConectadas && inputFotoVidasConectadas) {

  btnFotoVidasConectadas.addEventListener('click', () => {
    inputFotoVidasConectadas.click()
  })

  inputFotoVidasConectadas.addEventListener('change', () => {

    const file = inputFotoVidasConectadas.files?.[0]

    if (file) {

      const r = new FileReader()

      r.onload = (e) => {
        fotoDesafioTemp = e.target?.result as string
        render()
      }

      r.readAsDataURL(file)
    }
  })
}

/* FOTO — CURIOSIDADE */

const btnFotoCuriosidade =
  document.querySelector('#btn-registrar-curiosidade')

const inputFotoCuriosidade =
  document.querySelector('#input-foto-curiosidade') as HTMLInputElement | null

if (btnFotoCuriosidade && inputFotoCuriosidade) {

  btnFotoCuriosidade.addEventListener('click', () => {
    inputFotoCuriosidade.click()
  })

  inputFotoCuriosidade.addEventListener('change', () => {

    const file = inputFotoCuriosidade.files?.[0]

    if (file) {

      const r = new FileReader()

      r.onload = (e) => {
        fotoDesafioTemp = e.target?.result as string
        render()
      }

      r.readAsDataURL(file)
    }
  })
}

document.querySelector('#btn-guardar-descoberta')?.addEventListener('click', () => {

  if (!fotoDesafioTemp) return

  const novaDescoberta: DescobertaExpedicao = {
    id: `desc-${Date.now()}`,
    tipo: 'pequenos-habitantes',
    foto: fotoDesafioTemp,
    dataHora: obterDataHoraISO()
  }

  descobertasExpedicao.push(novaDescoberta)

  localStorage.setItem(
    'exp_descobertas',
    JSON.stringify(descobertasExpedicao)
  )

  fotoDesafioTemp = null
  desafioAtual = null

  render()
})

document.querySelector('#btn-guardar-quem-passou')?.addEventListener('click', () => {

  if (!fotoDesafioTemp) return

  const novaDescoberta: DescobertaExpedicao = {
    id: `desc-${Date.now()}`,
    tipo: 'quem-passou',
    foto: fotoDesafioTemp,
    dataHora: obterDataHoraISO()
  }

  descobertasExpedicao.push(novaDescoberta)

  localStorage.setItem(
    'exp_descobertas',
    JSON.stringify(descobertasExpedicao)
  )

  fotoDesafioTemp = null
  desafioAtual = null

  render()
})

document.querySelector('#btn-guardar-vidas-conectadas')?.addEventListener('click', () => {

  if (!fotoDesafioTemp) return

  const novaDescoberta: DescobertaExpedicao = {
    id: `desc-${Date.now()}`,
    tipo: 'vidas-conectadas',
    foto: fotoDesafioTemp,
    dataHora: obterDataHoraISO()
  }

  descobertasExpedicao.push(novaDescoberta)

  localStorage.setItem(
    'exp_descobertas',
    JSON.stringify(descobertasExpedicao)
  )

  fotoDesafioTemp = null
  desafioAtual = null

  render()
})

document.querySelector('#btn-guardar-curiosidade')?.addEventListener('click', () => {

  if (!fotoDesafioTemp) return

  const campoPergunta =
    document.querySelector('#pergunta-curiosidade') as HTMLTextAreaElement | null

  const pergunta = campoPergunta?.value.trim() || ''

  if (!pergunta) {
    alert('Escreva uma pergunta sobre o que despertou sua curiosidade.')
    return
  }

  const novaDescoberta: DescobertaExpedicao = {
    id: `desc-${Date.now()}`,
    tipo: 'curiosidade',
    foto: fotoDesafioTemp,
    pergunta: pergunta,
    dataHora: obterDataHoraISO()
  }

  descobertasExpedicao.push(novaDescoberta)

  localStorage.setItem(
    'exp_descobertas',
    JSON.stringify(descobertasExpedicao)
  )

  fotoDesafioTemp = null
  desafioAtual = null

  render()
})

document.querySelector('#btn-voltar-desafios')?.addEventListener('click', () => {
  desafiosExpedicaoAberto = false
  render()
})
  
  document.querySelector('#btn-voltar-estacoes')?.addEventListener('click', () => {
    verTabelaTemp = false
    verCaderno = false
    verConquistas = false
  render()
})

document.querySelector('#btn-salvar-paisagem')?.addEventListener('click', () => {
  if (!paisagemAtual) return

  const porte = document.querySelector('#escala-porte') as HTMLInputElement | null
  const abertura = document.querySelector('#escala-abertura') as HTMLInputElement | null
  const luz = document.querySelector('#escala-luz') as HTMLInputElement | null
  const temperatura = document.querySelector('#temp-paisagem') as HTMLInputElement | null

  if (!porte || !abertura || !luz || !temperatura) return

  if (!fotoPaisagemTemp) {
    alert('Fotografe a paisagem antes de salvar o registro.')
    return
  }

  const temperaturaValor =
    temperatura.value.trim() === ''
      ? null
      : Number(temperatura.value.replace(',', '.'))

const novoRegistro: RegistroPaisagem = {
  ponto: paisagemAtual,
  foto: fotoPaisagemTemp,
  porteVegetacao: Number(porte.value),
  aberturaPaisagem: Number(abertura.value),
  luzSolo: Number(luz.value),
  temperatura: temperaturaValor,
  dataHora: obterDataHoraISO()
}

registrosPaisagem = registrosPaisagem.filter(
  registro => registro.ponto !== paisagemAtual
)

registrosPaisagem.push(novoRegistro)

localStorage.setItem(
  'exp_paisagens',
  JSON.stringify(registrosPaisagem)
)

alert(`Retrato da Paisagem ${paisagemAtual} salvo!`)

paisagemAtual = null
fotoPaisagemTemp = null
render()
})

document
  .querySelector('#btn-salvar-interpretacao-paisagem')
  ?.addEventListener('click', () => {

    const campo = document.querySelector(
      '#texto-interpretacao-paisagem'
    ) as HTMLTextAreaElement | null

    if (!campo) return

    const texto = campo.value.trim()

    if (!texto) {
      alert('Escreva sua interpretação antes de salvar.')
      return
    }

    interpretacaoPaisagem = texto

    localStorage.setItem(
      'exp_interpretacao_paisagem',
      interpretacaoPaisagem
    )

    alert('Interpretação salva no Caderno de Campo!')
  })

document.querySelector('#btn-voltar-paisagem')?.addEventListener('click', () => {
  paisagemAtual = null
  render()
})

  document.querySelectorAll('.btn-abrir-estacao').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id')
      estacaoAtual = estacoes.find(e => e.id === id) || null
      render()
    })
  })


document.querySelector('#btn-voltar-home')?.addEventListener('click', () => {
  estacaoAtual = null
  missaoAtual = null
  render()
})

document.querySelector('#btn-voltar-mapa-estacao')?.addEventListener('click', () => {
  estacaoAtual = null
  missaoAtual = null
  render()
})

  document.querySelectorAll('.btn-abrir-missao').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id')
      
      console.log('MISSÃO CLICADA:', id)

      fotoTemp = null
      audioTemp = null
      opcaoSelecionadaQuiz = null
      missaoAtual = estacaoAtual?.missoes.find(m => m.id === id) || null
      render()
    })
  })

  document.querySelector('#btn-voltar-estacao')?.addEventListener('click', () => {
    missaoAtual = null
    render()
  })

  document.querySelectorAll('input[name="opcao-quiz"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      opcaoSelecionadaQuiz = (e.target as HTMLInputElement).value
    })
  })


  const btnFoto = document.querySelector('#btn-foto')
  const inputFoto = document.querySelector('#input-foto') as HTMLInputElement | null

  if (btnFoto && inputFoto) {
    btnFoto.addEventListener('click', () => inputFoto.click())

    inputFoto.addEventListener('change', () => {
      const file = inputFoto.files?.[0]

      if (file) {
        const r = new FileReader()
        r.onload = (e) => {
          fotoTemp = e.target?.result as string
          render()
        }
        r.readAsDataURL(file)
      }
    })
  }

const btnFotoPaisagem = document.querySelector('#btn-foto-paisagem')
const inputFotoPaisagem =
  document.querySelector('#input-foto-paisagem') as HTMLInputElement | null

if (btnFotoPaisagem && inputFotoPaisagem) {
  btnFotoPaisagem.addEventListener('click', () => {
    inputFotoPaisagem.click()
  })

  inputFotoPaisagem.addEventListener('change', () => {
    const file = inputFotoPaisagem.files?.[0]

    if (file) {
      const r = new FileReader()

      r.onload = (e) => {
        fotoPaisagemTemp = e.target?.result as string
        render()
      }

      r.readAsDataURL(file)
    }
  })
}

document.querySelector('#btn-audio')?.addEventListener('click', async () => {

  // INICIAR GRAVAÇÃO
  if (!gravandoAudio) {
    try {
      streamAudio = await navigator.mediaDevices.getUserMedia({
        audio: true
      })

      audioChunks = []

      mediaRecorder = new MediaRecorder(streamAudio)

      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
        }
      })

      mediaRecorder.addEventListener('stop', () => {
        const audioBlob = new Blob(audioChunks, {
          type: mediaRecorder?.mimeType || 'audio/webm'
        })

        if (audioTemp) {
          URL.revokeObjectURL(audioTemp)
        }

        audioTemp = URL.createObjectURL(audioBlob)

        streamAudio?.getTracks().forEach(track => track.stop())

        streamAudio = null
        mediaRecorder = null
        gravandoAudio = false

        render()
      })

      mediaRecorder.start()
      gravandoAudio = true

      render()

    } catch (erro) {
      console.error('Erro ao acessar o microfone:', erro)

      alert(
        'Não foi possível acessar o microfone. Verifique se o navegador tem permissão para usá-lo.'
      )
    }

    return
  }

  // PARAR GRAVAÇÃO
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop()
  }
})

  document.querySelector('#form-missao')?.addEventListener('submit', (e) => {
    e.preventDefault()

    if (!missaoAtual || !estacaoAtual) return

    let conteudo = ''
    let midiaUrl: string | undefined = undefined

    if (missaoAtual.tipo === 'quiz') {
      if (!opcaoSelecionadaQuiz) {
        return alert('Por favor, escolha uma das opções!')
      }

      const opt = missaoAtual.opcoesQuiz?.find(o => o.id === opcaoSelecionadaQuiz)
      if (!opt) return

      if (!opt.correta) {
        return alert(`❌ Resposta incorreta!\n\n${opt.explicacao}\n\nTente novamente!`)
      }

      conteudo = `Resposta Correta: ${opt.texto}`

    } else if (missaoAtual.tipo === 'temperatura') {
      const tempVal = parseFloat(
        (document.querySelector('#inp-temp') as HTMLInputElement).value
      )
      const horaVal = (document.querySelector('#inp-hora') as HTMLInputElement).value

      if (isNaN(tempVal)) {
        return alert('Por favor, digite um valor de temperatura válido!')
      }

      medicoesTemperatura = medicoesTemperatura.filter(
        m => m.estacaoId !== estacaoAtual!.id
      )

      medicoesTemperatura.push({
        estacaoId: estacaoAtual.id,
        estacaoNome: estacaoAtual.nome,
        valorTemp: tempVal,
        horarioMedicao: horaVal
      })

      localStorage.setItem('exp_medicoes', JSON.stringify(medicoesTemperatura))

      conteudo = `Temperatura: ${tempVal} °C às ${horaVal}`

    } else if (missaoAtual.tipo === 'foto') {
      if (!fotoTemp) {
        return alert('Por favor, tire uma foto!')
      }

      conteudo = 'Foto registrada no local'
      midiaUrl = fotoTemp

    } else if (missaoAtual.tipo === 'texto') {
      conteudo = (document.querySelector('#inp-texto') as HTMLTextAreaElement).value

    } else if (missaoAtual.tipo === 'audio') {
      if (!audioTemp) {
        return alert('Por favor, grave o áudio!')
      }

      conteudo = 'Áudio gravado no local'
    }

    const novaResp: RespostaAtividade = {
      estacaoId: estacaoAtual.id,
      missaoId: missaoAtual.id,
      titulo: `${estacaoAtual.nome} - ${missaoAtual.titulo}`,
      conteudo,
      midiaUrl,
      dataHora: obterDataHoraISO()
    }

    respostasGerais = respostasGerais.filter(
      r => r.missaoId !== missaoAtual!.id
    )

    respostasGerais.push(novaResp)
    localStorage.setItem('exp_respostas', JSON.stringify(respostasGerais))

    const totalMissoes = estacaoAtual.missoes.length
    const concluidas = estacaoAtual.missoes.filter(
      m => respostasGerais.some(r => r.missaoId === m.id)
    ).length

    if (concluidas === totalMissoes) {
      modalMensagem = `Você concluiu as atividades de ${estacaoAtual.nome}. Seus registros foram salvos no Caderno do Investigador.`
    } else {
      modalMensagem = 'Atividade salva com sucesso!'
    }

    render()
  })

  document.querySelector('#btn-fechar-modal')?.addEventListener('click', () => {
    modalMensagem = null

    if (estacaoAtual) {
      const totalMissoes = estacaoAtual.missoes.length
      const concluidas = estacaoAtual.missoes.filter(
        m => respostasGerais.some(r => r.missaoId === m.id)
      ).length

      if (concluidas === totalMissoes) {
        estacaoAtual = null
      }
    }

    missaoAtual = null
    render()
  })
}

render()
